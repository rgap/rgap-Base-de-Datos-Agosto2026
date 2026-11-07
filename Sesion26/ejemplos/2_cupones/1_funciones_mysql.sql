-- Funciones definidas por el usuario (MySQL 8).
-- Caso de estudio: sistema de cupones de descuento.
-- Antes haz la práctica 2 (ejemplos/practicas/mysql/: practica_2_modelo_fisico.sql
-- y practica_2_registros.sql).

USE cupones;

-- ---------------------------------------------------------------
-- 1. Ya usas funciones: las que trae el gestor
-- ---------------------------------------------------------------

SELECT UPPER('bienvenida10'), ROUND(107.956, 2), NOW();

-- ---------------------------------------------------------------
-- 2. Tu propia función: ¿cuánto paga el cliente con un porcentaje?
-- ---------------------------------------------------------------

-- p_ al inicio: así se ve que es un parámetro y no una columna.
DROP FUNCTION IF EXISTS aplicar_porcentaje;

CREATE FUNCTION aplicar_porcentaje(p_precio DECIMAL(10,2), p_porcentaje DECIMAL(5,2))
RETURNS DECIMAL(10,2)
DETERMINISTIC
RETURN p_precio - p_precio * p_porcentaje / 100;

-- Se usa igual que ROUND o UPPER.
SELECT aplicar_porcentaje(120, 10) AS a_pagar;
-- 108.00

-- Sobre las filas de una tabla: una compra de S/ 120 con cada cupón de porcentaje.
SELECT codigo, valor_descuento, aplicar_porcentaje(120, valor_descuento) AS a_pagar
FROM cupon
WHERE tipo_descuento = 'porcentaje'
ORDER BY id;
-- BIENVENIDA10  10.00  108.00
-- VERANO15      15.00  102.00
-- NAVIDAD25     25.00   90.00

-- La función queda guardada en la base cupones. Así la ves:
SHOW FUNCTION STATUS WHERE Db = 'cupones';

-- ---------------------------------------------------------------
-- 3. Errores frecuentes
-- ---------------------------------------------------------------

-- Sin DETERMINISTIC (o READS SQL DATA), MySQL no la crea:
-- ERROR 1418 (HY000): This function has none of DETERMINISTIC, NO SQL, or
-- READS SQL DATA in its declaration and binary logging is enabled
-- DETERMINISTIC: con los mismos datos de entrada, siempre devuelve lo mismo.

-- Crearla dos veces:
-- ERROR 1304 (42000): FUNCTION aplicar_porcentaje already exists
-- Por eso antes va DROP FUNCTION IF EXISTS.
