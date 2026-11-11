-- Práctica 1 (SQL Server), paso 3 de 3: una transacción.
-- Vender una entrada son dos cambios: descontar una entrada disponible y guardar la venta.
-- Se hacen los dos o ninguno.

USE feria;
GO

SELECT disponibles FROM entrada;
-- 500
SELECT COUNT(*) AS ventas FROM venta;
-- 0

-- ---------------------------------------------------------------
-- 1. Luis Rojas compra su entrada. La pasarela aprobó el pago: PAGO-0001.
-- ---------------------------------------------------------------

BEGIN TRANSACTION;
UPDATE entrada SET disponibles = disponibles - 1 WHERE id = 1;
INSERT INTO venta (dni, nombre, correo, precio, referencia_pago)
VALUES ('70123456', N'Luis Rojas', N'luis.rojas@example.com', 45.00, N'PAGO-0001');
COMMIT;

SELECT disponibles FROM entrada;
-- 499
SELECT dni, nombre, referencia_pago FROM venta ORDER BY id;
-- 70123456  Luis Rojas  PAGO-0001
GO

-- ---------------------------------------------------------------
-- 2. Luis intenta comprar otra entrada con el mismo DNI.
-- ---------------------------------------------------------------

BEGIN TRANSACTION;
UPDATE entrada SET disponibles = disponibles - 1 WHERE id = 1;

SELECT disponibles FROM entrada;
-- 498 (pendiente)

-- Este INSERT falla a propósito: el DNI 70123456 ya compró.
-- Msg 2627: Violation of UNIQUE KEY constraint ... The duplicate key value is (70123456).
-- SSMS muestra el error y sigue con las líneas que vienen.
INSERT INTO venta (dni, nombre, correo, precio, referencia_pago)
VALUES ('70123456', N'Luis Rojas', N'luis.rojas@example.com', 45.00, N'PAGO-0002');

ROLLBACK;

SELECT disponibles FROM entrada;
-- 499 (la entrada volvió a estar disponible)
SELECT COUNT(*) AS ventas FROM venta;
-- 1 (solo la venta de Luis)
GO

-- Para repetir la práctica, vuelve a ejecutar practica_1_modelo_fisico.sql
-- y practica_1_registros.sql.
