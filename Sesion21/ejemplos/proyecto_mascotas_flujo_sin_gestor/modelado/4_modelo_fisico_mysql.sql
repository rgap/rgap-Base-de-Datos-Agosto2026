-- Flujo A: físico para MySQL 8, a partir de 3_modelo_logico.dbml.
-- Se generó con dbml2sql --mysql y luego se revisó y completó a mano.

-- Base de datos con utf8mb4: guarda tildes, ñ y emojis.
-- La intercalación _ai_ci no distingue mayúsculas ni tildes al comparar.
CREATE DATABASE IF NOT EXISTS peluqueria
    CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE peluqueria;

-- ENGINE = InnoDB: el motor de MySQL que respeta las claves foráneas.
CREATE TABLE IF NOT EXISTS cliente (
    -- AUTO_INCREMENT: MySQL numera el id solo.
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    -- El teléfono identifica y permite reutilizar un cliente (RN-02).
    -- En MySQL, UNIQUE admite varios NULL: varios clientes sin teléfono.
    telefono VARCHAR(20) UNIQUE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS mascota (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- El nombre de la mascota es opcional (HU-01); si se indica, no se repite
    -- para el mismo cliente (RN-03).
    nombre VARCHAR(50),
    especie VARCHAR(30) NOT NULL,
    raza VARCHAR(50),
    cliente_id INT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    UNIQUE (cliente_id, nombre)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS servicio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Nombre único; la intercalación _ci no distingue mayúsculas (RN-08).
    nombre VARCHAR(100) NOT NULL UNIQUE,
    -- Duración en minutos: entero positivo (RN-08).
    duracion INT NOT NULL CHECK (duracion > 0),
    -- Precio en soles, con dos decimales exactos (RN-08).
    precio DECIMAL(8,2) NOT NULL CHECK (precio > 0),
    -- Posición en el catálogo; el usuario la reordena arrastrando (RN-11).
    orden INT NOT NULL
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS empleado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    -- Posición en el catálogo; el usuario la reordena arrastrando (RN-11).
    orden INT NOT NULL
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS cita (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_hora DATETIME NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'programada'
        CHECK (estado IN ('programada', 'completada', 'cancelada')),
    mascota_id INT NOT NULL,
    servicio_id INT NOT NULL,
    empleado_id INT NOT NULL,
    FOREIGN KEY (mascota_id) REFERENCES mascota(id),
    FOREIGN KEY (servicio_id) REFERENCES servicio(id),
    FOREIGN KEY (empleado_id) REFERENCES empleado(id),
    -- Un empleado no puede tener dos citas a la misma hora (RN-06).
    UNIQUE (empleado_id, fecha_hora)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS pago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Importe en soles: el precio total del servicio (RN-07).
    monto DECIMAL(8,2) NOT NULL,
    metodo VARCHAR(20) NOT NULL
        CHECK (metodo IN ('efectivo', 'tarjeta', 'transferencia')),
    -- cita_id es único: cada cita admite como máximo un pago (RN-07).
    cita_id INT NOT NULL UNIQUE,
    FOREIGN KEY (cita_id) REFERENCES cita(id)
) ENGINE = InnoDB;

-- Credencial del encargado (acceso a la aplicación). El backend crea la primera
-- fila en el arranque inicial; la contraseña se guarda con hash, nunca en claro.
CREATE TABLE IF NOT EXISTS encargado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL
) ENGINE = InnoDB;

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
