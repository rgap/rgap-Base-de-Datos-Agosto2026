-- Modelo físico de la feria (MySQL).
-- Caso de estudio: venta de entradas para la feria gastronómica Fogón.

DROP DATABASE IF EXISTS feria;
CREATE DATABASE feria;
USE feria;

CREATE TABLE entrada (
    -- Una sola entrada, válida para los tres días.
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    nombre VARCHAR(255) NOT NULL CHECK (TRIM(nombre) <> ''),
    descripcion VARCHAR(500),
    precio DECIMAL(10, 2) NOT NULL CHECK (precio > 0),
    disponibles INT NOT NULL DEFAULT 0 CHECK (disponibles >= 0),
    venta_activa TINYINT NOT NULL DEFAULT 1 CHECK (venta_activa IN (0, 1))
);

CREATE TABLE venta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entrada_id INT NOT NULL DEFAULT 1,
    -- Una entrada por persona.
    dni CHAR(8) NOT NULL UNIQUE CHECK (dni REGEXP '^[0-9]{8}$'),
    nombre VARCHAR(120) NOT NULL CHECK (TRIM(nombre) <> ''),
    correo VARCHAR(254) NOT NULL CHECK (correo LIKE '%_@_%._%' AND correo NOT LIKE '% %'),
    -- Precio de la entrada al momento de pagar.
    precio DECIMAL(10, 2) NOT NULL CHECK (precio > 0),
    -- Un pago no se registra dos veces.
    referencia_pago VARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(referencia_pago) <> ''),
    fecha_venta DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    FOREIGN KEY (entrada_id) REFERENCES entrada (id)
);

-- Credencial única de administración; contrasena es el SHA-256 en hexadecimal.
CREATE TABLE administrador (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    -- VARBINARY compara bytes: el usuario distingue mayúsculas.
    usuario VARBINARY(255) NOT NULL UNIQUE,
    contrasena CHAR(64) NOT NULL
);
