-- Procedimientos almacenados, de lo simple a lo completo (SQL Server).
-- Caso de estudio: venta de entradas para la feria gastronómica Fogón.
-- Antes ejecuta la práctica 1 (ejemplos/practicas/sqlserver/): modelo físico y registros.
-- CREATE PROCEDURE y CREATE FUNCTION deben ser lo primero de su lote: por eso va GO antes.

USE feria_entrada;
GO

-- ---------------------------------------------------------------
-- 1. Sin parámetros y con una sola instrucción
-- ---------------------------------------------------------------

CREATE OR ALTER PROCEDURE dbo.ver_entrada
AS
SELECT nombre, precio, disponibles, venta_activa FROM entrada;
GO

EXEC dbo.ver_entrada;
GO

-- ---------------------------------------------------------------
-- 2. Con un parámetro de entrada
-- ---------------------------------------------------------------

CREATE OR ALTER PROCEDURE dbo.cambiar_disponibles
    @disponibles INT
AS
UPDATE entrada SET disponibles = @disponibles WHERE id = 1;
GO

EXEC dbo.cambiar_disponibles 300;
EXEC dbo.ver_entrada;
GO

-- ---------------------------------------------------------------
-- 3. Con un parámetro de salida (OUTPUT)
-- ---------------------------------------------------------------

-- El procedimiento escribe en @total; quien lo llama lo recibe en su propia variable.
CREATE OR ALTER PROCEDURE dbo.contar_ventas
    @total INT OUTPUT
AS
SELECT @total = COUNT(*) FROM venta;
GO

DECLARE @total INT;
EXEC dbo.contar_ventas @total OUTPUT;
SELECT @total AS total;
GO

-- ---------------------------------------------------------------
-- 4. Una función que lee una tabla: credencial_valida
-- ---------------------------------------------------------------

-- FUNCIÓN: credencial_valida
-- Devuelve 1 si el usuario y el hash SHA-256 de la
-- contraseña coinciden con la credencial de administración.
-- SQL Server no tiene BOOLEAN: devuelve BIT (1 o 0).
CREATE OR ALTER FUNCTION dbo.credencial_valida(@usuario VARCHAR(255), @contrasena_hash CHAR(64))
RETURNS BIT
AS
BEGIN
    IF EXISTS (
        SELECT 1 FROM administrador
        WHERE usuario = @usuario
          AND contrasena = @contrasena_hash
    )
        RETURN 1;
    RETURN 0;
END;
GO

-- HASHBYTES calcula el SHA-256; CONVERT con estilo 2 lo pasa a hexadecimal en minúsculas.
SELECT dbo.credencial_valida('admin', LOWER(CONVERT(CHAR(64), HASHBYTES('SHA2_256', 'admin'), 2))) AS valida;
SELECT dbo.credencial_valida('Admin', LOWER(CONVERT(CHAR(64), HASHBYTES('SHA2_256', 'admin'), 2))) AS valida;
GO

-- ---------------------------------------------------------------
-- 5. Con IF y un error propio: configurar_entrada
-- ---------------------------------------------------------------

-- PROCEDIMIENTO ALMACENADO: configurar_entrada
-- El administrador fija el precio, las entradas
-- disponibles y si la venta está abierta.
CREATE OR ALTER PROCEDURE dbo.configurar_entrada
    -- Más decimales que la columna, para rechazar un tercer decimal en vez de redondearlo.
    @precio DECIMAL(20, 6),
    @disponibles INT,
    @venta_activa TINYINT
AS
BEGIN
    IF @precio IS NULL OR @precio <= 0 OR @precio <> ROUND(@precio, 2)
        THROW 50000, N'El precio debe ser positivo y tener como máximo dos decimales.', 1;

    UPDATE entrada
    SET precio = @precio, disponibles = @disponibles, venta_activa = @venta_activa
    WHERE id = 1;
END;
GO

-- Un precio con tres decimales: el procedimiento se detiene y no cambia nada.
EXEC dbo.configurar_entrada 45.555, 500, 1;
GO

-- Un precio válido: vuelve a 45.00 y 500 entradas.
EXEC dbo.configurar_entrada 45.00, 500, 1;
EXEC dbo.ver_entrada;
GO

-- ---------------------------------------------------------------
-- 6. Con una transacción: comprar_entrada
-- ---------------------------------------------------------------

-- PROCEDIMIENTO ALMACENADO: comprar_entrada
-- Registra la compra de una entrada en una sola transacción.
-- Descuenta una entrada solo si la venta está abierta y quedan entradas, y
-- guarda la venta. Que el DNI y la referencia de pago no se repitan lo
-- aseguran los UNIQUE de venta: el INSERT falla y se deshace el descuento.
-- Devuelve el id y la fecha de la venta, el nombre de la entrada y el precio pagado.
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

        -- El UPDATE bloquea la entrada hasta el COMMIT: dos compras a la vez no
        -- venden más entradas de las que hay. Si no cambia ninguna fila,
        -- la venta está cerrada o no quedan entradas.
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

-- Luis Rojas compra su entrada.
DECLARE @venta_id INT, @fecha_venta DATETIME, @entrada NVARCHAR(255), @precio DECIMAL(10, 2);
EXEC dbo.comprar_entrada '70123456', N'Luis Rojas', 'luis.rojas@example.com', 'PAGO-0001',
     @venta_id OUTPUT, @fecha_venta OUTPUT, @entrada OUTPUT, @precio OUTPUT;
SELECT @venta_id AS venta_id, @fecha_venta AS fecha_venta, @entrada AS entrada, @precio AS precio;
GO

-- Luis intenta comprar otra con el mismo DNI: el UNIQUE rechaza el INSERT
-- y el procedimiento hace ROLLBACK (se deshace el descuento).
DECLARE @venta_id INT, @fecha_venta DATETIME, @entrada NVARCHAR(255), @precio DECIMAL(10, 2);
EXEC dbo.comprar_entrada '70123456', N'Luis Rojas', 'luis.rojas@example.com', 'PAGO-0002',
     @venta_id OUTPUT, @fecha_venta OUTPUT, @entrada OUTPUT, @precio OUTPUT;
GO

EXEC dbo.ver_entrada;
DECLARE @total INT;
EXEC dbo.contar_ventas @total OUTPUT;
SELECT @total AS total;
GO
