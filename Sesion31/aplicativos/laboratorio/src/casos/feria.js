// Proyectos 56 y 57: venta de entradas con procedimiento almacenado, y con
// usuario y permisos (MySQL). Las consultas son las de
// 2_sistema_implementado/src/db.js; los permisos, los de 57/_specs. Resultados
// y errores copiados de una ejecución real en MySQL 8.4, conectado como app_feria.

export default {
  id: "feria",
  numero: "56 y 57",
  nombre: "Entradas de la feria",
  pantalla: {
    titulo: "Entrada Fogón 2026",
    subtitulo: "S/ 45.00 · quedan 500 entradas · venta abierta",
    columnas: ["Dato", "Valor"],
    filas: [
      ["DNI", "45678912"],
      ["Nombre", "María Flores"],
      ["Correo", "maria@correo.pe"],
    ],
    botones: ["Comprar", "Iniciar sesión (administración)"],
  },

  acciones: [
    {
      id: "comprar",
      boton: "Comprar",
      descripcion: "María Flores pagó su entrada. La aplicación registra la compra y le muestra el comprobante.",
      transaccion: false,
      porQueTransaccion: "La transacción ya está dentro del procedimiento (START TRANSACTION … COMMIT, Regla 6). La aplicación no abre otra: solo llama CALL.",
      pasos: [
        {
          id: "call",
          sql: "CALL comprar_entrada(?, ?, ?, ?,\n  @venta_id, @fecha_venta, @entrada, @precio)",
          nota: "Descuenta una entrada y guarda la venta, todo o nada. Deja el resultado en cuatro variables.",
        },
        {
          id: "leer-variables",
          sql: "SELECT @venta_id AS id,\n       CAST(@fecha_venta AS CHAR) AS fecha_venta,\n       CAST(@entrada AS CHAR) AS entrada,\n       CAST(@precio AS CHAR) AS precio",
          nota: "Lee las variables OUT, en la misma conexión, para armar el comprobante.",
          despuesDe: ["call"],
          orden: "Las variables @… tienen valor recién después del CALL.",
        },
      ],
      sobran: [
        {
          id: "descontar",
          sql: "UPDATE entrada SET disponibles = disponibles - 1\nWHERE id = 1",
          porQue: "Eso lo hace el procedimiento. Además, app_feria no tiene permiso: «Error Code: 1142. UPDATE command denied to user 'app_feria'@'localhost' for table 'entrada'».",
        },
        {
          id: "insertar",
          sql: "INSERT INTO venta (entrada_id, dni, nombre, correo, precio, referencia_pago)\nVALUES (1, ?, ?, ?, ?, ?)",
          porQue: "Eso lo hace el procedimiento. Además, app_feria no tiene permiso: «Error Code: 1142. INSERT command denied to user 'app_feria'@'localhost' for table 'venta'».",
        },
      ],
      despues: {
        tablas: [
          {
            nombre: "lo que devuelve el SELECT de las variables",
            columnas: ["id", "fecha_venta", "entrada", "precio"],
            filas: [[1, "2026-11-25 10:30:00", "Entrada Fogón 2026", "45.00"]],
          },
          { nombre: "entrada (después)", columnas: ["id", "disponibles"], filas: [[1, 499]], resaltar: [0] },
        ],
        nota: "Si María intenta comprar otra vez, el procedimiento hace ROLLBACK y MySQL responde: Error Code: 1062. Duplicate entry '45678912' for key 'venta.dni'.",
      },
    },
    {
      id: "login",
      boton: "Iniciar sesión (administración)",
      descripcion: "La organizadora escribe el usuario y la contraseña compartidos.",
      transaccion: false,
      porQueTransaccion: "Solo se lee: no cambia ninguna tabla.",
      pasos: [
        {
          id: "hash",
          app: "Calcula el SHA-256 de la contraseña escrita (src/auth.js).",
          nota: "La contraseña nunca viaja a la base en claro (Regla 9).",
        },
        {
          id: "funcion",
          sql: "SELECT credencial_valida(?, ?) AS valida",
          nota: "La base compara el usuario y el hash, y responde 1 o 0.",
          despuesDe: ["hash"],
          orden: "La función recibe el hash: primero hay que calcularlo.",
        },
        {
          id: "sesion",
          app: "Si valida es 1, crea la sesión (en memoria, con una cookie). Si es 0: «Usuario o contraseña incorrectos.»",
          nota: "Abre la sesión de administración.",
          despuesDe: ["funcion"],
          orden: "La sesión se abre solo después de saber que la credencial es válida.",
        },
      ],
      sobran: [
        {
          id: "leer-admin",
          sql: "SELECT usuario, contrasena FROM administrador\nWHERE usuario = ?",
          porQue: "app_feria no puede leer esa tabla: «Error Code: 1142. SELECT command denied to user 'app_feria'@'localhost' for table 'administrador'». Por eso existe la función.",
        },
        {
          id: "guardar-sesion",
          sql: "INSERT INTO sesion (token, vence) VALUES (?, ?)",
          porQue: "Las sesiones se guardan en memoria, no en la base. Esa tabla no existe.",
        },
      ],
      despues: {
        tablas: [{ nombre: "lo que devuelve la función", columnas: ["valida"], filas: [[1]] }],
        nota: "La aplicación nunca vio el hash guardado: solo recibió un 1.",
      },
    },
  ],

  ordenar: [
    {
      id: "entrada",
      titulo: "Datos de la página principal",
      contexto: "La página muestra la entrada, cuántas se vendieron y cuánto se recaudó (getEntrada en src/db.js).",
      piezas: [
        "SELECT e.nombre, e.descripcion, e.precio, e.disponibles, e.venta_activa,",
        "(SELECT COUNT(*) FROM venta) AS vendidas,",
        "(SELECT COALESCE(SUM(precio), 0) FROM venta) AS recaudado",
        "FROM entrada AS e",
        "WHERE e.id = 1",
      ],
      porQue: "Las dos subconsultas son columnas del SELECT: van antes del FROM, separadas por comas.",
    },
  ],

  devuelve: [
    {
      id: "sin-ventas",
      pregunta: "Todavía no hay ventas. ¿Qué devuelve? (versión corta de getEntrada)",
      tablas: [
        { nombre: "entrada", columnas: ["id", "nombre", "precio", "disponibles"], filas: [[1, "Entrada Fogón 2026", "45.00", 500]] },
        { nombre: "venta", columnas: ["id", "dni", "precio"], filas: [] },
      ],
      sql: "SELECT e.disponibles,\n       (SELECT COUNT(*) FROM venta) AS vendidas,\n       (SELECT COALESCE(SUM(precio), 0) FROM venta) AS recaudado\nFROM entrada AS e\nWHERE e.id = 1;",
      opciones: [
        { columnas: ["disponibles", "vendidas", "recaudado"], filas: [[500, null, null]] },
        { columnas: ["disponibles", "vendidas", "recaudado"], filas: [[500, 0, null]] },
        { columnas: ["disponibles", "vendidas", "recaudado"], filas: [[500, 0, "0.00"]] },
      ],
      correcta: 2,
      porQue: "COUNT(*) de una tabla vacía da 0. SUM de una tabla vacía da NULL; COALESCE lo cambia por 0. Sin COALESCE, recaudado saldría NULL.",
    },
  ],

  reglas: [
    {
      id: "atomica",
      texto: "Descontar la entrada disponible y guardar la compra se hace en una sola transacción: o se aplica todo o nada.",
      fuente: "Regla 6",
      va: "procedimiento",
      porQue: "comprar_entrada hace el UPDATE y el INSERT dentro de una transacción, con un EXIT HANDLER que hace ROLLBACK ante cualquier error. La aplicación solo llama CALL.",
      pista: "Es una acción de varios pasos que la aplicación pide con un botón.",
      tambien: {
        aplicacion: "También: una transacción en src/db.js. Pero en el proyecto 57 la aplicación no tiene permiso para escribir en las tablas: solo puede llamar al procedimiento.",
      },
      sqlOrigen: "proyecto",
      sql: "CREATE PROCEDURE comprar_entrada(...)\nBEGIN\n    DECLARE EXIT HANDLER FOR SQLEXCEPTION\n    BEGIN\n        ROLLBACK;\n        RESIGNAL;\n    END;\n\n    START TRANSACTION;\n    UPDATE entrada\n    SET disponibles = disponibles - 1\n    WHERE id = 1 AND disponibles > 0 AND venta_activa = 1;\n    IF ROW_COUNT() = 0 THEN\n        SIGNAL SQLSTATE '45000'\n            SET MESSAGE_TEXT = 'Venta cerrada o entradas agotadas.';\n    END IF;\n    -- … lee el precio y hace el INSERT INTO venta …\n    COMMIT;\nEND //",
    },
    {
      id: "dni",
      texto: "Un DNI no puede repetirse entre las compras.",
      fuente: "Regla 4",
      va: "restriccion",
      porQue: "UNIQUE en venta.dni: la segunda compra con el mismo DNI da el error 1062 y el procedimiento hace ROLLBACK.",
      pista: "Una columna que no se repite.",
      sqlOrigen: "proyecto",
      sql: "dni CHAR(8) NOT NULL UNIQUE CHECK (dni REGEXP '^[0-9]{8}$')",
    },
    {
      id: "precio",
      texto: "La compra guarda el precio vigente de la entrada al pagar.",
      fuente: "Regla 8",
      va: "procedimiento",
      porQue: "comprar_entrada lee el precio de entrada y lo copia en la venta, dentro de la misma transacción. Si después cambia el precio, la venta conserva el que pagó.",
      pista: "Se copia un dato de una tabla a otra en el momento de comprar.",
      tambien: {
        trigger: "También: un trigger BEFORE INSERT en venta podría copiar el precio de entrada en NEW.precio.",
      },
      sqlOrigen: "proyecto",
      sql: "SELECT nombre, precio\nINTO p_entrada, p_precio\nFROM entrada\nWHERE id = 1;\n\nINSERT INTO venta (entrada_id, dni, nombre, correo, precio, referencia_pago)\nVALUES (1, p_dni, TRIM(p_nombre), TRIM(p_correo), p_precio, TRIM(p_referencia_pago));",
    },
    {
      id: "permisos",
      texto: "[El usuario de la aplicación] no puede insertar, modificar ni borrar en ninguna tabla, ni leer administrador, ni crear objetos.",
      fuente: "Especificación técnica del proyecto 57",
      va: "permiso",
      porQue: "La aplicación se conecta como app_feria, que solo tiene SELECT en dos tablas y EXECUTE en las rutinas. Lo que no se le da, no lo puede hacer.",
      pista: "No es una regla sobre los datos, sino sobre quién puede hacer qué.",
      sqlOrigen: "proyecto",
      sql: "CREATE USER IF NOT EXISTS 'app_feria'@'localhost' IDENTIFIED BY 'app_feria';\nGRANT SELECT ON feria_entrada.entrada TO 'app_feria'@'localhost';\nGRANT SELECT ON feria_entrada.venta TO 'app_feria'@'localhost';\nGRANT EXECUTE ON PROCEDURE feria_entrada.comprar_entrada TO 'app_feria'@'localhost';\nGRANT EXECUTE ON PROCEDURE feria_entrada.configurar_entrada TO 'app_feria'@'localhost';\nGRANT EXECUTE ON FUNCTION feria_entrada.credencial_valida TO 'app_feria'@'localhost';",
    },
    {
      id: "credencial",
      texto: "La contraseña se guarda y se verifica mediante un hash, nunca en claro; el usuario se compara distinguiendo mayúsculas.",
      fuente: "Regla 9",
      va: "funcion",
      porQue: "credencial_valida compara el usuario y el hash dentro de la base y devuelve un valor: verdadero o falso. La aplicación no puede leer la tabla administrador.",
      pista: "La aplicación solo necesita una respuesta: ¿es válida o no?",
      tambien: {
        aplicacion: "El hash SHA-256 sí lo calcula la aplicación (src/auth.js), antes de llamar a la función. Pero la comparación queda en la base.",
      },
      sqlOrigen: "proyecto",
      sql: "CREATE FUNCTION credencial_valida(p_usuario VARCHAR(255), p_contrasena_hash CHAR(64))\nRETURNS BOOLEAN\nREADS SQL DATA\nBEGIN\n    RETURN EXISTS (\n        SELECT 1 FROM administrador\n        WHERE usuario = p_usuario\n          AND contrasena = p_contrasena_hash\n    );\nEND //",
    },
  ],
};
