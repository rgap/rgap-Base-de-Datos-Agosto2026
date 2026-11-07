-- Práctica 1 (SQL Server 2017 o superior), paso 1 de 3: modelo físico de la venta
-- de entradas para una feria gastronómica. Después ejecuta practica_1_registros.sql.
-- GO separa los lotes de instrucciones en SSMS.
-- Si la base ya existe, la borra y la crea de nuevo.
USE master;
GO
IF DB_ID('feria') IS NOT NULL
BEGIN
    -- Cierra las conexiones abiertas a la base para poder borrarla.
    ALTER DATABASE feria SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE feria;
END
GO
CREATE DATABASE feria;
GO
USE feria;
GO

-- Una sola entrada, válida para los tres días de la feria.
CREATE TABLE entrada (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    nombre NVARCHAR(255) NOT NULL CHECK (TRIM(nombre) <> ''),
    descripcion NVARCHAR(255),
    -- En soles.
    precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
    -- Entradas que aún se pueden vender. Cada compra descuenta una.
    disponibles INT NOT NULL DEFAULT 0 CHECK (disponibles >= 0),
    -- 1 = venta abierta, 0 = venta cerrada.
    venta_activa BIT NOT NULL DEFAULT 1
);

-- Una entrada por persona, pagada en la pasarela simulada.
CREATE TABLE compra (
    id INT IDENTITY PRIMARY KEY,
    entrada_id INT NOT NULL DEFAULT 1 REFERENCES entrada(id),
    -- 8 dígitos. UNIQUE: cada persona compra una sola entrada.
    dni CHAR(8) NOT NULL UNIQUE CHECK (dni NOT LIKE '%[^0-9]%' AND LEN(dni) = 8),
    nombre NVARCHAR(255) NOT NULL CHECK (TRIM(nombre) <> ''),
    -- Precio de la entrada al momento de pagar.
    precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
    -- Lo que devuelve la pasarela. Un pago no se registra dos veces.
    referencia_pago NVARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(referencia_pago) <> ''),
    fecha_compra DATETIME2 NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Usuario y contraseña de la administración. Solo hay uno (id = 1).
CREATE TABLE administrador (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    usuario NVARCHAR(255) NOT NULL UNIQUE,
    contrasena NVARCHAR(255) NOT NULL
);
GO
