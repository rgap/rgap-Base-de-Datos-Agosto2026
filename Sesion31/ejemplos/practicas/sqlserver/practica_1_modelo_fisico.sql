-- Modelo físico de la feria (SQL Server).
-- Caso de estudio: venta de entradas para la feria gastronómica Fogón.

USE master;
GO

IF DB_ID('feria') IS NOT NULL
BEGIN
    ALTER DATABASE feria SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE feria;
END;
GO

CREATE DATABASE feria;
GO

USE feria;
GO

CREATE TABLE entrada (
    -- Una sola entrada, válida para los tres días.
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    nombre NVARCHAR(255) NOT NULL CHECK (TRIM(nombre) <> ''),
    descripcion NVARCHAR(500),
    precio DECIMAL(10, 2) NOT NULL CHECK (precio > 0),
    disponibles INT NOT NULL DEFAULT 0 CHECK (disponibles >= 0),
    venta_activa TINYINT NOT NULL DEFAULT 1 CHECK (venta_activa IN (0, 1))
);

CREATE TABLE venta (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    entrada_id INT NOT NULL DEFAULT 1,
    -- Una entrada por persona: 8 caracteres, todos dígitos.
    dni CHAR(8) NOT NULL UNIQUE CHECK (dni NOT LIKE '%[^0-9]%' AND LEN(dni) = 8),
    nombre NVARCHAR(120) NOT NULL CHECK (TRIM(nombre) <> ''),
    correo VARCHAR(254) NOT NULL CHECK (correo LIKE '%_@_%._%' AND correo NOT LIKE '% %'),
    -- Precio de la entrada al momento de pagar.
    precio DECIMAL(10, 2) NOT NULL CHECK (precio > 0),
    -- Un pago no se registra dos veces.
    referencia_pago VARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(referencia_pago) <> ''),
    fecha_venta DATETIME NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (entrada_id) REFERENCES entrada (id)
);

-- Credencial única de administración; contrasena es el SHA-256 en hexadecimal.
CREATE TABLE administrador (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    -- Con la intercalación _CS_ el usuario distingue mayúsculas.
    usuario VARCHAR(255) COLLATE Latin1_General_CS_AS NOT NULL UNIQUE,
    contrasena CHAR(64) NOT NULL
);
