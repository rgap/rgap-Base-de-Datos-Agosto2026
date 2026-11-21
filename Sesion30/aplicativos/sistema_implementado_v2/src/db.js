// Acceso a MySQL. Las escrituras pasan por las rutinas almacenadas de
// specs/modelo_fisico.sql:
//
// - comprar_entrada (procedimiento): bloquea la entrada, comprueba la venta
//   abierta, el DNI, la referencia y las entradas disponibles, descuenta una y
//   guarda la venta en una sola transacción (Requisito 2, Reglas 4 a 8).
// - configurar_entrada (procedimiento): fija precio, disponibles y estado (Requisito 3).
// - credencial_valida (función): compara usuario y hash dentro de la base
//   (Requisito 6, Regla 9).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import mysql from "mysql2/promise";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// La conexión se puede redirigir con DATABASE_URL.
const databaseUrl = process.env.DATABASE_URL
  || "mysql://root@localhost:3306/feria_entrada";

// El esquema se guarda en memoria para poder reaplicarlo al reiniciar los datos.
// Las líneas DELIMITER son del cliente mysql, no de SQL: se quitan y cada
// "END //" vuelve a terminar en ";". El servidor separa las sentencias.
const schemaSql = readFileSync(join(root, "specs", "modelo_fisico.sql"), "utf8")
  .replace(/^DELIMITER .*$/gm, "")
  .replace(/\/\/[ \t]*$/gm, ";");

const pool = mysql.createPool({
  uri: databaseUrl,
  // Fechas como texto "AAAA-MM-DD HH:MM:SS" y DECIMAL como número de JavaScript.
  dateStrings: true,
  decimalNumbers: true,
});

// ---------------------------------------------------------------------------
// Reinicio de datos
// ---------------------------------------------------------------------------

// Botón «Reiniciar datos» del pie de página: elimina las tablas y las
// rutinas de la aplicación y vuelve a aplicar el esquema, incluida la entrada inicial.
// Usa una conexión propia con multipleStatements (el esquema son muchas
// sentencias) y FOREIGN_KEY_CHECKS, que vale solo para esa conexión. En MySQL
// cada DROP y CREATE confirma por sí solo: no hay transacción que deshacer.
export async function resetData() {
  const conexion = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });
  try {
    const [tablas] = await conexion.query(`
      SELECT table_name AS nombre
      FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
    `);
    await conexion.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const { nombre } of tablas) {
      await conexion.query(`DROP TABLE IF EXISTS \`${nombre}\``);
    }
    await conexion.query("SET FOREIGN_KEY_CHECKS = 1");
    // Las rutinas no se borran con las tablas: el esquema las vuelve a crear.
    const [rutinas] = await conexion.query(`
      SELECT routine_name AS nombre, routine_type AS tipo
      FROM information_schema.routines
      WHERE routine_schema = DATABASE()
    `);
    for (const { nombre, tipo } of rutinas) {
      await conexion.query(`DROP ${tipo} \`${nombre}\``);
    }
    await conexion.query(schemaSql);
  } finally {
    await conexion.end();
  }
}

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

// La entrada de la feria (Requisito 1, Regla 1) con las entradas vendidas y el
// monto recaudado, para la página principal y la administración.
export async function getEntrada() {
  const [[entrada]] = await pool.query(`
    SELECT e.nombre,
           e.descripcion,
           e.precio,
           e.disponibles,
           e.venta_activa,
           (SELECT COUNT(*) FROM venta)                     AS vendidas,
           (SELECT COALESCE(SUM(precio), 0) FROM venta)     AS recaudado
    FROM entrada AS e
    WHERE e.id = 1
  `);
  return entrada;
}

// Fija el precio, las entradas disponibles y el estado de venta (Requisito 3).
// src/validation.js valida los valores; configurar_entrada y los CHECK los
// garantizan (Reglas 2 y 3).
export async function updateEntrada({ precio, disponibles, ventaActiva }) {
  await pool.query("CALL configurar_entrada(?, ?, ?)", [precio, disponibles, ventaActiva]);
  return getEntrada();
}

// ---------------------------------------------------------------------------
// Compra
// ---------------------------------------------------------------------------

// Registra una compra pagada llamando al procedimiento almacenado (Requisito 2).
// Si la venta está cerrada, el DNI ya compró, el pago ya se registró o no
// quedan entradas, comprar_entrada lanza SIGNAL SQLSTATE '45000' con el mensaje
// y deshace todo; src/app.js lo traduce a 409.
//
// PASARELA DE PAGO: cuando se llama a esta función, el cobro ya ocurrió en la
// pasarela (simulada en public/checkout.js). referenciaPago es lo que devolvió
// la pasarela al aprobar el pago: el identificador de la orden.
//
// Los parámetros OUT de MySQL se reciben en variables de sesión (@venta_id,
// @fecha_venta, …), que solo existen en esa conexión: por eso CALL y SELECT
// usan la misma conexión del pool y no dos cualesquiera.
export async function registrarCompra({ dni, nombre, correo, referenciaPago }) {
  const conexion = await pool.getConnection();
  try {
    await conexion.query(
      "CALL comprar_entrada(?, ?, ?, ?, @venta_id, @fecha_venta, @entrada, @precio)",
      [dni, nombre, correo, referenciaPago],
    );
    // CAST: una variable de sesión no conserva el tipo de la columna; así
    // llegan como texto y número, no como bytes.
    const [[fila]] = await conexion.query(`
      SELECT @venta_id                   AS id,
             CAST(@fecha_venta AS CHAR)  AS fecha_venta,
             CAST(@entrada AS CHAR)      AS entrada,
             CAST(@precio AS CHAR)       AS precio
    `);
    return {
      id: fila.id,
      referencia_pago: referenciaPago,
      fecha_venta: fila.fecha_venta,
      dni,
      nombre,
      correo,
      entrada: fila.entrada,
      precio: Number(fila.precio),
    };
  } finally {
    conexion.release();
  }
}

// ---------------------------------------------------------------------------
// Ventas
// ---------------------------------------------------------------------------

// Compras registradas, de la más reciente a la más antigua (Requisito 4). La
// búsqueda por DNI, nombre, correo o referencia la resuelve el frontend.
export async function listVentas() {
  const [ventas] = await pool.query(`
    SELECT id, fecha_venta, dni, nombre, correo, precio, referencia_pago
    FROM venta
    ORDER BY fecha_venta DESC, id DESC
  `);
  return ventas;
}

// ---------------------------------------------------------------------------
// Administración
// ---------------------------------------------------------------------------

// Pregunta a la base si el usuario y el hash de la contraseña coinciden con la
// credencial guardada (Requisito 6). La aplicación nunca ve el hash guardado.
export async function credencialValidaEnBase(usuario, contrasenaHash) {
  const [[fila]] = await pool.query(
    "SELECT credencial_valida(?, ?) AS valida",
    [usuario, contrasenaHash],
  );
  return fila.valida === 1;
}
