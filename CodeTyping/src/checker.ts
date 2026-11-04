// Comparación tolerante de código SQL.
// No se compara texto, se comparan tokens: así da igual cuántos espacios,
// tabs o saltos de línea haya, si las palabras clave van en mayúsculas o
// minúsculas, o si hay comentarios.

export type TokenKind = 'word' | 'var' | 'num' | 'str' | 'op';

export interface Token {
  kind: TokenKind;
  value: string; // valor normalizado (lo que se compara)
  text: string; // texto original (lo que se muestra)
  from: number;
  to: number;
}

// Sinónimos que el gestor acepta igual.
const SYNONYMS: Record<string, string> = {
  bool: 'boolean',
  integer: 'int',
  dec: 'decimal',
  nvarchar: 'varchar',
  nchar: 'char',
  datetime2: 'datetime',
};

const TWO_CHAR_OPS = ['<=', '>=', '<>', '!=', '||', '&&', ':='];

const isIdentStart = (c: string) => /[\p{L}_@#$]/u.test(c);
const isIdentPart = (c: string) => /[\p{L}\p{N}_@#$]/u.test(c);
const isDigit = (c: string | undefined) => c !== undefined && c >= '0' && c <= '9';

function normalizeNumber(raw: string): string {
  const n = Number(raw);
  return Number.isFinite(n) ? String(n) : raw;
}

export function tokenize(source: string): Token[] {
  // DELIMITER $$ ... $$ (MySQL): se quitan las líneas DELIMITER y el delimitador
  // propio. Se reemplaza por espacios del mismo largo para no mover posiciones.
  let text = source.replace(/\r\n?/g, (m) => ' '.repeat(m.length - 1) + '\n');
  const delimiters = new Set<string>();
  text = text.replace(/^[ \t]*delimiter[ \t]+(\S+)[ \t]*$/gim, (m, d: string) => {
    if (d !== ';') delimiters.add(d);
    return ' '.repeat(m.length);
  });
  for (const d of delimiters) text = text.split(d).join(' '.repeat(d.length));

  const tokens: Token[] = [];
  const n = text.length;
  let i = 0;

  while (i < n) {
    const c = text[i];

    // Espacios, tabs, saltos de línea y espacios raros (no-break, etc.).
    if (/\s/u.test(c)) {
      i++;
      continue;
    }
    // Comentario de línea: -- ...
    if (c === '-' && text[i + 1] === '-') {
      while (i < n && text[i] !== '\n') i++;
      continue;
    }
    // Comentario de bloque: /* ... */
    if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end < 0 ? n : end + 2;
      continue;
    }

    const start = i;

    // N'texto' de SQL Server: la N no cambia el valor.
    if ((c === 'N' || c === 'n') && text[i + 1] === "'") {
      i++;
      continue;
    }

    // Cadenas '...' o "..." ('' dentro de la cadena es una comilla).
    if (c === "'" || c === '"') {
      const q = c;
      i++;
      let val = '';
      while (i < n) {
        if (text[i] === q) {
          if (text[i + 1] === q) {
            val += q;
            i += 2;
            continue;
          }
          i++;
          break;
        }
        val += text[i];
        i++;
      }
      tokens.push({ kind: 'str', value: val, text: text.slice(start, i), from: start, to: i });
      continue;
    }

    // Identificadores entre `backticks` (MySQL) o [corchetes] (SQL Server).
    if (c === '`' || c === '[') {
      const close = c === '`' ? '`' : ']';
      const end = text.indexOf(close, i + 1);
      const stop = end < 0 ? n : end + 1;
      const inner = text.slice(i + 1, end < 0 ? n : end).trim().toLowerCase();
      tokens.push({ kind: inner.startsWith('@') ? 'var' : 'word', value: inner, text: text.slice(start, stop), from: start, to: stop });
      i = stop;
      continue;
    }

    // Números: 100, 10.50, .5
    if (isDigit(c) || (c === '.' && isDigit(text[i + 1]))) {
      while (i < n && isDigit(text[i])) i++;
      if (text[i] === '.') {
        i++;
        while (i < n && isDigit(text[i])) i++;
      }
      const raw = text.slice(start, i);
      tokens.push({ kind: 'num', value: normalizeNumber(raw), text: raw, from: start, to: i });
      continue;
    }

    // Palabras y variables (@precio).
    if (isIdentStart(c)) {
      i++;
      while (i < n && isIdentPart(text[i])) i++;
      const raw = text.slice(start, i);
      const low = raw.toLowerCase();
      tokens.push({
        kind: low.startsWith('@') ? 'var' : 'word',
        value: SYNONYMS[low] ?? low,
        text: raw,
        from: start,
        to: i,
      });
      continue;
    }

    // Operadores y signos.
    const two = text.slice(i, i + 2);
    if (TWO_CHAR_OPS.includes(two)) {
      tokens.push({ kind: 'op', value: two === '!=' ? '<>' : two, text: two, from: start, to: i + 2 });
      i += 2;
      continue;
    }
    tokens.push({ kind: 'op', value: c, text: c, from: start, to: i + 1 });
    i++;
  }

  return tokens;
}

const isWord = (t: Token | undefined, w: string) => t !== undefined && t.kind === 'word' && t.value === w;

// Quita lo que no cambia el significado del código.
export function normalize(tokens: Token[]): Token[] {
  // 1. ; y GO son separadores: no se comparan.
  let ts = tokens.filter((t) => !(t.kind === 'op' && t.value === ';') && !isWord(t, 'go'));

  // 2. El esquema dbo. es opcional.
  ts = ts.filter((t, k) => {
    if (isWord(t, 'dbo') && ts[k + 1]?.value === '.') return false;
    if (t.value === '.' && isWord(ts[k - 1], 'dbo')) return false;
    return true;
  });

  // 3. CREATE OR ALTER FUNCTION = CREATE FUNCTION.
  ts = ts.filter((t, k) => {
    if (isWord(t, 'or') && isWord(ts[k - 1], 'create') && isWord(ts[k + 1], 'alter')) return false;
    if (isWord(t, 'alter') && isWord(ts[k - 1], 'or') && isWord(ts[k - 2], 'create')) return false;
    return true;
  });

  // 4. Un DROP FUNCTION IF EXISTS nombre al inicio es opcional.
  while (isWord(ts[0], 'drop') && isWord(ts[1], 'function') && isWord(ts[2], 'if') && isWord(ts[3], 'exists') && ts[4]) {
    ts = ts.slice(5);
  }

  // 5. Los nombres de las variables @ dan igual (@precio o @p_precio):
  //    se renombran por orden de aparición.
  const names = new Map<string, string>();
  ts = ts.map((t) => {
    if (t.kind !== 'var' || t.value.startsWith('@@')) return t;
    if (!names.has(t.value)) names.set(t.value, `@${names.size + 1}`);
    return { ...t, value: names.get(t.value)! };
  });

  return ts;
}

export interface CheckResult {
  ok: boolean;
  title: string;
  detail?: string;
  /** Rango a marcar en el código del alumno. */
  from?: number;
  to?: number;
  line?: number;
  /** Porcentaje del modelo que ya está bien (0-100). */
  progress: number;
}

function lineOf(src: string, pos: number): number {
  let line = 1;
  for (let k = 0; k < pos && k < src.length; k++) if (src[k] === '\n') line++;
  return line;
}

function show(t: Token): string {
  if (t.kind === 'var') return t.text;
  if (t.kind === 'str') return t.text;
  return t.text;
}

function hint(expected: Token | undefined, found: Token | undefined): string | undefined {
  if (!expected || !found) return undefined;
  if (expected.kind === 'var' && found.kind === 'word') return 'En SQL Server los parámetros y variables empiezan con @.';
  if (expected.kind === 'word' && found.kind === 'var') return 'En MySQL los parámetros no llevan @.';
  if (expected.kind === 'str' && found.kind === 'str') return 'Revisa el texto entre comillas: tiene que ser exactamente igual.';
  if (expected.kind === 'op' && ['(', ')', ','].includes(expected.value)) return 'Revisa los paréntesis y las comas.';
  if (expected.kind === 'word' && found.kind === 'word') {
    const a = expected.value;
    const b = found.value;
    if (Math.abs(a.length - b.length) <= 2 && similar(a, b)) return '¿Error de tipeo? Revisa cómo está escrita esa palabra.';
  }
  return undefined;
}

// Distancia de edición pequeña (para detectar errores de tipeo).
function similar(a: string, b: string): boolean {
  const dp = Array.from({ length: a.length + 1 }, (_, r) => [r, ...Array(b.length).fill(0)]);
  for (let c = 1; c <= b.length; c++) dp[0][c] = c;
  for (let r = 1; r <= a.length; r++)
    for (let c = 1; c <= b.length; c++)
      dp[r][c] = Math.min(dp[r - 1][c] + 1, dp[r][c - 1] + 1, dp[r - 1][c - 1] + (a[r - 1] === b[c - 1] ? 0 : 1));
  return dp[a.length][b.length] <= 2;
}

export function check(code: string, solutions: string[]): CheckResult {
  const mine = normalize(tokenize(code));
  if (mine.length === 0) return { ok: false, title: 'Todavía no has escrito nada.', progress: 0 };

  // Se compara contra cada solución aceptada y se usa la que más se parece.
  let best: { sol: Token[]; k: number } | null = null;
  for (const s of solutions) {
    const sol = normalize(tokenize(s));
    let k = 0;
    while (k < sol.length && k < mine.length && sol[k].kind === mine[k].kind && sol[k].value === mine[k].value) k++;
    if (k === sol.length && k === mine.length) return { ok: true, title: '¡Correcto! El código está bien.', progress: 100 };
    if (!best || k > best.k) best = { sol, k };
  }

  const { sol, k } = best!;
  const progress = Math.min(99, Math.floor((k / sol.length) * 100));
  const expected = sol[k];
  const found = mine[k];

  if (!found) {
    const last = mine[mine.length - 1];
    return {
      ok: false,
      title: 'Vas bien, pero falta código al final.',
      detail: `Lo que sigue debería empezar con: ${show(expected)}`,
      from: last.to,
      to: last.to,
      line: lineOf(code, last.to),
      progress,
    };
  }

  if (!expected) {
    return {
      ok: false,
      title: 'Sobra código al final.',
      detail: `A partir de ${show(found)} ya no debería haber nada más.`,
      from: found.from,
      to: code.length,
      line: lineOf(code, found.from),
      progress,
    };
  }

  const what = expected.kind === 'var' ? `un parámetro con @ (como ${expected.text})` : show(expected);
  return {
    ok: false,
    title: `Hay un error en la línea ${lineOf(code, found.from)}.`,
    detail: `Se esperaba ${what} y escribiste ${show(found)}.` + (hint(expected, found) ? ` ${hint(expected, found)}` : ''),
    from: found.from,
    to: found.to,
    line: lineOf(code, found.from),
    progress,
  };
}
