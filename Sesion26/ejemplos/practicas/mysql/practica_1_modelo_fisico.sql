-- Práctica 1 (MySQL 8), paso 1 de 3: modelo físico de la venta de entradas
-- para una feria gastronómica. Después ejecuta practica_1_registros.sql.
-- Si la base ya existe, la borra y la crea de nuevo.
DROP DATABASE IF EXISTS feria;
CREATE DATABASE feria;
USE feria;

-- Una sola entrada, válida para los tres días de la feria.
CREATE TABLE entrada (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    nombre VARCHAR(255) NOT NULL CHECK (TRIM(nombre) <> ''),
    descripcion VARCHAR(255),
    -- En soles.
    precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
    -- Entradas que aún se pueden vender. Cada compra descuenta una.
    disponibles INT NOT NULL DEFAULT 0 CHECK (disponibles >= 0),
    -- 1 = venta abierta, 0 = venta cerrada.
    venta_activa TINYINT NOT NULL DEFAULT 1 CHECK (venta_activa IN (0, 1))
);

-- Una entrada por persona, pagada en la pasarela simulada.
CREATE TABLE compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entrada_id INT NOT NULL DEFAULT 1,
    -- 8 dígitos. UNIQUE: cada persona compra una sola entrada.
    dni CHAR(8) NOT NULL UNIQUE CHECK (dni REGEXP '^[0-9]{8}$'),
    nombre VARCHAR(255) NOT NULL CHECK (TRIM(nombre) <> ''),
    -- Precio de la entrada al momento de pagar.
    precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
    -- Lo que devuelve la pasarela. Un pago no se registra dos veces.
    referencia_pago VARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(referencia_pago) <> ''),
    fecha_compra DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entrada_id) REFERENCES entrada(id)
);

-- Usuario y contraseña de la administración. Solo hay uno (id = 1).
CREATE TABLE administrador (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    usuario VARCHAR(255) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL
);
