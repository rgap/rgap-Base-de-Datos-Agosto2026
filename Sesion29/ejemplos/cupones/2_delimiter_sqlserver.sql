-- Función con BEGIN...END (SQL Server).
-- Caso de estudio: sistema de cupones de descuento.
-- Antes crea la base cupones con la práctica 1
-- (ejemplos/practicas/sqlserver/: practica_1_modelo_fisico.sql y practica_1_registros.sql).

USE cupones;
GO

-- En SQL Server no hay DELIMITER: GO separa los lotes de instrucciones.
CREATE OR ALTER FUNCTION dbo.aplicar_porcentaje(
    @precio     DECIMAL(10,2),
    @porcentaje DECIMAL(5,2))
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @desc DECIMAL(10,2);
    SET @desc = @precio * @porcentaje / 100;
    RETURN @precio - @desc;
END;
GO

SELECT dbo.aplicar_porcentaje(120, 10) AS a_pagar;
