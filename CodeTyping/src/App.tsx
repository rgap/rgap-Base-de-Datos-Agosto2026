import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Editor, EditorHandle } from './Editor';
import { CodeView } from './CodeView';
import { check, CheckResult } from './checker';
import { Dialect, EXERCISES } from './exercises';

const DIALECT_NAME: Record<Dialect, string> = { mysql: 'MySQL', sqlserver: 'SQL Server' };
const KEY = 'codetyping:v1';

// localStorage puede fallar (modo privado, bloqueado): nunca rompe la app.
const store = {
  get(k: string): string | null {
    try {
      return localStorage.getItem(`${KEY}:${k}`);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(`${KEY}:${k}`, v);
    } catch {
      /* sin almacenamiento */
    }
  },
  del(k: string) {
    try {
      localStorage.removeItem(`${KEY}:${k}`);
    } catch {
      /* sin almacenamiento */
    }
  },
};

function loadSolved(): Set<string> {
  try {
    return new Set(JSON.parse(store.get('solved') ?? '[]'));
  } catch {
    return new Set();
  }
}

export default function App() {
  const [currentId, setCurrentId] = useState(() => {
    const saved = store.get('current');
    return EXERCISES.some((e) => e.id === saved) ? saved! : EXERCISES[0].id;
  });
  const [solved, setSolved] = useState(loadSolved);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [stale, setStale] = useState(false);
  const [showModel, setShowModel] = useState(true);
  const [toast, setToast] = useState(false);
  const editor = useRef<EditorHandle>(null);
  const toastTimer = useRef<number>();

  const ex = EXERCISES.find((e) => e.id === currentId)!;
  const index = EXERCISES.indexOf(ex);
  const next = EXERCISES[index + 1];

  const groups = useMemo(() => {
    const map = new Map<number, typeof EXERCISES>();
    for (const e of EXERCISES) map.set(e.num, [...(map.get(e.num) ?? []), e]);
    return [...map.values()];
  }, []);

  const showBlocked = useCallback(() => {
    setToast(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(false), 2200);
  }, []);

  // Bloqueo general en toda la página: copiar, cortar, pegar, clic derecho, arrastrar.
  useEffect(() => {
    const block = (e: Event) => {
      e.preventDefault();
      showBlocked();
    };
    const silent = (e: Event) => e.preventDefault();
    const events = ['copy', 'cut', 'paste', 'contextmenu', 'dragstart', 'drop'];
    events.forEach((ev) => document.addEventListener(ev, block, true));
    document.addEventListener('dragover', silent, true);
    // Fuera del editor no se puede seleccionar texto.
    const noSelect = (e: Event) => {
      const el = e.target as Node;
      const elem = el instanceof Element ? el : el.parentElement;
      if (!elem?.closest('.editor')) e.preventDefault();
    };
    document.addEventListener('selectstart', noSelect, true);
    return () => {
      events.forEach((ev) => document.removeEventListener(ev, block, true));
      document.removeEventListener('dragover', silent, true);
      document.removeEventListener('selectstart', noSelect, true);
    };
  }, [showBlocked]);

  const select = (id: string) => {
    if (id === currentId) return;
    setCurrentId(id);
    store.set('current', id);
    setResult(null);
  };

  const onCheck = useCallback(() => {
    const code = editor.current?.getValue() ?? '';
    const r = check(code, ex.solutions);
    setResult(r);
    setStale(false);
    if (r.ok) {
      setSolved((prev) => {
        const s = new Set(prev).add(ex.id);
        store.set('solved', JSON.stringify([...s]));
        return s;
      });
      editor.current?.clearError();
    } else if (r.from !== undefined) {
      editor.current?.markError(r.from, r.to ?? r.from);
    }
  }, [ex]);

  const reset = () => {
    store.del(`code:${ex.id}`);
    setResult(null);
    // Forzar estado nuevo vacío.
    setCurrentId('');
    requestAnimationFrame(() => setCurrentId(ex.id));
  };

  const initial = store.get(`code:${ex.id}`) ?? '';

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="logo">{'</>'}</span>
          <span>CodeTyping SQL</span>
        </div>
        <div className="score">
          {solved.size} / {EXERCISES.length} resueltos
        </div>
      </header>

      <div className="layout">
        <nav className="sidebar">
          <h2>Ejercicios</h2>
          {groups.map((g) => (
            <div key={g[0].num} className="group">
              <div className="group-title">
                <span className="num">{g[0].num}</span>
                {g[0].title}
              </div>
              <div className="group-buttons">
                {g.map((e) => (
                  <button
                    key={e.id}
                    className={`ex-btn ${e.dialect} ${e.id === currentId ? 'active' : ''} ${solved.has(e.id) ? 'solved' : ''}`}
                    onClick={() => select(e.id)}
                  >
                    {solved.has(e.id) ? '✓ ' : ''}
                    {DIALECT_NAME[e.dialect]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <main className="main">
          <section className="card statement">
            <div className="meta">
              <span className={`badge ${ex.dialect}`}>{DIALECT_NAME[ex.dialect]}</span>
              <span className="context">{ex.context}</span>
            </div>
            <h1>
              {ex.num}. {ex.title}
            </h1>
            <p>{ex.statement}</p>
            {ex.note && <p className="note">💡 {ex.note}</p>}
          </section>

          <section className="card">
            <div className="card-head">
              <h3>Modelo</h3>
              <button className="ghost" onClick={() => setShowModel((s) => !s)}>
                {showModel ? 'Ocultar modelo (modo reto)' : 'Mostrar modelo'}
              </button>
            </div>
            {showModel ? (
              <CodeView code={ex.model} dialect={ex.dialect} />
            ) : (
              <div className="hidden-model">Modelo oculto: escríbelo de memoria.</div>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h3>Tu código</h3>
              <span className="hint">Tab = sangría · Shift+Tab = quitar sangría · Ctrl+Enter = comprobar</span>
              <button className="ghost" onClick={reset}>
                Borrar todo
              </button>
            </div>
            {currentId && (
              <Editor
                ref={editor}
                docKey={ex.id}
                initial={initial}
                dialect={ex.dialect}
                onChange={(v) => {
                  store.set(`code:${ex.id}`, v);
                  setStale(true);
                }}
                onBlocked={showBlocked}
                onCheck={onCheck}
              />
            )}
          </section>

          <button className="check" onClick={onCheck}>
            Comprobar
          </button>

          {result && (
            <section className={`result ${result.ok ? 'ok' : 'bad'} ${stale ? 'stale' : ''}`} role="status">
              <div className="result-title">
                {result.ok ? '✅' : '❌'} {result.title}
              </div>
              {result.detail && <div className="result-detail">{result.detail}</div>}
              {!result.ok && (
                <div className="progress">
                  <div className="bar" style={{ width: `${result.progress}%` }} />
                  <span>{result.progress}% bien hasta el error</span>
                </div>
              )}
              {result.ok && next && (
                <button className="next" onClick={() => select(next.id)}>
                  Siguiente: {next.num}. {next.title} ({DIALECT_NAME[next.dialect]}) →
                </button>
              )}
              {stale && <div className="stale-note">Cambiaste el código: vuelve a comprobar.</div>}
            </section>
          )}
        </main>
      </div>

      <div className={`toast ${toast ? 'show' : ''}`}>✋ Copiar y pegar está desactivado. ¡Escríbelo tú!</div>
    </div>
  );
}
