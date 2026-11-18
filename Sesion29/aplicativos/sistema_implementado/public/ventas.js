// Ventas (HU-04): compras registradas con búsqueda por DNI, nombre, correo o
// referencia de pago (en el navegador) y un resumen de entradas vendidas y
// monto recaudado.
const inputTexto = document.getElementById("filtro-texto");
const lista = document.getElementById("ventas-lista");
const conteo = document.getElementById("ventas-conteo");
const resumenEntradas = document.getElementById("resumen-entradas");
const resumenTotal = document.getElementById("resumen-total");

const formatoFecha = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
});

let compras = [];

// fecha_venta llega como "AAAA-MM-DD HH:MM:SS" en UTC (CURRENT_TIMESTAMP de SQLite).
function fechaLocal(texto) {
  const fecha = new Date(`${texto.replace(" ", "T")}Z`);
  return Number.isNaN(fecha.getTime()) ? texto : formatoFecha.format(fecha);
}

async function cargarCompras() {
  const response = await fetch("/api/compras");
  if (pedirSesion(response)) return;
  if (!response.ok) throw new Error("No se pudieron cargar las ventas.");
  compras = await response.json();
  renderizar();
}

function filtrarPorTexto(items) {
  const termino = inputTexto.value.trim().toLowerCase();
  if (!termino) return items;
  return items.filter((c) =>
    c.dni.includes(termino)
    || c.nombre.toLowerCase().includes(termino)
    || (c.correo || "").toLowerCase().includes(termino)
    || c.referencia_pago.toLowerCase().includes(termino));
}

function celda(principal, secundario, clase = "") {
  const td = document.createElement("td");
  if (clase) td.className = clase;
  const main = document.createElement("span");
  main.className = "cell-main";
  main.textContent = principal;
  td.append(main);
  if (secundario) {
    const sub = document.createElement("span");
    sub.className = "cell-sub";
    sub.textContent = secundario;
    td.append(sub);
  }
  return td;
}

function crearTabla(items) {
  const envoltorio = document.createElement("div");
  envoltorio.className = "table-wrap";
  const tabla = document.createElement("table");
  tabla.className = "sales-table";

  const cabecera = document.createElement("thead");
  const filaCabecera = document.createElement("tr");
  [["Fecha"], ["Comprador"], ["Precio", "num"], ["Referencia de pago"]]
    .forEach(([texto, clase]) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = texto;
      if (clase) th.className = clase;
      filaCabecera.append(th);
    });
  cabecera.append(filaCabecera);

  const cuerpo = document.createElement("tbody");
  items.forEach((c) => {
    const fila = document.createElement("tr");
    const referencia = celda(c.referencia_pago, "Lemon Squeezy · simulado");
    referencia.querySelector(".cell-main").classList.add("ref-code");
    fila.append(
      celda(fechaLocal(c.fecha_venta), "", "nowrap"),
      celda(c.nombre, [`DNI ${c.dni}`, c.correo].filter(Boolean).join(" · ")),
      celda(formatoSoles.format(c.precio), "", "num"),
      referencia,
    );
    cuerpo.append(fila);
  });

  tabla.append(cabecera, cuerpo);
  envoltorio.append(tabla);
  return envoltorio;
}

function renderizar() {
  const visibles = filtrarPorTexto(compras);
  conteo.textContent = `${visibles.length} ${visibles.length === 1 ? "compra" : "compras"}`;

  const recaudado = visibles.reduce((suma, c) => suma + Math.round(c.precio * 100), 0) / 100;
  resumenEntradas.textContent = String(visibles.length);
  resumenTotal.textContent = formatoSoles.format(recaudado);

  if (!compras.length) {
    lista.replaceChildren(estadoVacio("Todavía no hay ventas", "Las compras pagadas desde la portada aparecerán aquí."));
    return;
  }
  if (!visibles.length) {
    lista.replaceChildren(estadoVacio("Sin coincidencias", "Prueba con otro DNI, nombre, correo o referencia."));
    return;
  }
  lista.replaceChildren(crearTabla(visibles));
}

inputTexto.addEventListener("input", renderizar);

cargarCompras()
  .catch((error) => {
    mostrar(error.message, "error");
    lista.replaceChildren(estadoVacio("No pudimos cargar las ventas", "Intenta actualizar la página."));
  });
