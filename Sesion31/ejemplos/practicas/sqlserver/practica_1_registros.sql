USE feria;
GO

INSERT INTO entrada (id, nombre, descripcion, precio, disponibles, venta_activa) VALUES
    (1, N'Entrada Fogón 2026',
     N'Acceso a los tres días de la feria: más de 40 stands, cocina en vivo y mercado de productores.',
     45.00, 500, 1);

-- Usuario "admin", contraseña "admin".
INSERT INTO administrador (id, usuario, contrasena) VALUES
    (1, 'admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918');
