// Agenda de contactos (Historias 1 a 7): dos pestañas, Contactos y Grupos. Los
// formularios se abren en cuadros de diálogo, cada uno con su botón "Datos demo".
const $ = (id) => document.getElementById(id);

const estado = { contactos: [], grupos: [] };

// ---------- Utilidades ----------

function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

const formatoFecha = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fecha = (iso) => formatoFecha.format(new Date(`${iso}T00:00:00Z`));

// Iniciales para el avatar: primera letra de las dos primeras palabras.
const iniciales = (nombre) => nombre.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

// Para buscar sin distinguir mayúsculas ni tildes: "diaz" encuentra "Díaz".
const normalizar = (texto) => (texto ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const coincide = (busqueda, ...campos) => campos.some((campo) => normalizar(campo).includes(normalizar(busqueda)));

// Parte `valor` en trozos de texto y <mark> donde coincide `busqueda`.
// Cada letra normalizada recuerda de qué letra original sale, para cortar el texto original.
function resaltar(valor, busqueda) {
  const letras = Array.from(valor ?? "");
  const termino = normalizar(busqueda);
  if (!termino) return [letras.join("")];
  let normal = "";
  const origen = [];
  letras.forEach((letra, i) => {
    const n = normalizar(letra);
    for (let k = 0; k < n.length; k++) origen.push(i);
    normal += n;
  });
  const nodos = [];
  let desde = 0;
  for (let pos = normal.indexOf(termino); pos !== -1; pos = normal.indexOf(termino, pos + termino.length)) {
    const inicio = origen[pos];
    const fin = origen[pos + termino.length - 1] + 1;
    if (inicio > desde) nodos.push(letras.slice(desde, inicio).join(""));
    nodos.push(crear("mark", "", letras.slice(inicio, fin).join("")));
    desde = fin;
  }
  if (desde < letras.length) nodos.push(letras.slice(desde).join(""));
  return nodos;
}

// "2 de 3 contactos" mientras hay búsqueda; sin búsqueda, solo el total.
function contadorTexto(visibles, total, singular, plural, busqueda) {
  const palabra = total === 1 ? singular : plural;
  return busqueda ? `${visibles} de ${total} ${palabra}` : `${total} ${palabra}`;
}

// Mensaje de lista sin resultados; si hay búsqueda, ofrece limpiarla.
function listaVacia(mensaje, input, repintar) {
  const li = crear("li", "empty", mensaje);
  if (input.value.trim()) {
    const limpiar = crear("button", "link-button", "Limpiar búsqueda");
    limpiar.type = "button";
    limpiar.addEventListener("click", () => {
      input.value = "";
      repintar();
      input.focus();
    });
    li.append(limpiar);
  }
  return li;
}

// Título de un bloque de la lista (Favoritos, Todos los contactos).
function encabezadoSeccion(texto) {
  const li = crear("li", "seccion");
  li.append(crear("h3", "seccion-titulo", texto));
  return li;
}

function punto(color) {
  const dot = crear("span", `dot ${color || "gris"}`);
  dot.setAttribute("aria-hidden", "true");
  return dot;
}

let toastTimer;
function toast(texto) {
  const elemento = $("toast");
  elemento.textContent = texto;
  elemento.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { elemento.hidden = true; }, 3500);
}

async function api(url, metodo = "GET", datos) {
  const response = await fetch(url, datos === undefined ? { method: metodo } : {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  const resultado = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(resultado.error || "No se pudo conectar. Inténtalo de nuevo.");
  return resultado;
}

// ---------- Pestañas ----------

const pestañas = [
  { tab: $("tab-contactos"), vista: $("vista-contactos"), hash: "#contactos" },
  { tab: $("tab-grupos"), vista: $("vista-grupos"), hash: "#grupos" },
];

function mostrarPestaña(hash, enfocar = false) {
  const activa = pestañas.find((p) => p.hash === hash) ?? pestañas[0];
  for (const p of pestañas) {
    const es = p === activa;
    p.tab.setAttribute("aria-selected", String(es));
    p.tab.tabIndex = es ? 0 : -1;
    p.vista.hidden = !es;
  }
  if (enfocar) activa.tab.focus();
  history.replaceState(null, "", activa.hash);
}

pestañas.forEach((p, i) => {
  p.tab.addEventListener("click", () => mostrarPestaña(p.hash));
  // Flechas izquierda y derecha cambian de pestaña, como en un tablist.
  p.tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const siguiente = pestañas[(i + (event.key === "ArrowRight" ? 1 : -1) + pestañas.length) % pestañas.length];
    mostrarPestaña(siguiente.hash, true);
  });
});
mostrarPestaña(location.hash);
window.addEventListener("hashchange", () => mostrarPestaña(location.hash));

