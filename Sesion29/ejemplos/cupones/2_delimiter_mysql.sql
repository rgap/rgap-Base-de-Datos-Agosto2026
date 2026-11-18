-- Función con BEGIN...END y DELIMITER (MySQL 8).
-- Caso de estudio: sistema de cupones de descuento.
-- Antes crea la base cupones con la práctica 1
-- (ejemplos/practicas/mysql/: practica_1_modelo_fisico.sql y practica_1_registros.sql).

USE cupones;

-- Borra la versión de una sola línea para crearla de nuevo.
DROP FUNCTION IF EXISTS aplicar_porcentaje;

-- Dentro de BEGIN...END hay varios ; : DELIMITER $$ hace que el CREATE termine en $$.
DELIMITER $$
CREATE FUNCTION aplicar_porcentaje(
    p_precio     DECIMAL(10,2),
    p_porcentaje DECIMAL(5,2))
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE v_desc DECIMAL(10,2);
    SET v_desc = p_precio * p_porcentaje / 100;
    RETURN p_precio - v_desc;
END$$
DELIMITER ;

SELECT aplicar_porcentaje(120, 10) AS a_pagar;
