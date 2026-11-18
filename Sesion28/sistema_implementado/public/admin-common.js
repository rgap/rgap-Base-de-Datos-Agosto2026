// Utilidades compartidas por las dos vistas de administración (entrada y
// ventas): aviso flotante, redirección a /login cuando la
// sesión caducó, bloque de estado vacío, formato de soles y el botón
// "Cerrar sesión" del encabezado.

const formatoSoles = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

// Si la API responde 401 (sesión caducada), vuelve a /login y regresa aquí.
function pedirSesion(response) {
  if (response.status !== 401) return false;
  window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  return true;
}

// Aviso flotante (#mensaje) que se oculta solo.
function mostrar(texto, tipo = "success") {
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = texto;
  mensaje.className = `message message-${tipo}`;
  mensaje.hidden = false;
  window.clearTimeout(mostrar.timeout);
  mostrar.timeout = window.setTimeout(() => { mensaje.hidden = true; }, 5000);
}

function estadoVacio(titulo, detalle) {
  const caja = document.createElement("div");
  caja.className = "empty-state";
  const t = document.createElement("strong");
  t.textContent = titulo;
  const d = document.createElement("p");
  d.textContent = detalle;
  caja.append(t, d);
  return caja;
}

document.querySelector("[data-cerrar-sesion]")?.addEventListener("click", async (event) => {
  const boton = event.currentTarget;
  boton.disabled = true;
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch {
    /* sin conexión: igual se vuelve al inicio de sesión */
  }
  window.location.href = "/login";
});
