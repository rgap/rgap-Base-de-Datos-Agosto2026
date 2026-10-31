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
-- 2. En WHERE, devuelve UN VALOR: se compara con =, >, <
-- ---------------------------------------------------------------

-- El servicio más caro.
SELECT nombre, precio
FROM servicio
WHERE precio = (SELECT MAX(precio) FROM servicio);
-- Baño completo con corte  80.00

-- Las citas de Ana Torres: no sabemos su id, lo busca la subconsulta.
SELECT id FROM empleado WHERE nombre = 'Ana Torres';      -- 1
SELECT id, fecha_hora
FROM cita
WHERE empleado_id = (SELECT id FROM empleado WHERE nombre = 'Ana Torres');
-- 1  2026-09-08 10:00:00
-- 3  2026-09-22 09:00:00
-- 4  2026-10-06 10:00:00
-- 6  2026-10-20 09:00:00

-- ---------------------------------------------------------------
-- 3. Con IN, devuelve UNA LISTA: se usa con IN o NOT IN
-- ---------------------------------------------------------------

-- La lista que devuelve la de adentro.
SELECT empleado_id FROM cita;                             -- 1, 1, 1, 1, 2, 2, 2

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
-- 4. En FROM, devuelve UNA TABLA
-- ---------------------------------------------------------------

-- ¿Cuántas citas tiene el empleado con más citas?
-- MAX(COUNT(*)) no se puede escribir: primero se cuenta, luego se busca el máximo.

-- Paso 1: contar por empleado.
SELECT empleado_id, COUNT(*) AS total
FROM cita
GROUP BY empleado_id;
-- 1  4
-- 2  3

-- Paso 2: usar ese resultado como si fuera una tabla.
-- En FROM la subconsulta necesita un nombre (AS conteo).
SELECT MAX(total)
FROM (SELECT empleado_id, COUNT(*) AS total
      FROM cita
      GROUP BY empleado_id) AS conteo;
-- 4

-- Sin nombre falla:
-- SELECT MAX(total) FROM (SELECT empleado_id, COUNT(*) AS total FROM cita GROUP BY empleado_id);
-- ERROR 1248 (42000): Every derived table must have its own alias

-- ---------------------------------------------------------------
-- 5. En SELECT: una columna más
-- ---------------------------------------------------------------

-- Cada servicio junto al promedio y a cuánto se aleja de él.
SELECT nombre,
       precio,
       (SELECT AVG(precio) FROM servicio) AS promedio,
       precio - (SELECT AVG(precio) FROM servicio) AS diferencia
FROM servicio;
-- Baño e higiene           35.00  46.250000  -11.250000
-- Corte de pelo            55.00  46.250000    8.750000
-- Corte de uñas            15.00  46.250000  -31.250000
-- Baño completo con corte  80.00  46.250000   33.750000

-- La de adentro puede mirar la fila de afuera: se ejecuta una vez por empleado.
SELECT e.nombre,
       (SELECT COUNT(*) FROM cita c WHERE c.empleado_id = e.id) AS citas
FROM empleado e;
-- Ana Torres   4
-- Bruno Díaz   3
-- Carla Núñez  0

-- ---------------------------------------------------------------
-- 6. EXISTS y NOT EXISTS: ¿hay al menos una fila?
-- ---------------------------------------------------------------

-- Empleados que tienen al menos una cita.
-- SELECT 1 porque aquí no importa qué columna se traiga: solo si hay fila o no.
SELECT e.nombre
FROM empleado e
WHERE EXISTS (SELECT 1 FROM cita c WHERE c.empleado_id = e.id);
-- Ana Torres
-- Bruno Díaz

-- Empleados sin citas.
SELECT e.nombre
FROM empleado e
WHERE NOT EXISTS (SELECT 1 FROM cita c WHERE c.empleado_id = e.id);
-- Carla Núñez

-- Citas ya atendidas que todavía no se cobraron.
SELECT c.id, c.fecha_hora
FROM cita c
WHERE c.estado = 'completada'
  AND NOT EXISTS (SELECT 1 FROM pago p WHERE p.cita_id = c.id);
-- 6  2026-10-20 09:00:00

-- ---------------------------------------------------------------
-- 7. La trampa de NOT IN con NULL
-- ---------------------------------------------------------------

SELECT nombre FROM empleado WHERE id NOT IN (1, 2);        -- Carla Núñez
SELECT nombre FROM empleado WHERE id NOT IN (1, 2, NULL);  -- ninguna fila
-- ¿3 es distinto de NULL? El gestor no lo sabe, así que no devuelve la fila.
-- Lo mismo pasa si la subconsulta trae una columna que admite NULL, como cliente.telefono.
-- NOT EXISTS no tiene este problema.

-- ---------------------------------------------------------------
-- 8. La misma pregunta con JOIN
-- ---------------------------------------------------------------

-- Empleados con citas. Sin DISTINCT, Ana sale cuatro veces.
SELECT DISTINCT e.nombre
FROM empleado e
JOIN cita c ON c.empleado_id = e.id;