// ---------- Contactos ----------

// Un dato del contacto: teléfono o correo, con la búsqueda resaltada.
function dato(icono, valor, vacio, busqueda) {
  if (!valor) return crear("span", "", vacio);
  const span = crear("span");
  span.append(`${icono} `, ...resaltar(valor, busqueda));
  return span;
}

// Una tarjeta de contacto: avatar, nombre y datos, grupos y acciones.
function tarjetaContacto(c, busqueda) {
  const item = crear("li", "card contact");

  const avatar = crear("span", `avatar tono-${c.id % 5}`, iniciales(c.nombre));
  avatar.setAttribute("aria-hidden", "true");

  const cuerpo = crear("div", "contact-body");
  const nombre = crear("strong", "contact-name");
  nombre.replaceChildren(...resaltar(c.nombre, busqueda));
  const datos = crear("p", "contact-data");
  datos.append(
    dato("☎", c.telefono, "Sin teléfono", busqueda),
    dato("✉", c.correo, "Sin correo", busqueda),
    crear("span", "", `Desde ${fecha(c.fecha_registro)}`),
  );
  cuerpo.append(nombre, datos);
  const chips = crear("ul", "chips");
  chips.setAttribute("aria-label", `Grupos de ${c.nombre}`);
  chips.append(...c.grupos.map((g) => {
    const chip = crear("li", "chip");
    chip.append(punto(g.color), g.nombre);
    if (g.rol) chip.append(crear("em", "", g.rol));
    return chip;
  }));
  const agregar = crear("button", "chip chip-add", "+ Grupo");
  agregar.type = "button";
  agregar.setAttribute("aria-label", `Poner a ${c.nombre} en un grupo`);
  agregar.addEventListener("click", () => abrirPertenencia(c.id));
  const ultimo = crear("li");
  ultimo.append(agregar);
  chips.append(ultimo);
  const editar = crear("button", "link-button", "Editar");
  editar.type = "button";
  editar.setAttribute("aria-label", `Editar a ${c.nombre}`);
  editar.addEventListener("click", () => abrirFormContacto(c));

  const estrella = crear("button", "star", "★");
  estrella.type = "button";
  estrella.setAttribute("aria-pressed", String(c.es_favorito));
  estrella.setAttribute("aria-label", `${c.nombre}: ${c.es_favorito ? "quitar de favoritos" : "marcar como favorito"}`);
  estrella.addEventListener("click", () => marcarFavorito(c, estrella));

  // Una fila: avatar | nombre y datos | grupos | acciones.
  const acciones = crear("div", "contact-actions");
  acciones.append(editar, estrella);
  item.append(avatar, cuerpo, chips, acciones);
  return item;
}

