CREATE TABLE contacto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL
);

INSERT INTO contacto (nombre, telefono) VALUES
    ('Ana Torres', '987654321'),
    ('Luis Ramos', '912345678'),
    ('María Quispe', '956789123');
