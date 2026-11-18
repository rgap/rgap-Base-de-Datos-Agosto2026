-- Funciones: usos 1 y 2 (MySQL 8).
-- Caso de estudio: sistema de cupones de descuento.
-- Antes crea la base cupones con la práctica 1
-- (ejemplos/practicas/mysql/: practica_1_modelo_fisico.sql y practica_1_registros.sql).

USE cupones;

-- ---------------------------------------------------------------
-- Uso 1: aplicar un porcentaje
-- ---------------------------------------------------------------

-- Si ya la creaste en la sesión 28, la borra para crearla de nuevo.
DROP FUNCTION IF EXISTS aplicar_porcentaje;

CREATE FUNCTION aplicar_porcentaje(
    p_precio     DECIMAL(10,2),
    p_porcentaje DECIMAL(5,2))
RETURNS DECIMAL(10,2)
DETERMINISTIC
RETURN p_precio - p_precio * p_porcentaje / 100;

SELECT aplicar_porcentaje(120, 10) AS a_pagar;

SELECT codigo, valor_descuento,
       aplicar_porcentaje(120, valor_descuento) AS a_pagar
FROM cupon
WHERE tipo_descuento = 'porcentaje'
ORDER BY id;

-- ---------------------------------------------------------------
-- Uso 2: ¿el cupón está vigente?
-- ---------------------------------------------------------------

-- Vigente: está 'activo', ya llegó su inicio y su fin es nulo o todavía no llega.
-- Una condición ya vale 1 (sí) o 0 (no): se devuelve directo con RETURNS BOOLEAN.
DROP FUNCTION IF EXISTS es_vigente;

CREATE FUNCTION es_vigente(
    p_estado VARCHAR(10),
    p_desde  DATETIME,
    p_hasta  DATETIME,
    p_fecha  DATETIME)
RETURNS BOOLEAN
DETERMINISTIC
RETURN p_estado = 'activo'
   AND p_desde <= p_fecha
   AND (p_hasta IS NULL OR p_fecha < p_hasta);

SELECT codigo,
       es_vigente(estado, vigente_desde, vigente_hasta, '2026-11-10') AS vigente
FROM cupon
ORDER BY id;
