import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// Paleta oficial de Dracula: https://draculatheme.com/contribute
export const D = {
  bg: '#282a36',
  line: '#44475a',
  fg: '#f8f8f2',
  comment: '#6272a4',
  cyan: '#8be9fd',
  green: '#50fa7b',
  orange: '#ffb86c',
  pink: '#ff79c6',
  purple: '#bd93f9',
  red: '#ff5555',
  yellow: '#f1fa8c',
};

const theme = EditorView.theme(
  {
    '&': { color: D.fg, backgroundColor: D.bg, fontSize: '21px' },
    '.cm-content': {
      fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
      caretColor: D.fg,
      padding: '14px 0',
      lineHeight: '1.6',
    },
    '.cm-scroller': { fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace" },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: D.fg, borderLeftWidth: '2px' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      { backgroundColor: '#5a5f80' },
    '.cm-activeLine': { backgroundColor: '#44475a66' },
    '.cm-gutters': { backgroundColor: D.bg, color: D.comment, border: 'none', paddingRight: '6px' },
    '.cm-activeLineGutter': { backgroundColor: '#44475a66', color: D.fg },
    '.cm-matchingBracket, .cm-nonmatchingBracket': { backgroundColor: '#44475a', outline: `1px solid ${D.comment}` },
    '.cm-errorLine': { backgroundColor: '#ff555526' },
    '.cm-errorMark': { textDecoration: `underline wavy ${D.red}`, textUnderlineOffset: '5px', backgroundColor: '#ff555540' },
    '.cm-errorEnd': { borderLeft: `3px solid ${D.red}`, marginLeft: '-1px' },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: t.keyword, color: D.pink, fontWeight: '600' },
  { tag: [t.typeName, t.className], color: D.cyan, fontStyle: 'italic' },
  { tag: t.standard(t.name), color: D.green },
  { tag: t.special(t.name), color: D.orange, fontStyle: 'italic' },
  { tag: [t.string, t.special(t.string)], color: D.yellow },
  { tag: [t.number, t.bool, t.null], color: D.purple },
  { tag: [t.comment, t.lineComment, t.blockComment], color: D.comment, fontStyle: 'italic' },
  { tag: [t.operator, t.compareOperator, t.arithmeticOperator, t.logicOperator], color: D.pink },
  { tag: [t.punctuation, t.paren, t.separator, t.brace], color: D.fg },
  { tag: [t.name, t.variableName, t.propertyName], color: D.fg },
]);

export const dracula = [theme, syntaxHighlighting(highlight)];
