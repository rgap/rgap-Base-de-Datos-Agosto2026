USE agenda;
GO

-- IDENTITY_INSERT deja escribir el id a mano.
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
