// Servidor de la aplicación: sirve las páginas (portada con la compra, inicio
// de sesión y las dos vistas de administración: entrada y ventas) y expone la
// API (entrada, configuración de la entrada, compra con la pasarela simulada y
// listado de ventas). La validación de entrada está en src/validation.js y el
// acceso a MySQL en src/db.js.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getEntrada,
  listVentas,
  registrarCompra,
  resetData,
  updateEntrada,
} from "./db.js";
import { validateCompra, validateEntrada } from "./validation.js";
import {
  cerrarSesion,
  credencialValida,
  crearSesion,
  leerCookie,
  sesionValida,
  SESSION_COOKIE,
  SESSION_TTL_MS,
} from "./auth.js";

// Las páginas y los recursos estáticos se leen una sola vez al iniciar el proceso.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const asset = (name) => readFileSync(join(root, "public", name));

const HTML = "text/html; charset=utf-8";
const JS = "text/javascript; charset=utf-8";

const files = {
  "/": ["index.html", HTML],
  "/login": ["login.html", HTML],
  "/admin": ["administracion.html", HTML],
  "/admin/ventas": ["ventas.html", HTML],
  "/style.css": ["style.css", "text/css; charset=utf-8"],
  "/reset.js": ["reset.js", JS],
  "/checkout.js": ["checkout.js", JS],
  "/compra.js": ["compra.js", JS],
  "/login.js": ["login.js", JS],
  "/admin-common.js": ["admin-common.js", JS],
  "/administracion.js": ["administracion.js", JS],
  "/ventas.js": ["ventas.js", JS],
};

// Códigos de MySQL que indican que la base rechazó los datos: SIGNAL de un
// procedimiento (SQLSTATE 45000) o un CHECK incumplido (error 3819).
const RECHAZO_PROCEDIMIENTO = "45000";
const CHECK_VIOLADO = 3819;

// Vistas de administración: exigen una sesión activa (RN-09).
const RUTAS_ADMIN = new Set(["/admin", "/admin/ventas"]);
const staticFiles = Object.fromEntries(
  Object.entries(files).map(([route, [name, type]]) => [route, [asset(name), type]]),
);

// Responde con un cuerpo y un Content-Type explícitos.
function send(response, status, body, contentType) {
  response.writeHead(status, { "Content-Type": contentType });
  response.end(body);
}

// Atajo para responder JSON.
function json(response, status, data) {
  send(response, status, JSON.stringify(data), "application/json; charset=utf-8");
}

// Lee el cuerpo de la petición y lo parsea como objeto JSON. Lanza errores con
// mensaje "público" (se muestran como 400) si el cuerpo es demasiado grande o
// no es JSON válido.
async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    // Evita mantener cuerpos excesivamente grandes en memoria.
    if (body.length > 1_000_000) throw new Error("Solicitud demasiado grande.");
  }
  try {
    const data = JSON.parse(body || "null");
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    throw new Error("El cuerpo debe ser JSON válido.");
  }
}

// Indica si la petición trae una cookie de sesión de administración válida (RN-09).
function autenticado(request, response) {
  const token = leerCookie(request.headers.cookie, SESSION_COOKIE);
  if (!sesionValida(token)) return false;
  response.setHeader("Set-Cookie", cookieSesion(token, Math.floor(SESSION_TTL_MS / 1000)));
  return true;
}

