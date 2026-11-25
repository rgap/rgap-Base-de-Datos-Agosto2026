// Proyecto 9: sistema de flujo de caja simple (MySQL).
// Las consultas son las de 2_sistema_implementado_mysql/src/db.js; los
// resultados se copiaron de una ejecución real en MySQL 8.4.

const movimientos = {
  nombre: "movimiento",
  columnas: ["id", "fecha_hora", "descripcion", "tipo", "monto"],
  filas: [
    [1, "2026-11-23 08:15:00", "Venta de café", "ingreso", "120.00"],
    [2, "2026-11-23 09:40:00", "Compra de pan", "egreso", "35.00"],
    [3, "2026-11-23 12:05:00", "Venta de café", "ingreso", "115.00"],
    [4, "2026-11-23 16:30:00", "Pago de luz", "egreso", "50.00"],
  ],
};

export default {
  id: "flujo-caja",
  numero: 9,
  nombre: "Flujo de caja",
  pantalla: {
    titulo: "Flujo de caja",
    subtitulo: "23/11/2026 · entró S/ 235.00 · salió S/ 85.00 · saldo S/ 150.00",
    columnas: ["Hora", "Descripción", "Tipo", "Monto"],
    filas: [
      ["16:30", "Pago de luz", "egreso", "50.00"],
      ["12:05", "Venta de café", "ingreso", "115.00"],
      ["09:40", "Compra de pan", "egreso", "35.00"],
      ["08:15", "Venta de café", "ingreso", "120.00"],
    ],
    botones: ["Anotar movimiento", "Ver el día", "Ver el mes"],
  },

  acciones: [
    {
      id: "ver-dia",
      boton: "Ver el día",
      descripcion: "El responsable de caja abre el 23/11/2026: ve sus movimientos y los tres totales.",
      transaccion: false,
      porQueTransaccion: "Ver el día solo lee: no cambia ninguna tabla, así que no hace falta una transacción.",
      pasos: [
        {
          id: "leer",
          sql: "SELECT id, fecha_hora, descripcion, tipo, monto\nFROM movimiento\nWHERE DATE(fecha_hora) = ?\nORDER BY fecha_hora DESC, id DESC",
          nota: "Trae los movimientos del día, del más reciente al más antiguo.",
        },
        {
          id: "sumar",
          app: "Suma los ingresos, suma los egresos y resta: entró, salió y saldo (función totals de src/db.js).",
          nota: "Calcula los tres totales con los movimientos que llegaron.",
          despuesDe: ["leer"],
          orden: "Primero hay que traer los movimientos: los totales se calculan con ellos.",
        },
      ],
      sobran: [
        {
          id: "guardar-total",
          sql: "INSERT INTO total_dia (fecha, entro, salio, saldo)\nVALUES (?, ?, ?, ?)",
          porQue: "Regla 6: ninguno de los tres totales se almacena; se calculan cada vez. Esa tabla no existe.",
        },
        {
          id: "corregir",
          sql: "UPDATE movimiento SET monto = ? WHERE id = ?",
          porQue: "Ver el día solo lee. Además, Regla 7: un movimiento anotado no se puede editar.",
        },
      ],
      despues: {
        tablas: [{
          nombre: "lo que recibe la página",
          columnas: movimientos.columnas,
          filas: [...movimientos.filas].reverse(),
        }],
        nota: "Con esas filas, la aplicación calcula: entró 235.00, salió 85.00 y saldo 150.00.",
      },
    },
  ],

  ordenar: [
    {
      id: "sugerencias",
      titulo: "Sugerir descripciones",
      contexto: "Al escribir una descripción, la página sugiere las ya usadas, las más usadas primero (listDescriptions en src/db.js).",
      piezas: [
        "SELECT descripcion",
        "FROM movimiento",
        "GROUP BY descripcion",
        "ORDER BY COUNT(*) DESC, MAX(fecha_hora) DESC",
        "LIMIT 20",
      ],
      porQue: "Las cláusulas van siempre en este orden: SELECT, FROM, WHERE, GROUP BY, ORDER BY, LIMIT. ORDER BY puede usar COUNT(*) porque se aplica después de agrupar.",
    },
  ],

  devuelve: [
    {
      id: "sugerencias",
      pregunta: "Con estos cuatro movimientos, ¿qué sugerencias devuelve?",
      tablas: [movimientos],
      sql: "SELECT descripcion\nFROM movimiento\nGROUP BY descripcion\nORDER BY COUNT(*) DESC, MAX(fecha_hora) DESC\nLIMIT 20;",
      opciones: [
        { columnas: ["descripcion"], filas: [["Compra de pan"], ["Pago de luz"], ["Venta de café"]] },
        { columnas: ["descripcion"], filas: [["Venta de café"], ["Pago de luz"], ["Compra de pan"]] },
        { columnas: ["descripcion"], filas: [["Venta de café"], ["Compra de pan"], ["Pago de luz"]] },
      ],
      correcta: 1,
      porQue: "«Venta de café» aparece dos veces: va primero. «Pago de luz» y «Compra de pan» aparecen una vez; desempata MAX(fecha_hora) DESC: 16:30 va antes que 09:40.",
    },
  ],

  reglas: [
    {
      id: "inalterable",
      texto: "Un movimiento anotado no se puede editar ni eliminar.",
      fuente: "Regla 7",
      va: "trigger",
      trigger: { momento: "BEFORE", eventos: ["UPDATE", "DELETE"] },
      porQue: "Dos triggers BEFORE, uno para UPDATE y otro para DELETE, detienen la operación con SIGNAL venga de donde venga, también desde Workbench.",
      pista: "Tiene que impedirse aunque alguien entre a la base sin pasar por la aplicación.",
      tambien: {
        aplicacion: "Es lo que hace el proyecto: la página no tiene botón de editar ni de borrar. Funciona, pero desde Workbench alguien sí podría cambiar un movimiento. Un trigger lo impide siempre.",
      },
      sqlOrigen: "propuesto",
      sql: "DELIMITER //\nCREATE TRIGGER movimiento_no_se_edita\nBEFORE UPDATE ON movimiento\nFOR EACH ROW\nBEGIN\n    SIGNAL SQLSTATE '45000'\n        SET MESSAGE_TEXT = 'Un movimiento anotado no se puede editar ni eliminar.';\nEND //\n\nCREATE TRIGGER movimiento_no_se_borra\nBEFORE DELETE ON movimiento\nFOR EACH ROW\nBEGIN\n    SIGNAL SQLSTATE '45000'\n        SET MESSAGE_TEXT = 'Un movimiento anotado no se puede editar ni eliminar.';\nEND //\nDELIMITER ;",
    },
    {
      id: "tipo",
      texto: "El tipo de movimiento solo puede ser ingreso o egreso.",
      fuente: "Regla 1",
      va: "restriccion",
      porQue: "Es una regla sobre el valor de una columna: un CHECK la cumple siempre, sin escribir código.",
      pista: "Basta con mirar una columna de una fila.",
      sqlOrigen: "proyecto",
      sql: "tipo VARCHAR(7) NOT NULL CHECK (tipo IN ('ingreso', 'egreso'))",
    },
    {
      id: "totales",
      texto: "El total que entró, el total que salió y el saldo final […]. Ninguno de los tres se almacena: se calculan a partir de los movimientos.",
      fuente: "Regla 6",
      va: "vista",
      porQue: "Una vista guarda la consulta, no los datos: los totales se calculan cada vez que se leen.",
      pista: "Se calcula a partir de muchas filas y no se guarda.",
      tambien: {
        aplicacion: "Es lo que hace el proyecto: la función totals de src/db.js suma en JavaScript. Funciona; con una vista, el cálculo queda en la base y cualquier reporte lo usa igual.",
      },
      sqlOrigen: "sesión 31",
      sql: "CREATE VIEW total_por_dia AS\nSELECT DATE(fecha_hora) AS dia,\n    SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END) AS entro,\n    SUM(CASE WHEN tipo = 'egreso' THEN monto ELSE 0 END) AS salio\nFROM movimiento\nGROUP BY DATE(fecha_hora);",
    },
    {
      id: "importe",
      texto: "El importe debe ser positivo y admitir como máximo dos decimales.",
      fuente: "Regla 2",
      va: "restriccion",
      porQue: "DECIMAL(18, 2) guarda como máximo dos decimales y el CHECK exige que sea positivo.",
      pista: "Otra vez, una sola columna.",
      sqlOrigen: "proyecto",
      sql: "monto DECIMAL(18, 2) NOT NULL CHECK (monto > 0)",
    },
  ],
};
