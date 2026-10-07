// ---------- Datos ----------

const clientes = [
  { id: 1, nombre: 'Ana' },
  { id: 2, nombre: 'Luis' },
  { id: 3, nombre: 'María' },
];

const pedidos = [
  { id: 101, producto: 'Laptop', cliente_id: 1 },
  { id: 102, producto: 'Mouse', cliente_id: 1 },
  { id: 103, producto: 'Teclado', cliente_id: 2 },
  { id: 104, producto: 'Monitor', cliente_id: null },
];

const empleados = [
  { id: 1, nombre: 'Rosa', jefe_id: null },
  { id: 2, nombre: 'Carlos', jefe_id: 1 },
  { id: 3, nombre: 'Elena', jefe_id: 1 },
  { id: 4, nombre: 'Diego', jefe_id: 2 },
];

const tiendas = {
  izq: { titulo: 'clientes c', filas: clientes },
  der: { titulo: 'pedidos p', filas: pedidos },
  on: (c, p) => p.cliente_id === c.id,
  columnas: [
    { lado: 'l', campo: 'nombre', titulo: 'c.nombre' },
    { lado: 'r', campo: 'producto', titulo: 'p.producto' },
  ],
};

const jerarquia = {
  izq: { titulo: 'empleados e', filas: empleados },
  der: { titulo: 'empleados j  (la misma tabla)', filas: empleados },
  on: (e, j) => e.jefe_id === j.id,
  columnas: [
    { lado: 'l', campo: 'nombre', titulo: 'empleado' },
    { lado: 'r', campo: 'nombre', titulo: 'jefe' },
  ],
};

const joins = [
  {
    id: 'inner',
    nombre: 'INNER JOIN',
    desc: 'Solo las filas que coinciden en ambas tablas.',
    nota: 'María no tiene pedidos y el Monitor no tiene cliente: ninguno de los dos aparece.',
    sql: 'SELECT c.nombre, p.producto\nFROM clientes c\nINNER JOIN pedidos p ON p.cliente_id = c.id;',
    datos: tiendas,
    venn: () => venn(false, true, false),
  },
  {
    id: 'left',
    nombre: 'LEFT JOIN',
    desc: 'Todas las filas de la tabla izquierda, más las filas coincidentes de la derecha.',
    nota: 'María aparece aunque no tenga pedidos; su producto queda en NULL. También se escribe LEFT OUTER JOIN.',
    sql: 'SELECT c.nombre, p.producto\nFROM clientes c\nLEFT JOIN pedidos p ON p.cliente_id = c.id;',
    datos: tiendas,
    venn: () => venn(true, true, false),
  },
  {
    id: 'right',
    nombre: 'RIGHT JOIN',
    desc: 'Todas las filas de la tabla derecha, más las filas coincidentes de la izquierda.',
    nota: 'El Monitor aparece aunque no tenga cliente; su nombre queda en NULL. También se escribe RIGHT OUTER JOIN.',
    sql: 'SELECT c.nombre, p.producto\nFROM clientes c\nRIGHT JOIN pedidos p ON p.cliente_id = c.id;',
    datos: tiendas,
    venn: () => venn(false, true, true),
  },
  {
    id: 'full',
    nombre: 'FULL OUTER JOIN',
    desc: 'Todas las filas de ambas tablas, haciendo coincidir las que sea posible.',
    nota: 'Nadie queda fuera: aparecen María y el Monitor, cada uno con NULL en el otro lado. MySQL no lo soporta directamente: se simula con LEFT JOIN UNION RIGHT JOIN.',
    sql: 'SELECT c.nombre, p.producto\nFROM clientes c\nFULL OUTER JOIN pedidos p ON p.cliente_id = c.id;',
    datos: tiendas,
    venn: () => venn(true, true, true),
  },
  {
    id: 'cross',
    nombre: 'CROSS JOIN',
    desc: 'Todas las combinaciones posibles de filas entre ambas tablas.',
    nota: 'No lleva condición ON: 3 clientes × 4 pedidos = 12 filas.',
    sql: 'SELECT c.nombre, p.producto\nFROM clientes c\nCROSS JOIN pedidos p;',
    datos: tiendas,
    venn: vennCross,
  },
  {
    id: 'self',
    nombre: 'SELF JOIN',
    desc: 'Una tabla unida consigo misma.',
    nota: 'La tabla empleados se usa dos veces con alias distintos: e (el empleado) y j (su jefe). Rosa no tiene jefe, así que no aparece como empleado; con LEFT JOIN aparecería con jefe NULL.',
    sql: 'SELECT e.nombre AS empleado, j.nombre AS jefe\nFROM empleados e\nINNER JOIN empleados j ON e.jefe_id = j.id;',
    datos: jerarquia,
    venn: vennSelf,
  },
];

