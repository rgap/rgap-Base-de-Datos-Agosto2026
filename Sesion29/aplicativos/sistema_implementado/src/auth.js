// Autenticación de la administración (RF-06, RN-09): un solo usuario y una sola
// contraseña compartidos, sin cuentas. La credencial vive en la tabla
// `administrador` (specs/modelo_fisico.sql) como `usuario` + SHA-256(contraseña) en
// la columna `contrasena`, sin salt por ser
// monousuario; aquí se verifica con node:crypto y se emiten sesiones efímeras guardadas en
// memoria y referenciadas por una cookie HttpOnly. Las sesiones se pierden al
// reiniciar el proceso.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { getAdminPasswordHash } from "./db.js";

export const SESSION_COOKIE = "sesion";

// Duración de una sesión; también es el Max-Age de la cookie.
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

// token -> vencimiento (epoch ms).
const sesiones = new Map();

// SHA-256 de la contraseña en hexadecimal (igual que specs/modelo_fisico.sql).
function hashear(password) {
  return createHash("sha256").update(password).digest("hex");
}

// Compara dos cadenas hex sin filtrar el tiempo de comparación.
function iguales(a, b) {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

// Elimina las sesiones vencidas.
function purgar() {
  const ahora = Date.now();
  for (const [token, vence] of sesiones) {
    if (vence <= ahora) sesiones.delete(token);
  }
}

// Verifica el usuario y la contraseña recibidos contra la credencial almacenada
// (RN-09). El usuario se compara distinguiendo mayúsculas; la contraseña, por
// su hash.
export function credencialValida(usuario, password) {
  if (typeof usuario !== "string" || typeof password !== "string" || !password) return false;
  const hash = getAdminPasswordHash(usuario.trim());
  if (!hash) return false;
  return iguales(hashear(password), hash);
}

// Abre una sesión y devuelve su token.
export function crearSesion() {
  purgar();
  const token = randomBytes(32).toString("hex");
  sesiones.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

// Indica si el token corresponde a una sesión vigente.
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
