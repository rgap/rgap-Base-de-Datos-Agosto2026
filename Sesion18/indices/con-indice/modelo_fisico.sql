-- ============================================================
-- MODELO FÍSICO de la agenda (CON índice en correo)
-- ============================================================
-- Aquí solo se define la estructura: qué tabla hay y qué
-- columnas tiene. Los datos se insertan desde crear_db.js.


-- La tabla
--   id      número del contacto; SQLite lo pone solo (1, 2, 3...)
--   nombre  por ejemplo: Contacto 5
--   correo  por ejemplo: contacto5@correo.com

CREATE TABLE contacto (
    id      INTEGER PRIMARY KEY,
    nombre  TEXT,
    correo  TEXT
);


-- El índice
--   Una lista ordenada de los correos, para encontrarlos rápido.
--   Esta instrucción es la única diferencia con la carpeta sin-indice.

CREATE INDEX idx_contacto_correo
    ON contacto (correo);