// ---------- Lógica de los joins ----------

// Devuelve pares { l, r } con índices de fila; null significa "sin pareja".
function calcularPares(tipo, L, R, on) {
  const pares = [];
  const coincide = (i, j) => on(L[i], R[j]);
  const idxL = L.map((_, i) => i);
  const idxR = R.map((_, j) => j);

  if (tipo === 'cross') {
    idxL.forEach(l => idxR.forEach(r => pares.push({ l, r })));
    return pares;
  }

  if (tipo === 'right') {
    idxR.forEach(r => {
      const ls = idxL.filter(l => coincide(l, r));
      if (ls.length) ls.forEach(l => pares.push({ l, r }));
      else pares.push({ l: null, r });
    });
    return pares;
  }

  const conservarIzq = tipo === 'left' || tipo === 'full';
  idxL.forEach(l => {
    const rs = idxR.filter(r => coincide(l, r));
    if (rs.length) rs.forEach(r => pares.push({ l, r }));
    else if (conservarIzq) pares.push({ l, r: null });
  });
  if (tipo === 'full') {
    idxR.filter(r => !idxL.some(l => coincide(l, r)))
      .forEach(r => pares.push({ l: null, r }));
  }
  return pares;
}

// ---------- Diagramas ----------

function venn(izq, centro, der) {
  const on = 'var(--match)';
  const off = '#fff';
  return `<svg viewBox="0 0 150 90" role="img" aria-label="Diagrama de Venn">
    <defs><clipPath id="clipA"><circle cx="55" cy="45" r="34"/></clipPath></defs>
    <circle cx="55" cy="45" r="34" fill="${izq ? on : off}"/>
    <circle cx="95" cy="45" r="34" fill="${der ? on : off}"/>
    <circle cx="95" cy="45" r="34" fill="${centro ? on : off}" clip-path="url(#clipA)"/>
    <circle cx="55" cy="45" r="34" fill="none" stroke="var(--left)" stroke-width="2.5"/>
    <circle cx="95" cy="45" r="34" fill="none" stroke="var(--right)" stroke-width="2.5"/>
  </svg>`;
}

function vennCross() {
  const ys = n => Array.from({ length: n }, (_, i) => 45 + (i - (n - 1) / 2) * 20);
  const a = ys(3), b = ys(4);
  const lineas = a.map(y1 => b.map(y2 =>
    `<line x1="40" y1="${y1}" x2="110" y2="${y2}" stroke="var(--match)" stroke-width="1.5"/>`).join('')).join('');
  const puntos = (arr, x, color) => arr.map(y => `<circle cx="${x}" cy="${y}" r="6" fill="${color}"/>`).join('');
  return `<svg viewBox="0 0 150 90" role="img" aria-label="Todas las combinaciones">
    ${lineas}${puntos(a, 40, 'var(--left)')}${puntos(b, 110, 'var(--right)')}
  </svg>`;
}

function vennSelf() {
  return `<svg viewBox="0 0 150 90" role="img" aria-label="Tabla unida consigo misma">
    <defs><marker id="flecha" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="var(--match)"/></marker></defs>
    <circle cx="62" cy="48" r="30" fill="#fff" stroke="var(--left)" stroke-width="2.5"/>
    <path d="M84 28 C 128 2, 138 78, 92 62" fill="none" stroke="var(--match)" stroke-width="3" marker-end="url(#flecha)"/>
  </svg>`;
}

// ---------- Render ----------

const $ = id => document.getElementById(id);
const PALABRAS = /\b(SELECT|FROM|ON|AS)\b/g;
const PALABRAS_JOIN = /\b((?:INNER|LEFT|RIGHT|FULL OUTER|CROSS) JOIN)\b/g;

let actual = 0;
let pares = [];

function celda(valor) {
  return valor === null ? '<span class="null">NULL</span>' : valor;
}

function tablaOrigen(tabla, lado, estados) {
  const campos = Object.keys(tabla.filas[0]);
  const filas = tabla.filas.map((fila, i) =>
    `<tr class="${estados[i]}" data-lado="${lado}" data-i="${i}">` +
    campos.map(c => `<td>${celda(fila[c])}</td>`).join('') + '</tr>').join('');
  return `<div class="nombre">${tabla.titulo}</div>
    <table><thead><tr>${campos.map(c => `<th>${c}</th>`).join('')}</tr></thead>
    <tbody>${filas}</tbody></table>`;
}

