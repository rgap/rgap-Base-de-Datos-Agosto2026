// Portada (HU-01, HU-02): muestra la entrada de la feria (precio, entradas
// disponibles y estado de la venta) y su formulario de compra. «Pagar» valida
// el DNI, el nombre y el correo y abre la pasarela simulada (checkout.js); con el pago
// aprobado se registra la compra (POST /api/compras) y se recargan las
// entradas disponibles.

const formatoSoles = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });
const NOMBRE_TIENDA = "Fogón · Feria gastronómica 2026";

const tarjeta = document.getElementById("comprar");
const nombreEntrada = document.getElementById("entrada-nombre");
const descripcion = document.getElementById("entrada-descripcion");
const precio = document.getElementById("entrada-precio");
const disponibles = document.getElementById("entrada-disponibles");
const formulario = document.getElementById("compra-form");
const aviso = document.getElementById("compra-aviso");
const pagar = document.getElementById("pagar");
const demo = document.getElementById("compra-demo");

// Campo del comprador con su mensaje de error debajo.
function campo(id) {
  const input = document.getElementById(id);
  const error = document.getElementById(`${id}-error`);
  const limpiar = () => {
    input.removeAttribute("aria-invalid");
    error.hidden = true;
  };
  input.addEventListener("input", limpiar);
  return {
    input,
    limpiar,
    marcar(mensaje) {
      input.setAttribute("aria-invalid", "true");
      error.textContent = mensaje;
      error.hidden = false;
    },
  };
}

const dni = campo("comprador-dni");
const nombre = campo("comprador-nombre");
const correo = campo("comprador-correo");
dni.input.addEventListener("input", () => {
  dni.input.value = dni.input.value.replace(/\D/g, "").slice(0, 8);
});

let entrada = null;

function textoDisponibles(cantidad) {
  if (cantidad <= 0) return "Agotado";
  return cantidad === 1 ? "Queda 1 entrada" : `Quedan ${cantidad} entradas`;
}

function pintar() {
  tarjeta.removeAttribute("aria-busy");
  nombreEntrada.textContent = entrada.nombre;
  descripcion.textContent = entrada.descripcion || "";
  descripcion.hidden = !entrada.descripcion;
  precio.textContent = formatoSoles.format(entrada.precio);
  disponibles.textContent = textoDisponibles(entrada.disponibles);
  disponibles.className = `stock ${entrada.disponibles > 0 ? "stock-available" : "stock-empty"}`;

  let motivo = "";
  if (!entrada.venta_activa) motivo = "La venta de entradas está cerrada por el momento.";
  else if (entrada.disponibles <= 0) motivo = "Las entradas se agotaron.";
  aviso.textContent = motivo;
  aviso.hidden = !motivo;

  const bloqueado = Boolean(motivo);
  [dni.input, nombre.input, correo.input, pagar, demo].forEach((el) => { el.disabled = bloqueado; });
}

async function cargarEntrada() {
  try {
    const response = await fetch("/api/entrada");
    if (!response.ok) throw new Error();
    entrada = await response.json();
    pintar();
  } catch {
    tarjeta.removeAttribute("aria-busy");
    nombreEntrada.textContent = "No pudimos cargar la entrada";
    aviso.textContent = "Recarga la página para intentarlo de nuevo.";
    aviso.hidden = false;
    [dni.input, nombre.input, correo.input, pagar, demo].forEach((el) => { el.disabled = true; });
  }
}

// Datos demo: tres compradores de ejemplo que se alternan en cada clic (no se envían).
const COMPRADORES_DEMO = [
  { dni: "70123456", nombre: "Luis Rojas", correo: "luis.rojas@example.com" },
  { dni: "72458913", nombre: "Lucía Torres", correo: "lucia.torres@example.com" },
  { dni: "45871236", nombre: "Carlos Vargas", correo: "carlos.vargas@example.com" },
];
let siguienteDemo = 0;
demo.addEventListener("click", () => {
  const comprador = COMPRADORES_DEMO[siguienteDemo];
  siguienteDemo = (siguienteDemo + 1) % COMPRADORES_DEMO.length;
  dni.input.value = comprador.dni;
  nombre.input.value = comprador.nombre;
  correo.input.value = comprador.correo;
  dni.limpiar();
  nombre.limpiar();
  correo.limpiar();
  pagar.focus();
});

// Registra la compra pagada (POST /api/compras). Lanza un Error con el mensaje
// del backend si se rechaza; checkout.js lo muestra en la ventana de pago.
async function registrarCompra(carga) {
  const response = await fetch("/api/compras", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(carga),
  });
  const resultado = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(resultado.error || "No se pudo registrar la compra.");
  return resultado;
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  if (!entrada || pagar.disabled) return;

  const dniValor = dni.input.value.trim();
  const nombreValor = nombre.input.value.trim().replace(/\s+/g, " ");
  const correoValor = correo.input.value.trim().toLowerCase();
  let primerError = null;
  if (!/^\d{8}$/.test(dniValor)) {
    dni.marcar("El DNI debe tener 8 dígitos.");
    primerError = dni.input;
  }
  if (!nombreValor) {
    nombre.marcar("Escribe tu nombre completo.");
    primerError = primerError || nombre.input;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoValor)) {
    correo.marcar("Escribe un correo válido, por ejemplo nombre@correo.com.");
    primerError = primerError || correo.input;
  }
  if (primerError) {
    primerError.focus();
    return;
  }

  // PASARELA DE PAGO: aquí se abre la ventana de pago (simulada en checkout.js).
  // Si el pago se aprueba, la pasarela devuelve la referencia de la orden y
  // alAprobar la envía junto con los datos del comprador para registrar la compra.
  LemonCheckout.abrirCheckout({
    tienda: NOMBRE_TIENDA,
    concepto: entrada.nombre,
    precio: entrada.precio,
    comprador: { dni: dniValor, nombre: nombreValor, correo: correoValor },
    alAprobar: (referencia) => registrarCompra({
      dni: dniValor,
      nombre: nombreValor,
      correo: correoValor,
      referencia_pago: referencia,
    }),
    alCerrar: (huboCompra) => {
      if (!huboCompra) return;
      formulario.reset();
      cargarEntrada();
    },
  });
});

cargarEntrada();
