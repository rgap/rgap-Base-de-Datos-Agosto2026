// Servidor de la aplicación: sirve la página de la agenda y expone la API de
// contactos, grupos y pertenencias. La persistencia y sus reglas viven en src/db.js.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ReglaError, crearContacto, crearGrupo, crearPertenencia, editarContacto, editarGrupo, eliminarContacto, eliminarGrupo,
  listContactos, listGrupos, marcarFavorito, resetData,
} from "./db.js";

// La interfaz es estática, así que se lee una sola vez al iniciar el proceso.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const asset = (name) => readFileSync(join(root, "public", name));

const files = {
  "/": [asset("index.html"), "text/html; charset=utf-8"],
  "/style.css": [asset("style.css"), "text/css; charset=utf-8"],
  "/agenda.js": [asset("agenda.js"), "text/javascript; charset=utf-8"],
  "/reset.js": [asset("reset.js"), "text/javascript; charset=utf-8"],
};

const COLORES = ["rojo", "verde", "azul", "gris"];

// El día de hoy en Lima, como AAAA-MM-DD (Regla 3).
const hoyEnLima = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());

// Texto recortado; vacío o ausente es null.
const texto = (valor) => (typeof valor === "string" && valor.trim() ? valor.trim() : null);

// Valida y normaliza un contacto nuevo (Reglas 1 a 3). Devuelve { error } o { datos }.
export function validateContacto(body) {
  const nombre = texto(body.nombre);
  const telefono = texto(body.telefono);
  const correo = texto(body.correo)?.toLowerCase() ?? null;
  const fecha = texto(body.fecha_registro);
  if (!nombre) return { error: "El nombre es obligatorio." };
  if (nombre.length > 100) return { error: "El nombre admite hasta 100 caracteres." };
  if (telefono && telefono.length > 20) return { error: "El teléfono admite hasta 20 caracteres." };
  if (correo && correo.length > 255) return { error: "El correo admite hasta 255 caracteres." };
  if (fecha) {
    const valida = /^\d{4}-\d{2}-\d{2}$/.test(fecha) && new Date(`${fecha}T00:00:00Z`).toISOString().startsWith(fecha);
    if (!valida) return { error: "La fecha de registro no es válida." };
    // La base lo garantiza con un trigger; aquí solo se adelanta el mensaje.
    if (fecha > hoyEnLima()) return { error: "La fecha de registro no puede ser futura." };
  }
  return { datos: { nombre, telefono, correo, es_favorito: body.es_favorito === true, fecha_registro: fecha } };
}

// Valida y normaliza un grupo nuevo (Regla 4).
export function validateGrupo(body) {
  const nombre = texto(body.nombre);
  const color = texto(body.color);
  if (!nombre) return { error: "El nombre del grupo es obligatorio." };
  if (nombre.length > 50) return { error: "El nombre del grupo admite hasta 50 caracteres." };
  if (color && !COLORES.includes(color)) return { error: "El color debe ser rojo, verde, azul o gris." };
  return { datos: { nombre, descripcion: texto(body.descripcion), color } };
}

// Valida una pertenencia (Regla 5).
export function validatePertenencia(body) {
  const { contacto_id, grupo_id } = body;
  const rol = texto(body.rol);
  if (!Number.isInteger(contacto_id) || !Number.isInteger(grupo_id)) return { error: "Elige un contacto y un grupo." };
  if (rol && rol.length > 50) return { error: "El rol admite hasta 50 caracteres." };
  return { datos: { contacto_id, grupo_id, rol } };
}

// Responde con un cuerpo y un Content-Type explícitos.
function send(response, status, body, contentType) {
  response.writeHead(status, { "Content-Type": contentType });
  response.end(body);
}

function json(response, status, data) {
  send(response, status, JSON.stringify(data), "application/json; charset=utf-8");
}

