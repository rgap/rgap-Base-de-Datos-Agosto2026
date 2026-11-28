CREATE TABLE grupo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- La intercalación no distingue mayúsculas ni tildes: «Amigos» = «amigos» (Regla 4).
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    -- Un grupo nuevo es gris (Regla 4).
    color VARCHAR(20) DEFAULT 'gris'
        CHECK (color IN ('rojo', 'verde', 'azul', 'gris'))
);

CREATE TABLE contacto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(255) UNIQUE,
    es_favorito BOOLEAN NOT NULL DEFAULT FALSE,
    -- Hoy por defecto; que nunca sea futura lo cuidan los triggers (Regla 3).
    fecha_registro DATE NOT NULL
        DEFAULT (CURRENT_DATE)
);

-- Un contacto está en un mismo grupo una sola vez (Regla 5).
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

-- Regla 3: MySQL no acepta CURRENT_DATE en un CHECK (error 3814); lo hacen dos triggers.
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

-- ======================================================================
-- DATOS INICIALES (INSERT): registros que la base trae al crearse
-- ======================================================================

INSERT IGNORE INTO grupo (id, nombre, descripcion, color) VALUES
    (1, 'Familia', 'Padres, hermanos y primos.', 'rojo'),
    (2, 'Trabajo', 'Compañeros de la oficina.', 'azul'),
    (3, 'Amigos', NULL, 'gris');

INSERT IGNORE INTO contacto (id, nombre, telefono, correo, es_favorito, fecha_registro) VALUES
    (1, 'Ana Torres', '987654321', 'ana@correo.pe', TRUE, '2026-01-15'),
    (2, 'Luis Ramos', '912345678', NULL, FALSE, '2026-03-02'),
    (3, 'Carla Díaz', NULL, 'carla@correo.pe', FALSE, '2026-05-20');

-- Ana está en Familia y en Trabajo, con un rol distinto en cada uno.
INSERT IGNORE INTO contacto_grupo (contacto_id, grupo_id, rol) VALUES
    (1, 1, 'prima'),
    (1, 2, 'compañera'),
    (2, 2, 'jefe'),
    (3, 3, NULL);
