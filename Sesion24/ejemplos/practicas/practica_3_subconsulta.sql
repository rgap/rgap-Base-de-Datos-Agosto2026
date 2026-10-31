-- Práctica 3: subconsulta. Ejecuta este archivo en MySQL y en SQL Server.
-- Antes haz la práctica 1: crear la base en los dos gestores.

USE peluqueria;

-- ¿Qué servicios cuestan más que el promedio?
SELECT nombre, precio
FROM servicio
WHERE precio > (SELECT AVG(precio) FROM servicio);
-- Corte de pelo            55.00
-- Baño completo con corte  80.00
