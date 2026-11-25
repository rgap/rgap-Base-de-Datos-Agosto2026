import { useState } from "react";

import Pestanas from "../componentes/Pestanas.jsx";
import Sql from "../componentes/Sql.jsx";
import { Tabla, Tablas } from "../componentes/Tablas.jsx";

const LETRAS = ["A", "B", "C", "D"];

// Actividad 3: leer una consulta con datos fijos y elegir qué devuelve MySQL.
export default function QueDevuelve({ caso }) {
  const [itemId, setItemId] = useState(caso.devuelve[0].id);
  const item = caso.devuelve.find((i) => i.id === itemId);
  return (
    <div className="actividad">
      <Pestanas
        etiqueta="Pregunta"
        opciones={caso.devuelve.map((i, n) => ({ id: i.id, nombre: `Pregunta ${n + 1}` }))}
        actual={itemId}
        onElegir={setItemId}
      />
      <Pregunta key={item.id} item={item} />
    </div>
  );
}

function Pregunta({ item }) {
  const [elegida, setElegida] = useState(null);
  const acerto = elegida === item.correcta;

  return (
    <>
      <p className="escenario">{item.pregunta}</p>
      <h3>Los datos</h3>
      <Tablas tablas={item.tablas} />
      <h3>La consulta</h3>
      <Sql codigo={item.sql} />

      <h3>¿Qué devuelve?</h3>
      <div className="opciones" role="radiogroup" aria-label="Opciones">
        {item.opciones.map((opcion, i) => {
          let clase = "opcion";
          if (elegida === i) clase += acerto ? " correcta" : " incorrecta";
          return (
            <button key={i} type="button" role="radio" aria-checked={elegida === i} className={clase} onClick={() => setElegida(i)}>
              <span className="letra">{LETRAS[i]}</span>
              {opcion.mensaje ? <code className="mensaje-mysql">{opcion.mensaje}</code> : <Tabla tabla={opcion} />}
            </button>
          );
        })}
      </div>

      {elegida !== null && !acerto && (
        <div className="resultado mal" role="status">
          <strong>No es esa.</strong> Lee la consulta cláusula por cláusula, con los datos de arriba.{" "}
          <button type="button" className="enlace" onClick={() => setElegida(item.correcta)}>Ver la respuesta</button>
        </div>
      )}
      {acerto && (
        <div className="resultado bien" role="status">
          <strong>¡Bien!</strong> {item.porQue}
        </div>
      )}
    </>
  );
}
