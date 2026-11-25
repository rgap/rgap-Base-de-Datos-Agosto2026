-- Usuarios, permisos, roles y copia de seguridad (SQL Server).
-- Caso de estudio: venta de entradas para la feria gastronómica Fogón.
-- Antes ejecuta otra vez la práctica 1 (ejemplos/practicas/sqlserver/): la base sin triggers.
-- Ejecútalo por partes. CREATE PROCEDURE y CREATE VIEW deben ser lo primero de su lote.

USE feria_entrada;
GO

-- ---------------------------------------------------------------
-- 1. El procedimiento que usará la aplicación (sesión 30)
-- ---------------------------------------------------------------

-- PROCEDIMIENTO ALMACENADO: comprar_entrada
-- Registra la compra de una entrada en una sola transacción.
CREATE OR ALTER PROCEDURE dbo.comprar_entrada
    @dni CHAR(8),
    @nombre NVARCHAR(120),
    @correo VARCHAR(254),
    @referencia_pago VARCHAR(255),
    @venta_id INT OUTPUT,
    @fecha_venta DATETIME OUTPUT,
    @entrada NVARCHAR(255) OUTPUT,
    @precio DECIMAL(10, 2) OUTPUT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE entrada
        SET disponibles = disponibles - 1
        WHERE id = 1
          AND disponibles > 0
          AND venta_activa = 1;

        IF @@ROWCOUNT = 0
            THROW 50000, N'Venta cerrada o entradas agotadas.', 1;

        SELECT @entrada = nombre, @precio = precio
        FROM entrada
        WHERE id = 1;

        INSERT INTO venta (entrada_id, dni, nombre, correo, precio, referencia_pago)
        VALUES (1, @dni, TRIM(@nombre), TRIM(@correo), @precio, TRIM(@referencia_pago));

        SELECT @venta_id = id, @fecha_venta = fecha_venta
        FROM venta
        WHERE id = SCOPE_IDENTITY();

        COMMIT;
    END TRY
    BEGIN CATCH
        -- Ante cualquier error se deshace todo y se vuelve a lanzar el error.
        IF @@TRANCOUNT > 0
            ROLLBACK;
        THROW;
    END CATCH;
END;
GO

-- ---------------------------------------------------------------
-- 2. Una vista sin datos personales, para contabilidad
-- ---------------------------------------------------------------

-- Cuántas ventas hay y cuánto se recaudó. Sin DNI, nombres ni correos.
CREATE OR ALTER VIEW dbo.resumen_ventas AS
SELECT COUNT(*) AS ventas, COALESCE(SUM(precio), 0) AS recaudado
FROM venta;
GO

-- ---------------------------------------------------------------
-- 3. El usuario de la aplicación: un login y un usuario
-- ---------------------------------------------------------------

-- El login entra al servidor; el usuario, a una base.
IF SUSER_ID('app_feria') IS NOT NULL
    DROP LOGIN app_feria;

CREATE LOGIN app_feria WITH PASSWORD = 'Feria#2026';
CREATE USER app_feria FOR LOGIN app_feria;
GO

-- ---------------------------------------------------------------
-- 4. Sus permisos: leer y comprar, nada más
-- ---------------------------------------------------------------

GRANT SELECT ON dbo.entrada TO app_feria;
GRANT SELECT ON dbo.venta TO app_feria;
GRANT EXECUTE ON dbo.comprar_entrada TO app_feria;

-- Los permisos que tiene app_feria en esta base.
SELECT OBJECT_NAME(major_id) AS objeto, permission_name AS permiso
FROM sys.database_permissions
WHERE grantee_principal_id = USER_ID('app_feria') AND major_id > 0;
GO

-- ---------------------------------------------------------------
-- 5. Pruébalo: EXECUTE AS ejecuta como si fueras app_feria
-- ---------------------------------------------------------------

EXECUTE AS USER = 'app_feria';

SELECT nombre, precio, disponibles FROM entrada;
GO

UPDATE entrada SET precio = 1.00 WHERE id = 1;
GO

INSERT INTO venta (dni, nombre, correo, precio, referencia_pago)
VALUES ('70123456', N'Luis Rojas', 'luis.rojas@example.com', 1.00, 'PAGO-0001');
GO

DECLARE @venta_id INT, @fecha_venta DATETIME, @entrada NVARCHAR(255), @precio DECIMAL(10, 2);
EXEC dbo.comprar_entrada '70123456', N'Luis Rojas', 'luis.rojas@example.com', 'PAGO-0001',
     @venta_id OUTPUT, @fecha_venta OUTPUT, @entrada OUTPUT, @precio OUTPUT;

SELECT nombre, precio, disponibles FROM entrada;
GO

-- Vuelve a ser tú.
REVERT;
GO

-- ---------------------------------------------------------------
-- 6. Quitar un permiso: REVOKE
-- ---------------------------------------------------------------

-- Alguien le dio a la aplicación un permiso que no necesita.
GRANT INSERT ON dbo.venta TO app_feria;

REVOKE INSERT ON dbo.venta FROM app_feria;
GO

-- ---------------------------------------------------------------
-- 7. Un rol para contabilidad
-- ---------------------------------------------------------------

DROP USER IF EXISTS carmen;
DROP USER IF EXISTS jorge;
DROP ROLE IF EXISTS contabilidad;

-- El rol junta los permisos; las personas reciben el rol.
CREATE ROLE contabilidad;
GRANT SELECT ON dbo.resumen_ventas TO contabilidad;

IF SUSER_ID('carmen') IS NOT NULL DROP LOGIN carmen;
IF SUSER_ID('jorge') IS NOT NULL DROP LOGIN jorge;
CREATE LOGIN carmen WITH PASSWORD = 'Carmen#2026';
CREATE LOGIN jorge WITH PASSWORD = 'Jorge#2026';
CREATE USER carmen FOR LOGIN carmen;
CREATE USER jorge FOR LOGIN jorge;

ALTER ROLE contabilidad ADD MEMBER carmen;
ALTER ROLE contabilidad ADD MEMBER jorge;
GO

-- ---------------------------------------------------------------
-- 8. Pruébalo como carmen
-- ---------------------------------------------------------------

EXECUTE AS USER = 'carmen';

SELECT * FROM resumen_ventas;
GO

SELECT dni, nombre, correo FROM venta;
GO

REVERT;
GO

-- ---------------------------------------------------------------
-- 9. Jorge deja contabilidad: se le quita el rol
-- ---------------------------------------------------------------

ALTER ROLE contabilidad DROP MEMBER jorge;
GO

EXECUTE AS USER = 'jorge';

SELECT * FROM resumen_ventas;
GO

REVERT;
GO

-- ---------------------------------------------------------------
-- 10. Copia de seguridad
-- ---------------------------------------------------------------

-- Sin ruta, el archivo va a la carpeta de copias de SQL Server.
-- WITH INIT: reemplaza lo que ya tenía el archivo.
BACKUP DATABASE feria_entrada TO DISK = 'feria_entrada.bak' WITH INIT;
GO

-- Simula un error, solo si la copia terminó bien (quita los -- y ejecútalo):
-- DROP TABLE venta;
-- SELECT COUNT(*) FROM venta;

-- Volver a la copia: desde master, sin nadie conectado a la base.
-- WITH REPLACE: reemplaza la base que ya existe.
USE master;
GO

ALTER DATABASE feria_entrada SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE feria_entrada FROM DISK = 'feria_entrada.bak' WITH REPLACE;
GO

USE feria_entrada;
GO

SELECT dni, nombre, precio FROM venta;
GO
