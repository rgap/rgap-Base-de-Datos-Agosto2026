import { useEffect, useRef } from 'react';
import { highlightTree, tagHighlighter, tags as t } from '@lezer/highlight';
import { D } from './dracula';
import { sqlFor } from './Editor';
import type { Dialect } from './exercises';

// El código modelo se dibuja en un <canvas>: no hay texto en la página,
// así que no se puede seleccionar, copiar ni buscar.

const FONT_SIZE = 19;
const LINE_H = Math.round(FONT_SIZE * 1.6);
const PAD_X = 20;
const PAD_Y = 14;
const FONT = "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace";

// El "class" de cada etiqueta es el estilo con que se pinta: color|negrita|cursiva
const painter = tagHighlighter([
  { tag: t.keyword, class: `${D.pink}|b` },
  { tag: [t.typeName, t.className], class: `${D.cyan}|i` },
  { tag: t.standard(t.name), class: D.green },
  { tag: t.special(t.name), class: `${D.orange}|i` },
  { tag: [t.string, t.special(t.string)], class: D.yellow },
  { tag: [t.number, t.bool, t.null], class: D.purple },
  { tag: [t.comment, t.lineComment, t.blockComment], class: `${D.comment}|i` },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], class: D.pink },
]);

function styles(code: string, dialect: Dialect): string[] {
  const out: string[] = new Array(code.length).fill(D.fg);
  const tree = sqlFor(dialect).language.parser.parse(code);
  highlightTree(tree, painter, (from, to, cls) => {
    const style = cls.split(' ')[0];
    for (let k = from; k < to; k++) out[k] = style;
  });
  return out;
}

export function CodeView({ code, dialect }: { code: string; dialect: Dialect }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      const c = canvas.current;
      if (!c || cancelled) return;
      const ctx = c.getContext('2d')!;
      const lines = code.split('\n');
      const st = styles(code, dialect);

      ctx.font = `${FONT_SIZE}px ${FONT}`;
      const cw = ctx.measureText('M').width;
      const cols = Math.max(...lines.map((l) => l.length));
      const w = Math.ceil(PAD_X * 2 + cols * cw);
      const h = PAD_Y * 2 + lines.length * LINE_H;
      const dpr = window.devicePixelRatio || 1;
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = D.bg;
      ctx.fillRect(0, 0, w, h);
      ctx.textBaseline = 'middle';

      let pos = 0;
      lines.forEach((line, row) => {
        const y = PAD_Y + row * LINE_H + LINE_H / 2;
        for (let col = 0; col < line.length; col++) {
          const ch = line[col];
          if (ch !== ' ') {
            const [color, flag] = st[pos + col].split('|');
            ctx.font = `${flag === 'i' ? 'italic ' : ''}${flag === 'b' ? '600 ' : ''}${FONT_SIZE}px ${FONT}`;
            ctx.fillStyle = color;
            ctx.fillText(ch, PAD_X + col * cw, y);
          }
        }
        pos += line.length + 1;
      });
    };

    draw();
    // Se vuelve a dibujar cuando termina de cargar la fuente.
    document.fonts?.load(`${FONT_SIZE}px 'JetBrains Mono'`).then(draw, () => {});
    document.fonts?.ready.then(draw);
    return () => {
      cancelled = true;
    };
  }, [code, dialect]);

  return (
    <div className="codeview" aria-label="Código modelo (solo para mirar)">
      <canvas ref={canvas} draggable={false} />
    </div>
  );
}
