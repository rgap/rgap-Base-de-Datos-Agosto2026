CREATE TABLE IF NOT EXISTS cliente (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL CHECK (trim(nombre) <> ''),
    -- El teléfono identifica y permite reutilizar un cliente (RN-02).
    telefono TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS mascota (
    id INTEGER PRIMARY KEY,
    -- El nombre de la mascota es opcional (HU-01); si se indica, no se repite
    -- para el mismo cliente sin distinguir mayúsculas (RN-03).
    nombre TEXT COLLATE NOCASE,
    especie TEXT NOT NULL CHECK (trim(especie) <> ''),
    raza TEXT,
    cliente_id INTEGER NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    UNIQUE (cliente_id, nombre)
);

CREATE TABLE IF NOT EXISTS servicio (
    id INTEGER PRIMARY KEY,
    -- Nombre único sin distinguir mayúsculas (RN-08).
    nombre TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (trim(nombre) <> ''),
    -- Duración en minutos: entero positivo (RN-08).
    duracion INTEGER NOT NULL CHECK (typeof(duracion) = 'integer' AND duracion > 0),
    -- Precio en soles: positivo y con como máximo dos decimales (RN-08).
    precio REAL NOT NULL CHECK (precio > 0 AND round(precio, 2) = precio),
    -- Posición en el catálogo; el usuario la reordena arrastrando (RN-11).
    orden INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS empleado (
    id INTEGER PRIMARY KEY,
    -- Nombre único sin distinguir mayúsculas (RN-08).
    nombre TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (trim(nombre) <> ''),
    -- Posición en el catálogo; el usuario la reordena arrastrando (RN-11).
    orden INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cita (
    id INTEGER PRIMARY KEY,
    fecha_hora TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'programada'
        CHECK (estado IN ('programada', 'completada', 'cancelada')),
    mascota_id INTEGER NOT NULL,
    servicio_id INTEGER NOT NULL,
    empleado_id INTEGER NOT NULL,
    FOREIGN KEY (mascota_id) REFERENCES mascota(id),
    FOREIGN KEY (servicio_id) REFERENCES servicio(id),
    FOREIGN KEY (empleado_id) REFERENCES empleado(id),
    -- Un empleado no puede tener dos citas a la misma hora (RN-06).
    UNIQUE (empleado_id, fecha_hora)
);

CREATE TABLE IF NOT EXISTS pago (
    id INTEGER PRIMARY KEY,
    -- Importe en soles: el precio total del servicio (RN-07).
    monto REAL NOT NULL,
    metodo TEXT NOT NULL
        CHECK (metodo IN ('efectivo', 'tarjeta', 'transferencia')),
    -- cita_id es único: cada cita admite como máximo un pago (RN-07).
    cita_id INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (cita_id) REFERENCES cita(id)
);

-- Credencial del encargado (acceso a la aplicación). El backend crea la primera
-- fila en el arranque inicial; la contraseña se guarda con hash, nunca en claro.
CREATE TABLE IF NOT EXISTS encargado (
    id INTEGER PRIMARY KEY,
    usuario TEXT NOT NULL UNIQUE,
    contrasena TEXT NOT NULL
);

-- Servicios y empleados iniciales: la aplicación permite agregar y reordenar más.
INSERT OR IGNORE INTO servicio (id, nombre, duracion, precio, orden) VALUES
    (1, 'Baño e higiene', 45, 35.0, 1),
    (2, 'Corte de pelo', 60, 55.0, 2),
    (3, 'Corte de uñas', 15, 15.0, 3),
    (4, 'Baño completo con corte', 90, 80.0, 4);

INSERT OR IGNORE INTO empleado (id, nombre, orden) VALUES
    (1, 'Ana Torres', 1),
    (2, 'Bruno Díaz', 2),
    (3, 'Carla Núñez', 3);