// Lee el cuerpo de la petición como objeto JSON; {} si no lo es.
async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 10_000) break;
  }
  try {
    const data = JSON.parse(body || "null");
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

// Valida el cuerpo y, si es correcto, crea el registro: 201, o 400 con el motivo.
async function crear(request, response, validar, guardar) {
  const { error, datos } = validar(await readJson(request));
  if (error) return json(response, 400, { error });
  return json(response, 201, await guardar(datos));
}

// Router principal: despacha según método + ruta y centraliza el manejo de errores.
export async function handleRequest(request, response) {
  const url = new URL(request.url, "http://localhost");
  const { method } = request;
  const { pathname } = url;

  try {
    if (method === "GET" && files[pathname]) {
      const [body, contentType] = files[pathname];
      return send(response, 200, body, contentType);
    }

    if (method === "GET" && pathname === "/api/contactos") return json(response, 200, await listContactos());
    if (method === "POST" && pathname === "/api/contactos") return await crear(request, response, validateContacto, crearContacto);

    // Marcar o desmarcar favorito (RF-03).
    const porId = pathname.match(/^\/api\/contactos\/(\d+)$/);
    if (method === "PATCH" && porId) {
      const { es_favorito } = await readJson(request);
      if (typeof es_favorito !== "boolean") return json(response, 400, { error: "Indica si es favorito." });
      const contacto = await marcarFavorito(Number(porId[1]), es_favorito);
      return contacto ? json(response, 200, contacto) : json(response, 404, { error: "El contacto no existe." });
    }

    // Editar los datos de un contacto (RF-06), con las mismas reglas que al registrarlo.
    if (method === "PUT" && porId) {
      const { error, datos } = validateContacto(await readJson(request));
      if (error) return json(response, 400, { error });
      const contacto = await editarContacto(Number(porId[1]), datos);
      return contacto ? json(response, 200, contacto) : json(response, 404, { error: "El contacto no existe." });
    }

    // Eliminar un contacto (RF-06); también sale de sus grupos.
    if (method === "DELETE" && porId) {
      return (await eliminarContacto(Number(porId[1])))
        ? json(response, 200, { ok: true })
        : json(response, 404, { error: "El contacto no existe." });
    }

    if (method === "GET" && pathname === "/api/grupos") return json(response, 200, await listGrupos());
    if (method === "POST" && pathname === "/api/grupos") return await crear(request, response, validateGrupo, crearGrupo);

    // Editar un grupo (RF-07), con las mismas reglas que al crearlo.
    const grupoPorId = pathname.match(/^\/api\/grupos\/(\d+)$/);
    if (method === "PUT" && grupoPorId) {
      const { error, datos } = validateGrupo(await readJson(request));
      if (error) return json(response, 400, { error });
      const grupo = await editarGrupo(Number(grupoPorId[1]), datos);
      return grupo ? json(response, 200, grupo) : json(response, 404, { error: "El grupo no existe." });
    }

    // Eliminar un grupo (RF-07); sus contactos siguen en la agenda.
    if (method === "DELETE" && grupoPorId) {
      return (await eliminarGrupo(Number(grupoPorId[1])))
        ? json(response, 200, { ok: true })
        : json(response, 404, { error: "El grupo no existe." });
    }
    if (method === "POST" && pathname === "/api/pertenencias") return await crear(request, response, validatePertenencia, crearPertenencia);

    // Reiniciar los datos (botón del pie): utilidad de demostración.
    if (method === "POST" && pathname === "/api/reset") {
      await resetData();
      return json(response, 200, { ok: true });
    }

    return json(response, 404, { error: "Ruta no encontrada." });
  } catch (error) {
    if (error instanceof ReglaError) return json(response, 400, { error: error.message });
    // MySQL apagado, credenciales de DATABASE_URL incorrectas o esquema sin
    // aplicar: se avisa sin dar detalles al navegador.
    if (["ECONNREFUSED", "ER_ACCESS_DENIED_ERROR", "ER_BAD_DB_ERROR", "ER_NO_SUCH_TABLE"].includes(error.code)) {
      console.error(`No se pudo usar MySQL (${error.code}). Revisa DATABASE_URL y que el esquema esté aplicado (npm run db:crear).`);
      return json(response, 503, { error: "No se pudo conectar con la base de datos." });
    }
    // Los detalles se registran en el servidor, pero no se exponen al usuario.
    console.error(error);
    return json(response, 500, { error: "Error interno del servidor." });
  }
}