function pintarContactos() {
  const lista = $("contactos");
  const { contactos } = estado;
  lista.removeAttribute("aria-busy");
  $("total-contactos").textContent = String(contactos.length);
  // Búsqueda (Historia 7): por nombre, teléfono o correo.
  const input = $("buscar-contactos");
  const busqueda = input.value.trim();
  const visibles = contactos.filter((c) => coincide(busqueda, c.nombre, c.telefono, c.correo));
  $("contador-contactos").textContent = contadorTexto(visibles.length, contactos.length, "contacto", "contactos", busqueda);
  if (!contactos.length) {
    lista.replaceChildren(crear("li", "empty", "Todavía no hay contactos. Crea el primero con «Nuevo contacto»."));
    return;
  }
  if (!visibles.length) {
    lista.replaceChildren(listaVacia(`Ningún contacto coincide con «${busqueda}».`, input, pintarContactos));
    return;
  }
  // Favoritos primero; si hay favoritos, cada bloque lleva su título.
  const favoritos = visibles.filter((c) => c.es_favorito);
  const demas = visibles.filter((c) => !c.es_favorito);
  const filas = [];
  if (favoritos.length) filas.push(encabezadoSeccion("Favoritos"));
  filas.push(...favoritos.map((c) => tarjetaContacto(c, busqueda)));
  if (favoritos.length && demas.length) filas.push(encabezadoSeccion("Todos los contactos"));
  filas.push(...demas.map((c) => tarjetaContacto(c, busqueda)));
  lista.replaceChildren(...filas);
}

async function marcarFavorito(contacto, boton) {
  boton.disabled = true;
  try {
    await api(`/api/contactos/${contacto.id}`, "PATCH", { es_favorito: !contacto.es_favorito });
    await cargar();
  } catch (error) {
    toast(error.message);
    boton.disabled = false;
  }
}

// ---------- Grupos ----------

function tarjetaGrupo(g, busqueda) {
  const item = crear("li", `card group borde-${g.color || "gris"}`);
  const cabeza = crear("div", "group-head");
  const nombre = crear("strong");
  nombre.replaceChildren(...resaltar(g.nombre, busqueda));
  cabeza.append(punto(g.color), nombre,
    crear("span", "count", g.contactos === 1 ? "1 contacto" : `${g.contactos} contactos`));
  item.append(cabeza);
  if (g.descripcion) {
    const descripcion = crear("p", "group-desc");
    descripcion.replaceChildren(...resaltar(g.descripcion, busqueda));
    item.append(descripcion);
  }

  // Quién está en el grupo, con su rol: el otro lado de la relación N:M.
  const miembros = estado.contactos.flatMap((c) => c.grupos.filter((x) => x.id === g.id).map((x) => ({ nombre: c.nombre, rol: x.rol })));
  const ul = crear("ul", "members");
  if (miembros.length) {
    ul.append(...miembros.map((m) => {
      const li = crear("li", "", m.nombre);
      if (m.rol) li.append(crear("em", "", m.rol));
      return li;
    }));
  } else {
    ul.append(crear("li", "members-empty", "Nadie todavía."));
  }
  const agregar = crear("button", "link-button", "+ Agregar contacto");
  agregar.type = "button";
  agregar.addEventListener("click", () => abrirPertenencia(undefined, g.id));
  const editar = crear("button", "link-button", "Editar");
  editar.type = "button";
  editar.setAttribute("aria-label", `Editar el grupo ${g.nombre}`);
  editar.addEventListener("click", () => abrirFormGrupo(g));
  const acciones = crear("div", "group-actions");
  acciones.append(agregar, editar);
  item.append(ul, acciones);
  return item;
}

function pintarGrupos() {
  const lista = $("grupos");
  const { grupos } = estado;
  lista.removeAttribute("aria-busy");
  $("total-grupos").textContent = String(grupos.length);
  // Búsqueda (Historia 7): por nombre o descripción.
  const input = $("buscar-grupos");
  const busqueda = input.value.trim();
  const visibles = grupos.filter((g) => coincide(busqueda, g.nombre, g.descripcion));
  $("contador-grupos").textContent = contadorTexto(visibles.length, grupos.length, "grupo", "grupos", busqueda);
  if (!grupos.length) {
    lista.replaceChildren(crear("li", "empty", "Todavía no hay grupos. Crea el primero con «Nuevo grupo»."));
    return;
  }
  if (!visibles.length) {
    lista.replaceChildren(listaVacia(`Ningún grupo coincide con «${busqueda}».`, input, pintarGrupos));
    return;
  }
  lista.replaceChildren(...visibles.map((g) => tarjetaGrupo(g, busqueda)));
}

