-- Usuarios, permisos y roles de la agenda (MySQL).
-- Antes ejecuta la práctica 1 (ejemplos/practicas/mysql/): modelo físico y registros.
-- Ejecútalo por partes, conectado como root. Las partes 3 y 5 van en otra conexión,
-- como app_agenda: .\mysql -u app_agenda -p (contraseña Agenda2026).

-- ======================================================================
-- 1. Empezar de cero
-- ======================================================================

DROP USER IF EXISTS 'app_agenda'@'localhost', 'recepcion'@'localhost', 'reporte'@'localhost';
DROP ROLE IF EXISTS 'solo_lectura';

-- ======================================================================
-- 2. El usuario de la aplicación
-- ======================================================================

-- 'localhost': solo se conecta desde esta computadora.
CREATE USER 'app_agenda'@'localhost' IDENTIFIED BY 'Agenda2026';

-- ======================================================================
-- 3. Como app_agenda: todavía no puede hacer nada
-- ======================================================================

SHOW DATABASES;

SELECT nombre FROM agenda.contacto;

-- ======================================================================
-- 4. Solo los permisos que la aplicación necesita
-- ======================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON agenda.* TO 'app_agenda'@'localhost';

SHOW GRANTS FOR 'app_agenda'@'localhost';

-- ======================================================================
-- 5. Como app_agenda otra vez: ahora lee, pero no crea tablas
-- ======================================================================

SELECT id, nombre FROM agenda.contacto;

CREATE TABLE agenda.prueba (id INT);

-- ======================================================================
-- 6. Un permiso por columnas: recepción solo ve nombre y teléfono
-- ======================================================================

CREATE USER 'recepcion'@'localhost' IDENTIFIED BY 'Recepcion2026';
GRANT SELECT (nombre, telefono) ON agenda.contacto TO 'recepcion'@'localhost';

SHOW GRANTS FOR 'recepcion'@'localhost';

-- ======================================================================
-- 7. Quitar un permiso
-- ======================================================================

-- Una aplicación ya conectada lo nota al volver a conectarse.
REVOKE DELETE ON agenda.* FROM 'app_agenda'@'localhost';

SHOW GRANTS FOR 'app_agenda'@'localhost';

-- ======================================================================
-- 8. Un rol: permisos con nombre
-- ======================================================================

CREATE ROLE 'solo_lectura';
GRANT SELECT ON agenda.* TO 'solo_lectura';

CREATE USER 'reporte'@'localhost' IDENTIFIED BY 'Reporte2026';
GRANT 'solo_lectura' TO 'reporte'@'localhost';

-- Sin esto, el rol no se activa al conectarse.
SET DEFAULT ROLE 'solo_lectura' TO 'reporte'@'localhost';

SHOW GRANTS FOR 'reporte'@'localhost' USING 'solo_lectura';
