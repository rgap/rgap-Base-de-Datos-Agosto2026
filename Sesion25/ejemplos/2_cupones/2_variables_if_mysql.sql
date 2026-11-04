-- Variables y condicional IF (MySQL 8).
-- Caso de estudio: sistema de cupones de descuento.
-- Antes ejecuta 1_funciones_mysql.sql.

USE cupones;

-- ---------------------------------------------------------------
-- 1. Variables en un script: empiezan con @
-- ---------------------------------------------------------------

SET @precio = 120;
SET @descuento = 20;
SELECT @precio - @descuento AS a_pagar;
-- 100

-- Guardar en una variable el resultado de un SELECT.
SELECT valor_descuento INTO @descuento FROM cupon WHERE codigo = 'NOVIEMBRE20';
SELECT @descuento;
-- 20.00

-- ---------------------------------------------------------------
-- 2. IF dentro de una función: ¿cuánto paga el cliente con un cupón?
-- ---------------------------------------------------------------

-- Dentro de una función, las variables se crean con DECLARE (sin @).
-- v_ al inicio: así se ve que es una variable y no una columna.
-- La función tiene varias instrucciones, cada una con su ;
-- DELIMITER $$ le dice a MySQL que la función termina en $$ y no en el primer ;
DROP FUNCTION IF EXISTS precio_final;

DELIMITER $$
CREATE FUNCTION precio_final(p_precio DECIMAL(10,2), p_cupon_id INT)
RETURNS DECIMAL(10,2)
READS SQL DATA
BEGIN
    DECLARE v_tipo VARCHAR(10);
    DECLARE v_valor DECIMAL(10,2);
    DECLARE v_descuento DECIMAL(10,2);

    -- 1. Leer el cupón.
    SELECT tipo_descuento, valor_descuento INTO v_tipo, v_valor
    FROM cupon
    WHERE id = p_cupon_id;

    -- 2. Calcular el descuento según el tipo.
    IF v_tipo = 'porcentaje' THEN
        SET v_descuento = p_precio * v_valor / 100;
    ELSE
        SET v_descuento = v_valor;
    END IF;

    -- 3. El descuento no puede ser mayor que el precio: no se paga menos de 0.
    IF v_descuento > p_precio THEN
        SET v_descuento = p_precio;
    END IF;

    RETURN p_precio - v_descuento;
END$$
DELIMITER ;

SELECT precio_final(120, 1) AS bienvenida10,   -- porcentaje: 120 - 12
       precio_final(120, 2) AS noviembre20,    -- monto fijo: 120 - 20
       precio_final(30, 5)  AS prueba50;       -- 50 es más que 30: paga 0
-- 108.00  100.00  0.00

-- ---------------------------------------------------------------
-- 3. IF con varios caminos: ¿en qué situación está cada cupón?
-- ---------------------------------------------------------------

-- La fecha llega como parámetro. En la aplicación se usa NOW();
-- en clase fijamos '2026-11-10' para que todos veamos lo mismo.
DROP FUNCTION IF EXISTS situacion_cupon;

DELIMITER $$
CREATE FUNCTION situacion_cupon(p_cupon_id INT, p_fecha DATETIME)
RETURNS VARCHAR(20)
READS SQL DATA
BEGIN
    DECLARE v_estado VARCHAR(8);
    DECLARE v_desde DATETIME;
    DECLARE v_hasta DATETIME;
    DECLARE v_situacion VARCHAR(20);

    SELECT estado, vigente_desde, vigente_hasta INTO v_estado, v_desde, v_hasta
    FROM cupon
    WHERE id = p_cupon_id;

    -- Se revisa en orden: la primera condición que se cumple gana.
    IF v_estado = 'inactivo' THEN
        SET v_situacion = 'inactivo';
    ELSEIF p_fecha < v_desde THEN
        SET v_situacion = 'por empezar';
    ELSEIF v_hasta IS NOT NULL AND p_fecha >= v_hasta THEN
        SET v_situacion = 'vencido';
    ELSE
        SET v_situacion = 'vigente';
    END IF;

    RETURN v_situacion;
END$$
DELIMITER ;

SELECT codigo, situacion_cupon(id, '2026-11-10') AS situacion
FROM cupon
ORDER BY id;
-- BIENVENIDA10  vigente
-- NOVIEMBRE20   vigente
-- VERANO15      vencido
-- NAVIDAD25     por empezar
-- PRUEBA50      inactivo

-- ---------------------------------------------------------------
-- 4. Las dos funciones juntas: lo que calcula la tienda en línea
-- ---------------------------------------------------------------

-- Una compra de S/ 120: ¿cuánto pagaría con cada cupón que se puede usar hoy?
SELECT codigo, precio_final(120, id) AS a_pagar
FROM cupon
WHERE situacion_cupon(id, '2026-11-10') = 'vigente'
ORDER BY id;
-- BIENVENIDA10  108.00
-- NOVIEMBRE20   100.00
