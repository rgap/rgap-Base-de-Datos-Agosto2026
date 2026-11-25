// Proyecto 38: sistema de objetos perdidos (MySQL).
// Las consultas son las de 2_sistema_implementado_mysql/src/db.js. Resultados
// y errores copiados de una ejecución real en MySQL 8.4.

export default {
  id: "objetos-perdidos",
  numero: 38,
  nombre: "Objetos perdidos",
  pantalla: {
    titulo: "Objetos perdidos · panel del encargado",
    subtitulo: "1 reclamo pendiente",
    columnas: ["Objeto", "Ubicación", "Estado", "Reclamo"],
    filas: [
      ["Casaca de jean", "Biblioteca", "disponible", "—"],
      ["Mochila con cierre roto", "Biblioteca", "disponible", "pendiente: Rosa Quispe"],
      ["Llavero de la UTP", "Biblioteca", "devuelto", "—"],
    ],
    botones: ["Registrar hallazgo", "Aprobar reclamo", "Rechazar reclamo"],
  },

  acciones: [
    {
      id: "hallazgo",
      boton: "Registrar hallazgo",
      descripcion: "El encargado registra un paraguas negro encontrado en la «cafetería», entregado por Pedro Huamán.",
      transaccion: true,
      porQueTransaccion: "Son varios INSERT: un objeto sin su hallazgo, o un hallazgo a medias, no debe quedar (Regla 2). Todo o nada.",
      pasos: [
        {
          id: "buscar-ubicacion",
          sql: "SELECT id FROM ubicacion\nWHERE LOWER(nombre) = LOWER(?) FOR UPDATE",
          nota: "Busca la ubicación sin distinguir mayúsculas («Cafetería» encuentra «cafetería») y la bloquea hasta el COMMIT.",
        },
        {
          id: "crear-ubicacion",
          sql: "INSERT INTO ubicacion (nombre) VALUES (?)",
          nota: "Crea la ubicación, solo si no existía.",
          despuesDe: ["buscar-ubicacion"],
          orden: "Primero se busca: si la ubicación ya existe, se reutiliza y no se crea otra.",
        },
        {
          id: "persona",
          sql: "INSERT INTO persona (nombre, celular) VALUES (?, ?)",
          nota: "Guarda a quien lo entregó, si dejó sus datos.",
        },
        {
          id: "objeto",
          sql: "INSERT INTO objeto (descripcion, categoria, color, estado)\nVALUES (?, ?, ?, 'disponible')",
          nota: "Guarda el objeto, disponible.",
        },
        {
          id: "hallazgo",
          sql: "INSERT INTO hallazgo (fecha_hora, objeto_id, ubicacion_id, persona_id)\nVALUES (?, ?, ?, ?)",
          nota: "Une el objeto con dónde, cuándo y quién lo encontró.",
          despuesDe: ["crear-ubicacion", "persona", "objeto"],
          orden: "El hallazgo necesita los id del objeto, de la ubicación y de la persona: esas filas van antes. Con un objeto_id que todavía no existe, MySQL lo rechaza:",
          error: "Error Code: 1452. Cannot add or update a child row: a foreign key constraint fails (`objetos_perdidos`.`hallazgo`, CONSTRAINT `hallazgo_ibfk_1` FOREIGN KEY (`objeto_id`) REFERENCES `objeto` (`id`))",
        },
      ],
      sobran: [
        {
          id: "devolver",
          sql: "UPDATE objeto SET estado = 'devuelto' WHERE id = ?",
          porQue: "Eso pasa al aprobar un reclamo, no al registrar un hallazgo.",
        },
        {
          id: "reclamo",
          sql: "INSERT INTO reclamo (persona_id, objeto_id, evidencia, estado, fecha_envio)\nVALUES (?, ?, ?, 'pendiente', ?)",
          porQue: "El reclamo lo envía después el dueño, desde la vista pública.",
        },
      ],
      despues: {
        tablas: [
          {
            nombre: "objeto (después)",
            columnas: ["id", "descripcion", "estado"],
            filas: [
              [1, "Mochila con cierre roto", "disponible"],
              [2, "Casaca de jean", "disponible"],
              [3, "Llavero de la UTP", "devuelto"],
              [4, "Paraguas negro", "disponible"],
            ],
            resaltar: [3],
          },
          {
            nombre: "hallazgo (después)",
            columnas: ["objeto_id", "ubicacion_id", "persona_id"],
            filas: [[1, 1, null], [2, 1, null], [3, 1, null], [4, 2, 4]],
            resaltar: [3],
          },
        ],
        nota: "La cafetería no existía: se creó como ubicación 2. Pedro quedó como persona 4.",
      },
    },
    {
      id: "aprobar",
      boton: "Aprobar reclamo",
      descripcion: "El encargado aprueba el reclamo de Rosa Quispe por la mochila con cierre roto.",
      transaccion: true,
      porQueTransaccion: "Son dos UPDATE en tablas distintas: el objeto devuelto y el reclamo aprobado van juntos (Regla 7).",
      pasos: [
        {
          id: "reclamo",
          sql: "SELECT objeto_id, estado FROM reclamo\nWHERE persona_id = ? AND objeto_id = ? FOR UPDATE",
          nota: "Revisa que el reclamo siga pendiente (Regla 8) y lo bloquea.",
        },
        {
          id: "objeto",
          sql: "SELECT estado FROM objeto WHERE id = ? FOR UPDATE",
          nota: "Revisa que el objeto siga disponible (Regla 6) y lo bloquea.",
          despuesDe: ["reclamo"],
          orden: "Primero se confirma el reclamo: de él sale el objeto que hay que revisar.",
        },
        {
          id: "devolver",
          sql: "UPDATE objeto SET estado = 'devuelto' WHERE id = ?",
          nota: "El objeto pasa a devuelto.",
          despuesDe: ["objeto"],
          orden: "Primero se comprueba todo; después se cambia.",
        },
        {
          id: "resolver",
          sql: "UPDATE reclamo SET estado = ?, fecha_resolucion = ?\nWHERE persona_id = ? AND objeto_id = ?",
          nota: "El reclamo queda aprobado, con su fecha.",
          despuesDe: ["objeto"],
          orden: "Primero se comprueba todo; después se cambia.",
        },
      ],
      sobran: [
        {
          id: "borrar-reclamo",
          sql: "DELETE FROM reclamo\nWHERE persona_id = ? AND objeto_id = ?",
          porQue: "El reclamo no se borra: queda aprobado, y un reclamo resuelto no puede resolverse otra vez (Regla 8).",
        },
        {
          id: "disponible",
          sql: "UPDATE objeto SET estado = 'disponible' WHERE id = ?",
          porQue: "Aprobar no deja el objeto disponible. Y al rechazar, el objeto ya estaba disponible: no se toca (Regla 7).",
        },
      ],
      despues: {
        tablas: [
          {
            nombre: "objeto (después)",
            columnas: ["id", "descripcion", "estado"],
            filas: [
              [1, "Mochila con cierre roto", "devuelto"],
              [2, "Casaca de jean", "disponible"],
              [3, "Llavero de la UTP", "devuelto"],
            ],
            resaltar: [0],
          },
          {
            nombre: "reclamo (después)",
            columnas: ["persona_id", "objeto_id", "estado"],
            filas: [[1, 1, "aprobado"], [2, 2, "rechazado"], [3, 3, "aprobado"]],
            resaltar: [0],
          },
        ],
        nota: "La mochila sale de la vista pública: ya no está disponible.",
      },
    },
  ],

  ordenar: [
    {
      id: "disponibles",
      titulo: "Objetos disponibles (vista pública)",
      contexto: "La página pública lista los objetos disponibles y avisa si ya tienen un reclamo en revisión (getAvailableObjects en src/db.js).",
      piezas: [
        "SELECT o.id, o.descripcion, o.categoria, o.color,\n       u.nombre AS ubicacion, h.fecha_hora,",
        "EXISTS (\n  SELECT 1 FROM reclamo AS r\n  WHERE r.objeto_id = o.id AND r.estado = 'pendiente'\n) AS tiene_reclamo",
        "FROM objeto AS o",
        "JOIN hallazgo AS h ON h.objeto_id = o.id",
        "JOIN ubicacion AS u ON u.id = h.ubicacion_id",
        "WHERE o.estado = 'disponible'",
        "ORDER BY h.fecha_hora DESC, o.id DESC",
      ],
      porQue: "EXISTS (…) es una columna más del SELECT: vale 1 si hay un reclamo pendiente. Los JOIN van en orden: el segundo usa h, que trae el primero.",
    },
  ],

  devuelve: [
    {
      id: "exists",
      pregunta: "La casaca tuvo un reclamo, pero fue rechazado. ¿Qué devuelve? (versión corta de getAvailableObjects)",
      tablas: [
        {
          nombre: "objeto",
          columnas: ["id", "descripcion", "estado"],
          filas: [
            [1, "Mochila con cierre roto", "disponible"],
            [2, "Casaca de jean", "disponible"],
            [3, "Llavero de la UTP", "devuelto"],
          ],
        },
        {
          nombre: "reclamo",
          columnas: ["persona_id", "objeto_id", "estado"],
          filas: [[1, 1, "pendiente"], [2, 2, "rechazado"], [3, 3, "aprobado"]],
        },
      ],
      sql: "SELECT o.descripcion,\n       EXISTS (\n         SELECT 1 FROM reclamo AS r\n         WHERE r.objeto_id = o.id AND r.estado = 'pendiente'\n       ) AS tiene_reclamo\nFROM objeto AS o\nWHERE o.estado = 'disponible'\nORDER BY o.id;",
      opciones: [
        {
          columnas: ["descripcion", "tiene_reclamo"],
          filas: [["Mochila con cierre roto", 1], ["Casaca de jean", 1]],
        },
        {
          columnas: ["descripcion", "tiene_reclamo"],
          filas: [["Mochila con cierre roto", 1], ["Casaca de jean", 0], ["Llavero de la UTP", 0]],
        },
        {
          columnas: ["descripcion", "tiene_reclamo"],
          filas: [["Mochila con cierre roto", 1], ["Casaca de jean", 0]],
        },
      ],
      correcta: 2,
      porQue: "El WHERE deja fuera el llavero, que está devuelto. La casaca tuvo un reclamo, pero rechazado: EXISTS solo busca reclamos pendientes, así que da 0.",
    },
  ],

  reglas: [
    {
      id: "vista-publica",
      texto: "Debe ofrecerse una página accesible sin autenticación que muestre los objetos disponibles con los datos que ayudan a reconocerlos, sin exponer quién los entregó.",
      fuente: "Requisito 2",
      va: "vista",
      porQue: "Una vista (objeto_disponible) elige las columnas que se pueden ver y deja fuera persona_id. Además, se le puede dar permiso a la vista y no a la tabla.",
      pista: "Es una consulta que esconde columnas.",
      tambien: {
        aplicacion: "Es lo que hace el proyecto: el SELECT de getAvailableObjects no pide quién lo entregó. Funciona; una vista además permite dar permiso solo a ella.",
      },
      sqlOrigen: "sesión 31",
      sql: "CREATE VIEW objeto_disponible AS\nSELECT o.id, o.descripcion, o.categoria,\n     o.color, h.fecha_hora\nFROM objeto o\nJOIN hallazgo h ON h.objeto_id = o.id\nWHERE o.estado = 'disponible';",
    },
    {
      id: "aprobar",
      texto: "Al aprobar un reclamo, el objeto pasa a devuelto; al rechazarlo, permanece disponible.",
      fuente: "Regla 7",
      va: "procedimiento",
      porQue: "Son dos cambios en dos tablas, juntos y con comprobaciones: un procedimiento los hace en una transacción y la aplicación solo llama CALL resolver_reclamo(…).",
      pista: "Es una acción que pide un botón y cambia dos tablas.",
      tambien: {
        aplicacion: "Es lo que hace el proyecto: una transacción en src/db.js (resolveClaim), el flujo de «Aprobar reclamo». También vale.",
      },
      sqlOrigen: "sesión 31",
      sql: "CREATE PROCEDURE resolver_reclamo(IN p_persona_id INT,\n    IN p_objeto_id INT, IN p_aprobado BOOLEAN)\nBEGIN\n    -- EXIT HANDLER con ROLLBACK, como en la sesión 30\n    START TRANSACTION;\n    UPDATE reclamo\n    SET estado = CASE WHEN p_aprobado THEN 'aprobado'\n                ELSE 'rechazado' END,\n         fecha_resolucion = NOW()\n    WHERE persona_id = p_persona_id\n        AND objeto_id = p_objeto_id AND estado = 'pendiente';\n    IF ROW_COUNT() = 0 THEN\n        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT =\n            'El reclamo no existe o ya fue resuelto.';\n    END IF;\n    IF p_aprobado THEN\n        UPDATE objeto SET estado = 'devuelto'\n        WHERE id = p_objeto_id;\n    END IF;\n    COMMIT;\nEND //",
    },
    {
      id: "hallazgo-unico",
      texto: "Cada objeto debe estar asociado con un único hallazgo.",
      fuente: "Regla 2",
      va: "restriccion",
      porQue: "UNIQUE en hallazgo.objeto_id: un objeto no puede aparecer en dos hallazgos.",
      pista: "Una columna que no se repite.",
      sqlOrigen: "proyecto",
      sql: "objeto_id INT NOT NULL UNIQUE",
    },
    {
      id: "reclamo-pendiente",
      texto: "Solo puede existir un reclamo pendiente por objeto.",
      fuente: "Regla 3",
      va: "aplicacion",
      porQue: "El proyecto lo revisa en src/db.js, dentro de la transacción de saveClaim. Un UNIQUE no sirve: un objeto puede tener varios reclamos rechazados, y solo el pendiente es único.",
      pista: "Ojo: puede haber varios reclamos del mismo objeto; solo uno pendiente.",
      tambien: {
        trigger: "También: un trigger BEFORE INSERT en reclamo podría revisarlo y detenerlo con SIGNAL, aunque el reclamo llegue por otro lado.",
      },
      sqlOrigen: "proyecto",
      sql: "SELECT 1 FROM reclamo WHERE objeto_id = ? AND estado = 'pendiente'",
    },
  ],
};
