-- Práctica 2 (MySQL 8), paso 1 de 2: modelo físico del sistema de cupones de descuento.
-- Después ejecuta practica_2_registros.sql.
-- Si la base ya existe, la borra y la crea de nuevo.
DROP DATABASE IF EXISTS cupones;
CREATE DATABASE cupones;
USE cupones;

CREATE TABLE cupon (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(codigo) <> ''),
    descripcion VARCHAR(255) NOT NULL CHECK (TRIM(descripcion) <> ''),
    tipo_descuento VARCHAR(10) NOT NULL
        CHECK (tipo_descuento IN ('porcentaje', 'monto_fijo')),
    -- Porcentaje (10 = 10 %) o soles, según el tipo.
    valor_descuento DECIMAL(10,2) NOT NULL CHECK (valor_descuento > 0),
    estado VARCHAR(8) NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo')),
    vigente_desde DATETIME NOT NULL,
    -- Opcional: sin fecha de fin.
    vigente_hasta DATETIME,
    CHECK (tipo_descuento <> 'porcentaje' OR valor_descuento <= 100),
    CHECK (vigente_hasta IS NULL OR vigente_hasta > vigente_desde)
);

-- Usuario y contraseña para entrar al panel. Solo hay uno (id = 1).
CREATE TABLE administrador (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    usuario VARCHAR(255) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL
);
