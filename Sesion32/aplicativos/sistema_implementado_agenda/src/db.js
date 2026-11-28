// Persistencia de la agenda en MySQL. El esquema (specs/modelo_fisico_mysql.sql)
// define `contacto`, `grupo` y la tabla intermedia `contacto_grupo`, sus reglas,
// los triggers que impiden una fecha de registro futura y los datos iniciales.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import mysql from "mysql2/promise";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// La conexión se puede redirigir con DATABASE_URL.
const databaseUrl = process.env.DATABASE_URL
  || "mysql://root@localhost:3306/agenda";

// El esquema se guarda en memoria para poder reaplicarlo al reiniciar los datos.
// Las líneas DELIMITER son del cliente mysql, no de SQL: se quitan y cada
// "END //" vuelve a terminar en ";". El servidor separa las sentencias.
const schemaSql = readFileSync(join(root, "specs", "modelo_fisico_mysql.sql"), "utf8")
  .replace(/^DELIMITER .*$/gm, "")
  .replace(/\/\/[ \t]*$/gm, ";");

// Fechas DATE como texto "AAAA-MM-DD", igual que las envía el navegador.
const pool = mysql.createPool({ uri: databaseUrl, dateStrings: true });

// Error de una regla del negocio: la API lo responde como 400 con su mensaje.
export class ReglaError extends Error {}

// Traduce las violaciones de UNIQUE / PRIMARY KEY / FOREIGN KEY a un mensaje
// para el usuario. El SIGNAL de un trigger (SQLSTATE 45000) ya trae su mensaje.
async function conRegla(fn, mensajes) {
  try {
    return await fn();
  } catch (error) {
    if (error.sqlState === "45000") throw new ReglaError(error.sqlMessage);
    const clave = Object.keys(mensajes).find((k) => error.message?.includes(k));
    if (clave) throw new ReglaError(mensajes[clave]);
    throw error;
  }
}

// Contactos, favoritos primero y luego por nombre, con sus grupos y su rol (RF-02).
export async function listContactos() {
  const [contactos] = await pool.query(`
    SELECT id, nombre, telefono, correo, es_favorito, fecha_registro
    FROM contacto ORDER BY es_favorito DESC, nombre, id
  `);
  const [pertenencias] = await pool.query(`
    SELECT cg.contacto_id, g.id, g.nombre, g.color, cg.rol
    FROM contacto_grupo cg JOIN grupo g ON g.id = cg.grupo_id
    ORDER BY g.nombre
  `);
  return contactos.map((c) => ({
    ...c,
    es_favorito: c.es_favorito === 1,
    grupos: pertenencias.filter((p) => p.contacto_id === c.id)
      .map(({ id, nombre, color, rol }) => ({ id, nombre, color, rol })),
  }));
}

const getContacto = async (id) => (await listContactos()).find((c) => c.id === id) ?? null;

const CORREO_REPETIDO = { "contacto.correo": "Ya hay un contacto con ese correo." };

// Registra un contacto (RF-01). Sin fecha, la base pone la de hoy en Lima; con
// una fecha futura, el trigger de INSERT lo rechaza.
export async function crearContacto({ nombre, telefono, correo, es_favorito, fecha_registro }) {
  const [{ insertId }] = await conRegla(() => fecha_registro
    ? pool.query("INSERT INTO contacto (nombre, telefono, correo, es_favorito, fecha_registro) VALUES (?, ?, ?, ?, ?)",
      [nombre, telefono, correo, es_favorito ? 1 : 0, fecha_registro])
    : pool.query("INSERT INTO contacto (nombre, telefono, correo, es_favorito) VALUES (?, ?, ?, ?)",
      [nombre, telefono, correo, es_favorito ? 1 : 0]),
  CORREO_REPETIDO);
  return getContacto(insertId);
}

