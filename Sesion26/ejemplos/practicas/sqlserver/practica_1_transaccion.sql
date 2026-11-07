-- Práctica 1 (SQL Server), paso 3 de 3: una transacción.
-- Comprar una entrada son dos cambios: descontar una entrada disponible y guardar la compra.
-- Se hacen los dos o ninguno.

USE feria;
GO

SELECT disponibles FROM entrada;
-- 500

-- ---------------------------------------------------------------
-- 1. Ana compra su entrada. La pasarela aprobó el pago: PAGO-0002.
-- ---------------------------------------------------------------

BEGIN TRANSACTION;
UPDATE entrada SET disponibles = disponibles - 1 WHERE id = 1;
INSERT INTO compra (dni, nombre, precio, referencia_pago)
VALUES ('45678912', N'Ana Quispe', 45.00, N'PAGO-0002');
COMMIT;

SELECT disponibles FROM entrada;
-- 499
SELECT dni, nombre, referencia_pago FROM compra ORDER BY id;
-- 70123456  Luis Rojas  PAGO-0001
-- 45678912  Ana Quispe  PAGO-0002
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
INSERT INTO compra (dni, nombre, precio, referencia_pago)
VALUES ('70123456', N'Luis Rojas', 45.00, N'PAGO-0003');

ROLLBACK;

SELECT disponibles FROM entrada;
-- 499 (la entrada volvió a estar disponible)
GO

-- Para repetir la práctica, vuelve a ejecutar practica_1_modelo_fisico.sql
-- y practica_1_registros.sql.
