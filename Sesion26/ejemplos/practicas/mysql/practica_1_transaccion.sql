-- Práctica 1 (MySQL 8), paso 3 de 3: una transacción.
-- Vender una entrada son dos cambios: descontar una entrada disponible y guardar la venta.
-- Se hacen los dos o ninguno.

USE feria;

SELECT disponibles FROM entrada;
-- 500
SELECT COUNT(*) AS ventas FROM venta;
-- 0

-- ---------------------------------------------------------------
-- 1. Luis Rojas compra su entrada. La pasarela aprobó el pago: PAGO-0001.
-- ---------------------------------------------------------------

START TRANSACTION;
UPDATE entrada SET disponibles = disponibles - 1 WHERE id = 1;
INSERT INTO venta (dni, nombre, correo, precio, referencia_pago)
VALUES ('70123456', 'Luis Rojas', 'luis.rojas@example.com', 45.00, 'PAGO-0001');
COMMIT;

SELECT disponibles FROM entrada;
-- 499
SELECT dni, nombre, referencia_pago FROM venta ORDER BY id;
-- 70123456  Luis Rojas  PAGO-0001

-- ---------------------------------------------------------------
-- 2. Luis intenta comprar otra entrada con el mismo DNI.
-- ---------------------------------------------------------------

START TRANSACTION;
UPDATE entrada SET disponibles = disponibles - 1 WHERE id = 1;

SELECT disponibles FROM entrada;
-- 498 (pendiente)

-- Este INSERT falla a propósito: el DNI 70123456 ya compró.
-- ERROR 1062 (23000): Duplicate entry '70123456' for key 'venta.dni'
-- Workbench se detiene aquí: selecciona las líneas que siguen y ejecútalas.
INSERT INTO venta (dni, nombre, correo, precio, referencia_pago)
VALUES ('70123456', 'Luis Rojas', 'luis.rojas@example.com', 45.00, 'PAGO-0002');

ROLLBACK;

SELECT disponibles FROM entrada;
-- 499 (la entrada volvió a estar disponible)
SELECT COUNT(*) AS ventas FROM venta;
-- 1 (solo la venta de Luis)

-- Para repetir la práctica, vuelve a ejecutar practica_1_modelo_fisico.sql
-- y practica_1_registros.sql.
