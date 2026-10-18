// ============================================================
// EL SERVIDOR
// ============================================================
// Se enciende con:  npm run dev
// Hace tres cosas: entrega la página, responde los filtros
// y crea o borra el índice de dos columnas.

import express from 'express';
import { DatabaseSync } from 'node:sqlite';

// Se abre la base de datos que creó crear_db.js.
const db = new DatabaseSync('tienda.db');

// Se crea el servidor.
const app = express();

// ------------------------------------------------------------
// 1. LA PÁGINA
// ------------------------------------------------------------
// Al entrar a http://localhost:3003 se entrega public/index.html.

app.use(express.static('public'));

// ------------------------------------------------------------
// 2. LOS FILTROS
// ------------------------------------------------------------
// La página pide, por ejemplo:  /buscar?categoria=Hogar&minimo=100&maximo=300

// La consulta que arma la tienda con los filtros elegidos.
// Cada signo ? se reemplaza por lo que eligió el usuario.
const sql =
  'SELECT nombre, categoria, precio FROM producto ' +
  'WHERE categoria = ? AND precio BETWEEN ? AND ? ' +
  'ORDER BY precio ' +
  'LIMIT 10';

app.get('/buscar', function (peticion, respuesta) {
  const categoria = peticion.query.categoria;
  const minimo = Number(peticion.query.minimo);
  const maximo = Number(peticion.query.maximo);

  const consulta = db.prepare(sql);

  // Se anota la hora, se ejecuta la consulta y se anota la hora otra vez.
  const inicio = performance.now();
  const productos = consulta.all(categoria, minimo, maximo);
  const fin = performance.now();

  // EXPLAIN QUERY PLAN cuenta CÓMO buscó SQLite:
  //   SCAN producto            leyó la tabla completa, fila por fila
  //   SEARCH ... USING INDEX   fue directo, usando el índice
  const plan = db
    .prepare('EXPLAIN QUERY PLAN ' + sql)
    .all(categoria, minimo, maximo)
    .map((paso) => paso.detail);

  respuesta.json({
    productos: productos,
    milisegundos: fin - inicio,
    plan: plan,
    indice: hayIndice(),
  });
});

// ------------------------------------------------------------
// 3. EL ÍNDICE DE DOS COLUMNAS
// ------------------------------------------------------------

function hayIndice() {
  const fila = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_producto_categoria_precio'")
    .get();
  return fila !== undefined;
}

app.get('/indice', function (peticion, respuesta) {
  respuesta.json({ indice: hayIndice() });
});

app.post('/indice/crear', function (peticion, respuesta) {
  db.exec('CREATE INDEX IF NOT EXISTS idx_producto_categoria_precio ON producto (categoria, precio)');
  respuesta.json({ indice: hayIndice() });
});

app.post('/indice/borrar', function (peticion, respuesta) {
  db.exec('DROP INDEX IF EXISTS idx_producto_categoria_precio');
  respuesta.json({ indice: hayIndice() });
});

// ------------------------------------------------------------
// 4. ENCENDER
// ------------------------------------------------------------

app.listen(3003, function () {
  console.log('Abre http://localhost:3003');
});
