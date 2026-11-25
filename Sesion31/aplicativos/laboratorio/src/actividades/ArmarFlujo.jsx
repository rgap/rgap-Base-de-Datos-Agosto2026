import { useEffect, useMemo, useState } from "react";

import Pieza from "../componentes/Pieza.jsx";
import { Tablas } from "../componentes/Tablas.jsx";
import { mezclar, revisarFlujo } from "../revisar.js";

// Tiempo que se queda resaltado cada paso al «ver en la aplicación».
const MS_POR_PASO = 1400;

// Actividad 1: elegir las consultas que ejecuta un botón y ponerlas en orden.
export default function ArmarFlujo({ caso, accion }) {
  const piezas = useMemo(
    () => mezclar([...accion.pasos, ...accion.sobran], caso.id + accion.id),
    [caso.id, accion],
  );
  const [elegidos, setElegidos] = useState([]);
  const [enTransaccion, setEnTransaccion] = useState(false);
  const [problemas, setProblemas] = useState(null); // null: todavía sin revisar
  const [paso, setPaso] = useState(-1); // paso que se está mostrando; -1: ninguno

  const porId = Object.fromEntries(piezas.map((pieza) => [pieza.id, pieza]));
  const libres = piezas.filter((pieza) => !elegidos.includes(pieza.id));
  const conProblema = new Set((problemas ?? []).map((problema) => problema.id));
  const bien = problemas?.length === 0;
  const viendo = paso >= 0;
  const terminado = paso >= elegidos.length;

  useEffect(() => {
    if (!viendo || terminado) return;
    const espera = setTimeout(() => setPaso(paso + 1), MS_POR_PASO);
    return () => clearTimeout(espera);
  }, [paso, viendo, terminado]);

  function cambiar(nuevos) {
    setElegidos(nuevos);
    setProblemas(null);
    setPaso(-1);
  }

  function mover(posicion, salto) {
    const nuevos = [...elegidos];
    [nuevos[posicion], nuevos[posicion + salto]] = [nuevos[posicion + salto], nuevos[posicion]];
    cambiar(nuevos);
  }

  function cambiarTransaccion(valor) {
    setEnTransaccion(valor);
    setProblemas(null);
    setPaso(-1);
  }

  function verSolucion() {
    setElegidos(accion.pasos.map((p) => p.id));
    setEnTransaccion(accion.transaccion);
    setProblemas([]);
    setPaso(-1);
  }

  return (
    <div className="actividad">
      <p className="escenario">
        <strong>{accion.boton}.</strong> {accion.descripcion}
      </p>
      <p className="consigna">
        Elige lo que pasa por dentro al pulsar el botón y ponlo en orden. Algunas piezas sobran.
      </p>

      <div className="dos-columnas">
        <div>
          <h3>Piezas</h3>
          {libres.length === 0 && <p className="vacio">Usaste todas las piezas.</p>}
          <ul className="lista-piezas">
            {libres.map((pieza) => (
              <li key={pieza.id}>
                <button type="button" className="pieza-boton" onClick={() => cambiar([...elegidos, pieza.id])}>
                  <Pieza pieza={pieza} />
                  <span className="agregar" aria-hidden="true">Agregar →</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Tu flujo</h3>
          <label className="interruptor">
            <input
              type="checkbox"
              checked={enTransaccion}
              onChange={(evento) => cambiarTransaccion(evento.target.checked)}
            />
            Va en una transacción
          </label>
          <div className={enTransaccion ? "flujo en-transaccion" : "flujo"}>
            {enTransaccion && <code className="marca-tx">START TRANSACTION;</code>}
            {elegidos.length === 0 && <p className="vacio">Agrega piezas desde la izquierda.</p>}
            <ol className="lista-flujo">
              {elegidos.map((id, i) => {
                const clases = ["paso-flujo"];
                if (conProblema.has(id)) clases.push("con-problema");
                if (viendo && i === paso) clases.push("ejecutando");
                if (viendo && i < paso) clases.push("hecho");
                return (
                  <li key={id} className={clases.join(" ")}>
                    <span className="numero">{i + 1}</span>
                    <div className="paso-contenido">
                      <Pieza pieza={porId[id]} />
                      {viendo && i <= paso && porId[id].nota && <p className="nota">{porId[id].nota}</p>}
                    </div>
                    <div className="controles">
                      <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)}>↑</button>
                      <button type="button" aria-label="Bajar" disabled={i === elegidos.length - 1} onClick={() => mover(i, 1)}>↓</button>
                      <button type="button" aria-label="Quitar" onClick={() => cambiar(elegidos.filter((e) => e !== id))}>✕</button>
                    </div>
                  </li>
                );
              })}
            </ol>
            {enTransaccion && <code className="marca-tx">COMMIT;</code>}
          </div>

          <div className="acciones-revisar">
            <button type="button" className="primario" disabled={elegidos.length === 0} onClick={() => setProblemas(revisarFlujo(accion, elegidos, enTransaccion))}>
              Revisar
            </button>
            <button type="button" onClick={verSolucion}>Ver la solución</button>
          </div>

          {problemas && !bien && (
            <div className="resultado mal" role="status">
              <strong>Todavía no.</strong>
              <ul>
                {problemas.map((problema) => (
                  <li key={problema.id}>
                    {problema.texto}
                    {problema.error && <code className="error-mysql">{problema.error}</code>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bien && (
            <div className="resultado bien" role="status">
              <strong>¡Bien! El flujo está completo y en orden.</strong>
              <p>{accion.porQueTransaccion}</p>
              <button type="button" className="primario" onClick={() => setPaso(0)}>
                {viendo ? "▶ Ver de nuevo" : "▶ Ver en la aplicación"}
              </button>
            </div>
          )}
        </div>
      </div>

      {bien && terminado && (
        <section className="despues">
          <h3>Así quedan los datos</h3>
          <Tablas tablas={accion.despues.tablas} />
          <p>{accion.despues.nota}</p>
        </section>
      )}
    </div>
  );
}
