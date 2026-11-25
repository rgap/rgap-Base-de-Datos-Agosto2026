import { useState } from "react";

import Sql from "../componentes/Sql.jsx";
import { revisarDondeVa, ZONAS } from "../revisar.js";

const EVENTOS = ["INSERT", "UPDATE", "DELETE"];

const ORIGEN = {
  proyecto: "Así está en el proyecto",
  "sesión 31": "Ejemplo de la sesión 31",
  propuesto: "Propuesto: el proyecto no lo tiene",
};

const TITULO = { bien: "¡Bien!", tambien: "También vale, pero hay un lugar mejor.", casi: "Casi.", mal: "No va ahí." };

// Actividad 4: decidir dónde se cumple cada regla del sistema.
export default function DondeVa({ caso }) {
  const [actual, setActual] = useState(0);
  const [resueltas, setResueltas] = useState({}); // id de la regla → zona
  const [respuesta, setRespuesta] = useState(null);
  const [eligiendoTrigger, setEligiendoTrigger] = useState(false);
  const [momento, setMomento] = useState(null);
  const [eventos, setEventos] = useState([]);

  const regla = caso.reglas[actual];

  function irA(posicion) {
    setActual(posicion);
    setRespuesta(null);
    setEligiendoTrigger(false);
    setMomento(null);
    setEventos([]);
  }

  function responder(zona, detalle) {
    const resultado = revisarDondeVa(regla, zona, detalle);
    setRespuesta(resultado);
    if (resultado.estado === "bien") setResueltas({ ...resueltas, [regla.id]: zona });
  }

  function elegirZona(zona) {
    setEligiendoTrigger(zona === "trigger");
    if (zona === "trigger") setRespuesta(null);
    else responder(zona);
  }

  function alternarEvento(evento) {
    setEventos((antes) => (antes.includes(evento) ? antes.filter((e) => e !== evento) : [...antes, evento]));
    setRespuesta(null);
  }

  function elegirMomento(valor) {
    setMomento(valor);
    setRespuesta(null);
  }

  return (
    <div className="actividad">
      <div className="reglas" role="group" aria-label="Reglas">
        {caso.reglas.map((r, i) => (
          <button
            key={r.id}
            type="button"
            className={["regla-chip", i === actual && "activa", resueltas[r.id] && "resuelta"].filter(Boolean).join(" ")}
            aria-pressed={i === actual}
            onClick={() => irA(i)}
          >
            {resueltas[r.id] ? "✓ " : ""}{r.fuente}
          </button>
        ))}
        <span className="progreso">
          {Object.keys(resueltas).length} de {caso.reglas.length}
        </span>
      </div>

      <blockquote className="regla">
        «{regla.texto}»
        <cite>{regla.fuente}</cite>
      </blockquote>

      <p className="consigna">¿Dónde se cumple esta regla?</p>
      <div className="zonas">
        {ZONAS.map((zona) => (
          <button
            key={zona.id}
            type="button"
            className={eligiendoTrigger && zona.id === "trigger" ? "zona elegida" : "zona"}
            onClick={() => elegirZona(zona.id)}
          >
            <strong>{zona.nombre}</strong>
            <span>{zona.ayuda}</span>
          </button>
        ))}
      </div>

      {eligiendoTrigger && (
        <div className="detalle-trigger">
          <fieldset>
            <legend>¿Cuándo?</legend>
            {["BEFORE", "AFTER"].map((m) => (
              <label key={m}>
                <input type="radio" name="momento" checked={momento === m} onChange={() => elegirMomento(m)} /> {m}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>¿Ante qué?</legend>
            {EVENTOS.map((evento) => (
              <label key={evento}>
                <input type="checkbox" checked={eventos.includes(evento)} onChange={() => alternarEvento(evento)} /> {evento}
              </label>
            ))}
          </fieldset>
          <button
            type="button"
            className="primario"
            disabled={!momento || eventos.length === 0}
            onClick={() => responder("trigger", { momento, eventos })}
          >
            Revisar
          </button>
        </div>
      )}

      {respuesta && (
        <div className={`resultado ${respuesta.estado === "bien" ? "bien" : respuesta.estado === "mal" ? "mal" : "medio"}`} role="status">
          <strong>{TITULO[respuesta.estado]}</strong>{" "}
          {respuesta.estado === "mal" ? `Pista: ${respuesta.texto}` : respuesta.texto}
          {respuesta.estado === "bien" && (
            <>
              <p className="origen">{ORIGEN[regla.sqlOrigen]}:</p>
              <Sql codigo={regla.sql} />
              {actual < caso.reglas.length - 1 && (
                <button type="button" className="primario" onClick={() => irA(actual + 1)}>Siguiente regla →</button>
              )}
            </>
          )}
        </div>
      )}

      <section className="mapa" aria-label="Dónde quedó cada regla">
        <h3>El sistema por dentro</h3>
        <div className="mapa-zonas">
          {ZONAS.map((zona) => (
            <div key={zona.id} className="mapa-zona">
              <h4>{zona.nombre}</h4>
              {caso.reglas.filter((r) => resueltas[r.id] === zona.id).map((r) => (
                <p key={r.id} className="mapa-regla" title={r.texto}>
                  <b>{r.fuente}</b> {r.texto}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