async function cargar() {
  try {
    [estado.contactos, estado.grupos] = await Promise.all([api("/api/contactos"), api("/api/grupos")]);
    pintarContactos();
    pintarGrupos();
  } catch {
    for (const id of ["contactos", "grupos"]) {
      $(id).removeAttribute("aria-busy");
      $(id).replaceChildren(crear("li", "empty", "No pudimos cargar la agenda. Recarga la página."));
    }
  }
}

// ---------- Diálogos ----------

// Conecta un diálogo con su formulario: cancelar, demo, envío y errores.
function conectarDialogo({ dialogo, form, demo, enviar }) {
  const error = form.querySelector(".notice");
  const guardar = form.querySelector("button[type=submit]");
  form.querySelector("button[value=cancelar]").addEventListener("click", () => dialogo.close());
  form.querySelector(".demo").addEventListener("click", () => {
    error.hidden = true;
    demo(form);
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    guardar.disabled = true;
    error.hidden = true;
    try {
      const mensaje = await enviar(form);
      dialogo.close();
      toast(mensaje);
      await cargar();
    } catch (e) {
      error.textContent = e.message;
      error.hidden = false;
    } finally {
      guardar.disabled = false;
    }
  });
  return () => {
    form.reset();
    error.hidden = true;
    dialogo.showModal();
  };
}

// Pregunta antes de eliminar; resuelve true solo si se pulsa "Eliminar".
function confirmar(titulo, detalle) {
  const dialogo = $("dialogo-confirmar");
  $("confirmar-titulo").textContent = titulo;
  $("confirmar-detalle").textContent = detalle;
  dialogo.returnValue = "";
  dialogo.showModal();
  return new Promise((resolve) => {
    dialogo.addEventListener("close", () => resolve(dialogo.returnValue === "si"), { once: true });
  });
}

// Elimina tras confirmar, cierra el diálogo de edición y recarga la agenda.
async function eliminar({ dialogo, url, titulo, detalle, mensaje }) {
  if (!(await confirmar(titulo, detalle))) return;
  const error = dialogo.querySelector(".notice");
  try {
    await api(url, "DELETE");
    dialogo.close();
    toast(mensaje);
    await cargar();
  } catch (e) {
    error.textContent = e.message;
    error.hidden = false;
  }
}

const cuantos = (n, singular, plural) => (n === 1 ? `1 ${singular}` : `${n} ${plural}`);

// Ejemplos para "Datos demo": se usa el primero que aún no esté en la agenda.
const DEMO_CONTACTOS = [
  { nombre: "Rosa Medina", telefono: "955112233", correo: "rosa@correo.pe", es_favorito: true },
  { nombre: "Jorge Salas", telefono: "944556677", correo: "" },
  { nombre: "Mariela Paz", telefono: "", correo: "mariela@correo.pe" },
  { nombre: "Diego Huamán", telefono: "966778899", correo: "diego@correo.pe" },
];
const DEMO_GRUPOS = [
  { nombre: "Vecinos", color: "verde", descripcion: "Los del edificio." },
  { nombre: "Fútbol", color: "azul", descripcion: "La pichanga de los sábados." },
  { nombre: "Universidad", color: "gris", descripcion: "" },
  { nombre: "Viaje a Cusco", color: "rojo", descripcion: "Los que van en julio." },
];
const DEMO_ROLES = { Familia: "primo", Trabajo: "compañero", Amigos: "amigo", Vecinos: "vecino", "Fútbol": "arquero", Universidad: "compañera" };

// El contacto que se está editando; null cuando el diálogo registra uno nuevo.
let contactoEditando = null;