// Encabezado Set-Cookie de la sesión (HttpOnly, SameSite=Strict); `maxAge` en
// segundos, 0 la borra.
function cookieSesion(token, maxAge) {
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

const SIN_SESION = { error: "Necesitas iniciar sesión." };

// Router principal: despacha según método + ruta y centraliza el manejo de errores.
export async function handleRequest(request, response) {
  const url = new URL(request.url, "http://localhost");

  try {
    // Las vistas de administración exigen sesión (RN-09): sin ella, a /login.
    if (request.method === "GET" && RUTAS_ADMIN.has(url.pathname) && !autenticado(request, response)) {
      response.writeHead(302, { Location: `/login?next=${encodeURIComponent(url.pathname)}` });
      return response.end();
    }

    // Páginas y recursos estáticos.
    if (request.method === "GET" && staticFiles[url.pathname]) {
      const [body, contentType] = staticFiles[url.pathname];
      return send(response, 200, body, contentType);
    }

    // Inicio de sesión de administración (RF-06).
    if (request.method === "POST" && url.pathname === "/api/login") {
      const { usuario, password } = await readJson(request);
      // La comprobación la hace MySQL (credencial_valida).
      if (!(await credencialValida(usuario, password))) {
        return json(response, 401, { error: "Usuario o contraseña incorrectos." });
      }
      response.setHeader(
        "Set-Cookie",
        cookieSesion(crearSesion(), Math.floor(SESSION_TTL_MS / 1000)),
      );
      return json(response, 200, { ok: true });
    }

    // Cierre de sesión.
    if (request.method === "POST" && url.pathname === "/api/logout") {
      cerrarSesion(leerCookie(request.headers.cookie, SESSION_COOKIE));
      response.setHeader("Set-Cookie", cookieSesion("", 0));
      return json(response, 200, { ok: true });
    }

    // Reiniciar todos los datos al estado inicial del esquema (botón del pie de
    // todas las páginas, incluidas las públicas): es una utilidad de demostración.
    if (request.method === "POST" && url.pathname === "/api/reset") {
      await resetData();
      return json(response, 200, { ok: true });
    }

    // La entrada de la feria (RF-01). Es pública.
    if (request.method === "GET" && url.pathname === "/api/entrada") {
      return json(response, 200, await getEntrada());
    }

    // Configurar precio, entradas disponibles y estado de venta (RF-03).
    if (request.method === "PATCH" && url.pathname === "/api/entrada") {
      if (!autenticado(request, response)) return json(response, 401, SIN_SESION);
      const validation = validateEntrada(await readJson(request));
      if (validation.error) return json(response, 400, { error: validation.error });
      try {
        return json(response, 200, await updateEntrada(validation.value));
      } catch (error) {
        // configurar_entrada o un CHECK rechazaron los valores.
        if (error.sqlState === RECHAZO_PROCEDIMIENTO || error.errno === CHECK_VIOLADO) {
          return json(response, 400, { error: error.sqlMessage || "Valores de la entrada no válidos." });
        }
        throw error;
      }
    }

    // Compra pagada en la pasarela simulada de Lemon Squeezy (RF-02). Es pública.
    // referencia_pago es el identificador de la orden que devolvió la pasarela
    // al aprobar el pago. Como la pasarela es simulada, se confía en él; con una
    // pasarela real, aquí se verificaría el pago (webhook firmado o consulta de
    // la orden) antes de llamar a registrarCompra. Las reglas de la compra
    // (venta abierta, un DNI, pago nuevo, entradas disponibles) las comprueba
    // el procedimiento comprar_entrada dentro de la base.
    if (request.method === "POST" && url.pathname === "/api/compras") {
      const validation = validateCompra(await readJson(request));
      if (validation.error) return json(response, 400, { error: validation.error });

      try {
        return json(response, 201, await registrarCompra(validation.value));
      } catch (error) {
        // comprar_entrada rechazó la compra con SIGNAL: conflicto con el estado
        // actual (409). Un CHECK incumplido son datos inválidos (400).
        if (error.sqlState === RECHAZO_PROCEDIMIENTO) return json(response, 409, { error: error.sqlMessage });
        if (error.errno === CHECK_VIOLADO) return json(response, 400, { error: "Datos de la compra no válidos." });
        throw error;
      }
    }

    // Ventas para administración (RF-04).
    if (request.method === "GET" && url.pathname === "/api/compras") {
      if (!autenticado(request, response)) return json(response, 401, SIN_SESION);
      return json(response, 200, await listVentas());
    }

    return json(response, 404, { error: "Ruta no encontrada." });
  } catch (error) {
    // Los errores de entrada son públicos; los inesperados solo se registran.
    if (
      error.message === "El cuerpo debe ser JSON válido."
      || error.message === "Solicitud demasiado grande."
    ) return json(response, 400, { error: error.message });

    // MySQL apagado o credenciales de app_feria incorrectas: se avisa sin dar
    // detalles al navegador.
    if (error.code === "ECONNREFUSED" || error.code === "ER_ACCESS_DENIED_ERROR" || error.code === "ER_BAD_DB_ERROR") {
      console.error(`No se pudo conectar con MySQL (${error.code}). Revisa DATABASE_URL y que el esquema esté aplicado.`);
      return json(response, 503, { error: "No se pudo conectar con la base de datos." });
    }

    console.error(error);
    return json(response, 500, { error: "Error interno del servidor." });
  }
}
