// Proyecto 13: agenda de contactos con trigger (MySQL).
// Las consultas son las de 2_sistema_implementado/src/db.js; los datos son
// los iniciales de _specs/modelo_fisico.sql. Resultados y errores copiados
// de una ejecución real en MySQL 8.4.

const contactoGrupo = {
  nombre: "contacto_grupo",
  columnas: ["contacto_id", "grupo_id", "rol"],
  filas: [
    [1, 1, "prima"],
    [1, 2, "compañera"],
    [2, 2, "jefe"],
    [3, 3, null],
  ],
};

export default {
  id: "agenda",
  numero: 13,
  nombre: "Agenda de contactos",
  pantalla: {
    titulo: "Agenda de contactos",
    subtitulo: "3 contactos · 3 grupos",
    columnas: ["", "Nombre", "Teléfono", "Grupos"],
    filas: [
      ["★", "Ana Torres", "987654321", "Familia (prima), Trabajo (compañera)"],
      ["", "Carla Díaz", "—", "Amigos"],
      ["", "Luis Ramos", "912345678", "Trabajo (jefe)"],
    ],
    botones: ["Nuevo contacto", "Eliminar contacto", "Grupos"],
  },

  acciones: [
    {
      id: "eliminar",
      boton: "Eliminar contacto",
      descripcion: "Se elimina a Ana Torres (id 1), que está en Familia y en Trabajo.",
      transaccion: true,
      porQueTransaccion: "Son dos DELETE. Si el segundo falla, el primero no debe quedar: se aplican los dos o ninguno.",
      pasos: [
        {
          id: "pertenencias",
          sql: "DELETE FROM contacto_grupo WHERE contacto_id = ?",
          nota: "Saca al contacto de sus grupos (Regla 6).",
        },
        {
          id: "contacto",
          sql: "DELETE FROM contacto WHERE id = ?",
          nota: "Borra el contacto.",
          despuesDe: ["pertenencias"],
          orden: "contacto_grupo apunta a contacto con una llave foránea. Si primero se borra el contacto, MySQL lo rechaza:",
          error: "Error Code: 1451. Cannot delete or update a parent row: a foreign key constraint fails (`agenda_contactos`.`contacto_grupo`, CONSTRAINT `contacto_grupo_ibfk_1` FOREIGN KEY (`contacto_id`) REFERENCES `contacto` (`id`))",
        },
      ],
      sobran: [
        {
          id: "grupos",
          sql: "DELETE FROM grupo WHERE id = ?",
          porQue: "Los grupos siguen en la agenda: solo se borran las pertenencias del contacto.",
        },
        {
          id: "nulo",
          sql: "UPDATE contacto_grupo SET contacto_id = NULL\nWHERE contacto_id = ?",
          porQue: "contacto_id es NOT NULL y parte de la llave primaria: la fila no puede quedar sin contacto. Regla 6: ninguna pertenencia queda apuntando a un contacto que no existe.",
        },
      ],
      despues: {
        tablas: [
          { ...contactoGrupo, nombre: "contacto_grupo (antes)", resaltar: [0, 1] },
          { ...contactoGrupo, nombre: "contacto_grupo (después)", filas: contactoGrupo.filas.slice(2) },
          {
            nombre: "contacto (después)",
            columnas: ["id", "nombre"],
            filas: [[2, "Luis Ramos"], [3, "Carla Díaz"]],
          },
        ],
        nota: "Las dos pertenencias de Ana se borraron primero; después, Ana.",
      },
    },
  ],

  ordenar: [
    {
      id: "grupos",
      titulo: "Lista de grupos",
      contexto: "La pantalla «Grupos» muestra cada grupo con cuántos contactos tiene (listGrupos en src/db.js).",
      piezas: [
        "SELECT g.id, g.nombre, g.descripcion, g.color, COUNT(cg.contacto_id) AS contactos",
        "FROM grupo g",
        "LEFT JOIN contacto_grupo cg ON cg.grupo_id = g.id",
        "GROUP BY g.id",
        "ORDER BY g.nombre",
      ],
      porQue: "El JOIN va justo después del FROM: une cada grupo con sus pertenencias. Luego se agrupa por grupo para contar, y al final se ordena.",
    },
  ],

  devuelve: [
    {
      id: "vecinos",
      pregunta: "Se crea el grupo Vecinos, sin contactos. ¿Qué devuelve la lista de grupos? (versión corta de listGrupos: solo nombre y contactos)",
      tablas: [
        {
          nombre: "grupo",
          columnas: ["id", "nombre"],
          filas: [[1, "Familia"], [2, "Trabajo"], [3, "Amigos"], [4, "Vecinos"]],
        },
        contactoGrupo,
      ],
      sql: "SELECT g.nombre, COUNT(cg.contacto_id) AS contactos\nFROM grupo g LEFT JOIN contacto_grupo cg ON cg.grupo_id = g.id\nGROUP BY g.id ORDER BY g.nombre;",
      opciones: [
        {
          columnas: ["nombre", "contactos"],
          filas: [["Amigos", 1], ["Familia", 1], ["Trabajo", 2], ["Vecinos", 1]],
        },
        {
          columnas: ["nombre", "contactos"],
          filas: [["Amigos", 1], ["Familia", 1], ["Trabajo", 2]],
        },
        {
          columnas: ["nombre", "contactos"],
          filas: [["Amigos", 1], ["Familia", 1], ["Trabajo", 2], ["Vecinos", 0]],
        },
      ],
      correcta: 2,
      porQue: "LEFT JOIN conserva a Vecinos aunque no tenga contactos: su contacto_id llega como NULL, y COUNT(cg.contacto_id) no cuenta los NULL. Con JOIN, Vecinos no saldría; con COUNT(*), saldría con 1.",
    },
  ],

  reglas: [
    {
      id: "fecha",
      texto: "[La fecha de registro] nunca es posterior al día de hoy.",
      fuente: "Regla 3",
      va: "trigger",
      trigger: { momento: "BEFORE", eventos: ["INSERT", "UPDATE"] },
      porQue: "Un CHECK no acepta la fecha de hoy (MySQL da el error 3814). Por eso el proyecto usa dos triggers BEFORE: uno al registrar (INSERT) y otro al corregir (UPDATE).",
      pista: "Parece un CHECK, pero compara con la fecha de hoy, que cambia cada día.",
      sqlOrigen: "proyecto",
      sql: "CREATE TRIGGER contacto_fecha_no_futura_al_registrar\nBEFORE INSERT ON contacto\nFOR EACH ROW\nBEGIN\n    IF NEW.fecha_registro > DATE(UTC_TIMESTAMP() - INTERVAL 5 HOUR) THEN\n        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La fecha de registro no puede ser futura.';\n    END IF;\nEND //\n\n-- y otro igual, BEFORE UPDATE: contacto_fecha_no_futura_al_corregir",
    },
    {
      id: "correo",
      texto: "No hay dos contactos con el mismo correo.",
      fuente: "Regla 1",
      va: "restriccion",
      porQue: "UNIQUE en la columna correo: la base rechaza el segundo y la aplicación lo traduce a «Ya hay un contacto con ese correo.».",
      pista: "Compara una fila con las demás de la misma tabla, por una columna.",
      sqlOrigen: "proyecto",
      sql: "correo VARCHAR(255) UNIQUE",
    },
    {
      id: "gris",
      texto: "Un grupo nuevo es gris si no se elige otro.",
      fuente: "Regla 4",
      va: "restriccion",
      porQue: "DEFAULT 'gris': si el INSERT no trae color, la base lo pone.",
      pista: "Es el valor que toma una columna cuando no se manda.",
      sqlOrigen: "proyecto",
      sql: "color VARCHAR(20) DEFAULT 'gris' CHECK (color IN ('rojo', 'verde', 'azul', 'gris'))",
    },
    {
      id: "eliminar",
      texto: "Al eliminar un contacto, se borran también sus pertenencias a grupos.",
      fuente: "Regla 6",
      va: "aplicacion",
      porQue: "El proyecto lo hace en src/db.js (eliminarContacto): una transacción con dos DELETE. Es el flujo de «Arma el flujo».",
      pista: "Son dos borrados en tablas distintas, en un orden.",
      tambien: {
        restriccion: "También: con ON DELETE CASCADE en la llave foránea, la base borraría las pertenencias sola. El proyecto no usa CASCADE: lo hace en el código.",
        procedimiento: "También: un procedimiento podría hacer los dos DELETE dentro de la base, y la aplicación solo llamaría CALL.",
      },
      sqlOrigen: "proyecto",
      sql: "DELETE FROM contacto_grupo WHERE contacto_id = ?;\nDELETE FROM contacto WHERE id = ?;",
    },
  ],
};
