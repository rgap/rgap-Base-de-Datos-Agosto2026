// Formulario de inicio de sesión de administración (HU-05). Envía la contraseña
// a POST /api/login y, si es correcta, navega a la vista solicitada. El backend
// (o public/client-api.js en el sistema simulado) es quien abre la sesión.

const form = document.getElementById("login-form");
const usuario = document.getElementById("usuario");
const input = document.getElementById("password");
const boton = document.getElementById("entrar");
const botonDemo = document.getElementById("usar-demo");
const error = document.getElementById("login-error");

// Credenciales de demostración: el botón "Datos demo" rellena el formulario con
// el usuario y la contraseña compartidos, sin enviarlos.
const DEMO = { usuario: "admin", password: "admin" };

// Solo se acepta volver a una vista de administración; cualquier otro valor
// cae en /admin.
const RUTAS_VALIDAS = ["/admin", "/admin/ventas"];
const siguiente = new URLSearchParams(window.location.search).get("next");
const destino = RUTAS_VALIDAS.includes(siguiente) ? siguiente : "/admin";

function mostrarError(mensaje) {
  error.textContent = mensaje;
  error.hidden = false;
}

botonDemo.addEventListener("click", () => {
  usuario.value = DEMO.usuario;
  input.value = DEMO.password;
  error.hidden = true;
  input.focus();
});

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  error.hidden = true;
  boton.disabled = true;

  try {
    const respuesta = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: usuario.value, password: input.value }),
    });

    if (respuesta.ok) {
      window.location.href = destino;
      return;
    }

    const cuerpo = await respuesta.json().catch(() => ({}));
    mostrarError(cuerpo.error || "No se pudo iniciar sesión.");
    input.select();
  } catch {
    mostrarError("No se pudo conectar. Inténtalo de nuevo.");
  } finally {
    boton.disabled = false;
  }
});
