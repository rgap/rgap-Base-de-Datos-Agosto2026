-- Triggers, de lo simple a lo aplicado (SQL Server).
-- Caso de estudio: venta de entradas para la feria gastronómica Fogón.
-- Antes ejecuta la práctica 1 (ejemplos/practicas/sqlserver/): modelo físico y registros.
-- CREATE TRIGGER debe ser lo primero de su lote: por eso va GO antes.

USE feria_entrada;
GO

-- ---------------------------------------------------------------
-- 1. Tu primer trigger: se vende una entrada, queda una menos
-- ---------------------------------------------------------------

-- Después de cada INSERT en venta. Se ejecuta una vez por instrucción:
-- inserted tiene todas las filas nuevas, por eso se cuentan.
CREATE OR ALTER TRIGGER dbo.venta_descuenta_disponible
ON venta
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE entrada
    SET disponibles = disponibles - (SELECT COUNT(*) FROM inserted)
    WHERE id = 1;
END;
GO

INSERT INTO venta (dni, nombre, correo, precio, referencia_pago)
VALUES ('70123456', N'Luis Rojas', 'luis.rojas@example.com', 45.00, 'PAGO-0001');

SELECT nombre, precio, disponibles FROM entrada;
GO

-- ---------------------------------------------------------------
-- 2. Completar los datos antes de guardar: INSTEAD OF
-- ---------------------------------------------------------------

-- En lugar del INSERT original: guarda las filas de inserted con el
-- correo en minúsculas y el precio de la entrada.
CREATE OR ALTER TRIGGER dbo.venta_completa_datos
ON venta
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO venta (entrada_id, dni, nombre, correo, precio, referencia_pago)
    SELECT i.entrada_id, i.dni, i.nombre, LOWER(TRIM(i.correo)), e.precio, i.referencia_pago
    FROM inserted i
    JOIN entrada e ON e.id = i.entrada_id;
END;
GO

INSERT INTO venta (dni, nombre, correo, precio, referencia_pago)
VALUES ('70123457', N'María Torres', 'Maria.Torres@Example.com', 1.00, 'PAGO-0002');

SELECT dni, nombre, correo, precio FROM venta;
SELECT nombre, precio, disponibles FROM entrada;
GO

-- ---------------------------------------------------------------
-- 3. Detener una operación: una venta no se borra
-- ---------------------------------------------------------------

-- En lugar del DELETE: lo cancela con un error propio.
CREATE OR ALTER TRIGGER dbo.venta_no_se_borra
ON venta
INSTEAD OF DELETE
AS
BEGIN
    THROW 50000, N'Una venta no se puede borrar.', 1;
END;
GO

DELETE FROM venta WHERE dni = '70123456';
GO

SELECT COUNT(*) AS ventas FROM venta;
GO

-- ---------------------------------------------------------------
-- 4. El historial de precios: deleted e inserted
-- ---------------------------------------------------------------

DROP TABLE IF EXISTS cambio_precio;

-- Una fila por cada cambio de precio de la entrada.
CREATE TABLE cambio_precio (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    precio_anterior DECIMAL(10, 2) NOT NULL,
    precio_nuevo DECIMAL(10, 2) NOT NULL,
    fecha DATETIME NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Después de cada UPDATE en entrada: deleted tiene las filas antes del
-- cambio; inserted, las filas después. Solo se anotan las que cambiaron de precio.
CREATE OR ALTER TRIGGER dbo.entrada_guarda_cambio_precio
ON entrada
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO cambio_precio (precio_anterior, precio_nuevo)
    SELECT d.precio, i.precio
    FROM deleted d
    JOIN inserted i ON i.id = d.id
    WHERE d.precio <> i.precio;
END;
GO

UPDATE entrada SET precio = 50.00 WHERE id = 1;

SELECT precio_anterior, precio_nuevo FROM cambio_precio;
GO

-- ---------------------------------------------------------------
-- 5. Todo junto: una compra con un solo INSERT
-- ---------------------------------------------------------------

-- Sin precio: lo pone el trigger venta_completa_datos.
INSERT INTO venta (dni, nombre, correo, referencia_pago)
VALUES ('70123458', N'Pedro Huamán', ' Pedro.Huaman@Example.com ', 'PAGO-0003');

SELECT dni, nombre, correo, precio FROM venta;
SELECT nombre, precio, disponibles FROM entrada;
SELECT precio_anterior, precio_nuevo FROM cambio_precio;
GO

-- ---------------------------------------------------------------
-- 6. Si el trigger falla, el INSERT tampoco se guarda
-- ---------------------------------------------------------------

UPDATE entrada SET disponibles = 0 WHERE id = 1;
GO

-- El trigger de la parte 1 dejaría disponibles en -1: el CHECK lo rechaza.
INSERT INTO venta (dni, nombre, correo, referencia_pago)
VALUES ('70123459', N'Rosa Quispe', 'rosa.quispe@example.com', 'PAGO-0004');
GO

SELECT COUNT(*) AS ventas FROM venta;
GO

-- ---------------------------------------------------------------
-- 7. Ver los triggers de la base
-- ---------------------------------------------------------------

SELECT name AS trigger_name, OBJECT_NAME(parent_id) AS tabla
FROM sys.triggers;
GO
