-- Práctica 4: CTE. Ejecuta este archivo en MySQL y en SQL Server.
-- Antes haz la práctica 1: crear la base en los dos gestores.

USE peluqueria;

-- ¿Cuántos servicios cuestan más que el promedio y cuánto suman sus precios?
WITH caros AS (
    SELECT nombre, precio
    FROM servicio
    WHERE precio > (SELECT AVG(precio) FROM servicio)
)
SELECT COUNT(*) AS cantidad, SUM(precio) AS total
FROM caros;
-- 2  135.00
