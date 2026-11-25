// Validación de la entrada de la API (RF-05). Traduce el cuerpo JSON recibido a
// un objeto limpio, o devuelve { error } con un mensaje claro. No toca la base
// de datos.

// Cadena recortada con contenido, o null.
function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// Entero no negativo, o null si no lo es.
function wholeNumber(value) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

// Booleano 0/1 a partir de true/false, 0/1 o "0"/"1"; null si no es ninguno.
function flag(value) {
  if (value === true || value === 1 || value === "1") return 1;
  if (value === false || value === 0 || value === "0") return 0;
  return null;
}

// Precio en soles: positivo y con como máximo dos decimales (RN-02), o null.
function price(value) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  // La conversión a dos decimales debe conservar el importe original.
  return Math.round(number * 100) / 100 === number ? number : null;
}

// Correo electrónico con formato usuario@dominio.ext, en minúsculas, o null.
function email(value) {
  const correo = text(value)?.toLowerCase() ?? null;
  return correo && correo.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ? correo : null;
}

// Configuración de la entrada (HU-03): precio positivo con dos decimales como
// máximo (RN-02), entradas disponibles enteras no negativas (RN-03) y venta
// abierta o cerrada.
export function validateEntrada(data) {
  const precio = price(data.precio);
  const disponibles = wholeNumber(data.disponibles);
  const ventaActiva = flag(data.venta_activa);

  if (precio === null) {
    return { error: "El precio debe ser positivo y tener como máximo dos decimales." };
  }
  if (disponibles === null) {
    return { error: "Las entradas disponibles deben ser un número entero no negativo." };
  }
  if (ventaActiva === null) {
    return { error: "Indica si la venta está abierta o cerrada." };
  }

  return { value: { precio, disponibles, ventaActiva } };
}

// Compra pagada (HU-02). DNI de exactamente 8 dígitos y nombre obligatorio
// (RN-04), correo válido para el comprobante (RN-10) y la referencia del pago aprobado (RN-07). Que la venta esté
// abierta, que quede una entrada disponible y que el DNI no haya comprado lo
// comprueba el procedimiento comprar_entrada en MySQL.
export function validateCompra(data) {
  const dni = typeof data.dni === "string" ? data.dni.trim() : "";
  const nombre = text(data.nombre)?.replace(/\s+/g, " ") ?? null;
  const correo = email(data.correo);
  const referenciaPago = text(data.referencia_pago);

  if (!/^\d{8}$/.test(dni)) {
    return { error: "El DNI debe tener exactamente 8 dígitos." };
  }
  if (!nombre || nombre.length > 120) {
    return { error: "Escribe el nombre del comprador (máximo 120 caracteres)." };
  }
  if (!correo) {
    return { error: "Escribe un correo válido para enviarte el comprobante." };
  }
  if (!referenciaPago || referenciaPago.length > 255) {
    return { error: "Falta la referencia del pago aprobado." };
  }

  return { value: { dni, nombre, correo, referenciaPago } };
}
