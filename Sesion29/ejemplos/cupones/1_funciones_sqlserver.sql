-- Funciones: usos 1 y 2 (SQL Server).
-- Caso de estudio: sistema de cupones de descuento.
-- Antes crea la base cupones con la práctica 1
-- (ejemplos/practicas/sqlserver/: practica_1_modelo_fisico.sql y practica_1_registros.sql).

USE cupones;
GO

-- ---------------------------------------------------------------
-- Uso 1: aplicar un porcentaje
-- ---------------------------------------------------------------

-- CREATE OR ALTER: la crea, o la reemplaza si ya la creaste en la sesión 28.
-- Los parámetros llevan @, después de RETURNS va AS y el cuerpo va entre BEGIN y END.
CREATE OR ALTER FUNCTION dbo.aplicar_porcentaje(
    @precio     DECIMAL(10,2),
    @porcentaje DECIMAL(5,2))
RETURNS DECIMAL(10,2)
AS
BEGIN
    RETURN @precio - @precio * @porcentaje / 100;
END;
GO

SELECT dbo.aplicar_porcentaje(120, 10) AS a_pagar;

SELECT codigo, valor_descuento,
       dbo.aplicar_porcentaje(120, valor_descuento) AS a_pagar
FROM cupon
WHERE tipo_descuento = 'porcentaje'
ORDER BY id;
GO

-- ---------------------------------------------------------------
-- Uso 2: ¿el cupón está vigente?
-- ---------------------------------------------------------------

-- Vigente: está 'activo', ya llegó su inicio y su fin es nulo o todavía no llega.
-- No existe BOOLEAN: se usa BIT. IIF(condición, 1, 0) devuelve 1 si se cumple y 0 si no.
CREATE OR ALTER FUNCTION dbo.es_vigente(
    @estado VARCHAR(10),
    @desde  DATETIME,
    @hasta  DATETIME,
    @fecha  DATETIME)
RETURNS BIT
AS
BEGIN
    RETURN IIF(@estado = 'activo'
           AND @desde <= @fecha
           AND (@hasta IS NULL OR @fecha < @hasta), 1, 0);
END;
GO

SELECT codigo,
       dbo.es_vigente(estado, vigente_desde, vigente_hasta, '2026-11-10') AS vigente
FROM cupon
ORDER BY id;
