-- Los triggers de la feria (SQL Server).
-- Caso de estudio: venta de entradas para la feria gastronómica Fogón.
-- Antes ejecuta la práctica 1 (ejemplos/practicas/sqlserver/): modelo físico y registros.
-- CREATE TRIGGER debe ser lo primero de su lote: por eso va GO antes.

USE feria;
GO

-- ======================================================================
-- 1. Completar los datos antes de guardar: INSTEAD OF
-- ======================================================================

-- No hay BEFORE: en lugar del INSERT original, guarda las filas de
-- inserted con el correo en minúsculas y el precio de la entrada.
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
GO

-- ======================================================================
-- 2. Detener una operación: una venta no se borra
-- ======================================================================

-- En lugar del DELETE: lo cancela con un error propio.
CREATE OR ALTER TRIGGER dbo.venta_no_se_borra
ON venta
INSTEAD OF DELETE
AS
BEGIN
    THROW 50000, N'Una venta no se puede borrar.', 1;
END;
GO

-- Msg 50000, Level 16, State 1, Procedure venta_no_se_borra, Line 12
DELETE FROM venta WHERE dni = '70123457';
GO

SELECT COUNT(*) AS ventas FROM venta;
GO

-- ======================================================================
-- 3. El historial de precios: deleted e inserted
-- ======================================================================

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

-- ======================================================================
-- 4. Un INSERT con tres filas
-- ======================================================================

-- Sin precio. SQL Server no tiene FOR EACH ROW: venta_completa_datos se
-- ejecuta una sola vez, e inserted trae las tres filas.
INSERT INTO venta (dni, nombre, correo, referencia_pago)
VALUES ('70123461', N'Ana Ruiz', 'Ana.Ruiz@Example.com', 'PAGO-0011'),
       ('70123462', N'Jorge Soto', 'JORGE.SOTO@EXAMPLE.COM', 'PAGO-0012'),
       ('70123463', N'Lucía Vega', ' Lucia.Vega@Example.com ', 'PAGO-0013');

SELECT dni, correo, precio FROM venta
WHERE dni > '70123460';
GO

-- ======================================================================
-- 5. Ver los triggers de la base
-- ======================================================================

SELECT name FROM sys.triggers;
GO
