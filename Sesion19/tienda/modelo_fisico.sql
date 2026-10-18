-- ============================================================
-- MODELO FÍSICO de la tienda
-- ============================================================
-- Aquí solo se define la estructura: qué tabla hay y qué
-- columnas tiene. Los datos se insertan desde crear_db.js.


-- La tabla
--   id         número del producto; SQLite lo pone solo (1, 2, 3...)
--   nombre     por ejemplo: Producto 5
--   categoria  por ejemplo: Cómputo
--   precio     en soles, por ejemplo: 349

CREATE TABLE producto (
    id         INTEGER PRIMARY KEY,
    nombre     TEXT,
    categoria  TEXT,
    precio     INTEGER
);


-- El índice NO se crea aquí.
-- Se crea y se borra desde la página, con los botones:
--
--   CREATE INDEX idx_producto_categoria_precio
--       ON producto (categoria, precio);
--
--   DROP INDEX idx_producto_categoria_precio;
