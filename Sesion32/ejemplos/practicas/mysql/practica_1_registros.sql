USE agenda;

INSERT INTO grupo (id, nombre, descripcion, color) VALUES
    (1, 'Familia', 'Padres, hermanos y primos.', 'rojo'),
    (2, 'Trabajo', 'Compañeros de la oficina.', 'azul'),
    (3, 'Amigos', NULL, 'gris');

INSERT INTO contacto (id, nombre, telefono, correo, es_favorito, fecha_registro) VALUES
    (1, 'Ana Torres', '987654321', 'ana@correo.pe', TRUE, '2026-01-15'),
    (2, 'Luis Ramos', '912345678', NULL, FALSE, '2026-03-02'),
    (3, 'Carla Díaz', NULL, 'carla@correo.pe', FALSE, '2026-05-20');

-- Ana está en Familia y en Trabajo, con un rol distinto en cada uno.
INSERT INTO contacto_grupo (contacto_id, grupo_id, rol) VALUES
    (1, 1, 'prima'),
    (1, 2, 'compañera'),
    (2, 2, 'jefe'),
    (3, 3, NULL);