const abrirContacto = conectarDialogo({
  dialogo: $("dialogo-contacto"),
  form: $("form-contacto"),
  demo(f) {
    const usados = new Set(estado.contactos.flatMap((c) => [c.nombre, c.correo]));
    const d = DEMO_CONTACTOS.find((x) => !usados.has(x.nombre) && !usados.has(x.correo)) ?? DEMO_CONTACTOS.at(-1);
    f.nombre.value = d.nombre;
    f.telefono.value = d.telefono;
    f.correo.value = d.correo;
    f.es_favorito.checked = Boolean(d.es_favorito);
  },
  async enviar(f) {
    const datos = {
      nombre: f.nombre.value,
      telefono: f.telefono.value,
      correo: f.correo.value,
      es_favorito: f.es_favorito.checked,
    };
    if (contactoEditando) {
      const c = await api(`/api/contactos/${contactoEditando.id}`, "PUT", datos);
      return `Se guardaron los cambios de ${c.nombre}.`;
    }
    const c = await api("/api/contactos", "POST", datos);
    mostrarPestaña("#contactos");
    return `${c.nombre} quedó guardado en la agenda.`;
  },
});

// Abre el diálogo vacío para registrar, o con los datos de `contacto` para editarlo.
function abrirFormContacto(contacto = null) {
  contactoEditando = contacto;
  const f = $("form-contacto");
  abrirContacto();
  $("dialogo-contacto-titulo").textContent = contacto ? "Editar contacto" : "Nuevo contacto";
  f.querySelector(".demo").hidden = Boolean(contacto);
  f.querySelector(".sheet-danger").hidden = !contacto;
  if (!contacto) return;
  f.nombre.value = contacto.nombre;
  f.telefono.value = contacto.telefono ?? "";
  f.correo.value = contacto.correo ?? "";
  f.es_favorito.checked = contacto.es_favorito;
}

$("form-contacto").querySelector(".eliminar").addEventListener("click", () => {
  const c = contactoEditando;
  eliminar({
    dialogo: $("dialogo-contacto"),
    url: `/api/contactos/${c.id}`,
    titulo: `¿Eliminar a ${c.nombre}?`,
    detalle: c.grupos.length
      ? `También saldrá de ${cuantos(c.grupos.length, "grupo", "grupos")}. No se puede deshacer.`
      : "No se puede deshacer.",
    mensaje: `${c.nombre} se eliminó de la agenda.`,
  });
});

// El grupo que se está editando; null cuando el diálogo crea uno nuevo.
let grupoEditando = null;

const abrirGrupo = conectarDialogo({
  dialogo: $("dialogo-grupo"),
  form: $("form-grupo"),
  demo(f) {
    const usados = new Set(estado.grupos.map((g) => g.nombre));
    const d = DEMO_GRUPOS.find((x) => !usados.has(x.nombre)) ?? DEMO_GRUPOS.at(-1);
    f.nombre.value = d.nombre;
    f.color.value = d.color;
    f.descripcion.value = d.descripcion;
  },
  async enviar(f) {
    const datos = {
      nombre: f.nombre.value,
      descripcion: f.descripcion.value,
      color: f.color.value,
    };
    if (grupoEditando) {
      const g = await api(`/api/grupos/${grupoEditando.id}`, "PUT", datos);
      return `Se guardaron los cambios del grupo «${g.nombre}».`;
    }
    const g = await api("/api/grupos", "POST", datos);
    mostrarPestaña("#grupos");
    return `Grupo «${g.nombre}» creado.`;
  },
});

// Abre el diálogo vacío para crear, o con los datos de `grupo` para editarlo.
function abrirFormGrupo(grupo = null) {
  grupoEditando = grupo;
  const f = $("form-grupo");
  abrirGrupo();
  $("dialogo-grupo-titulo").textContent = grupo ? "Editar grupo" : "Nuevo grupo";
  f.querySelector(".demo").hidden = Boolean(grupo);
  f.querySelector(".sheet-danger").hidden = !grupo;
  f.querySelector("button[type=submit]").textContent = grupo ? "Guardar" : "Crear grupo";
  if (!grupo) return;
  f.nombre.value = grupo.nombre;
  f.descripcion.value = grupo.descripcion ?? "";
  f.color.value = grupo.color || "gris";
}

