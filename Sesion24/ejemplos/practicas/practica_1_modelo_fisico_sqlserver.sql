-- Práctica 1: crea la base peluqueria en SQL Server 2017 o superior.
-- Es el modelo físico del sistema de la peluquería, adaptado de SQLite a SQL Server.
-- Si la base ya existe, no borra nada.
-- GO separa los lotes de instrucciones en SSMS.

IF DB_ID('peluqueria') IS NULL
    CREATE DATABASE peluqueria;
GO
USE peluqueria;
GO

IF OBJECT_ID('cliente') IS NULL
CREATE TABLE cliente (
    id INT IDENTITY PRIMARY KEY,
    nombre NVARCHAR(255) NOT NULL CHECK (TRIM(nombre) <> ''),
    dni CHAR(8),
    -- El teléfono identifica y permite reutilizar un cliente (RN-02).
    -- La unicidad del dni y del teléfono va en índices al final.
    telefono NVARCHAR(255)
);

IF OBJECT_ID('mascota') IS NULL
CREATE TABLE mascota (
    id INT IDENTITY PRIMARY KEY,
    -- El nombre de la mascota es opcional (HU-01); si se indica, no se repite
    -- para el mismo cliente (RN-03). Esa regla va en un índice al final.
    nombre NVARCHAR(255),
    especie NVARCHAR(255) NOT NULL CHECK (TRIM(especie) <> ''),
    raza NVARCHAR(255),
    cliente_id INT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES cliente(id)
);

IF OBJECT_ID('servicio') IS NULL
CREATE TABLE servicio (
    id INT IDENTITY PRIMARY KEY,
    -- Nombre único (RN-08).
    nombre NVARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(nombre) <> ''),
    -- Duración en minutos: entero positivo (RN-08).
    duracion INT NOT NULL CHECK (duracion > 0),
    -- Precio en soles: positivo y con dos decimales (RN-08).
    precio DECIMAL(18,2) NOT NULL CHECK (precio > 0),
    -- Posición en el catálogo; el usuario la reordena arrastrando (RN-11).
    orden INT NOT NULL
);

IF OBJECT_ID('empleado') IS NULL
CREATE TABLE empleado (
    id INT IDENTITY PRIMARY KEY,
    -- Nombre único (RN-08).
    nombre NVARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(nombre) <> ''),
    dni CHAR(8),
    -- Posición en el catálogo; el usuario la reordena arrastrando (RN-11).
    orden INT NOT NULL
);

IF OBJECT_ID('cita') IS NULL
CREATE TABLE cita (
    id INT IDENTITY PRIMARY KEY,
    fecha_hora DATETIME2 NOT NULL,
    estado NVARCHAR(10) NOT NULL DEFAULT 'programada'
        CHECK (estado IN ('programada', 'completada', 'cancelada')),
    mascota_id INT NOT NULL,
    servicio_id INT NOT NULL,
    empleado_id INT NOT NULL,
    FOREIGN KEY (mascota_id) REFERENCES mascota(id),
    FOREIGN KEY (servicio_id) REFERENCES servicio(id),
    FOREIGN KEY (empleado_id) REFERENCES empleado(id),
    -- Un empleado no puede tener dos citas a la misma hora (RN-06).
    UNIQUE (empleado_id, fecha_hora)
);

IF OBJECT_ID('pago') IS NULL
CREATE TABLE pago (
    id INT IDENTITY PRIMARY KEY,
    -- Importe en soles: el precio total del servicio (RN-07).
    monto DECIMAL(18,2) NOT NULL CHECK (monto > 0),
    metodo NVARCHAR(20) NOT NULL
        CHECK (metodo IN ('efectivo', 'tarjeta', 'transferencia')),
    -- cita_id es único: cada cita admite como máximo un pago (RN-07).
    cita_id INT NOT NULL UNIQUE,
    FOREIGN KEY (cita_id) REFERENCES cita(id)
);

-- Credencial del encargado (acceso a la aplicación). El backend crea la primera
-- fila en el arranque inicial; la contraseña se guarda con hash, nunca en claro.
IF OBJECT_ID('encargado') IS NULL
CREATE TABLE encargado (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    usuario NVARCHAR(255) NOT NULL UNIQUE,
    contrasena NVARCHAR(255) NOT NULL
);
GO

-- Si la base viene de una sesión anterior, sus tablas no tienen dni: aquí se agrega.
IF COL_LENGTH('cliente', 'dni') IS NULL
    ALTER TABLE cliente ADD dni CHAR(8);
IF COL_LENGTH('empleado', 'dni') IS NULL
    ALTER TABLE empleado ADD dni CHAR(8);
GO

-- En SQL Server, UNIQUE solo admite un NULL. Con WHERE, la regla se aplica
-- solo cuando el dato existe: puede haber varios clientes sin teléfono.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_cliente_dni')
    CREATE UNIQUE INDEX ux_cliente_dni
        ON cliente (dni) WHERE dni IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_empleado_dni')
    CREATE UNIQUE INDEX ux_empleado_dni
        ON empleado (dni) WHERE dni IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_cliente_telefono')
    CREATE UNIQUE INDEX ux_cliente_telefono
        ON cliente (telefono) WHERE telefono IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_mascota_cliente_nombre')
    CREATE UNIQUE INDEX ux_mascota_cliente_nombre
        ON mascota (cliente_id, nombre) WHERE nombre IS NOT NULL;
GO

-- Servicios y empleados iniciales: la aplicación permite agregar y reordenar más.
IF NOT EXISTS (SELECT 1 FROM servicio)
INSERT INTO servicio (nombre, duracion, precio, orden) VALUES
    (N'Baño e higiene', 45, 35.00, 1),
    (N'Corte de pelo', 60, 55.00, 2),
    (N'Corte de uñas', 15, 15.00, 3),
    (N'Baño completo con corte', 90, 80.00, 4);

IF NOT EXISTS (SELECT 1 FROM empleado)
INSERT INTO empleado (nombre, orden) VALUES
    (N'Ana Torres', 1),
    (N'Bruno Díaz', 2),
    (N'Carla Núñez', 3);

UPDATE empleado SET dni = '43567012' WHERE nombre = N'Ana Torres';
UPDATE empleado SET dni = '48456901' WHERE nombre = N'Bruno Díaz';
UPDATE empleado SET dni = '44678123' WHERE nombre = N'Carla Núñez';
GO
