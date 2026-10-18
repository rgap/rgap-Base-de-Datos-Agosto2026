// ============================================================
// CREAR LA BASE DE DATOS
// ============================================================
// Este programa se ejecuta una sola vez:  npm run crear
// Al terminar deja el archivo tienda.db con un millón de productos.

import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// ------------------------------------------------------------
// Paso 1: si ya había una tienda.db, se borra para empezar de cero.
// ------------------------------------------------------------

fs.rmSync('tienda.db', { force: true });

// ------------------------------------------------------------
// Paso 2: se crea el archivo tienda.db, todavía vacío.
// ------------------------------------------------------------

const db = new DatabaseSync('tienda.db');

// ------------------------------------------------------------
// Paso 3: se lee modelo_fisico.sql y se ejecuta.
//         Eso crea la tabla producto.
// ------------------------------------------------------------

const sql = fs.readFileSync('modelo_fisico.sql', 'utf8');
db.exec(sql);

// ------------------------------------------------------------
// Paso 4: se insertan los productos, uno por uno.
// ------------------------------------------------------------

const categorias = ['Cómputo', 'Celulares', 'Hogar', 'Muebles', 'Juguetes', 'Libros', 'Deportes', 'Ropa'];

// Los signos ? son espacios en blanco que se llenan en cada vuelta del for.
const insertar = db.prepare('INSERT INTO producto (nombre, categoria, precio) VALUES (?, ?, ?)');

// BEGIN y COMMIT hacen que el millón se guarde junto: así es mucho más rápido.
db.exec('BEGIN');

for (let numero = 1; numero <= 1000000; numero++) {
  // Producto 1, Producto 2, Producto 3...
  const nombre = 'Producto ' + numero;

  // Las categorías se reparten en orden: Cómputo, Celulares, Hogar...
  const categoria = categorias[numero % categorias.length];

  // Un precio entre 10 y 5009 soles que parece al azar, pero siempre sale igual.
  const precio = 10 + ((numero * 7919) % 5000);

  insertar.run(nombre, categoria, precio);
}

db.exec('COMMIT');

console.log('Listo: se creó tienda.db');
