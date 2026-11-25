// Muestra SQL con las palabras clave resaltadas. Las palabras en mayúsculas son
// las palabras clave: así está escrito todo el SQL del curso.
const PARTES = /(--[^\n]*|'[^']*'|\b[A-Z][A-Z_]+\b)/;

export default function Sql({ codigo }) {
  return (
    <pre className="sql">
      <code>
        {codigo.split(PARTES).map((parte, i) => {
          if (i % 2 === 0) return parte;
          if (parte.startsWith("--")) return <span key={i} className="sql-comentario">{parte}</span>;
          if (parte.startsWith("'")) return <span key={i} className="sql-texto">{parte}</span>;
          return <span key={i} className="sql-clave">{parte}</span>;
        })}
      </code>
    </pre>
  );
}
