-- Práctica 2: combinar SELECT. Ejecuta este archivo en MySQL y en SQL Server.
-- Antes haz la práctica 1: crear la base en los dos gestores.
-- En MySQL, EXCEPT necesita la versión 8.0.31 o superior.

USE peluqueria;

-- Servicios de menos de S/ 60, sin contar los que duran una hora o más.
SELECT nombre, precio FROM servicio
WHERE precio < 60
EXCEPT
SELECT nombre, precio FROM servicio
WHERE duracion >= 60
ORDER BY precio;
-- Corte de uñas   15.00
-- Baño e higiene  35.00
