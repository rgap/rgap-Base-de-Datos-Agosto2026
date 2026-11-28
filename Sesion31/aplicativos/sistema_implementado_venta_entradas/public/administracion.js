// Entrada de la feria (HU-03): muestra el precio, las entradas disponibles y el
// estado de la venta actuales con un resumen (vendidas, disponibles y recaudado) y guarda los
// cambios con PATCH /api/entrada. «Datos demo» completa valores de ejemplo
// sin guardarlos.
const form = document.getElementById("entrada-form");
const leyenda = document.getElementById("entrada-nombre");
const inputPrecio = document.getElementById("precio");
const inputDisponibles = document.getElementById("disponibles");
const inputVenta = document.getElementById("venta-activa");
const botonGuardar = document.getElementById("guardar-entrada");
const botonDemo = document.getElementById("usar-demo");
const resumenVendidas = document.getElementById("resumen-vendidas");
const resumenDisponibles = document.getElementById("resumen-disponibles");
const resumenTotal = document.getElementById("resumen-total");

function pintar(entrada) {
  leyenda.textContent = entrada.nombre;
  inputPrecio.value = entrada.precio.toFixed(2);
  inputDisponibles.value = String(entrada.disponibles);
  inputVenta.checked = Boolean(entrada.venta_activa);
  resumenVendidas.textContent = String(entrada.vendidas);
  resumenDisponibles.textContent = String(entrada.disponibles);
  resumenTotal.textContent = formatoSoles.format(entrada.recaudado);
}

async function cargar() {
  // GET /api/entrada es pública; la sesión se comprueba al abrir la vista y al guardar.
  const response = await fetch("/api/entrada");
  if (!response.ok) throw new Error("No se pudo cargar la entrada.");
  pintar(await response.json());
}

// Valores de ejemplo válidos; no se guardan hasta pulsar «Guardar cambios».
const DEMOS = [
  { precio: "55.00", disponibles: "300", venta: true },
  { precio: "39.90", disponibles: "120", venta: true },
  { precio: "60.00", disponibles: "0", venta: false },
];
let siguienteDemo = 0;
botonDemo.addEventListener("click", () => {
  const demo = DEMOS[siguienteDemo];
  siguienteDemo = (siguienteDemo + 1) % DEMOS.length;
  inputPrecio.value = demo.precio;
  inputDisponibles.value = demo.disponibles;
  inputVenta.checked = demo.venta;
  botonGuardar.focus();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const precio = Number(inputPrecio.value);
  const disponibles = Number(inputDisponibles.value);
  if (!inputPrecio.value.trim() || !(precio > 0) || Math.round(precio * 100) / 100 !== precio) {
    mostrar("El precio debe ser positivo y tener como máximo dos decimales.", "error");
    inputPrecio.focus();
    return;
  }
  if (!inputDisponibles.value.trim() || !Number.isSafeInteger(disponibles) || disponibles < 0) {
    mostrar("Las entradas disponibles deben ser un número entero no negativo.", "error");
    inputDisponibles.focus();
    return;
  }

  botonGuardar.disabled = true;
  try {
    const response = await fetch("/api/entrada", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ precio, disponibles, venta_activa: inputVenta.checked }),
    });
    if (pedirSesion(response)) return;
    const resultado = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(resultado.error || "No se pudieron guardar los cambios.");
    pintar(resultado);
    mostrar(resultado.venta_activa ? "Cambios guardados. La venta está abierta." : "Cambios guardados. La venta está cerrada.");
  } catch (error) {
    mostrar(error.message, "error");
  } finally {
    botonGuardar.disabled = false;
  }
});

cargar().catch((error) => mostrar(error.message, "error"));
