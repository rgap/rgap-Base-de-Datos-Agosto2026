-- Modelo físico de la agenda de contactos (SQL Server).
-- Caso de estudio: la agenda de Marco, con sus contactos y sus grupos.

USE master;
GO

IF DB_ID('agenda') IS NOT NULL
BEGIN
    ALTER DATABASE agenda SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE agenda;
END;
GO

CREATE DATABASE agenda;
GO

USE agenda;
GO

CREATE TABLE grupo (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    -- La intercalación no distingue mayúsculas ni tildes: «Amigos» = «amigos».
    nombre NVARCHAR(50) COLLATE Latin1_General_CI_AI NOT NULL UNIQUE,
    descripcion NVARCHAR(MAX),
    -- Un grupo nuevo es gris.
    color VARCHAR(20) DEFAULT 'gris'
        CHECK (color IN ('rojo', 'verde', 'azul', 'gris'))
);

CREATE TABLE contacto (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(255),
    es_favorito BIT NOT NULL DEFAULT 0,
    -- Hoy por defecto; que nunca sea futura lo cuidan los triggers.
    fecha_registro DATE NOT NULL
        DEFAULT CAST(GETDATE() AS DATE)
);

-- Un correo no se repite. UNIQUE admitiría un solo NULL:
-- el índice filtrado deja varios contactos sin correo.
CREATE UNIQUE INDEX contacto_correo_unico
    ON contacto (correo) WHERE correo IS NOT NULL;

-- Un contacto está en un mismo grupo una sola vez.
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

-- No hay BEFORE: son AFTER y, si una fila trae una fecha futura,
-- THROW deshace la instrucción completa.
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
