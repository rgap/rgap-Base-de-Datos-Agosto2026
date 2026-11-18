-- Procedimientos almacenados (SQL Server).
-- Caso de estudio: sistema de cupones de descuento.
-- Antes ejecuta la práctica 1 (ejemplos/practicas/sqlserver/) y, de Sesion28/ejemplos/cupones/,
-- 1_funciones_sqlserver.sql y 2_variables_if_sqlserver.sql (crean precio_final y situacion_cupon).

USE cupones;
GO

-- ---------------------------------------------------------------
-- 1. Un procedimiento que cambia datos: desactivar un cupón
-- ---------------------------------------------------------------

-- Una función calcula y devuelve un valor. Un procedimiento HACE algo:
-- aquí, un UPDATE. No se usa en un SELECT: se ejecuta con EXEC.
-- CREATE PROCEDURE debe ser la primera instrucción de su lote: por eso va GO antes.
CREATE OR ALTER PROCEDURE dbo.desactivar_cupon(@codigo NVARCHAR(255))
AS
BEGIN
    UPDATE cupon SET estado = 'inactivo' WHERE codigo = @codigo;
END;
GO

EXEC dbo.desactivar_cupon 'VERANO15';

SELECT codigo, estado FROM cupon WHERE codigo = 'VERANO15';

-- Con un código que no existe no cambia nada, y tampoco avisa:
EXEC dbo.desactivar_cupon 'VERANO1';
GO

-- ---------------------------------------------------------------
-- 2. Con variables e IF: avisar si el cupón no existe
-- ---------------------------------------------------------------

CREATE OR ALTER PROCEDURE dbo.desactivar_cupon(@codigo NVARCHAR(255))
AS
BEGIN
    DECLARE @cantidad INT;

    -- 1. ¿Cuántos cupones tienen ese código? 0 o 1.
    SELECT @cantidad = COUNT(*)
    FROM cupon
    WHERE codigo = @codigo;

    -- 2. Si no hay ninguno, avisar. Si hay, desactivarlo.
    -- El camino del ELSE tiene dos instrucciones: van entre BEGIN y END.
    IF @cantidad = 0
        SELECT N'El cupón no existe' AS mensaje;
    ELSE
    BEGIN
        UPDATE cupon SET estado = 'inactivo' WHERE codigo = @codigo;
        SELECT N'Cupón desactivado' AS mensaje;
    END;
END;
GO

EXEC dbo.desactivar_cupon 'VERANO1';

EXEC dbo.desactivar_cupon 'VERANO15';
GO

-- ---------------------------------------------------------------
-- 3. Un procedimiento que muestra un resultado y usa las funciones
-- ---------------------------------------------------------------

-- Lo que pide la tienda en línea: con una compra de @precio soles,
-- ¿cuánto pagaría con cada cupón que se puede usar en @fecha?
CREATE OR ALTER PROCEDURE dbo.cupones_vigentes(@precio DECIMAL(10,2), @fecha DATETIME2)
AS
BEGIN
    SELECT codigo, dbo.precio_final(@precio, id) AS a_pagar
    FROM cupon
    WHERE dbo.situacion_cupon(id, @fecha) = 'vigente'
    ORDER BY id;
END;
GO

EXEC dbo.cupones_vigentes 120, '2026-11-10';
GO

-- Los procedimientos quedan guardados en la base cupones. Así los ves:
SELECT name FROM sys.procedures;
GO

-- ---------------------------------------------------------------
-- 4. Errores frecuentes
-- ---------------------------------------------------------------

-- Usar un procedimiento dentro de un SELECT, como si fuera una función:
-- SELECT dbo.desactivar_cupon('VERANO15');

-- Olvidar un parámetro:
-- EXEC dbo.cupones_vigentes 120;