function estadoFilas(n, lado) {
  return Array.from({ length: n }, (_, i) => {
    const mias = pares.filter(p => p[lado] === i);
    if (!mias.length) return 'out';
    const otro = lado === 'l' ? 'r' : 'l';
    return mias.some(p => p[otro] !== null) ? 'match' : 'solo';
  });
}

function render() {
  const join = joins[actual];
  const { izq, der, on, columnas } = join.datos;
  pares = calcularPares(join.id === 'self' ? 'inner' : join.id, izq.filas, der.filas, on);

  [...$('tabs').children].forEach((b, i) => b.classList.toggle('activo', i === actual));
  $('venn').innerHTML = join.venn();
  $('titulo').textContent = join.nombre;
  $('desc').textContent = join.desc;
  $('nota').textContent = join.nota;
  $('sql').innerHTML = join.sql
    .replace(PALABRAS_JOIN, '<span class="join">$1</span>')
    .replace(PALABRAS, '<span class="kw">$1</span>');

  $('tablaIzq').innerHTML = tablaOrigen(izq, 'l', estadoFilas(izq.filas.length, 'l'));
  $('tablaDer').innerHTML = tablaOrigen(der, 'r', estadoFilas(der.filas.length, 'r'));

  const origen = { l: izq.filas, r: der.filas };
  const filas = pares.map((p, k) => {
    const clase = p.l === null || p.r === null ? 'solo' : 'match';
    const celdas = columnas.map(c => {
      const idx = p[c.lado];
      return `<td>${celda(idx === null ? null : origen[c.lado][idx][c.campo])}</td>`;
    }).join('');
    return `<tr class="${clase}" data-k="${k}">${celdas}</tr>`;
  }).join('');
  $('resultado').innerHTML = `<table>
    <thead><tr>${columnas.map(c => `<th class="${c.lado}">${c.titulo}</th>`).join('')}</tr></thead>
    <tbody>${filas}</tbody></table>`;
  $('conteo').textContent = `${pares.length} ${pares.length === 1 ? 'fila' : 'filas'}`;

  enfocar(null);
  dibujarLineas();
}

// Une con una curva cada fila izquierda con su pareja de la derecha.
function dibujarLineas() {
  const stage = $('stage');
  const svg = $('lineas');
  const base = stage.getBoundingClientRect();
  const borde = (lado, i) => {
    const r = stage.querySelector(`tr[data-lado="${lado}"][data-i="${i}"]`).getBoundingClientRect();
    return { x: (lado === 'l' ? r.right : r.left) - base.left, y: r.top + r.height / 2 - base.top };
  };
  svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);
  svg.classList.toggle('muchas', pares.length > 8);
  svg.innerHTML = pares.map((p, k) => {
    if (p.l === null || p.r === null) return '';
    const a = borde('l', p.l), b = borde('r', p.r);
    const m = (a.x + b.x) / 2;
    return `<path data-k="${k}" d="M${a.x} ${a.y} C${m} ${a.y}, ${m} ${b.y}, ${b.x} ${b.y}"/>`;
  }).join('');
}

// Resalta los pares que cumplen el filtro (o quita el resaltado con null).
function enfocar(filtro) {
  document.querySelectorAll('.hl').forEach(el => el.classList.remove('hl'));
  document.body.classList.toggle('enfocando', !!filtro);
  if (!filtro) return;
  const marcar = sel => document.querySelectorAll(sel).forEach(el => el.classList.add('hl'));
  if (filtro.lado) marcar(`tr[data-lado="${filtro.lado}"][data-i="${filtro.i}"]`);
  pares.forEach((p, k) => {
    const activo = filtro.lado ? p[filtro.lado] === filtro.i : k === filtro.k;
    if (!activo) return;
    marcar(`[data-k="${k}"]`);
    if (p.l !== null) marcar(`tr[data-lado="l"][data-i="${p.l}"]`);
    if (p.r !== null) marcar(`tr[data-lado="r"][data-i="${p.r}"]`);
  });
}

// ---------- Eventos ----------

function ir(i) {
  actual = (i + joins.length) % joins.length;
  render();
}

$('tabs').innerHTML = joins.map((j, i) => `<button data-idx="${i}">${j.nombre}</button>`).join('');
$('tabs').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (btn) ir(Number(btn.dataset.idx));
});

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') ir(actual + 1);
  if (e.key === 'ArrowLeft') ir(actual - 1);
});

document.addEventListener('mouseover', e => {
  const tr = e.target.closest('tbody tr');
  if (!tr) return enfocar(null);
  if (tr.dataset.k !== undefined) enfocar({ k: Number(tr.dataset.k) });
  else enfocar({ lado: tr.dataset.lado, i: Number(tr.dataset.i) });
});

window.addEventListener('resize', dibujarLineas);

render();
