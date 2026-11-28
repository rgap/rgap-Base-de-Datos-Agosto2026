-- El mismo modelo físico de modelo_fisico_mysql.sql, en SQL Server.
-- Se ejecuta en una base vacía: antes, CREATE DATABASE agenda; y USE agenda;

CREATE TABLE grupo (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    -- La intercalación no distingue mayúsculas ni tildes: «Amigos» = «amigos» (Regla 4).
    nombre NVARCHAR(50) COLLATE Latin1_General_CI_AI NOT NULL UNIQUE,
    descripcion NVARCHAR(MAX),
    -- Un grupo nuevo es gris (Regla 4).
    color VARCHAR(20) DEFAULT 'gris'
        CHECK (color IN ('rojo', 'verde', 'azul', 'gris'))
);

CREATE TABLE contacto (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(255),
    es_favorito BIT NOT NULL DEFAULT 0,
    -- Hoy por defecto; que nunca sea futura lo cuidan los triggers (Regla 3).
    fecha_registro DATE NOT NULL
        DEFAULT CAST(GETDATE() AS DATE)
);

-- Un correo no se repite. En SQL Server, UNIQUE admite un solo NULL:
-- el índice filtrado deja varios contactos sin correo, como en MySQL.
CREATE UNIQUE INDEX contacto_correo_unico
    ON contacto (correo) WHERE correo IS NOT NULL;

-- Un contacto está en un mismo grupo una sola vez (Regla 5).
CREATE TABLE contacto_grupo (
    contacto_id INT,
    grupo_id INT,
    rol NVARCHAR(50),
    PRIMARY KEY (contacto_id, grupo_id),
    FOREIGN KEY (contacto_id) REFERENCES contacto (id),
    FOREIGN KEY (grupo_id) REFERENCES grupo (id)
);
GO

-- ======================================================================
-- TRIGGERS
-- ======================================================================

-- Regla 3: los mismos dos triggers del modelo MySQL. No hay BEFORE: son AFTER
-- y, si una fila trae una fecha futura, THROW deshace la instrucción completa.
CREATE TRIGGER contacto_fecha_no_futura_al_registrar
ON contacto
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted WHERE fecha_registro > CAST(GETDATE() AS DATE))
        THROW 50000, N'La fecha de registro no puede ser futura.', 1;
END;
GO

CREATE TRIGGER contacto_fecha_no_futura_al_corregir
ON contacto
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted WHERE fecha_registro > CAST(GETDATE() AS DATE))
        THROW 50000, N'La fecha de registro no puede ser futura.', 1;
END;
GO

-- ======================================================================
-- DATOS INICIALES (INSERT): registros que la base trae al crearse
-- ======================================================================

-- IDENTITY_INSERT deja escribir el id a mano, como en el modelo MySQL.
SET IDENTITY_INSERT grupo ON;
INSERT INTO grupo (id, nombre, descripcion, color) VALUES
    (1, N'Familia', N'Padres, hermanos y primos.', 'rojo'),
    (2, N'Trabajo', N'Compañeros de la oficina.', 'azul'),
    (3, N'Amigos', NULL, 'gris');
SET IDENTITY_INSERT grupo OFF;

SET IDENTITY_INSERT contacto ON;
INSERT INTO contacto (id, nombre, telefono, correo, es_favorito, fecha_registro) VALUES
    (1, N'Ana Torres', '987654321', 'ana@correo.pe', 1, '2026-01-15'),
    (2, N'Luis Ramos', '912345678', NULL, 0, '2026-03-02'),
    (3, N'Carla Díaz', NULL, 'carla@correo.pe', 0, '2026-05-20');
SET IDENTITY_INSERT contacto OFF;

-- Ana está en Familia y en Trabajo, con un rol distinto en cada uno.
INSERT INTO contacto_grupo (contacto_id, grupo_id, rol) VALUES
    (1, 1, N'prima'),
    (1, 2, N'compañera'),
    (2, 2, N'jefe'),
    (3, 3, NULL);
GO
