import { useState } from "react";

import ArmarFlujo from "./actividades/ArmarFlujo.jsx";
import DondeVa from "./actividades/DondeVa.jsx";
import OrdenarConsulta from "./actividades/OrdenarConsulta.jsx";
import QueDevuelve from "./actividades/QueDevuelve.jsx";
import Aplicacion from "./componentes/Aplicacion.jsx";
import Pestanas from "./componentes/Pestanas.jsx";
import { CASOS } from "./casos/index.js";

const ACTIVIDADES = [
  { id: "flujo", nombre: "1. Arma el flujo" },
  { id: "ordenar", nombre: "2. Ordena la consulta" },
  { id: "devuelve", nombre: "3. ¿Qué devuelve?" },
  { id: "donde", nombre: "4. ¿Dónde va?" },
];

export default function App() {
  const [casoId, setCasoId] = useState(CASOS[0].id);
  const [actividad, setActividad] = useState("flujo");
  const [accionId, setAccionId] = useState(CASOS[0].acciones[0].id);

  const caso = CASOS.find((c) => c.id === casoId);
  const accion = caso.acciones.find((a) => a.id === accionId) ?? caso.acciones[0];

  function elegirCaso(id) {
    setCasoId(id);
    setAccionId(CASOS.find((c) => c.id === id).acciones[0].id);
  }

  function pulsarBoton(boton) {
    setAccionId(caso.acciones.find((a) => a.boton === boton).id);
    setActividad("flujo");
  }

  return (
    <div className="pagina">
      <header className="cabecera">
        <h1>Laboratorio: ¿dónde va cada consulta?</h1>
        <p>Sesión 31 · Aquí nada se ejecuta: piensa qué consulta va, en qué orden y dónde vive cada regla.</p>
        <Pestanas
          etiqueta="Proyecto"
          opciones={CASOS.map((c) => ({ id: c.id, nombre: `${c.numero} · ${c.nombre}` }))}
          actual={casoId}
          onElegir={elegirCaso}
        />
      </header>

      <main className="cuerpo">
        <Aplicacion caso={caso} botonActivo={actividad === "flujo" ? accion.boton : null} onBoton={pulsarBoton} />

        <section className="panel">
          <Pestanas etiqueta="Actividad" opciones={ACTIVIDADES} actual={actividad} onElegir={setActividad} />
          {/* Las cuatro quedan montadas: al cambiar de pestaña no se pierde lo avanzado. */}
          <div hidden={actividad !== "flujo"}>
            <ArmarFlujo key={caso.id + accion.id} caso={caso} accion={accion} />
          </div>
          <div hidden={actividad !== "ordenar"}>
            <OrdenarConsulta key={caso.id} caso={caso} />
          </div>
          <div hidden={actividad !== "devuelve"}>
            <QueDevuelve key={caso.id} caso={caso} />
          </div>
          <div hidden={actividad !== "donde"}>
            <DondeVa key={caso.id} caso={caso} />
          </div>
        </section>
      </main>
    </div>
  );
}
