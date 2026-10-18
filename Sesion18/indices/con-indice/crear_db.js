// ============================================================
// CREAR LA BASE DE DATOS
// ============================================================
// Este programa se ejecuta una sola vez:  npm run crear
// Al terminar deja el archivo agenda.db con un millón de contactos.

import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// ------------------------------------------------------------
// Paso 1: si ya había una agenda.db, se borra para empezar de cero.
// ------------------------------------------------------------

fs.rmSync('agenda.db', { force: true });

// ------------------------------------------------------------
// Paso 2: se crea el archivo agenda.db, todavía vacío.
// ------------------------------------------------------------

const db = new DatabaseSync('agenda.db');

// ------------------------------------------------------------
// Paso 3: se lee modelo_fisico.sql y se ejecuta.
//         Eso crea la tabla contacto.
// ------------------------------------------------------------

const sql = fs.readFileSync('modelo_fisico.sql', 'utf8');
db.exec(sql);

// ------------------------------------------------------------
// Paso 4: se insertan los contactos, uno por uno.
// ------------------------------------------------------------

// Los signos ? son espacios en blanco que se llenan en cada vuelta del for.
const insertar = db.prepare('INSERT INTO contacto (nombre, correo) VALUES (?, ?)');

// BEGIN y COMMIT hacen que el millón se guarde junto: así es mucho más rápido.
db.exec('BEGIN');

for (let numero = 1; numero <= 1000000; numero++) {
  // Contacto 1, Contacto 2, Contacto 3...
  const nombre = 'Contacto ' + numero;

  // contacto1@correo.com, contacto2@correo.com...
  const correo = 'contacto' + numero + '@correo.com';

  insertar.run(nombre, correo);
}

db.exec('COMMIT');

console.log('Listo: se creó agenda.db');
