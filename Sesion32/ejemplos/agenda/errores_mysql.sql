-- Errores comunes en la agenda (MySQL).
-- Antes ejecuta la práctica 1 (ejemplos/practicas/mysql/): modelo físico y registros.
-- En PowerShell, conéctate con .\mysql -u root -p agenda y pega una parte a la vez.

-- ======================================================================
-- 1. Un correo repetido: ya es de Ana Torres
-- ======================================================================

INSERT INTO contacto (nombre, correo) VALUES ('Ana Ruiz', 'ana@correo.pe');

-- ======================================================================
-- 2. Un contacto sin nombre
-- ======================================================================

INSERT INTO contacto (nombre) VALUES (NULL);

-- ======================================================================
-- 3. Una fecha de registro futura: la rechaza el trigger
-- ======================================================================

INSERT INTO contacto (nombre, fecha_registro) VALUES ('Del futuro', '2099-01-01');

-- ======================================================================
-- 4. Un color que no está en el CHECK
-- ======================================================================

INSERT INTO grupo (nombre, color) VALUES ('Vecinos', 'morado');

-- ======================================================================
-- 5. Un grupo que no existe
-- ======================================================================

INSERT INTO contacto_grupo (contacto_id, grupo_id) VALUES (1, 9);

-- ======================================================================
-- 6. Una tabla mal escrita
-- ======================================================================

SELECT * FROM contactos;
