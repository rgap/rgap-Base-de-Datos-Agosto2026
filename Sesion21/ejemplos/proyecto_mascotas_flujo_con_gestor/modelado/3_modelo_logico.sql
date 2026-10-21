-- Flujo B: el gestor se conoce desde el inicio (MySQL).
-- Modelo lógico: tablas, columnas, claves y reglas, escritas ya en SQL de MySQL.
-- Todavía no lleva los detalles propios de MySQL (ver 4_modelo_fisico.sql).

CREATE TABLE cliente (
    id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL CHECK (TRIM(nombre) <> ''),
    telefono VARCHAR(20) UNIQUE
);

CREATE TABLE mascota (
    id INT PRIMARY KEY,
    nombre VARCHAR(50),
    especie VARCHAR(30) NOT NULL CHECK (TRIM(especie) <> ''),
    raza VARCHAR(50),
    cliente_id INT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES cliente(id),
    UNIQUE (cliente_id, nombre)
);

CREATE TABLE servicio (
    id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE CHECK (TRIM(nombre) <> ''),
    duracion INT NOT NULL CHECK (duracion > 0),
    precio DECIMAL(8,2) NOT NULL CHECK (precio > 0),
    orden INT NOT NULL
);

CREATE TABLE empleado (
    id INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE CHECK (TRIM(nombre) <> ''),
    orden INT NOT NULL
);

CREATE TABLE cita (
    id INT PRIMARY KEY,
    fecha_hora DATETIME NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'programada'
        CHECK (estado IN ('programada', 'completada', 'cancelada')),
    mascota_id INT NOT NULL,
    servicio_id INT NOT NULL,
    empleado_id INT NOT NULL,
    FOREIGN KEY (mascota_id) REFERENCES mascota(id),
    FOREIGN KEY (servicio_id) REFERENCES servicio(id),
    FOREIGN KEY (empleado_id) REFERENCES empleado(id),
    UNIQUE (empleado_id, fecha_hora)
);

CREATE TABLE pago (
    id INT PRIMARY KEY,
    monto DECIMAL(8,2) NOT NULL,
    metodo VARCHAR(20) NOT NULL
        CHECK (metodo IN ('efectivo', 'tarjeta', 'transferencia')),
    cita_id INT NOT NULL UNIQUE,
    FOREIGN KEY (cita_id) REFERENCES cita(id)
);

CREATE TABLE encargado (
    id INT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL
);
