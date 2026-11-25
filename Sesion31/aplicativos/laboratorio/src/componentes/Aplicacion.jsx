import { Tabla } from "./Tablas.jsx";

// La pantalla de la aplicación, dibujada con datos fijos. Los botones que
// tienen un flujo en el laboratorio se pueden pulsar.
export default function Aplicacion({ caso, botonActivo, onBoton }) {
  const { pantalla } = caso;
  const conFlujo = caso.acciones.map((accion) => accion.boton);
  return (
    <section className="aplicacion" aria-label="La aplicación">
      <div className="ventana-barra">
        <span className="puntos" aria-hidden="true"><i /><i /><i /></span>
        <span className="direccion">localhost:3000 · proyecto {caso.numero}</span>
      </div>
      <div className="ventana-cuerpo">
        <h2>{pantalla.titulo}</h2>
        <p className="subtitulo">{pantalla.subtitulo}</p>
        <Tabla tabla={pantalla} />
        <div className="botones-app">
          {pantalla.botones.map((boton) =>
            conFlujo.includes(boton) ? (
              <button
                key={boton}
                type="button"
                className={boton === botonActivo ? "boton-app activo" : "boton-app"}
                onClick={() => onBoton(boton)}
              >
                {boton}
              </button>
            ) : (
              <button key={boton} type="button" className="boton-app" disabled>
                {boton}
              </button>
            ),
          )}
        </div>
        <p className="ayuda">Pulsa un botón activo para armar lo que hace por dentro.</p>
      </div>
    </section>
  );
}
