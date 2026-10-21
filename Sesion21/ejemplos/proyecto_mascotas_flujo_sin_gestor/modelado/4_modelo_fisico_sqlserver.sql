-- Flujo A: físico para SQL Server, a partir de 3_modelo_logico.dbml.
-- Se generó con dbml2sql --mssql y luego se revisó y completó a mano.
-- GO separa los lotes de instrucciones en SSMS.

IF DB_ID(N'peluqueria') IS NULL
    CREATE DATABASE peluqueria;
GO
USE peluqueria;
GO

-- SQL Server no tiene CREATE TABLE IF NOT EXISTS: se pregunta con OBJECT_ID.
-- NVARCHAR guarda texto Unicode: tildes, ñ y cualquier alfabeto.
IF OBJECT_ID(N'dbo.cliente', N'U') IS NULL
CREATE TABLE cliente (
    -- IDENTITY(1, 1): SQL Server numera el id desde 1, de 1 en 1.
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    -- El teléfono identifica y permite reutilizar un cliente (RN-02).
    -- Su unicidad va en un índice filtrado (más abajo): en SQL Server,
    -- UNIQUE solo admitiría un cliente sin teléfono.
    telefono NVARCHAR(20)
);
GO

IF OBJECT_ID(N'dbo.mascota', N'U') IS NULL
CREATE TABLE mascota (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    -- El nombre de la mascota es opcional (HU-01); si se indica, no se repite
    -- para el mismo cliente (RN-03): también con índice filtrado.
    nombre NVARCHAR(50),
    especie NVARCHAR(30) NOT NULL,
    raza NVARCHAR(50),
    cliente_id INT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES cliente(id)
);
GO

IF OBJECT_ID(N'dbo.servicio', N'U') IS NULL
CREATE TABLE servicio (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    -- Nombre único; la intercalación por defecto no distingue mayúsculas (RN-08).
    nombre NVARCHAR(100) NOT NULL UNIQUE,
    -- Duración en minutos: entero positivo (RN-08).
    duracion INT NOT NULL CHECK (duracion > 0),
    -- Precio en soles, con dos decimales exactos (RN-08).
    precio DECIMAL(8,2) NOT NULL CHECK (precio > 0),
    -- Posición en el catálogo; el usuario la reordena arrastrando (RN-11).
    orden INT NOT NULL
);
GO

IF OBJECT_ID(N'dbo.empleado', N'U') IS NULL
CREATE TABLE empleado (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL UNIQUE,
    -- Posición en el catálogo; el usuario la reordena arrastrando (RN-11).
    orden INT NOT NULL
);
GO

IF OBJECT_ID(N'dbo.cita', N'U') IS NULL
CREATE TABLE cita (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    -- DATETIME2: el tipo de fecha y hora recomendado en SQL Server.
    fecha_hora DATETIME2 NOT NULL,
    estado NVARCHAR(20) NOT NULL DEFAULT N'programada'
        CHECK (estado IN (N'programada', N'completada', N'cancelada')),
    mascota_id INT NOT NULL,
    servicio_id INT NOT NULL,
    empleado_id INT NOT NULL,
    FOREIGN KEY (mascota_id) REFERENCES mascota(id),
    FOREIGN KEY (servicio_id) REFERENCES servicio(id),
    FOREIGN KEY (empleado_id) REFERENCES empleado(id),
    -- Un empleado no puede tener dos citas a la misma hora (RN-06).
    UNIQUE (empleado_id, fecha_hora)
);
GO

IF OBJECT_ID(N'dbo.pago', N'U') IS NULL
CREATE TABLE pago (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    -- Importe en soles: el precio total del servicio (RN-07).
    monto DECIMAL(8,2) NOT NULL,
    metodo NVARCHAR(20) NOT NULL
        CHECK (metodo IN (N'efectivo', N'tarjeta', N'transferencia')),
    -- cita_id es único: cada cita admite como máximo un pago (RN-07).
    cita_id INT NOT NULL UNIQUE,
    FOREIGN KEY (cita_id) REFERENCES cita(id)
);
GO

-- Credencial del encargado (acceso a la aplicación). El backend crea la primera
-- fila en el arranque inicial; la contraseña se guarda con hash, nunca en claro.
IF OBJECT_ID(N'dbo.encargado', N'U') IS NULL
CREATE TABLE encargado (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    usuario NVARCHAR(50) NOT NULL UNIQUE,
    contrasena NVARCHAR(255) NOT NULL
);
GO

-- Índices filtrados: la unicidad solo se exige cuando el dato existe.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ux_cliente_telefono')
    CREATE UNIQUE INDEX ux_cliente_telefono
        ON cliente (telefono) WHERE telefono IS NOT NULL;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ux_mascota_cliente_nombre')
    CREATE UNIQUE INDEX ux_mascota_cliente_nombre
        ON mascota (cliente_id, nombre) WHERE nombre IS NOT NULL;
GO

-- Servicios y empleados iniciales: la aplicación permite agregar y reordenar más.
-- IDENTITY_INSERT permite indicar el id a mano solo durante esta carga.
IF NOT EXISTS (SELECT 1 FROM servicio)
BEGIN
    SET IDENTITY_INSERT servicio ON;
    INSERT INTO servicio (id, nombre, duracion, precio, orden) VALUES
        (1, N'Baño e higiene', 45, 35.00, 1),
        (2, N'Corte de pelo', 60, 55.00, 2),
        (3, N'Corte de uñas', 15, 15.00, 3),
        (4, N'Baño completo con corte', 90, 80.00, 4);
    SET IDENTITY_INSERT servicio OFF;
END;

IF NOT EXISTS (SELECT 1 FROM empleado)
BEGIN
    SET IDENTITY_INSERT empleado ON;
    INSERT INTO empleado (id, nombre, orden) VALUES
        (1, N'Ana Torres', 1),
        (2, N'Bruno Díaz', 2),
        (3, N'Carla Núñez', 3);
    SET IDENTITY_INSERT empleado OFF;
END;
GO
