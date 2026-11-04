-- Práctica 1 (SQL Server 2017 o superior), paso 1 de 2: modelo físico de la peluquería.
-- Después ejecuta practica_1_registros.sql.
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
    -- Opcional, pero no se repite.
    telefono NVARCHAR(255) UNIQUE
);

IF OBJECT_ID('mascota') IS NULL
CREATE TABLE mascota (
    id INT IDENTITY PRIMARY KEY,
    -- Opcional. Un cliente no tiene dos mascotas con el mismo nombre.
    nombre NVARCHAR(255),
    especie NVARCHAR(255) NOT NULL CHECK (TRIM(especie) <> ''),
    raza NVARCHAR(255),
    cliente_id INT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    UNIQUE (cliente_id, nombre)
);

IF OBJECT_ID('servicio') IS NULL
CREATE TABLE servicio (
    id INT IDENTITY PRIMARY KEY,
    nombre NVARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(nombre) <> ''),
    -- En minutos.
    duracion INT NOT NULL CHECK (duracion > 0),
    -- En soles.
    precio DECIMAL(18,2) NOT NULL CHECK (precio > 0),
    -- Posición en la lista.
    orden INT NOT NULL
);

IF OBJECT_ID('empleado') IS NULL
CREATE TABLE empleado (
    id INT IDENTITY PRIMARY KEY,
    nombre NVARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(nombre) <> ''),
    -- Posición en la lista.
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
    -- Un empleado no tiene dos citas a la misma hora.
    UNIQUE (empleado_id, fecha_hora)
);

IF OBJECT_ID('pago') IS NULL
CREATE TABLE pago (
    id INT IDENTITY PRIMARY KEY,
    -- En soles.
    monto DECIMAL(18,2) NOT NULL CHECK (monto > 0),
    metodo NVARCHAR(20) NOT NULL
        CHECK (metodo IN ('efectivo', 'tarjeta', 'transferencia')),
    -- Cada cita tiene como máximo un pago.
    cita_id INT NOT NULL UNIQUE,
    FOREIGN KEY (cita_id) REFERENCES cita(id)
);

-- Usuario y contraseña para entrar a la aplicación. Solo hay uno (id = 1).
IF OBJECT_ID('encargado') IS NULL
CREATE TABLE encargado (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    usuario NVARCHAR(255) NOT NULL UNIQUE,
    contrasena NVARCHAR(255) NOT NULL
);
GO
