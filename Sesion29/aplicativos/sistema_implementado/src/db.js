// Acceso a SQLite: la única entrada de la feria (lectura y configuración), la
// compra (en una transacción) y el listado de ventas.
//
// El esquema (specs/modelo_fisico.sql) define las tablas, la entrada
// inicial, la unicidad del DNI y de la referencia de pago y los CHECK de precio,
// entradas disponibles, DNI, correo y estado.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// La ruta del archivo SQLite se puede redirigir con SQLITE_DATABASE (útil en pruebas).
const databasePath = process.env.SQLITE_DATABASE || join(root, "feria.db");
const database = new DatabaseSync(databasePath);

// El esquema se guarda en memoria para poder reaplicarlo al reiniciar los datos.
const schemaSql = readFileSync(join(root, "specs", "modelo_fisico.sql"), "utf8");

// foreign_keys se activa por conexión; el esquema se aplica tal cual está en el archivo.
database.exec("PRAGMA foreign_keys = ON");
database.exec(schemaSql);

// Error de negocio esperado: src/app.js lo traduce a una respuesta con `status`.
export class ReglaError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Reinicio de datos
// ---------------------------------------------------------------------------

// Botón «Reiniciar datos» del pie de página: elimina las tablas de la
// aplicación y vuelve a aplicar el esquema, incluida la entrada inicial.
export function resetData() {
  const tablas = database.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  `).all();

  database.exec("PRAGMA foreign_keys = OFF");
  database.exec("BEGIN TRANSACTION");
  try {
    for (const { name } of tablas) {
      database.exec(`DROP TABLE IF EXISTS "${name}"`);
    }
    database.exec(schemaSql);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  } finally {
    database.exec("PRAGMA foreign_keys = ON");
  }
}

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

// La entrada de la feria (RF-01, RN-01) con las entradas vendidas y el monto
// recaudado, para la página principal y la administración.
export function getEntrada() {
  return database.prepare(`
    SELECT e.nombre,
           e.descripcion,
           e.precio,
           e.disponibles,
           e.venta_activa,
           (SELECT COUNT(*) FROM venta)                           AS vendidas,
           (SELECT COALESCE(round(SUM(precio), 2), 0) FROM venta) AS recaudado
    FROM entrada AS e
    WHERE e.id = 1
  `).get();
}

// Fija el precio, las entradas disponibles y el estado de venta (RF-03).
// src/validation.js valida los valores (RN-02, RN-03) y los CHECK los garantizan.
export function updateEntrada({ precio, disponibles, ventaActiva }) {
  database.prepare(`
    UPDATE entrada
    SET precio = ?, disponibles = ?, venta_activa = ?
    WHERE id = 1
  `).run(precio, disponibles, ventaActiva);

  return getEntrada();
}

// ---------------------------------------------------------------------------
// Compra
// ---------------------------------------------------------------------------

// Registra una compra pagada en una sola transacción (RF-02, RN-06). Lanza
// ReglaError con el estado HTTP cuando la compra no se puede registrar.
//
// PASARELA DE PAGO: cuando se llama a esta función, el cobro ya ocurrió en la
// pasarela (simulada en public/checkout.js). referenciaPago es lo que devolvió
// la pasarela al aprobar el pago: el identificador de la orden. Aquí ya no se
// cobra nada; solo se registra la compra asociada a ese pago.
export function registrarCompra({ dni, nombre, correo, referenciaPago }) {
  // Toma el bloqueo de escritura desde el inicio, para que nadie más escriba
  // entre las comprobaciones y el registro de la compra.
  database.exec("BEGIN IMMEDIATE TRANSACTION");

  try {
    // 1. Lee la entrada: su nombre y precio vigente (para guardarlos en la
    //    compra) y si la venta está abierta (RN-05).
    const entrada = database.prepare(`
      SELECT nombre, precio, disponibles, venta_activa
      FROM entrada
      WHERE id = 1
    `).get();

    if (!entrada.venta_activa) {
      throw new ReglaError(409, "La venta de entradas está cerrada.");
    }

    // 2. Comprueba que este DNI no tenga ya una entrada comprada (RN-04).
    const dniYaCompro = database.prepare(`
      SELECT 1 FROM venta WHERE dni = ?
    `).get(dni);

    if (dniYaCompro) {
      throw new ReglaError(409, "Este DNI ya tiene una entrada comprada. Solo se permite una entrada por persona.");
    }

    // 3. Comprueba que este pago no se haya registrado antes (RN-07): la
    //    referencia es la orden que devolvió la pasarela.
    const pagoRepetido = database.prepare(`
      SELECT 1 FROM venta WHERE referencia_pago = ?
    `).get(referenciaPago);

    if (pagoRepetido) {
      throw new ReglaError(409, "Este pago ya fue registrado.");
    }

    // 4. Descuenta una entrada solo si la venta sigue abierta y queda al menos
    //    una (RN-05); si no cambia ninguna fila, es que se agotaron.
    const descuento = database.prepare(`
      UPDATE entrada
      SET disponibles = disponibles - 1
      WHERE id = 1 AND venta_activa = 1 AND disponibles >= 1
    `).run();

    if (descuento.changes === 0) {
      throw new ReglaError(409, "Ya no quedan entradas disponibles.");
    }

    // 5. Registra la compra con los datos del comprador, el precio vigente
    //    (RN-08) y la referencia de la pasarela, para poder ubicar el pago
    //    (por ejemplo, ante un reclamo).
    const insercion = database.prepare(`
      INSERT INTO venta (entrada_id, dni, nombre, correo, precio, referencia_pago)
      VALUES (1, ?, ?, ?, ?, ?)
    `).run(dni, nombre, correo, entrada.precio, referenciaPago);

    const ventaId = Number(insercion.lastInsertRowid);

    // 6. Recupera la fecha y hora que la base asignó a la compra, para el recibo.
    const { fecha_venta: fechaVenta } = database.prepare(`
      SELECT fecha_venta FROM venta WHERE id = ?
    `).get(ventaId);

    // Todo salió bien: el descuento y la compra quedan guardados juntos.
    database.exec("COMMIT");

    return {
      id: ventaId,
      referencia_pago: referenciaPago,
      fecha_venta: fechaVenta,
      dni,
      nombre,
      correo,
      entrada: entrada.nombre,
      precio: entrada.precio,
    };
  } catch (error) {
    // Algo falló: se deshace todo, ni se descuenta la entrada ni se guarda la compra.
    database.exec("ROLLBACK");
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Ventas
// ---------------------------------------------------------------------------

// Compras registradas, de la más reciente a la más antigua (RF-04). La búsqueda
// por DNI, nombre, correo o referencia la resuelve el frontend.
export function listVentas() {
  return database.prepare(`
    SELECT id, fecha_venta, dni, nombre, correo, precio, referencia_pago
    FROM venta
    ORDER BY fecha_venta DESC, id DESC
  `).all();
}

// ---------------------------------------------------------------------------
// Administración
// ---------------------------------------------------------------------------

// Hash de la contraseña del administrador cuyo usuario coincide exactamente,
// distinguiendo mayúsculas (RF-06, RN-09), o null si el usuario no existe.
// La verificación de la contraseña está en src/auth.js.
export function getAdminPasswordHash(usuario) {
  const fila = database.prepare(`
    SELECT contrasena FROM administrador WHERE usuario = ?
  `).get(usuario);

  return fila ? fila.contrasena : null;
}
