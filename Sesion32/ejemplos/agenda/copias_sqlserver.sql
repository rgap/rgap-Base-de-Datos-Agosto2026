-- Copias de seguridad de la agenda (SQL Server).
-- Antes ejecuta la práctica 1 (ejemplos/practicas/sqlserver/): modelo físico y registros.
-- Ejecútalo por partes: selecciona una parte y pulsa Execute.

-- ======================================================================
-- 1. Sacar la copia completa
-- ======================================================================

-- Sin ruta, el archivo va a la carpeta Backup de SQL Server.
BACKUP DATABASE agenda
TO DISK = 'agenda.bak'
WITH INIT;
GO

-- ======================================================================
-- 2. Por error, se borra a Ana Torres
-- ======================================================================

USE agenda;
GO

DELETE FROM contacto_grupo WHERE contacto_id = 1;
DELETE FROM contacto WHERE id = 1;

SELECT id, nombre FROM contacto;
GO

-- ======================================================================
-- 3. Volver a la copia
-- ======================================================================

-- Desde master y sin nadie conectado a la base.
USE master;
GO

ALTER DATABASE agenda SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE agenda
FROM DISK = 'agenda.bak'
WITH REPLACE;
GO

SELECT id, nombre FROM agenda.dbo.contacto;
GO

-- ======================================================================
-- 4. Las tres copias: completa, diferencial y del log
-- ======================================================================

-- La copia del log solo se puede con el modelo de recuperación FULL.
ALTER DATABASE agenda SET RECOVERY FULL;
GO

-- Domingo: la copia completa.
BACKUP DATABASE agenda TO DISK = 'agenda_completa.bak' WITH INIT;
GO

-- Lunes: Marco registra a Rosa. En la noche, la copia diferencial.
INSERT INTO agenda.dbo.contacto (nombre, correo) VALUES (N'Rosa Paz', 'rosa@correo.pe');
BACKUP DATABASE agenda TO DISK = 'agenda_diferencial.bak' WITH DIFFERENTIAL, INIT;
GO

-- Martes: registra a Pedro. Una hora después, la copia del log.
INSERT INTO agenda.dbo.contacto (nombre, correo) VALUES (N'Pedro Huamán', 'pedro@correo.pe');
BACKUP LOG agenda TO DISK = 'agenda_log.trn' WITH INIT;
GO

-- ======================================================================
-- 5. Volver en orden: completa, diferencial y log
-- ======================================================================

USE master;
GO

ALTER DATABASE agenda SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO

-- NORECOVERY: la base espera la siguiente copia. RECOVERY: queda lista para usarse.
RESTORE DATABASE agenda FROM DISK = 'agenda_completa.bak' WITH REPLACE, NORECOVERY;
RESTORE DATABASE agenda FROM DISK = 'agenda_diferencial.bak' WITH NORECOVERY;
RESTORE LOG agenda FROM DISK = 'agenda_log.trn' WITH RECOVERY;
GO

SELECT nombre FROM agenda.dbo.contacto;
GO

-- ======================================================================
-- 6. Monitoreo: ¿cuándo fue la última copia completa?
-- ======================================================================

-- msdb guarda la historia de las copias. type: D = completa, I = diferencial, L = log.
SELECT database_name, MAX(backup_finish_date) AS ultima_completa
FROM msdb.dbo.backupset
WHERE type = 'D'
GROUP BY database_name;
GO
