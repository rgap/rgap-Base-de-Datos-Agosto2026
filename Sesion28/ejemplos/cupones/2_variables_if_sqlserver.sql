-- Variables y condicional IF (SQL Server).
-- Caso de estudio: sistema de cupones de descuento.
-- Antes ejecuta 1_funciones_sqlserver.sql.

USE cupones;
GO

-- ---------------------------------------------------------------
-- 1. Variables en un script: se crean con DECLARE y empiezan con @
-- ---------------------------------------------------------------

DECLARE @precio DECIMAL(10,2) = 120;
DECLARE @descuento DECIMAL(10,2) = 20;
SELECT @precio - @descuento AS a_pagar;
-- 100.00

-- Guardar en una variable el resultado de un SELECT.
SELECT @descuento = valor_descuento FROM cupon WHERE codigo = 'NOVIEMBRE20';
SELECT @descuento;
-- 20.00
GO
-- Ojo: una variable solo vive hasta el GO.

-- ---------------------------------------------------------------
-- 2. IF dentro de una función: ¿cuánto paga el cliente con un cupón?
-- ---------------------------------------------------------------

CREATE OR ALTER FUNCTION dbo.precio_final(@precio DECIMAL(10,2), @cupon_id INT)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @tipo NVARCHAR(10);
    DECLARE @valor DECIMAL(10,2);
    DECLARE @descuento DECIMAL(10,2);

    -- 1. Leer el cupón.
    SELECT @tipo = tipo_descuento, @valor = valor_descuento
    FROM cupon
    WHERE id = @cupon_id;

    -- 2. Calcular el descuento según el tipo.
    -- Sin THEN ni END IF. Si un camino tiene varias instrucciones, van entre BEGIN y END.
    IF @tipo = 'porcentaje'
        SET @descuento = @precio * @valor / 100;
    ELSE
        SET @descuento = @valor;

    -- 3. El descuento no puede ser mayor que el precio: no se paga menos de 0.
    IF @descuento > @precio
        SET @descuento = @precio;

    RETURN @precio - @descuento;
END;
GO

SELECT dbo.precio_final(120, 1) AS bienvenida10,   -- porcentaje: 120 - 12
       dbo.precio_final(120, 2) AS noviembre20,    -- monto fijo: 120 - 20
       dbo.precio_final(30, 5)  AS prueba50;       -- 50 es más que 30: paga 0
-- 108.00  100.00  0.00
GO

-- ---------------------------------------------------------------
-- 3. IF con varios caminos: ¿en qué situación está cada cupón?
-- ---------------------------------------------------------------

-- La fecha llega como parámetro. En la aplicación se usa GETDATE();
-- en clase fijamos '2026-11-10' para que todos veamos lo mismo.
CREATE OR ALTER FUNCTION dbo.situacion_cupon(@cupon_id INT, @fecha DATETIME2)
RETURNS NVARCHAR(20)
AS
BEGIN
    DECLARE @estado NVARCHAR(8);
    DECLARE @desde DATETIME2;
    DECLARE @hasta DATETIME2;
    DECLARE @situacion NVARCHAR(20);

    SELECT @estado = estado, @desde = vigente_desde, @hasta = vigente_hasta
    FROM cupon
    WHERE id = @cupon_id;

    -- Se revisa en orden: la primera condición que se cumple gana.
    -- En SQL Server no existe ELSEIF: se escribe ELSE IF, separado.
    IF @estado = 'inactivo'
        SET @situacion = 'inactivo';
    ELSE IF @fecha < @desde
        SET @situacion = 'por empezar';
    ELSE IF @hasta IS NOT NULL AND @fecha >= @hasta
        SET @situacion = 'vencido';
    ELSE
        SET @situacion = 'vigente';

    RETURN @situacion;
END;
GO

SELECT codigo, dbo.situacion_cupon(id, '2026-11-10') AS situacion
FROM cupon
ORDER BY id;
-- BIENVENIDA10  vigente
-- NOVIEMBRE20   vigente
-- VERANO15      vencido
-- NAVIDAD25     por empezar
-- PRUEBA50      inactivo
GO

-- ---------------------------------------------------------------
-- 4. Las dos funciones juntas: lo que calcula la tienda en línea
-- ---------------------------------------------------------------

-- Una compra de S/ 120: ¿cuánto pagaría con cada cupón que se puede usar hoy?
SELECT codigo, dbo.precio_final(120, id) AS a_pagar
FROM cupon
WHERE dbo.situacion_cupon(id, '2026-11-10') = 'vigente'
ORDER BY id;
-- BIENVENIDA10  108.00
-- NOVIEMBRE20   100.00
GO
