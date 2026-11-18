CREATE TABLE entrada (
    -- Una sola entrada, válida para los tres días (RN-01).
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    nombre TEXT NOT NULL CHECK (trim(nombre) <> ''),
    descripcion TEXT,
    precio REAL NOT NULL CHECK (precio > 0 AND round(precio, 2) = precio),
    disponibles INTEGER NOT NULL DEFAULT 0 CHECK (typeof(disponibles) = 'integer' AND disponibles >= 0),
    venta_activa INTEGER NOT NULL DEFAULT 1 CHECK (venta_activa IN (0, 1))
);

CREATE TABLE venta (
    id INTEGER PRIMARY KEY,
    entrada_id INTEGER NOT NULL DEFAULT 1 REFERENCES entrada(id),
    -- Una entrada por persona (RN-04).
    dni TEXT NOT NULL UNIQUE CHECK (length(dni) = 8 AND dni NOT GLOB '*[^0-9]*'),
    nombre TEXT NOT NULL CHECK (trim(nombre) <> ''),
    correo TEXT NOT NULL CHECK (correo LIKE '%_@_%._%' AND correo NOT LIKE '% %'),
    -- Precio de la entrada al momento de pagar (RN-08).
    precio REAL NOT NULL CHECK (precio > 0 AND round(precio, 2) = precio),
    -- Un pago no se registra dos veces (RN-07).
    referencia_pago TEXT NOT NULL UNIQUE CHECK (trim(referencia_pago) <> ''),
    fecha_venta TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Credencial única de administración (RN-09); contrasena es el SHA-256 en hexadecimal.
CREATE TABLE administrador (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    usuario TEXT NOT NULL UNIQUE,
    contrasena TEXT NOT NULL
);

INSERT OR IGNORE INTO entrada (id, nombre, descripcion, precio, disponibles, venta_activa) VALUES
    (1, 'Entrada Fogón 2026',
     'Acceso a los tres días de la feria: más de 40 stands, cocina en vivo y mercado de productores.',
     45.00, 500, 1);

-- Usuario "admin", contraseña "admin".
INSERT OR IGNORE INTO administrador (id, usuario, contrasena) VALUES
    (1, 'admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918');
