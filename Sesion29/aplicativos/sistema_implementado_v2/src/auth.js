// Autenticación de la administración (Requisito 6, Regla 9): un solo usuario y
// una sola contraseña compartidos, sin cuentas. La credencial vive en la tabla
// `administrador` (_specs/modelo_fisico.sql) como `usuario` + SHA-256(contraseña).
// Aquí solo se calcula el hash; la comparación la hace MySQL con la función
// credencial_valida, porque la aplicación no puede leer esa tabla. Las sesiones
// son efímeras, se guardan en memoria y se referencian con una cookie HttpOnly;
// se pierden al reiniciar el proceso.
import { createHash, randomBytes } from "node:crypto";

import { credencialValidaEnBase } from "./db.js";

export const SESSION_COOKIE = "sesion";

// Duración de una sesión; también es el Max-Age de la cookie.
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

// token -> vencimiento (epoch ms).
const sesiones = new Map();

// SHA-256 de la contraseña en hexadecimal (igual que _specs/modelo_fisico.sql).
function hashear(password) {
  return createHash("sha256").update(password).digest("hex");
}

// Elimina las sesiones vencidas.
function purgar() {
  const ahora = Date.now();
  for (const [token, vence] of sesiones) {
    if (vence <= ahora) sesiones.delete(token);
  }
}

// Verifica el usuario y la contraseña recibidos (Regla 9). El usuario se
// compara distinguiendo mayúsculas (columna utf8mb4_bin); la contraseña, por su
// hash.
export async function credencialValida(usuario, password) {
  if (typeof usuario !== "string" || typeof password !== "string" || !password) return false;
  return credencialValidaEnBase(usuario.trim(), hashear(password));
}

// Abre una sesión y devuelve su token.
export function crearSesion() {
  purgar();
  const token = randomBytes(32).toString("hex");
  sesiones.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

// Indica si el token corresponde a una sesión vigente y, si lo es, la renueva.
export function sesionValida(token) {
  if (!token) return false;
  const vence = sesiones.get(token);
  if (!vence) return false;
  if (vence <= Date.now()) {
    sesiones.delete(token);
    return false;
  }
  sesiones.set(token, Date.now() + SESSION_TTL_MS);
  return true;
}

// Cierra la sesión del token indicado.
export function cerrarSesion(token) {
  if (token) sesiones.delete(token);
}

// Devuelve el valor de una cookie del encabezado "Cookie", o null.
export function leerCookie(header, nombre) {
  if (!header) return null;
  for (const parte of header.split(";")) {
    const indice = parte.indexOf("=");
    if (indice === -1) continue;
    if (parte.slice(0, indice).trim() === nombre) {
      try {
        return decodeURIComponent(parte.slice(indice + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}
