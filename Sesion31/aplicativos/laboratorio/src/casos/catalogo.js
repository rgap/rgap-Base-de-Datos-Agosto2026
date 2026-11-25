// Proyecto 68: catálogo web de productos con filtros (MySQL).
// Las consultas son las de 2_sistema_implementado_mysql/src/db.js. Resultados
// y errores copiados de una ejecución real en MySQL 8.4.

const polos = {
  nombre: "polo",
  columnas: ["id", "nombre", "precio", "tema_id", "activo"],
  filas: [
    [1, "Polo Gato Astronauta", "39.90", 1, 1],
    [2, "Polo Llama Andina", "45.00", 2, 1],
    [3, "Polo Cóndor Pixel", "59.90", 3, 0],
  ],
};

export default {
  id: "catalogo",
  numero: 68,
  nombre: "Catálogo de polos",
  pantalla: {
    titulo: "Catálogo de polos",
    subtitulo: "Tema: todos · precio: S/ 39.90 a S/ 45.00",
    columnas: ["Polo", "Tema", "Precio", "Stock total"],
    filas: [
      ["Polo Llama Andina", "Cine", "45.00", "12"],
      ["Polo Gato Astronauta", "Espacio", "39.90", "20"],
    ],
    botones: ["Filtrar", "Registrar polo", "Actualizar stock", "Activar / desactivar"],
  },

  acciones: [
    {
      id: "registrar",
      boton: "Registrar polo",
      descripcion: "El administrador registra el «Polo Alpaca Gamer» (Videojuegos, S/ 49.90) con tallas S, M y L y una imagen.",
      transaccion: true,
      porQueTransaccion: "Regla 8: el polo, el stock de sus tallas y las imágenes se registran en una sola transacción. Si un SKU falla, no queda un polo sin tallas.",
      pasos: [
        {
          id: "tallas",
          sql: "SELECT nombre FROM talla WHERE id = ?",
          nota: "Revisa que cada talla elegida exista (una vez por talla).",
        },
        {
          id: "skus",
          sql: "SELECT sku FROM polo_talla FOR UPDATE",
          nota: "Trae los SKU que ya existen y los bloquea hasta el COMMIT.",
        },
        {
          id: "comparar",
          app: "Compara los SKU nuevos con los existentes, sin distinguir mayúsculas. Si uno se repite: «SKU duplicado» (Regla 2).",
          nota: "Revisa que ningún SKU se repita.",
          despuesDe: ["skus"],
          orden: "Para comparar, primero hay que traer los SKU.",
        },
        {
          id: "polo",
          sql: "INSERT INTO polo (nombre, descripcion, precio, tema_id)\nVALUES (?, ?, ?, ?)",
          nota: "Guarda el polo. Su id sale de AUTO_INCREMENT.",
          despuesDe: ["tallas", "comparar"],
          orden: "Primero se comprueba todo; solo después se guarda.",
        },
        {
          id: "polo-talla",
          sql: "INSERT INTO polo_talla (polo_id, talla_id, sku, stock)\nVALUES (?, ?, ?, ?)",
          nota: "Guarda el SKU y el stock de cada talla.",
          despuesDe: ["polo"],
          orden: "polo_talla necesita el id del polo. Con un polo_id que todavía no existe, MySQL lo rechaza:",
          error: "Error Code: 1452. Cannot add or update a child row: a foreign key constraint fails (`catalogo`.`polo_talla`, CONSTRAINT `polo_talla_ibfk_1` FOREIGN KEY (`polo_id`) REFERENCES `polo` (`id`))",
        },
        {
          id: "imagen",
          sql: "INSERT INTO imagen (polo_id, url, posicion)\nVALUES (?, ?, ?)",
          nota: "Guarda cada imagen con su posición.",
          despuesDe: ["polo"],
          orden: "imagen también necesita el id del polo.",
        },
      ],
      sobran: [
        {
          id: "activar",
          sql: "UPDATE polo SET activo = 1 WHERE id = ?",
          porQue: "No hace falta: la columna activo tiene DEFAULT 1. Un polo nuevo ya está activo.",
        },
        {
          id: "stock-total",
          sql: "UPDATE polo SET stock_total = ? WHERE id = ?",
          porQue: "El stock total no se guarda: se calcula sumando el stock de las tallas. Esa columna no existe.",
        },
      ],
      despues: {
        tablas: [
          {
            nombre: "polo (después)",
            columnas: polos.columnas,
            filas: [...polos.filas, [4, "Polo Alpaca Gamer", "49.90", 3, 1]],
            resaltar: [3],
          },
          {
            nombre: "polo_talla (filas nuevas)",
            columnas: ["polo_id", "talla_id", "sku", "stock"],
            filas: [[4, 1, "ALP-S", 5], [4, 2, "ALP-M", 8], [4, 3, "ALP-L", 3]],
          },
          {
            nombre: "imagen (fila nueva)",
            columnas: ["polo_id", "url", "posicion"],
            filas: [[4, "alpaca-gamer.jpg", 1]],
          },
        ],
        nota: "Todo entró junto con el COMMIT: en el catálogo aparece con stock total 16.",
      },
    },
  ],

  ordenar: [
    {
      id: "catalogo",
      titulo: "Tarjetas del catálogo",
      contexto: "listProducts en src/db.js, sin filtros: cada tarjeta lleva el tema y el stock total del polo.",
      piezas: [
        "SELECT p.id, p.nombre, p.descripcion, t.nombre AS tema, p.precio,",
        "(SELECT COALESCE(SUM(pt.stock), 0)\n FROM polo_talla AS pt\n WHERE pt.polo_id = p.id) AS stock_total",
        "FROM polo AS p",
        "JOIN tema AS t ON t.id = p.tema_id",
        "WHERE p.activo = 1",
        "ORDER BY p.fecha_registro DESC, p.id DESC",
      ],
      porQue: "La subconsulta es una columna del SELECT y usa p, el polo de cada fila. El JOIN trae el nombre del tema; el WHERE deja solo los activos (Regla 9).",
    },
  ],

  devuelve: [
    {
      id: "rango",
      pregunta: "El filtro de precio muestra el rango de los polos del catálogo. ¿Qué devuelve?",
      tablas: [polos],
      sql: "SELECT MIN(precio) AS min, MAX(precio) AS max\nFROM polo\nWHERE activo = 1;",
      opciones: [
        { columnas: ["min", "max"], filas: [["39.90", "59.90"]] },
        { columnas: ["min", "max"], filas: [["39.90", "45.00"]] },
        { columnas: ["min", "max"], filas: [["45.00", "59.90"]] },
      ],
      correcta: 1,
      porQue: "El WHERE quita el Cóndor Pixel, que está inactivo. Sin el WHERE, el máximo sería 59.90: un precio que nadie puede comprar.",
    },
  ],

  reglas: [
    {
      id: "stock-total",
      texto: "Cada tarjeta del catálogo debe mostrar nombre, tema, descripción, precio y stock total.",
      fuente: "Historia 2",
      va: "funcion",
      porQue: "stock_total(p.id) devuelve un solo valor por polo y se usa dentro del SELECT de cualquier consulta.",
      pista: "Es un solo número por polo, calculado desde otra tabla.",
      tambien: {
        aplicacion: "Es lo que hace el proyecto: una subconsulta dentro del SELECT de src/db.js. Funciona; la función le pone nombre y se reutiliza.",
        vista: "También: una vista con el stock total de cada polo sirve para la lista completa.",
      },
      sqlOrigen: "sesión 31",
      sql: "DELIMITER //\nCREATE FUNCTION stock_total(p_polo_id INT)\nRETURNS INT\nREADS SQL DATA\nBEGIN\n    RETURN (SELECT COALESCE(SUM(stock), 0)\n        FROM polo_talla\n        WHERE polo_id = p_polo_id);\nEND //\nDELIMITER ;",
    },
    {
      id: "sku",
      texto: "Cada SKU identifica una sola talla de un solo polo, sin distinguir mayúsculas de minúsculas.",
      fuente: "Regla 2",
      va: "restriccion",
      porQue: "UNIQUE en sku. La intercalación por defecto de MySQL no distingue mayúsculas: «alp-s» choca con «ALP-S».",
      pista: "Una columna que no se repite.",
      tambien: {
        aplicacion: "El proyecto además compara en src/db.js, para dar el mensaje «SKU duplicado». Pero quien lo garantiza es el UNIQUE.",
      },
      sqlOrigen: "proyecto",
      sql: "sku VARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(sku) <> '')",
    },
    {
      id: "transaccion",
      texto: "El polo, el stock de sus tallas y las imágenes se registran en una sola transacción.",
      fuente: "Regla 8",
      va: "aplicacion",
      porQue: "Es lo que hace el proyecto: saveProduct en src/db.js abre una transacción con varios INSERT. Es el flujo de «Registrar polo».",
      pista: "Son varios INSERT en tablas distintas, y la cantidad de tallas e imágenes cambia cada vez.",
      tambien: {
        procedimiento: "También: un procedimiento registrar_polo podría hacerlo dentro de la base. Pasarle una lista de tallas e imágenes es más difícil que en JavaScript.",
      },
      sqlOrigen: "proyecto",
      sql: "START TRANSACTION;\nINSERT INTO polo (nombre, descripcion, precio, tema_id) VALUES (?, ?, ?, ?);\nINSERT INTO polo_talla (polo_id, talla_id, sku, stock) VALUES (?, ?, ?, ?);\nINSERT INTO imagen (polo_id, url, posicion) VALUES (?, ?, ?);\nCOMMIT;",
    },
    {
      id: "activos",
      texto: "Solo los polos activos se muestran en el catálogo público. La vista de administración muestra también los inactivos.",
      fuente: "Regla 9",
      va: "vista",
      porQue: "Una vista polo_publico deja fuera los inactivos. La página pública lee la vista; la de administración, la tabla.",
      pista: "La página pública siempre necesita la misma lista ya filtrada.",
      tambien: {
        aplicacion: "Es lo que hace el proyecto: WHERE p.activo = 1 en las consultas públicas de src/db.js. Funciona; la vista lo escribe una sola vez.",
      },
      sqlOrigen: "propuesto",
      sql: "CREATE VIEW polo_publico AS\nSELECT id, nombre, descripcion, precio, tema_id\nFROM polo\nWHERE activo = 1;",
    },
    {
      id: "stock",
      texto: "El stock de una talla (al registrarla o al actualizarlo) debe ser un número entero no negativo.",
      fuente: "Regla 4",
      va: "restriccion",
      porQue: "BIGINT guarda enteros y el CHECK rechaza los negativos, venga de donde venga el INSERT o el UPDATE.",
      pista: "Solo hace falta mirar una columna de la fila.",
      sqlOrigen: "proyecto",
      sql: "stock BIGINT NOT NULL DEFAULT 0 CHECK (stock >= 0)",
    },
  ],
};
