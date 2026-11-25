import Sql from "./Sql.jsx";

// Un paso de un flujo: una consulta SQL o algo que hace la aplicación.
export default function Pieza({ pieza }) {
  if (pieza.app) {
    return (
      <div className="pieza pieza-app">
        <span className="etiqueta etiqueta-app">Aplicación</span>
        <p>{pieza.app}</p>
      </div>
    );
  }
  return (
    <div className="pieza">
      <span className="etiqueta">SQL</span>
      <Sql codigo={pieza.sql} />
    </div>
  );
}
