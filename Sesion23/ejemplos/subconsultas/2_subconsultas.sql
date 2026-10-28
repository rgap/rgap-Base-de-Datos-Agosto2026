-- Subconsultas: una consulta dentro de otra (MySQL 8).
-- Primero ejecuta 1_datos_de_ejemplo.sql.
-- Truco: selecciona solo la consulta de adentro y ejecútala sola
-- para ver qué devuelve antes de ejecutar la consulta completa.

USE peluqueria;

-- ---------------------------------------------------------------
-- 1. La pregunta: ¿qué servicios cuestan más que el promedio?
-- ---------------------------------------------------------------

-- Paso a paso, con dos consultas.
SELECT AVG(precio) FROM servicio;                         -- 46.250000
SELECT nombre, precio FROM servicio WHERE precio > 46.25; -- el número escrito a mano

-- En una sola: el número se reemplaza por la consulta que lo calcula.
SELECT nombre, precio
FROM servicio
WHERE precio > (SELECT AVG(precio) FROM servicio);
-- Corte de pelo            55.00
-- Baño completo con corte  80.00

-- ---------------------------------------------------------------
-- 2. La subconsulta devuelve UN VALOR: se compara con =, >, <
-- ---------------------------------------------------------------

-- El servicio más caro.
SELECT nombre, precio
FROM servicio
WHERE precio = (SELECT MAX(precio) FROM servicio);
-- Baño completo con corte  80.00

-- Las mascotas de Lucía: no sabemos su id, lo busca la subconsulta.
SELECT id FROM cliente WHERE nombre = 'Lucía Ramos';      -- 1
SELECT nombre, especie
FROM mascota
WHERE cliente_id = (SELECT id FROM cliente WHERE nombre = 'Lucía Ramos');
-- Firulais  perro
-- Michi     gato

-- ---------------------------------------------------------------
-- 3. La subconsulta devuelve UNA LISTA: se usa con IN o NOT IN
-- ---------------------------------------------------------------

-- La lista que devuelve la de adentro.
SELECT empleado_id FROM cita;                             -- tres veces 1 y dos veces 2

-- Empleados que tienen al menos una cita.
SELECT nombre
FROM empleado
WHERE id IN (SELECT empleado_id FROM cita);
-- Ana Torres
-- Bruno Díaz

-- Empleados sin citas.
SELECT nombre
FROM empleado
WHERE id NOT IN (SELECT empleado_id FROM cita);
-- Carla Núñez

-- Error frecuente: = espera un solo valor, pero la lista tiene varios.
-- SELECT nombre FROM empleado WHERE id = (SELECT empleado_id FROM cita);
-- ERROR 1242 (21000): Subquery returns more than 1 row

-- ---------------------------------------------------------------
-- 4. La subconsulta devuelve UNA TABLA: va en FROM
-- ---------------------------------------------------------------

-- ¿Cuántas citas tiene el empleado con más citas?
-- MAX(COUNT(*)) no se puede escribir: primero se cuenta, luego se busca el máximo.

-- Paso 1: contar por empleado.
SELECT empleado_id, COUNT(*) AS total
FROM cita
GROUP BY empleado_id;
-- 1  3
-- 2  2

-- Paso 2: usar ese resultado como si fuera una tabla.
-- En FROM la subconsulta necesita un nombre (AS conteo).
SELECT MAX(total)
FROM (SELECT empleado_id, COUNT(*) AS total
      FROM cita
      GROUP BY empleado_id) AS conteo;
-- 3

-- Sin nombre falla:
-- SELECT MAX(total) FROM (SELECT empleado_id, COUNT(*) AS total FROM cita GROUP BY empleado_id);
-- ERROR 1248 (42000): Every derived table must have its own alias

-- ---------------------------------------------------------------
-- 5. La subconsulta en SELECT: una columna más
-- ---------------------------------------------------------------

-- Cada servicio junto al precio promedio.
SELECT nombre, precio, (SELECT AVG(precio) FROM servicio) AS promedio
FROM servicio;

-- ---------------------------------------------------------------
-- 6. La misma pregunta con JOIN
-- ---------------------------------------------------------------

-- Empleados con citas. Sin DISTINCT, Ana sale tres veces.
SELECT DISTINCT e.nombre
FROM empleado e
JOIN cita c ON c.empleado_id = e.id;
