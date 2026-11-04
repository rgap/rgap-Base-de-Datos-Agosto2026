import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorSelection, EditorState, Prec, StateEffect, StateField } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentLess, indentMore } from '@codemirror/commands';
import { bracketMatching, indentOnInput, indentUnit } from '@codemirror/language';
import { MSSQL, MySQL, sql } from '@codemirror/lang-sql';
import { dracula } from './dracula';
import { antiCopy } from './antiCopy';
import type { Dialect } from './exercises';

export const TAB = 4;

export const sqlFor = (dialect: Dialect) => sql({ dialect: dialect === 'mysql' ? MySQL : MSSQL, upperCaseKeywords: true });

// ---- Marca del error ----
const setError = StateEffect.define<{ from: number; to: number } | null>();

const errorField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    if (tr.docChanged) deco = Decoration.none;
    for (const e of tr.effects) {
      if (!e.is(setError)) continue;
      if (!e.value) {
        deco = Decoration.none;
        continue;
      }
      const len = tr.state.doc.length;
      const from = Math.min(e.value.from, len);
      const to = Math.min(e.value.to, len);
      const line = tr.state.doc.lineAt(from);
      const ranges = [Decoration.line({ class: 'cm-errorLine' }).range(line.from)];
      if (to > from) ranges.push(Decoration.mark({ class: 'cm-errorMark' }).range(from, to));
      deco = Decoration.set(ranges, true);
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

// Tab: sin selección inserta espacios hasta la siguiente parada de 4;
// con selección indenta todas las líneas. Shift+Tab quita sangría.
const tabCommand = (view: EditorView) => {
  const { state } = view;
  if (state.selection.ranges.some((r) => !r.empty)) return indentMore(view);
  view.dispatch(
    state.changeByRange((range) => {
      const col = range.head - state.doc.lineAt(range.head).from;
      const spaces = ' '.repeat(TAB - (col % TAB));
      return { changes: { from: range.head, insert: spaces }, range: EditorSelection.cursor(range.head + spaces.length) };
    }),
    { userEvent: 'input.indent', scrollIntoView: true },
  );
  return true;
};

export interface EditorHandle {
  getValue(): string;
  markError(from: number, to: number): void;
  clearError(): void;
  focus(): void;
}

interface Props {
  /** Cambia cuando se cambia de ejercicio: crea un estado nuevo. */
  docKey: string;
  initial: string;
  dialect: Dialect;
  onChange(value: string): void;
  onBlocked(): void;
  onCheck(): void;
}

export const Editor = forwardRef<EditorHandle, Props>(function Editor(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const cb = useRef(props);
  cb.current = props;

  const makeState = (doc: string, dialect: Dialect) =>
    EditorState.create({
      doc,
      extensions: [
        antiCopy(() => cb.current.onBlocked()),
        Prec.highest(
          keymap.of([
            { key: 'Mod-Enter', run: () => (cb.current.onCheck(), true) },
            { key: 'Tab', run: tabCommand, shift: indentLess },
          ]),
        ),
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        highlightActiveLine(),
        EditorState.tabSize.of(TAB),
        indentUnit.of(' '.repeat(TAB)),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        sqlFor(dialect),
        dracula,
        errorField,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) cb.current.onChange(u.state.doc.toString());
        }),
        EditorView.contentAttributes.of({ 'aria-label': 'Editor de código' }),
      ],
    });

  useEffect(() => {
    view.current = new EditorView({ state: makeState(props.initial, props.dialect), parent: host.current! });
    return () => view.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambio de ejercicio: estado nuevo (se reinicia el historial de deshacer).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    view.current?.setState(makeState(props.initial, props.dialect));
    view.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.docKey]);

  useImperativeHandle(ref, () => ({
    getValue: () => view.current?.state.doc.toString() ?? '',
    markError(from, to) {
      const v = view.current;
      if (!v) return;
      const pos = Math.min(from, v.state.doc.length);
      v.dispatch({
        effects: [setError.of({ from, to }), EditorView.scrollIntoView(pos, { y: 'center' })],
        selection: { anchor: pos },
      });
      v.focus();
    },
    clearError: () => view.current?.dispatch({ effects: setError.of(null) }),
    focus: () => view.current?.focus(),
  }));

  return <div ref={host} className="editor" />;
});
