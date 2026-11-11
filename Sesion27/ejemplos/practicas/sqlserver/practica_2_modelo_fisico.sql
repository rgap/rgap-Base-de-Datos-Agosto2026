-- Práctica 2 (SQL Server 2017 o superior), paso 1 de 2: modelo físico del sistema
-- de cupones de descuento. Después ejecuta practica_2_registros.sql.
-- GO separa los lotes de instrucciones en SSMS.
-- Si la base ya existe, la borra y la crea de nuevo.
USE master;
GO
IF DB_ID('cupones') IS NOT NULL
BEGIN
    -- Cierra las conexiones abiertas a la base para poder borrarla.
    ALTER DATABASE cupones SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE cupones;
END
GO
CREATE DATABASE cupones;
GO
USE cupones;
GO

CREATE TABLE cupon (
    id INT IDENTITY PRIMARY KEY,
    codigo NVARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(codigo) <> ''),
    descripcion NVARCHAR(255) NOT NULL CHECK (TRIM(descripcion) <> ''),
    tipo_descuento NVARCHAR(10) NOT NULL
        CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
    -- Porcentaje (10 = 10 %) o soles, según el tipo.
    valor_descuento DECIMAL(10,2) NOT NULL CHECK (valor_descuento > 0),
    estado NVARCHAR(8) NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo')),
    vigente_desde DATETIME2 NOT NULL,
    -- Opcional: sin fecha de fin.
    vigente_hasta DATETIME2,
    CHECK (tipo_descuento <> 'porcentaje' OR valor_descuento <= 100),
    CHECK (vigente_hasta IS NULL OR vigente_hasta > vigente_desde)
);

-- Usuario y contraseña para entrar al panel. Solo hay uno (id = 1).
CREATE TABLE administrador (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    usuario NVARCHAR(255) NOT NULL UNIQUE,
    contrasena NVARCHAR(255) NOT NULL
);
GO