$("form-grupo").querySelector(".eliminar").addEventListener("click", () => {
  const g = grupoEditando;
  eliminar({
    dialogo: $("dialogo-grupo"),
    url: `/api/grupos/${g.id}`,
    titulo: `¿Eliminar el grupo «${g.nombre}»?`,
    detalle: {
      0: "No se puede deshacer.",
      1: "1 contacto saldrá del grupo, pero seguirá en la agenda. No se puede deshacer.",
    }[g.contactos] ?? `${g.contactos} contactos saldrán del grupo, pero seguirán en la agenda. No se puede deshacer.`,
    mensaje: `Grupo «${g.nombre}» eliminado.`,
  });
});

const formPertenencia = $("form-pertenencia");
const abrirDialogoPertenencia = conectarDialogo({
  dialogo: $("dialogo-pertenencia"),
  form: formPertenencia,
  // Demo: la primera pareja contacto-grupo que aún no existe, empezando por el
  // contacto y el grupo ya elegidos, con un rol que va con el grupo.
  demo(f) {
    const primero = (lista, id) => [...lista].sort((a, b) => (b.id === id) - (a.id === id));
    const grupos = primero(estado.grupos, Number(f.grupo_id.value));
    for (const c of primero(estado.contactos, Number(f.contacto_id.value))) {
      const g = grupos.find((x) => !c.grupos.some((y) => y.id === x.id));
      if (g) {
        f.contacto_id.value = c.id;
        f.grupo_id.value = g.id;
        f.rol.value = DEMO_ROLES[g.nombre] ?? "amigo";
        return;
      }
    }
    toast("Todos los contactos ya están en todos los grupos.");
  },
  async enviar(f) {
    await api("/api/pertenencias", "POST", {
      contacto_id: Number(f.contacto_id.value),
      grupo_id: Number(f.grupo_id.value),
      rol: f.rol.value,
    });
    return `${f.contacto_id.selectedOptions[0].text} ahora está en ${f.grupo_id.selectedOptions[0].text}.`;
  },
});

// Abre "Poner en un grupo" con el contacto o el grupo ya elegidos.
function abrirPertenencia(contactoId, grupoId) {
  const f = formPertenencia;
  f.contacto_id.replaceChildren(...estado.contactos.map((c) => new Option(c.nombre, c.id)));
  f.grupo_id.replaceChildren(...estado.grupos.map((g) => new Option(g.nombre, g.id)));
  abrirDialogoPertenencia();
  if (contactoId) f.contacto_id.value = contactoId;
  if (grupoId) f.grupo_id.value = grupoId;
  // Con el grupo ya elegido, sugiere un contacto que aún no esté en él.
  if (grupoId && !contactoId) {
    const libre = estado.contactos.find((c) => !c.grupos.some((g) => g.id === grupoId));
    if (libre) f.contacto_id.value = libre.id;
  }
  (contactoId ? f.grupo_id : f.contacto_id).focus();
}

$("nuevo-contacto").addEventListener("click", () => abrirFormContacto());
$("nuevo-grupo").addEventListener("click", () => abrirFormGrupo());

// Buscadores: filtran al escribir; Esc vacía el campo (o quita el foco si ya está vacío).
for (const [id, repintar] of [["buscar-contactos", pintarContactos], ["buscar-grupos", pintarGrupos]]) {
  const input = $(id);
  input.addEventListener("input", repintar);
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    if (input.value) {
      input.value = "";
      repintar();
    } else {
      input.blur();
    }
  });
}

// "/" lleva el foco al buscador de la pestaña visible, salvo que ya se esté escribiendo o haya un diálogo abierto.
document.addEventListener("keydown", (event) => {
  if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
  const escribiendo = event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable]");
  if (escribiendo || document.querySelector("dialog[open]")) return;
  event.preventDefault();
  ($("vista-grupos").hidden ? $("buscar-contactos") : $("buscar-grupos")).focus();
});

// Un clic en el fondo oscuro cierra el diálogo.
for (const dialogo of document.querySelectorAll("dialog.sheet")) {
  dialogo.addEventListener("click", (event) => {
    if (event.target === dialogo) dialogo.close();
  });
}

cargar();
