-- Un usuario, sus permisos y una copia de seguridad (MySQL).
-- Caso de estudio: la agenda de contactos (proyecto 13).
-- Antes ejecuta agenda_mysql.sql: crea la base agenda_contactos.
-- Ejecútalo por partes. Las partes 1 y 2 van conectado como root.
-- La parte 3 va en una conexión nueva de Workbench, con Username app_agenda.

-- ---------------------------------------------------------------
-- 1. Crear el usuario de la aplicación
-- ---------------------------------------------------------------

-- Para poder ejecutar el script otra vez desde el principio.
DROP USER IF EXISTS 'app_agenda'@'localhost';

-- 'localhost': solo puede conectarse desde la misma computadora.
CREATE USER 'app_agenda'@'localhost' IDENTIFIED BY 'Agenda2026';

-- Un usuario nuevo puede conectarse, pero no tiene ningún permiso.
SHOW GRANTS FOR 'app_agenda'@'localhost';

-- ---------------------------------------------------------------
-- 2. Darle solo los permisos que usa la aplicación
-- ---------------------------------------------------------------

-- agenda_contactos.*: todas las tablas de la base.
GRANT SELECT, INSERT, UPDATE, DELETE ON agenda_contactos.* TO 'app_agenda'@'localhost';

SHOW GRANTS FOR 'app_agenda'@'localhost';

-- ---------------------------------------------------------------
-- 3. Probar como app_agenda (en una conexión nueva)
-- ---------------------------------------------------------------

USE agenda_contactos;

-- Sí puede: leer y registrar.
SELECT nombre FROM contacto;

INSERT INTO contacto (nombre, telefono) VALUES ('Rosa Paz', '955111222');

-- El trigger se cumple con cualquier usuario: Error Code: 1644.
INSERT INTO contacto (nombre, fecha_registro) VALUES ('Del futuro', '2099-01-01');

-- No puede: borrar la tabla (Error Code: 1142) ni la base (Error Code: 1044).
DROP TABLE contacto;

DROP DATABASE agenda_contactos;

-- ---------------------------------------------------------------
-- 4. La copia de seguridad (en PowerShell, no en Workbench)
-- ---------------------------------------------------------------

-- a. En PowerShell, dentro de C:\Program Files\MySQL\MySQL Server 8.4\bin
--    (la copia queda en la carpeta backups del Escritorio; $HOME es tu carpeta de usuario).
--    mkdir crea la carpeta: solo hace falta la primera vez.
--    mkdir $HOME\Desktop\backups
--    .\mysqldump -u root -p --databases agenda_contactos --result-file=$HOME\Desktop\backups\agenda_contactos.sql

-- b. En Workbench, como root, el error:
--    DROP TABLE contacto_grupo;

-- c. En PowerShell, en la misma carpeta bin:
--    .\mysql -u root -p -e "source $HOME\Desktop\backups\agenda_contactos.sql"

-- d. En Workbench: Ana sigue en Familia y en Trabajo.
--    SELECT * FROM agenda_contactos.contacto_grupo;
