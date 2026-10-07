-- ============================================================
-- MODELO FÍSICO de la agenda (SIN índice en correo)
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
