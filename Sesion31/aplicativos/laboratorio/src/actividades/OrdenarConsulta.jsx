import { useMemo, useState } from "react";

import Pestanas from "../componentes/Pestanas.jsx";
import Sql from "../componentes/Sql.jsx";
import { mezclar, primerError } from "../revisar.js";

// Actividad 2: armar una consulta real del proyecto con sus cláusulas desordenadas.
export default function OrdenarConsulta({ caso }) {
  const [itemId, setItemId] = useState(caso.ordenar[0].id);
  const item = caso.ordenar.find((i) => i.id === itemId);
  return (
    <div className="actividad">
      <Pestanas
        etiqueta="Consulta"
        opciones={caso.ordenar.map((i) => ({ id: i.id, nombre: i.titulo }))}
        actual={itemId}
        onElegir={setItemId}
      />
      <Ordenar key={item.id} item={item} semilla={caso.id + item.id} />
    </div>
  );
}

function Ordenar({ item, semilla }) {
  // Las piezas se guardan por su posición correcta: 0 es la primera cláusula.
  const desordenadas = useMemo(() => mezclar(item.piezas.map((_, i) => i), semilla), [item, semilla]);
  const [elegidas, setElegidas] = useState([]);
  const [revisado, setRevisado] = useState(false);

  const libres = desordenadas.filter((pieza) => !elegidas.includes(pieza));
  const error = revisado ? primerError(elegidas) : -1;
  const bien = revisado && error === -1;

  function cambiar(nuevas) {
    setElegidas(nuevas);
    setRevisado(false);
  }

  function claseDe(posicion) {
    if (!revisado) return "pieza-consulta";
    return posicion < error || error === -1 ? "pieza-consulta en-su-lugar" : "pieza-consulta fuera-de-lugar";
  }

  return (
    <>
      <p className="escenario">
        <strong>{item.titulo}.</strong> {item.contexto}
      </p>
      <p className="consigna">Pulsa las piezas en el orden en que se escribe la consulta.</p>

      <div className="dos-columnas">
        <div>
          <h3>Piezas</h3>
          {libres.length === 0 && <p className="vacio">Usaste todas las piezas.</p>}
          <ul className="lista-piezas">
            {libres.map((pieza) => (
              <li key={pieza}>
                <button type="button" className="pieza-boton" onClick={() => cambiar([...elegidas, pieza])}>
                  <Sql codigo={item.piezas[pieza]} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Tu consulta</h3>
          {elegidas.length === 0 && <p className="vacio">Todavía vacía.</p>}
          <ol className="lista-consulta">
            {elegidas.map((pieza, posicion) => (
              <li key={pieza}>
                <button
                  type="button"
                  className={claseDe(posicion)}
                  title="Quitar esta pieza"
                  onClick={() => cambiar(elegidas.filter((e) => e !== pieza))}
                >
                  <Sql codigo={item.piezas[pieza]} />
                </button>
              </li>
            ))}
          </ol>
          <div className="acciones-revisar">
            <button
              type="button"
              className="primario"
              disabled={elegidas.length !== item.piezas.length}
              onClick={() => setRevisado(true)}
            >
              Revisar
            </button>
            <button type="button" onClick={() => { setElegidas(item.piezas.map((_, i) => i)); setRevisado(true); }}>
              Ver la solución
            </button>
          </div>
          {revisado && !bien && (
            <div className="resultado mal" role="status">
              <strong>Todavía no.</strong>{" "}
              {error === 0 ? "La primera pieza no va ahí." : `Hasta la pieza ${error}, todo bien; la pieza ${error + 1} no va ahí.`}{" "}
              Pulsa una pieza para quitarla.
            </div>
          )}
          {bien && (
            <div className="resultado bien" role="status">
              <strong>¡Bien!</strong> {item.porQue}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
