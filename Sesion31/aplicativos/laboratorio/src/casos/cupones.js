// Proyecto 22: sistema de cupones de descuento (MySQL).
// Las consultas son las de 2_sistema_implementado_mysql/src/db.js; los
// cupones son los de la sesión 28. Resultados copiados de una ejecución real
// en MySQL 8.4 (con la fecha 2026-11-25 en lugar de UTC_TIMESTAMP()).

const cupones = {
  nombre: "cupon",
  columnas: ["id", "codigo", "estado", "vigente_desde", "vigente_hasta"],
  filas: [
    [1, "BIENVENIDA10", "activo", "2026-01-01 00:00:00", null],
    [2, "NOVIEMBRE20", "activo", "2026-11-01 00:00:00", "2026-12-01 00:00:00"],
    [3, "VERANO15", "activo", "2026-01-01 00:00:00", "2026-03-31 00:00:00"],
    [4, "NAVIDAD25", "activo", "2026-12-20 00:00:00", "2026-12-26 00:00:00"],
    [5, "PRUEBA50", "inactivo", "2026-01-01 00:00:00", null],
  ],
};

export default {
  id: "cupones",
  numero: 22,
  nombre: "Cupones de descuento",
  pantalla: {
    titulo: "Cupones de descuento · panel",
    subtitulo: "Sesión de administrador",
    columnas: ["Código", "Descuento", "Estado", "Vigente"],
    filas: [
      ["PRUEBA50", "50 %", "inactivo", "no"],
      ["NAVIDAD25", "25 %", "activo", "no"],
      ["VERANO15", "15 %", "activo", "no"],
      ["NOVIEMBRE20", "S/ 20", "activo", "sí"],
      ["BIENVENIDA10", "10 %", "activo", "sí"],
    ],
    botones: ["Nuevo cupón", "Activar / desactivar", "Eliminar"],
  },

  acciones: [
    {
      id: "nuevo",
      boton: "Nuevo cupón",
      descripcion: "El administrador registra el cupón DICIEMBRE15: 15 % en diciembre.",
      transaccion: false,
      porQueTransaccion: "Hay un solo cambio, el INSERT: no hace falta una transacción. Si dos personas registran el mismo código a la vez, el UNIQUE de la tabla rechaza al segundo.",
      pasos: [
        {
          id: "codigos",
          sql: "SELECT codigo FROM cupon",
          nota: "Trae todos los códigos que ya existen.",
        },
        {
          id: "comparar",
          app: "Compara sin distinguir mayúsculas: «diciembre15» chocaría con «DICIEMBRE15» (Regla 2).",
          nota: "Revisa que el código no esté repetido.",
          despuesDe: ["codigos"],
          orden: "Para comparar, primero hay que traer los códigos.",
        },
        {
          id: "insertar",
          sql: "INSERT INTO cupon (\n  codigo, descripcion, tipo_descuento, valor_descuento,\n  estado, vigente_desde, vigente_hasta\n) VALUES (?, ?, ?, ?, ?, ?, ?)",
          nota: "Guarda el cupón nuevo.",
          despuesDe: ["comparar"],
          orden: "Solo se inserta después de comprobar que el código no se repite.",
        },
      ],
      sobran: [
        {
          id: "borrar",
          sql: "DELETE FROM cupon WHERE codigo = ?",
          porQue: "Para registrar un cupón no se borra nada.",
        },
        {
          id: "activar",
          sql: "UPDATE cupon SET estado = 'activo' WHERE id = ?",
          porQue: "El estado va en el mismo INSERT; si no se mandara, la columna tiene DEFAULT 'activo' (Regla 3).",
        },
      ],
      despues: {
        tablas: [{
          nombre: "cupon (después)",
          columnas: ["id", "codigo", "estado"],
          filas: [
            [6, "DICIEMBRE15", "activo"],
            ...cupones.filas.map(([id, codigo, estado]) => [id, codigo, estado]).reverse(),
          ],
          resaltar: [0],
        }],
        nota: "Un solo INSERT: el cupón nuevo aparece arriba del panel (ORDER BY c.id DESC).",
      },
    },
  ],

  ordenar: [
    {
      id: "vigentes",
      titulo: "Cupones vigentes (vista pública)",
      contexto: "listCoupons(true) en src/db.js, con la condición de vigencia de la Regla 6. Para acortar, sin la columna calculada vigente.",
      piezas: [
        "SELECT c.id, c.codigo, c.descripcion, c.tipo_descuento, c.valor_descuento,\n       c.estado, c.vigente_desde, c.vigente_hasta",
        "FROM cupon AS c",
        "WHERE c.estado = 'activo'",
        "AND c.vigente_desde <= UTC_TIMESTAMP()\nAND (c.vigente_hasta IS NULL OR c.vigente_hasta > UTC_TIMESTAMP())",
        "ORDER BY c.id DESC",
      ],
      porQue: "El WHERE junta las condiciones de «vigente» con AND: activo, ya empezó, y no tiene fin o todavía no termina. Los paréntesis hacen que el OR se evalúe primero.",
    },
  ],

  devuelve: [
    {
      id: "vigentes",
      pregunta: "Hoy es 25/11/2026. ¿Qué cupones devuelve la vista pública?",
      tablas: [cupones],
      sql: "SELECT c.codigo\nFROM cupon AS c\nWHERE c.estado = 'activo'\n  AND c.vigente_desde <= UTC_TIMESTAMP()\n  AND (c.vigente_hasta IS NULL OR c.vigente_hasta > UTC_TIMESTAMP())\nORDER BY c.id DESC;",
      opciones: [
        { columnas: ["codigo"], filas: [["NOVIEMBRE20"], ["BIENVENIDA10"]] },
        { columnas: ["codigo"], filas: [["BIENVENIDA10"], ["NOVIEMBRE20"]] },
        { columnas: ["codigo"], filas: [["PRUEBA50"], ["NOVIEMBRE20"], ["BIENVENIDA10"]] },
      ],
      correcta: 0,
      porQue: "VERANO15 ya venció, NAVIDAD25 todavía no empieza y PRUEBA50 está inactivo. ORDER BY c.id DESC pone primero el id 2.",
    },
  ],

  reglas: [
    {
      id: "vigencia",
      texto: "Un cupón está vigente cuando su estado es activo, su fecha de inicio ya se alcanzó y su fecha final es nula o todavía no se alcanzó.",
      fuente: "Regla 6",
      va: "vista",
      porQue: "Una vista escribe la condición una sola vez, dentro de la base. La página pública solo hace SELECT * FROM cupon_vigente.",
      pista: "Varias páginas necesitan la misma lista ya filtrada.",
      tambien: {
        aplicacion: "Es lo que hace el proyecto: la condición está en src/db.js (currentCondition) y se usa en el SELECT y en el WHERE. Funciona; una vista la deja en un solo lugar, dentro de la base.",
        funcion: "También: una función es_vigente(estado, desde, hasta, fecha), como en la sesión 29, sirve dentro de un WHERE.",
      },
      sqlOrigen: "sesión 31",
      sql: "CREATE VIEW cupon_vigente AS\nSELECT codigo, descripcion, vigente_hasta\nFROM cupon\nWHERE estado = 'activo'\n    AND vigente_desde <= NOW()\n    AND (vigente_hasta IS NULL\n        OR vigente_hasta > NOW());",
    },
    {
      id: "codigo",
      texto: "Un código de cupón no puede repetirse, sin distinguir mayúsculas de minúsculas.",
      fuente: "Regla 2",
      va: "restriccion",
      porQue: "UNIQUE en codigo. La intercalación por defecto de MySQL no distingue mayúsculas: «VERANO10» y «verano10» chocan.",
      pista: "Compara una fila con las demás de la tabla, por una columna.",
      tambien: {
        aplicacion: "El proyecto además compara en src/db.js antes del INSERT, para dar un mensaje claro. Pero quien lo garantiza es el UNIQUE.",
      },
      sqlOrigen: "proyecto",
      sql: "codigo VARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(codigo) <> '')",
    },
    {
      id: "porcentaje",
      texto: "Cuando el tipo es porcentaje, no puede superar 100.",
      fuente: "Regla 4",
      va: "restriccion",
      porQue: "Un CHECK puede mirar dos columnas de la misma fila: si es porcentaje, el valor no pasa de 100.",
      pista: "Solo hace falta mirar la misma fila.",
      sqlOrigen: "proyecto",
      sql: "CHECK (tipo_descuento <> 'porcentaje' OR valor_descuento <= 100)",
    },
    {
      id: "hash",
      texto: "La contraseña se guarda con hash y sal, nunca en texto claro.",
      fuente: "Regla 8",
      va: "aplicacion",
      porQue: "src/auth.js calcula el hash con scrypt y una sal aleatoria antes de guardarla. La base solo guarda el resultado.",
      pista: "¿Quién tiene la contraseña escrita antes de guardarla?",
      sqlOrigen: "proyecto",
      sql: "// src/auth.js\nimport { randomBytes, randomUUID, scryptSync, timingSafeEqual } from \"node:crypto\";",
    },
  ],
};
