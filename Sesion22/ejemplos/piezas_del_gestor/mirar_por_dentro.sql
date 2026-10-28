-- Mirar el gestor por dentro (MySQL 8).
-- Necesita la base peluqueria de la sesión 21:
--   Sesion21/ejemplos/proyecto_mascotas_flujo_con_gestor/modelado/4_modelo_fisico.sql
-- Ejecútalo por partes: cada bloque muestra una pieza del gestor.

USE peluqueria;

-- Pieza 1. Gestor de conexiones: una fila por cada conexión abierta.
-- Abre otra conexión (terminal o Workbench) y vuelve a ejecutarlo.
SHOW PROCESSLIST;

-- Quién soy, desde dónde llegué y en qué base estoy.
SELECT USER(), CURRENT_USER(), DATABASE();

-- Pieza 2. Analizador: estas dos fallan antes de tocar ningún dato.
-- SELEC nombre FROM servicio;      -- ERROR 1064: error de gramática
-- SELECT nombre FROM servicios;    -- ERROR 1146: la tabla no existe

-- Pieza 2. Optimizador: EXPLAIN muestra el plan sin ejecutar la consulta.
-- type = const: va directo a una fila usando el índice PRIMARY.
EXPLAIN SELECT * FROM servicio WHERE id = 2;
-- type = ALL: recorre todas las filas porque precio no tiene índice.
EXPLAIN SELECT * FROM servicio WHERE precio > 40;

-- Pieza 3. Motor de almacenamiento: los motores disponibles y el de cada tabla.
SHOW ENGINES;
SELECT table_name, engine
FROM information_schema.tables
WHERE table_schema = 'peluqueria';

-- Pieza 4. Memoria intermedia: su tamaño en MB (128 por defecto).
SELECT @@innodb_buffer_pool_size / 1024 / 1024 AS buffer_pool_mb;

-- Pieza 5. Transacciones: el cambio se ve dentro de la transacción
-- y desaparece con ROLLBACK.
START TRANSACTION;
UPDATE servicio SET precio = 99.00 WHERE id = 1;
SELECT id, nombre, precio FROM servicio WHERE id = 1;
ROLLBACK;
SELECT id, nombre, precio FROM servicio WHERE id = 1;

-- Pieza 5. Bloqueos: tiempo máximo de espera en segundos (50 por defecto).
SELECT @@innodb_lock_wait_timeout;

-- Pieza 7. Catálogo: los metadatos se consultan con SQL.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'peluqueria' AND table_name = 'servicio'
ORDER BY ordinal_position;

SHOW TABLES;
DESCRIBE servicio;

-- Pieza 8. Archivos en disco: la carpeta de datos del servidor.
-- Dentro hay una carpeta peluqueria/ con un archivo .ibd por tabla.
SELECT @@datadir;

-- Datos del servidor: computadora, puerto y versión.
SELECT @@hostname, @@port, VERSION();
