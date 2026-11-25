// Fila de botones para elegir entre varias opciones (casos, acciones, preguntas).
export default function Pestanas({ opciones, actual, onElegir, etiqueta }) {
  if (opciones.length < 2) return null;
  return (
    <div className="pestanas" role="group" aria-label={etiqueta}>
      {opciones.map((opcion) => (
        <button
          key={opcion.id}
          type="button"
          className={opcion.id === actual ? "pestana activa" : "pestana"}
          aria-pressed={opcion.id === actual}
          onClick={() => onElegir(opcion.id)}
        >
          {opcion.nombre}
        </button>
      ))}
    </div>
  );
}
