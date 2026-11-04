-- Práctica 3 (SQL Server 2017 o superior), paso 1 de 2: modelo físico del sistema
-- de cupones de descuento. Después ejecuta practica_3_registros.sql.
-- GO separa los lotes de instrucciones en SSMS.
IF DB_ID('cupones') IS NULL
    CREATE DATABASE cupones;
GO
USE cupones;
GO

IF OBJECT_ID('cupon') IS NULL
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
IF OBJECT_ID('administrador') IS NULL
CREATE TABLE administrador (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    usuario NVARCHAR(255) NOT NULL UNIQUE,
    contrasena NVARCHAR(255) NOT NULL
);
GO
