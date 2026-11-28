-- Modelo físico de la agenda de contactos (MySQL).
-- Caso de estudio: la agenda de Marco, con sus contactos y sus grupos.

DROP DATABASE IF EXISTS agenda;
CREATE DATABASE agenda;
USE agenda;

CREATE TABLE grupo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- La intercalación no distingue mayúsculas ni tildes: «Amigos» = «amigos».
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    -- Un grupo nuevo es gris.
    color VARCHAR(20) DEFAULT 'gris'
        CHECK (color IN ('rojo', 'verde', 'azul', 'gris'))
);

CREATE TABLE contacto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(255) UNIQUE,
    es_favorito BOOLEAN NOT NULL DEFAULT FALSE,
    -- Hoy por defecto; que nunca sea futura lo cuidan los triggers.
    fecha_registro DATE NOT NULL
        DEFAULT (CURRENT_DATE)
);

-- Un contacto está en un mismo grupo una sola vez.
CREATE TABLE contacto_grupo (
    contacto_id INT,
    grupo_id INT,
    rol VARCHAR(50),
    PRIMARY KEY (contacto_id, grupo_id),
    FOREIGN KEY (contacto_id) REFERENCES contacto (id),
    FOREIGN KEY (grupo_id) REFERENCES grupo (id)
);

-- ======================================================================
-- TRIGGERS
-- ======================================================================

-- MySQL no acepta CURRENT_DATE en un CHECK (error 3814): lo cumplen dos triggers.
DELIMITER //

CREATE TRIGGER contacto_fecha_no_futura_al_registrar
BEFORE INSERT ON contacto
FOR EACH ROW
BEGIN
    IF NEW.fecha_registro > CURRENT_DATE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La fecha de registro no puede ser futura.';
    END IF;
END //

CREATE TRIGGER contacto_fecha_no_futura_al_corregir
BEFORE UPDATE ON contacto
FOR EACH ROW
BEGIN
    IF NEW.fecha_registro > CURRENT_DATE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La fecha de registro no puede ser futura.';
    END IF;
END //

DELIMITER ;
