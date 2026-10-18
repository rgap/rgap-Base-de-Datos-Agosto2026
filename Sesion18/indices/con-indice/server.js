// ============================================================
// EL SERVIDOR
// ============================================================
// Se enciende con:  npm run dev
// Hace dos cosas: entrega la página y responde las búsquedas.

import express from 'express';
import { DatabaseSync } from 'node:sqlite';

// Se abre la base de datos que creó crear_db.js.
const db = new DatabaseSync('agenda.db');

// Se crea el servidor.
const app = express();

// ------------------------------------------------------------
// 1. LA PÁGINA
// ------------------------------------------------------------
// Al entrar a http://localhost:3002 se entrega public/index.html.

app.use(express.static('public'));

// ------------------------------------------------------------
// 2. LA BÚSQUEDA
// ------------------------------------------------------------
// La página pide, por ejemplo:  /buscar?correo=contacto5@correo.com

app.get('/buscar', function (peticion, respuesta) {
  // El correo que se escribió en la página.
  const correo = peticion.query.correo;

  // La consulta. El signo ? se reemplaza por el correo.
  const consulta = db.prepare('SELECT * FROM contacto WHERE correo = ?');

  // Se anota la hora, se ejecuta la consulta y se anota la hora otra vez.
  const inicio = performance.now();
  const filas = consulta.all(correo);
  const fin = performance.now();

  // Se le responde a la página:
  //   contacto      la fila encontrada (o nada, si no existe)
  //   milisegundos  lo que tardó la consulta
  respuesta.json({
    contacto: filas[0],
    milisegundos: fin - inicio,
  });
});

// ------------------------------------------------------------
// 3. ENCENDER
// ------------------------------------------------------------

app.listen(3002, function () {
  console.log('Abre http://localhost:3002');
});
