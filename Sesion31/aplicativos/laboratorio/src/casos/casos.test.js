// Revisa que el contenido de cada caso esté completo y sea coherente: un error
// aquí se vería recién en clase, frente a los alumnos.
import { test } from "node:test";
import assert from "node:assert/strict";

import { CASOS } from "./index.js";
import { revisarFlujo, ZONAS } from "../revisar.js";

const zonas = ZONAS.map((zona) => zona.id);
const origenes = ["proyecto", "sesión 31", "propuesto"];

function revisarTabla(tabla, donde) {
  for (const fila of tabla.filas) {
    assert.equal(fila.length, tabla.columnas.length, `${donde}: fila ${JSON.stringify(fila)}`);
  }
  for (const i of tabla.resaltar ?? []) assert.ok(i < tabla.filas.length, `${donde}: resaltar ${i}`);
}

test("los casos tienen id distinto", () => {
  const ids = CASOS.map((caso) => caso.id);
  assert.equal(new Set(ids).size, ids.length);
});

for (const caso of CASOS) {
  test(`${caso.nombre}: la pantalla tiene un botón para cada flujo`, () => {
    revisarTabla(caso.pantalla, "pantalla");
    for (const accion of caso.acciones) assert.ok(caso.pantalla.botones.includes(accion.boton), accion.boton);
  });

  for (const accion of caso.acciones) {
    test(`${caso.nombre} · ${accion.boton}: los pasos en el orden escrito son la respuesta`, () => {
      const piezas = [...accion.pasos, ...accion.sobran];
      assert.equal(new Set(piezas.map((p) => p.id)).size, piezas.length, "ids repetidos");
      for (const paso of accion.pasos) {
        assert.ok(Boolean(paso.sql) !== Boolean(paso.app), `${paso.id}: sql o app, solo uno`);
        assert.ok(paso.nota, `${paso.id}: falta nota`);
        if (paso.despuesDe) assert.ok(paso.orden, `${paso.id}: falta orden`);
      }
      for (const sobra of accion.sobran) assert.ok(sobra.sql && sobra.porQue, sobra.id);
      assert.ok(accion.porQueTransaccion);
      // Los pasos en el orden del archivo tienen que pasar la revisión.
      assert.deepEqual(revisarFlujo(accion, accion.pasos.map((p) => p.id), accion.transaccion), []);
      accion.despues.tablas.forEach((tabla) => revisarTabla(tabla, tabla.nombre));
    });
  }

  test(`${caso.nombre}: cada consulta para ordenar tiene piezas distintas`, () => {
    for (const item of caso.ordenar) {
      assert.ok(item.piezas.length >= 3, item.id);
      assert.equal(new Set(item.piezas).size, item.piezas.length, item.id);
      assert.ok(item.porQue && item.contexto, item.id);
    }
  });

  test(`${caso.nombre}: cada «¿Qué devuelve?» tiene una sola respuesta correcta`, () => {
    for (const item of caso.devuelve) {
      assert.ok(item.correcta >= 0 && item.correcta < item.opciones.length, item.id);
      const textos = item.opciones.map((opcion) => JSON.stringify(opcion));
      assert.equal(new Set(textos).size, textos.length, `${item.id}: opciones repetidas`);
      item.tablas.forEach((tabla) => revisarTabla(tabla, tabla.nombre));
      item.opciones.filter((o) => o.filas).forEach((opcion) => revisarTabla(opcion, item.id));
    }
  });

  test(`${caso.nombre}: cada regla va a una zona que existe`, () => {
    for (const regla of caso.reglas) {
      assert.ok(zonas.includes(regla.va), `${regla.id}: ${regla.va}`);
      assert.equal(Boolean(regla.trigger), regla.va === "trigger", `${regla.id}: trigger`);
      for (const zona of Object.keys(regla.tambien ?? {})) {
        assert.ok(zonas.includes(zona) && zona !== regla.va, `${regla.id}: también ${zona}`);
      }
      assert.ok(origenes.includes(regla.sqlOrigen), `${regla.id}: ${regla.sqlOrigen}`);
      assert.ok(regla.texto && regla.fuente && regla.porQue && regla.pista && regla.sql, regla.id);
    }
  });
}