// Ejecuta `fn` en una transacción, con una conexión propia del pool: se
// aplican todos sus cambios o ninguno.
async function enTransaccion(fn) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await fn(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// Edita los datos de un contacto (RF-06); null si no existe. Sin fecha, conserva
// la que tenía; con una fecha futura, el trigger de UPDATE lo rechaza.
export async function editarContacto(id, { nombre, telefono, correo, es_favorito, fecha_registro }) {
  const [{ affectedRows }] = await conRegla(() => pool.query(`
    UPDATE contacto SET nombre = ?, telefono = ?, correo = ?, es_favorito = ?,
      fecha_registro = COALESCE(?, fecha_registro)
    WHERE id = ?
  `, [nombre, telefono, correo, es_favorito ? 1 : 0, fecha_registro, id]), CORREO_REPETIDO);
  return affectedRows ? getContacto(id) : null;
}

// Elimina un contacto (RF-06); false si no existe. Antes lo saca de sus grupos,
// porque la clave foránea de contacto_grupo no borra en cascada.
export function eliminarContacto(id) {
  return enTransaccion(async (conexion) => {
    await conexion.query("DELETE FROM contacto_grupo WHERE contacto_id = ?", [id]);
    const [{ affectedRows }] = await conexion.query("DELETE FROM contacto WHERE id = ?", [id]);
    return affectedRows > 0;
  });
}

// Marca o desmarca un favorito (RF-03); null si el contacto no existe.
export async function marcarFavorito(id, esFavorito) {
  const [{ affectedRows }] = await pool.query("UPDATE contacto SET es_favorito = ? WHERE id = ?", [esFavorito ? 1 : 0, id]);
  return affectedRows ? getContacto(id) : null;
}

// Grupos por nombre, con cuántos contactos tiene cada uno (RF-04).
export async function listGrupos() {
  const [grupos] = await pool.query(`
    SELECT g.id, g.nombre, g.descripcion, g.color, COUNT(cg.contacto_id) AS contactos
    FROM grupo g LEFT JOIN contacto_grupo cg ON cg.grupo_id = g.id
    GROUP BY g.id ORDER BY g.nombre
  `);
  return grupos;
}

const NOMBRE_REPETIDO = { "grupo.nombre": "Ya hay un grupo con ese nombre." };

// Crea un grupo (RF-04). Sin color, la base lo deja gris.
export async function crearGrupo({ nombre, descripcion, color }) {
  const [{ insertId }] = await conRegla(() => color
    ? pool.query("INSERT INTO grupo (nombre, descripcion, color) VALUES (?, ?, ?)", [nombre, descripcion, color])
    : pool.query("INSERT INTO grupo (nombre, descripcion) VALUES (?, ?)", [nombre, descripcion]),
  NOMBRE_REPETIDO);
  return (await listGrupos()).find((g) => g.id === insertId);
}

// Edita un grupo (RF-07); null si no existe. Sin color, conserva el que tenía.
export async function editarGrupo(id, { nombre, descripcion, color }) {
  const [{ affectedRows }] = await conRegla(() => pool.query(
    "UPDATE grupo SET nombre = ?, descripcion = ?, color = COALESCE(?, color) WHERE id = ?",
    [nombre, descripcion, color, id],
  ), NOMBRE_REPETIDO);
  return affectedRows ? (await listGrupos()).find((g) => g.id === id) : null;
}

// Elimina un grupo (RF-07); false si no existe. Sus contactos siguen en la
// agenda: solo se borran sus filas de contacto_grupo.
export function eliminarGrupo(id) {
  return enTransaccion(async (conexion) => {
    await conexion.query("DELETE FROM contacto_grupo WHERE grupo_id = ?", [id]);
    const [{ affectedRows }] = await conexion.query("DELETE FROM grupo WHERE id = ?", [id]);
    return affectedRows > 0;
  });
}

// Pone un contacto en un grupo, con su rol (RF-05). La clave compuesta impide
// repetir la pareja y las claves foráneas, que alguno no exista.
export async function crearPertenencia({ contacto_id, grupo_id, rol }) {
  await conRegla(() => pool.query("INSERT INTO contacto_grupo (contacto_id, grupo_id, rol) VALUES (?, ?, ?)",
    [contacto_id, grupo_id, rol]), {
    "contacto_grupo.PRIMARY": "Ese contacto ya está en ese grupo.",
    "foreign key constraint fails": "El contacto o el grupo no existe.",
  });
  return { contacto_id, grupo_id, rol };
}

// Vuelve a los datos iniciales (utilidad de demostración): elimina las tablas,
// y con ellas sus triggers, y vuelve a aplicar el esquema. Usa una conexión
// propia con multipleStatements, porque el esquema son muchas sentencias.
export async function resetData() {
  const conexion = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });
  try {
    await conexion.query("DROP TABLE IF EXISTS contacto_grupo, contacto, grupo");
    await conexion.query(schemaSql);
  } finally {
    await conexion.end();
  }
}
