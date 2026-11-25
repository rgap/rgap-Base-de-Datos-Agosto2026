import { test } from "node:test";
import assert from "node:assert/strict";

import { mezclar, primerError, revisarDondeVa, revisarFlujo } from "./revisar.js";

// Una acción pequeña: «c» necesita a «a» y a «b», que pueden ir en cualquier orden.
const accion = {
  transaccion: true,
  porQueTransaccion: "Son varios cambios.",
  pasos: [
    { id: "a", sql: "SELECT 1", nota: "a" },
    { id: "b", sql: "SELECT 2", nota: "b" },
    { id: "c", sql: "INSERT", nota: "c", despuesDe: ["a", "b"], orden: "c va al final.", error: "Error Code: 1452." },
  ],
  sobran: [{ id: "x", sql: "DELETE", porQue: "No se borra nada." }],
};

test("un flujo completo y en orden no tiene problemas", () => {
  assert.deepEqual(revisarFlujo(accion, ["a", "b", "c"], true), []);
  assert.deepEqual(revisarFlujo(accion, ["b", "a", "c"], true), []);
});

test("un paso antes de lo que necesita muestra el error de MySQL", () => {
  const problemas = revisarFlujo(accion, ["a", "c", "b"], true);
  assert.deepEqual(problemas, [{ id: "c", texto: "c va al final.", error: "Error Code: 1452." }]);
});

test("avisa los pasos que faltan, los que sobran y la transacción", () => {
  const problemas = revisarFlujo(accion, ["x", "a", "c"], false);
  assert.deepEqual(problemas.map((p) => p.id), ["x", "b", "transaccion"]);
});

test("primerError da la primera pieza fuera de su lugar", () => {
  assert.equal(primerError([0, 1, 2]), -1);
  assert.equal(primerError([0, 2, 1]), 1);
});

const regla = {
  va: "trigger",
  trigger: { momento: "BEFORE", eventos: ["INSERT", "UPDATE"] },
  porQue: "bien",
  pista: "pista",
  tambien: { aplicacion: "también" },
};

test("¿Dónde va?: bien, casi, también y mal", () => {
  assert.equal(revisarDondeVa(regla, "trigger", { momento: "BEFORE", eventos: ["UPDATE", "INSERT"] }).estado, "bien");
  assert.equal(revisarDondeVa(regla, "trigger", { momento: "AFTER", eventos: ["INSERT", "UPDATE"] }).estado, "casi");
  assert.equal(revisarDondeVa(regla, "trigger", { momento: "BEFORE", eventos: ["INSERT"] }).estado, "casi");
  assert.equal(revisarDondeVa(regla, "aplicacion").estado, "tambien");
  assert.deepEqual(revisarDondeVa(regla, "vista"), { estado: "mal", texto: "pista" });
});

test("mezclar es siempre igual para la misma semilla y nunca deja el orden original", () => {
  const lista = [0, 1, 2, 3, 4];
  assert.deepEqual(mezclar(lista, "caso"), mezclar(lista, "caso"));
  assert.deepEqual([...mezclar(lista, "caso")].sort(), lista);
  for (const semilla of ["a", "b", "c", "d", "e", "f"]) {
    assert.notDeepEqual(mezclar(lista, semilla), lista);
  }
});
