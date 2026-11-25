// Revisa las respuestas del alumno. Nada se ejecuta: se compara con lo que
// cada caso trae escrito en src/casos/.

// Los lugares donde puede ir una regla (actividad «¿Dónde va?»).
export const ZONAS = [
  { id: "aplicacion", nombre: "Aplicación", ayuda: "código en src/db.js o en el navegador" },
  { id: "restriccion", nombre: "Restricción", ayuda: "CHECK, UNIQUE, NOT NULL, DEFAULT, llave foránea" },
  { id: "vista", nombre: "Vista", ayuda: "una consulta con nombre" },
  { id: "funcion", nombre: "Función", ayuda: "un valor dentro de un SELECT o un WHERE" },
  { id: "procedimiento", nombre: "Procedimiento", ayuda: "una acción de varios pasos, con CALL" },
  { id: "trigger", nombre: "Trigger", ayuda: "se ejecuta solo ante un INSERT, UPDATE o DELETE" },
  { id: "permiso", nombre: "Permiso", ayuda: "GRANT: quién puede hacer qué" },
];

// «Arma el flujo»: los pasos elegidos, en orden, y si van en una transacción.
// Devuelve los problemas encontrados; una lista vacía significa que está bien.
export function revisarFlujo(accion, elegidos, enTransaccion) {
  const problemas = [];

  for (const sobra of accion.sobran) {
    if (elegidos.includes(sobra.id)) problemas.push({ id: sobra.id, texto: sobra.porQue });
  }

  for (const paso of accion.pasos) {
    const posicion = elegidos.indexOf(paso.id);
    if (posicion === -1) {
      problemas.push({ id: paso.id, texto: `Falta un paso: ${paso.nota}` });
      continue;
    }
    // Un paso va después de todos los que necesita; si falta uno, ya se avisó arriba.
    const malOrden = (paso.despuesDe ?? []).some((id) => elegidos.indexOf(id) > posicion);
    if (malOrden) problemas.push({ id: paso.id, texto: paso.orden, error: paso.error });
  }

  if (enTransaccion !== accion.transaccion) {
    problemas.push({ id: "transaccion", texto: accion.porQueTransaccion });
  }
  return problemas;
}

// «Ordena la consulta»: elegidos son los índices de las piezas en el orden del
// alumno. Devuelve la primera posición equivocada, o -1 si todo está en su lugar.
export function primerError(elegidos) {
  return elegidos.findIndex((pieza, posicion) => pieza !== posicion);
}

// «¿Dónde va?»: la zona elegida y, si es un trigger, su momento y sus eventos.
// estado: "bien" (la mejor respuesta), "tambien" (vale, con matices),
// "casi" (trigger bien elegido, detalle mal) o "mal".
export function revisarDondeVa(regla, zona, detalle) {
  if (zona === regla.va) {
    if (zona === "trigger" && !mismoTrigger(regla.trigger, detalle)) {
      return { estado: "casi", texto: "Sí es un trigger, pero revisa el momento (BEFORE o AFTER) y los eventos." };
    }
    return { estado: "bien", texto: regla.porQue };
  }
  if (regla.tambien?.[zona]) return { estado: "tambien", texto: regla.tambien[zona] };
  return { estado: "mal", texto: regla.pista };
}

function mismoTrigger(esperado, elegido) {
  if (!elegido || esperado.momento !== elegido.momento) return false;
  const eventos = [...elegido.eventos].sort().join();
  return eventos === [...esperado.eventos].sort().join();
}

// Mezcla una lista siempre igual para la misma semilla: las piezas no salen
// en orden, y no cambian de lugar cada vez que React vuelve a dibujar.
export function mezclar(lista, semilla) {
  let estado = [...semilla].reduce((total, letra) => (total * 31 + letra.charCodeAt(0)) >>> 0, 7);
  const azar = () => {
    estado = (estado * 1103515245 + 12345) >>> 0;
    return estado / 2 ** 32;
  };
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  // Si quedó igual que al inicio, se corre una posición: no regalar la respuesta.
  const igual = copia.every((elemento, i) => elemento === lista[i]);
  return igual && copia.length > 1 ? [...copia.slice(1), copia[0]] : copia;
}
