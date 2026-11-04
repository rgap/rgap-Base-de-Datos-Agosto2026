import { EditorState, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';

// Varias capas para que copiar y pegar sea muy difícil:
// 1. se bloquean los eventos del navegador (paste, copy, cut, drop, menú contextual);
// 2. se bloquean los atajos de teclado (Ctrl/Cmd + C, X, V, Shift+Insert...);
// 3. por si algo se escapa, se rechaza todo cambio que meta de golpe más de
//    2 caracteres que no sean espacios (al tipear entra 1 a la vez).
export function antiCopy(onBlocked: () => void) {
  const block = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    onBlocked();
    return true;
  };

  const blockedKeys = ['Mod-c', 'Mod-x', 'Mod-v', 'Mod-Shift-v', 'Mod-Alt-v', 'Shift-Insert', 'Ctrl-Insert', 'Shift-Delete'];

  return [
    EditorView.domEventHandlers({
      paste: block,
      copy: block,
      cut: block,
      drop: block,
      dragstart: block,
      dragenter: (e) => { e.preventDefault(); return true; },
      dragover: (e) => { e.preventDefault(); return true; },
      contextmenu: block,
      auxclick: (e) => (e.button === 1 ? block(e) : false), // clic central (pegar en Linux)
      beforeinput: (e) =>
        /^insertFrom|insertReplacementText|insertLink/.test((e as InputEvent).inputType) ? block(e) : false,
    }),
    Prec.highest(keymap.of(blockedKeys.map((key) => ({ key, run: () => (onBlocked(), true), preventDefault: true })))),
    EditorState.transactionFilter.of((tr) => {
      if (!tr.docChanged) return tr;
      if (tr.isUserEvent('undo') || tr.isUserEvent('redo') || tr.isUserEvent('move.line')) return tr;
      let inserted = '';
      tr.changes.iterChanges((_fa, _ta, _fb, _tb, text) => {
        inserted += text.toString();
      });
      if (inserted.replace(/\s/g, '').length > 2) {
        queueMicrotask(onBlocked);
        return [];
      }
      return tr;
    }),
    EditorView.contentAttributes.of({
      spellcheck: 'false',
      autocorrect: 'off',
      autocapitalize: 'off',
      translate: 'no',
    }),
  ];
}
