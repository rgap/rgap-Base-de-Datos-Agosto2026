-- Práctica 1: crea la base peluqueria en MySQL 8.
-- Es el modelo físico del sistema de la peluquería, adaptado de SQLite a MySQL.
-- Si la base ya existe, no borra nada.

CREATE DATABASE IF NOT EXISTS peluqueria;
USE peluqueria;

CREATE TABLE IF NOT EXISTS cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL CHECK (TRIM(nombre) <> ''),
    dni CHAR(8) UNIQUE,
    -- El teléfono identifica y permite reutilizar un cliente (RN-02).
    telefono VARCHAR(255) UNIQUE
);

CREATE TABLE IF NOT EXISTS mascota (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- El nombre de la mascota es opcional (HU-01); si se indica, no se repite
    -- para el mismo cliente (RN-03).
    nombre VARCHAR(255),
    especie VARCHAR(255) NOT NULL CHECK (TRIM(especie) <> ''),
    raza VARCHAR(255),
    cliente_id INT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    UNIQUE (cliente_id, nombre)
);

CREATE TABLE IF NOT EXISTS servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Nombre único (RN-08).
    nombre VARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(nombre) <> ''),
    -- Duración en minutos: entero positivo (RN-08).
    duracion INT NOT NULL CHECK (duracion > 0),
    -- Precio en soles: positivo y con dos decimales (RN-08).
    precio DECIMAL(18,2) NOT NULL CHECK (precio > 0),
    -- Posición en el catálogo; el usuario la reordena arrastrando (RN-11).
    orden INT NOT NULL
);

CREATE TABLE IF NOT EXISTS empleado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Nombre único (RN-08).
    nombre VARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(nombre) <> ''),
    dni CHAR(8) UNIQUE,
    -- Posición en el catálogo; el usuario la reordena arrastrando (RN-11).
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
    -- Un empleado no puede tener dos citas a la misma hora (RN-06).
    UNIQUE (empleado_id, fecha_hora)
);

CREATE TABLE IF NOT EXISTS pago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Importe en soles: el precio total del servicio (RN-07).
    monto DECIMAL(18,2) NOT NULL CHECK (monto > 0),
    metodo VARCHAR(20) NOT NULL
        CHECK (metodo IN ('efectivo', 'tarjeta', 'transferencia')),
    -- cita_id es único: cada cita admite como máximo un pago (RN-07).
    cita_id INT NOT NULL UNIQUE,
    FOREIGN KEY (cita_id) REFERENCES cita(id)
);

-- Credencial del encargado (acceso a la aplicación). El backend crea la primera
-- fila en el arranque inicial; la contraseña se guarda con hash, nunca en claro.
CREATE TABLE IF NOT EXISTS encargado (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    usuario VARCHAR(255) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL
);

-- Si la base viene de una sesión anterior, sus tablas no tienen dni: aquí se agrega.
SET @paso = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE cliente ADD COLUMN dni CHAR(8) UNIQUE AFTER nombre', 'DO 0')
             FROM information_schema.columns
             WHERE table_schema = 'peluqueria' AND table_name = 'cliente' AND column_name = 'dni');
PREPARE agregar_dni FROM @paso;
EXECUTE agregar_dni;

SET @paso = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE empleado ADD COLUMN dni CHAR(8) UNIQUE AFTER nombre', 'DO 0')
             FROM information_schema.columns
             WHERE table_schema = 'peluqueria' AND table_name = 'empleado' AND column_name = 'dni');
PREPARE agregar_dni FROM @paso;
EXECUTE agregar_dni;
DEALLOCATE PREPARE agregar_dni;

-- Servicios y empleados iniciales: la aplicación permite agregar y reordenar más.
INSERT IGNORE INTO servicio (id, nombre, duracion, precio, orden) VALUES
    (1, 'Baño e higiene', 45, 35.00, 1),
    (2, 'Corte de pelo', 60, 55.00, 2),
    (3, 'Corte de uñas', 15, 15.00, 3),
    (4, 'Baño completo con corte', 90, 80.00, 4);

INSERT IGNORE INTO empleado (id, nombre, orden) VALUES
    (1, 'Ana Torres', 1),
    (2, 'Bruno Díaz', 2),
    (3, 'Carla Núñez', 3);

UPDATE empleado SET dni = '43567012' WHERE nombre = 'Ana Torres';
UPDATE empleado SET dni = '48456901' WHERE nombre = 'Bruno Díaz';
UPDATE empleado SET dni = '44678123' WHERE nombre = 'Carla Núñez';
