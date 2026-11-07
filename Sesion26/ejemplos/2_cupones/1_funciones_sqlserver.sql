-- Funciones definidas por el usuario (SQL Server).
-- Caso de estudio: sistema de cupones de descuento.
-- Antes haz la práctica 2 (ejemplos/practicas/sqlserver/: practica_2_modelo_fisico.sql
-- y practica_2_registros.sql).

USE cupones;
GO

-- ---------------------------------------------------------------
-- 1. Ya usas funciones: las que trae el gestor
-- ---------------------------------------------------------------

SELECT UPPER('bienvenida10'), ROUND(107.956, 2), GETDATE();
GO

-- ---------------------------------------------------------------
-- 2. Tu propia función: ¿cuánto paga el cliente con un porcentaje?
-- ---------------------------------------------------------------

-- CREATE OR ALTER: la crea, o la reemplaza si ya existe.
-- CREATE FUNCTION debe ser la primera instrucción de su lote: por eso va GO antes.
CREATE OR ALTER FUNCTION dbo.aplicar_porcentaje(@precio DECIMAL(10,2), @porcentaje DECIMAL(5,2))
RETURNS DECIMAL(10,2)
AS
BEGIN
    RETURN @precio - @precio * @porcentaje / 100;
END;
GO

-- Al usarla se escribe el esquema: dbo.
SELECT dbo.aplicar_porcentaje(120, 10) AS a_pagar;
-- 108.00

-- Sobre las filas de una tabla: una compra de S/ 120 con cada cupón de porcentaje.
SELECT codigo, valor_descuento, dbo.aplicar_porcentaje(120, valor_descuento) AS a_pagar
FROM cupon
WHERE tipo_descuento = 'porcentaje'
ORDER BY id;
-- BIENVENIDA10  10.00  108.00
-- VERANO15      15.00  102.00
-- NAVIDAD25     25.00   90.00
GO

-- La función queda guardada en la base cupones.
-- En SSMS: cupones > Programmability > Functions > Scalar-valued Functions.
SELECT name, type_desc FROM sys.objects WHERE type = 'FN';
GO

-- ---------------------------------------------------------------
-- 3. Errores frecuentes
-- ---------------------------------------------------------------

-- Llamarla sin dbo.:
-- SELECT aplicar_porcentaje(120, 10);
-- Msg 195: 'aplicar_porcentaje' is not a recognized built-in function name.
