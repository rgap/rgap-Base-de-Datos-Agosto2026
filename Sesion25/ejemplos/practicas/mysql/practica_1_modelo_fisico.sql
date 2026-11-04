-- Práctica 1 (MySQL 8), paso 1 de 2: modelo físico de la peluquería.
-- Después ejecuta practica_1_registros.sql.
CREATE DATABASE IF NOT EXISTS peluqueria;
USE peluqueria;

CREATE TABLE IF NOT EXISTS cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL CHECK (TRIM(nombre) <> ''),
    -- Opcional, pero no se repite.
    telefono VARCHAR(255) UNIQUE
);

CREATE TABLE IF NOT EXISTS mascota (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Opcional. Un cliente no tiene dos mascotas con el mismo nombre.
    nombre VARCHAR(255),
    especie VARCHAR(255) NOT NULL CHECK (TRIM(especie) <> ''),
    raza VARCHAR(255),
    cliente_id INT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    UNIQUE (cliente_id, nombre)
);

CREATE TABLE IF NOT EXISTS servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(nombre) <> ''),
    -- En minutos.
    duracion INT NOT NULL CHECK (duracion > 0),
    -- En soles.
    precio DECIMAL(18,2) NOT NULL CHECK (precio > 0),
    -- Posición en la lista.
    orden INT NOT NULL
);

CREATE TABLE IF NOT EXISTS empleado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(nombre) <> ''),
    -- Posición en la lista.
    orden INT NOT NULL
);

CREATE TABLE IF NOT EXISTS cita (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_hora DATETIME NOT NULL,
    estado VARCHAR(10) NOT NULL DEFAULT 'programada'
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

CREATE TABLE IF NOT EXISTS pago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- En soles.
    monto DECIMAL(18,2) NOT NULL CHECK (monto > 0),
    metodo VARCHAR(20) NOT NULL
        CHECK (metodo IN ('efectivo', 'tarjeta', 'transferencia')),
    -- Cada cita tiene como máximo un pago.
    cita_id INT NOT NULL UNIQUE,
    FOREIGN KEY (cita_id) REFERENCES cita(id)
);

-- Usuario y contraseña para entrar a la aplicación. Solo hay uno (id = 1).
CREATE TABLE IF NOT EXISTS encargado (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    usuario VARCHAR(255) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL
);
