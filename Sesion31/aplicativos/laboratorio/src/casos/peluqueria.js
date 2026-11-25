// Proyecto 48: sistema de administración de peluquerías caninas (MySQL).
// Las consultas son las de 2_sistema_implementado_mysql/src/db.js; servicios
// y empleados son los iniciales de _specs/modelo_fisico_mysql.sql. Resultados
// copiados de una ejecución real en MySQL 8.4.

export default {
  id: "peluqueria",
  numero: 48,
  nombre: "Peluquería canina",
  pantalla: {
    titulo: "Peluquería canina · citas",
    subtitulo: "26/11/2026",
    columnas: ["Hora", "Mascota", "Servicio", "Empleado", "Estado"],
    filas: [
      ["10:00", "Toby", "Baño e higiene", "Ana Torres", "programada"],
      ["11:30", "Luna", "Baño e higiene", "Ana Torres", "cancelada"],
    ],
    botones: ["Agendar cita", "Completar", "Cancelar", "Registrar pago"],
  },

  acciones: [
    {
      id: "agendar",
      boton: "Agendar cita",
      descripcion: "Marta Salas (987654321) agenda un corte de pelo para su perro Toby con Bruno Díaz, a las 15:00.",
      transaccion: true,
      porQueTransaccion: "Si la cita falla (por ejemplo, el empleado ya tiene una cita a esa hora, Regla 6), no deben quedar el cliente ni la mascota a medias.",
      pasos: [
        {
          id: "buscar-cliente",
          sql: "SELECT id FROM cliente WHERE telefono = ? FOR UPDATE",
          nota: "Busca al cliente por su teléfono (Regla 2) y lo bloquea.",
        },
        {
          id: "crear-cliente",
          sql: "INSERT INTO cliente (nombre, telefono) VALUES (?, ?)",
          nota: "Crea al cliente, solo si no existía.",
          despuesDe: ["buscar-cliente"],
          orden: "Primero se busca: si el teléfono ya existe, se reutiliza el cliente.",
        },
        {
          id: "buscar-mascota",
          sql: "SELECT id FROM mascota\nWHERE cliente_id = ? AND LOWER(nombre) = LOWER(?)",
          nota: "Busca la mascota de ese cliente, sin distinguir mayúsculas (Regla 3).",
          despuesDe: ["crear-cliente"],
          orden: "Necesita el id del cliente: va después de buscarlo o crearlo.",
        },
        {
          id: "crear-mascota",
          sql: "INSERT INTO mascota (cliente_id, nombre, especie, raza)\nVALUES (?, ?, ?, ?)",
          nota: "Crea la mascota, solo si no existía.",
          despuesDe: ["buscar-mascota"],
          orden: "Primero se busca: si la mascota ya existe, se reutiliza.",
        },
        {
          id: "cita",
          sql: "INSERT INTO cita (mascota_id, servicio_id, empleado_id, fecha_hora)\nSELECT ?, s.id, e.id, ?\nFROM servicio AS s, empleado AS e\nWHERE s.id = ? AND e.id = ?",
          nota: "Guarda la cita, solo si el servicio y el empleado existen.",
          despuesDe: ["crear-mascota"],
          orden: "La cita necesita el id de la mascota.",
        },
      ],
      sobran: [
        {
          id: "programar",
          sql: "UPDATE cita SET estado = 'programada' WHERE id = ?",
          porQue: "Una cita nueva ya es programada: la columna estado tiene DEFAULT 'programada'.",
        },
        {
          id: "pago",
          sql: "INSERT INTO pago (monto, metodo, cita_id) VALUES (?, ?, ?)",
          porQue: "El pago va después, cuando la cita está completada (Regla 7).",
        },
      ],
      despues: {
        tablas: [{
          nombre: "cita (después)",
          columnas: ["id", "mascota_id", "servicio_id", "empleado_id", "fecha_hora", "estado"],
          filas: [
            [1, 1, 1, 1, "2026-11-26 10:00:00", "programada"],
            [2, 2, 1, 1, "2026-11-26 11:30:00", "cancelada"],
            [3, 1, 2, 2, "2026-11-26 15:00:00", "programada"],
          ],
          resaltar: [2],
        }],
        nota: "Marta y Toby ya existían: los dos SELECT los encontraron y los INSERT de cliente y mascota no hicieron falta.",
      },
    },
    {
      id: "completar",
      boton: "Completar",
      descripcion: "El encargado marca como completada la cita de Toby de las 10:00 (cita 1).",
      transaccion: false,
      porQueTransaccion: "Es un solo UPDATE: una sola instrucción ya es todo o nada.",
      pasos: [
        {
          id: "cambiar",
          sql: "UPDATE cita SET estado = ?\nWHERE id = ? AND estado = 'programada'",
          nota: "Cambia el estado solo si la cita sigue programada (Regla 5).",
        },
        {
          id: "revisar",
          app: "Si cambió 0 filas, responde «Cita no programada».",
          nota: "Avisa cuando la cita no estaba programada.",
          despuesDe: ["cambiar"],
          orden: "Para saber cuántas filas cambió, primero hay que ejecutar el UPDATE.",
        },
      ],
      sobran: [
        {
          id: "leer",
          sql: "SELECT estado FROM cita WHERE id = ?",
          porQue: "No hace falta leer antes: el WHERE estado = 'programada' revisa la regla en el mismo UPDATE.",
        },
        {
          id: "borrar",
          sql: "DELETE FROM cita WHERE id = ?",
          porQue: "Completar o cancelar no borra la cita: cambia su estado.",
        },
      ],
      despues: {
        tablas: [{
          nombre: "cita (después)",
          columnas: ["id", "estado"],
          filas: [[1, "completada"], [2, "cancelada"]],
          resaltar: [0],
        }],
        nota: "MySQL respondió «1 row(s) affected»: la cita estaba programada.",
      },
    },
  ],

  ordenar: [
    {
      id: "cita",
      titulo: "Guardar la cita",
      contexto: "El último paso de «Agendar cita» (scheduleAppointment en src/db.js): inserta la cita solo si el servicio y el empleado existen.",
      piezas: [
        "INSERT INTO cita (mascota_id, servicio_id, empleado_id, fecha_hora)",
        "SELECT ?, s.id, e.id, ?",
        "FROM servicio AS s, empleado AS e",
        "WHERE s.id = ? AND e.id = ?",
      ],
      porQue: "INSERT … SELECT inserta lo que devuelve el SELECT. Si el servicio o el empleado no existe, el SELECT no devuelve filas y no se inserta nada.",
    },
    {
      id: "pago",
      titulo: "Leer la cita antes de pagar",
      contexto: "«Registrar pago» (savePayment en src/db.js) trae el estado de la cita y el precio de su servicio.",
      piezas: [
        "SELECT ci.estado, se.precio",
        "FROM cita AS ci",
        "JOIN servicio AS se ON se.id = ci.servicio_id",
        "WHERE ci.id = ?",
      ],
      porQue: "El precio está en servicio, no en cita: el JOIN las une por servicio_id.",
    },
  ],

  devuelve: [
    {
      id: "cancelada",
      pregunta: "La cita 2 está cancelada. ¿Qué responde MySQL Workbench?",
      tablas: [{ nombre: "cita", columnas: ["id", "estado"], filas: [[1, "programada"], [2, "cancelada"]] }],
      sql: "UPDATE cita SET estado = 'completada'\nWHERE id = 2 AND estado = 'programada';",
      opciones: [
        { mensaje: "1 row(s) affected Rows matched: 1  Changed: 1  Warnings: 0" },
        { mensaje: "0 row(s) affected Rows matched: 0  Changed: 0  Warnings: 0" },
        { mensaje: "Error Code: 1644. Solo una cita programada puede completarse o cancelarse." },
      ],
      correcta: 1,
      porQue: "No es un error: el WHERE no encuentra la cita, porque no está programada, y cambia 0 filas. La aplicación ve el 0 y responde «Cita no programada». El error 1644 saldría con el trigger de la sesión 31, que el proyecto no tiene.",
    },
  ],

  reglas: [
    {
      id: "transicion",
      texto: "Solo una cita programada puede completarse o cancelarse.",
      fuente: "Regla 5",
      va: "trigger",
      trigger: { momento: "BEFORE", eventos: ["UPDATE"] },
      porQue: "Un trigger BEFORE UPDATE compara OLD.estado con NEW.estado y detiene el cambio con SIGNAL, venga de donde venga.",
      pista: "Hay que comparar el estado de antes con el de después.",
      tambien: {
        aplicacion: "Es lo que hace el proyecto: el UPDATE lleva AND estado = 'programada' en el WHERE. Funciona si todo pasa por la aplicación.",
      },
      sqlOrigen: "sesión 31",
      sql: "DELIMITER //\nCREATE TRIGGER cita_cambio_de_estado\nBEFORE UPDATE ON cita\nFOR EACH ROW\nBEGIN\n    IF OLD.estado <> 'programada'\n        AND NEW.estado <> OLD.estado THEN\n        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT =\n        'Solo una cita programada puede completarse o cancelarse.';\n    END IF;\nEND //\nDELIMITER ;",
    },
    {
      id: "horario",
      texto: "No puede haber dos citas para el mismo empleado en la misma fecha y hora.",
      fuente: "Regla 6",
      va: "restriccion",
      porQue: "Un UNIQUE de dos columnas: la pareja empleado + fecha y hora no se repite.",
      pista: "Una combinación de columnas que no se repite.",
      sqlOrigen: "proyecto",
      sql: "UNIQUE (empleado_id, fecha_hora)",
    },
    {
      id: "eliminar",
      texto: "Un servicio o un empleado solo puede eliminarse si ninguna cita lo referencia.",
      fuente: "Regla 12",
      va: "restriccion",
      porQue: "Las llaves foráneas de cita: MySQL rechaza el DELETE (error 1451) y la aplicación lo traduce a un mensaje.",
      pista: "Otra tabla apunta a esta fila.",
      sqlOrigen: "proyecto",
      sql: "FOREIGN KEY (servicio_id) REFERENCES servicio (id),\nFOREIGN KEY (empleado_id) REFERENCES empleado (id)",
    },
    {
      id: "telefono",
      texto: "El teléfono identifica y permite reutilizar un cliente cuando se proporciona.",
      fuente: "Regla 2",
      va: "restriccion",
      porQue: "UNIQUE en cliente.telefono: no hay dos clientes con el mismo teléfono. Reutilizarlo lo hace la aplicación, que lo busca antes de crear al cliente.",
      pista: "Una columna que no se repite.",
      tambien: {
        aplicacion: "Reutilizarlo sí lo hace la aplicación: busca el teléfono antes de crear al cliente (el flujo de «Agendar cita»). Pero que no se repita lo garantiza el UNIQUE.",
      },
      sqlOrigen: "proyecto",
      sql: "telefono VARCHAR(255) UNIQUE",
    },
  ],
};
