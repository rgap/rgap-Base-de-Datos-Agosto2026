-- Procedimientos almacenados (MySQL 8).
-- Caso de estudio: sistema de cupones de descuento.
-- Antes ejecuta la práctica 1 (ejemplos/practicas/mysql/) y, de Sesion28/ejemplos/cupones/,
-- 1_funciones_mysql.sql y 2_variables_if_mysql.sql (crean precio_final y situacion_cupon).

USE cupones;

-- ---------------------------------------------------------------
-- 1. Un procedimiento que cambia datos: desactivar un cupón
-- ---------------------------------------------------------------

-- Una función calcula y devuelve un valor. Un procedimiento HACE algo:
-- aquí, un UPDATE. No se usa en un SELECT: se ejecuta con CALL.
DROP PROCEDURE IF EXISTS desactivar_cupon;

CREATE PROCEDURE desactivar_cupon(p_codigo VARCHAR(255))
UPDATE cupon SET estado = 'inactivo' WHERE codigo = p_codigo;

CALL desactivar_cupon('VERANO15');

SELECT codigo, estado FROM cupon WHERE codigo = 'VERANO15';

-- Con un código que no existe no cambia nada, y tampoco avisa:
CALL desactivar_cupon('VERANO1');

-- ---------------------------------------------------------------
-- 2. Con variables e IF: avisar si el cupón no existe
-- ---------------------------------------------------------------

DROP PROCEDURE IF EXISTS desactivar_cupon;

DELIMITER $$
CREATE PROCEDURE desactivar_cupon(p_codigo VARCHAR(255))
BEGIN
    DECLARE v_cantidad INT;

    -- 1. ¿Cuántos cupones tienen ese código? 0 o 1.
    SELECT COUNT(*) INTO v_cantidad
    FROM cupon
    WHERE codigo = p_codigo;

    -- 2. Si no hay ninguno, avisar. Si hay, desactivarlo.
    IF v_cantidad = 0 THEN
        SELECT 'El cupón no existe' AS mensaje;
    ELSE
        UPDATE cupon SET estado = 'inactivo' WHERE codigo = p_codigo;
        SELECT 'Cupón desactivado' AS mensaje;
    END IF;
END$$
DELIMITER ;

CALL desactivar_cupon('VERANO1');

CALL desactivar_cupon('VERANO15');

-- ---------------------------------------------------------------
-- 3. Un procedimiento que muestra un resultado y usa las funciones
-- ---------------------------------------------------------------

-- Lo que pide la tienda en línea: con una compra de p_precio soles,
-- ¿cuánto pagaría con cada cupón que se puede usar en p_fecha?
DROP PROCEDURE IF EXISTS cupones_vigentes;

CREATE PROCEDURE cupones_vigentes(p_precio DECIMAL(10,2), p_fecha DATETIME)
SELECT codigo, precio_final(p_precio, id) AS a_pagar
FROM cupon
WHERE situacion_cupon(id, p_fecha) = 'vigente'
ORDER BY id;

CALL cupones_vigentes(120, '2026-11-10');

-- Los procedimientos quedan guardados en la base cupones. Así los ves:
SHOW PROCEDURE STATUS WHERE Db = 'cupones';

-- ---------------------------------------------------------------
-- 4. Errores frecuentes
-- ---------------------------------------------------------------

-- Usar un procedimiento dentro de un SELECT, como si fuera una función:
-- SELECT desactivar_cupon('VERANO15');

-- Olvidar un parámetro:
-- CALL cupones_vigentes(120);
