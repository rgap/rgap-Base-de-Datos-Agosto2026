-- Errores comunes en la agenda (SQL Server).
-- Antes ejecuta la práctica 1 (ejemplos/practicas/sqlserver/): modelo físico y registros.
-- Ejecútalo completo (F5): SSMS muestra cada error en Messages y sigue con el siguiente lote.

USE agenda;
GO

-- ======================================================================
-- 1. Un correo repetido: ya es de Ana Torres
-- ======================================================================

INSERT INTO contacto (nombre, correo) VALUES (N'Ana Ruiz', 'ana@correo.pe');
GO

-- ======================================================================
-- 2. Un contacto sin nombre
-- ======================================================================

INSERT INTO contacto (nombre) VALUES (NULL);
GO

-- ======================================================================
-- 3. Una fecha de registro futura: la rechaza el trigger
-- ======================================================================

INSERT INTO contacto (nombre, fecha_registro) VALUES (N'Del futuro', '2099-01-01');
GO

-- ======================================================================
-- 4. Un color que no está en el CHECK
-- ======================================================================

INSERT INTO grupo (nombre, color) VALUES (N'Vecinos', 'morado');
GO

-- ======================================================================
-- 5. Un grupo que no existe
-- ======================================================================

INSERT INTO contacto_grupo (contacto_id, grupo_id) VALUES (1, 9);
GO

-- ======================================================================
-- 6. Una tabla mal escrita
-- ======================================================================

SELECT * FROM contactos;
GO
