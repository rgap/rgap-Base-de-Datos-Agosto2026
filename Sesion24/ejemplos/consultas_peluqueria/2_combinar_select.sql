-- Combinar SELECT: UNION, INTERSECT y EXCEPT (MySQL 8).
-- Primero ejecuta 1_datos_de_ejemplo.sql.
-- INTERSECT y EXCEPT necesitan MySQL 8.0.31 o superior.

USE peluqueria;

SELECT VERSION();    -- revisa tu versión

-- ---------------------------------------------------------------
-- 1. Las dos listas: clientes y empleados
-- ---------------------------------------------------------------

SELECT dni, nombre FROM cliente;
-- Lucía Ramos, Pedro Salas, Rosa Medina, Bruno Díaz

SELECT dni, nombre FROM empleado;
-- Ana Torres, Bruno Díaz, Carla Núñez

-- ---------------------------------------------------------------
-- 2. UNION: las filas de las dos listas, sin repetir
-- ---------------------------------------------------------------

-- ¿A quién le enviamos el saludo de fin de año?
SELECT dni, nombre FROM cliente
UNION
SELECT dni, nombre FROM empleado;
-- Lucía Ramos, Pedro Salas, Rosa Medina, Bruno Díaz, Ana Torres, Carla Núñez

-- UNION ALL: no quita los repetidos. Bruno Díaz sale dos veces.
SELECT dni, nombre FROM cliente
UNION ALL
SELECT dni, nombre FROM empleado;
-- 7 filas

-- Regla: los dos SELECT deben tener la misma cantidad de columnas.
-- SELECT nombre, telefono FROM cliente
-- UNION
-- SELECT nombre FROM empleado;
-- ERROR 1222 (21000): The used SELECT statements have a different number of columns

-- ---------------------------------------------------------------
-- 3. INTERSECT: solo las filas que están en las dos listas
-- ---------------------------------------------------------------

-- ¿Qué empleados también son clientes? Les toca el descuento de personal.
-- Se compara la fila completa: el dni evita confundir a dos personas que se llaman igual.
SELECT dni, nombre FROM cliente
INTERSECT
SELECT dni, nombre FROM empleado;
-- Bruno Díaz

-- ---------------------------------------------------------------
-- 4. EXCEPT: las filas de la primera lista que no están en la segunda
-- ---------------------------------------------------------------

-- ¿Qué clientes no trabajan aquí? Ellos reciben la promoción.
SELECT dni, nombre FROM cliente
EXCEPT
SELECT dni, nombre FROM empleado;
-- Lucía Ramos, Pedro Salas, Rosa Medina

-- El orden importa: al revés, son los empleados que no son clientes.
SELECT dni, nombre FROM empleado
EXCEPT
SELECT dni, nombre FROM cliente;
-- Ana Torres, Carla Núñez

-- Otro uso frecuente: cruzar dos tablas para encontrar lo que falta.
-- ¿Qué citas ya se atendieron y todavía no se cobraron?
SELECT id FROM cita WHERE estado = 'completada'
EXCEPT
SELECT cita_id FROM pago;
-- 6
