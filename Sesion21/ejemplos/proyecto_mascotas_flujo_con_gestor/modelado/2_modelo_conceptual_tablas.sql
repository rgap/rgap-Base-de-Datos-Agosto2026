-- Flujo B: el gestor se conoce desde el inicio (MySQL).
-- Modelo conceptual, alternativa 2: tablas y columnas, sin reglas.
-- Solo nombres de tablas y columnas con tipos provisionales INT o VARCHAR.
-- Todavía no hay PK, FK, NOT NULL, UNIQUE ni CHECK: eso llega en el lógico.
-- Las columnas *_id solo anuncian con qué tabla se relaciona cada una.

CREATE TABLE cliente (
    id INT,
    nombre VARCHAR(100),
    telefono VARCHAR(100)
);

CREATE TABLE mascota (
    id INT,
    nombre VARCHAR(100),
    especie VARCHAR(100),
    raza VARCHAR(100),
    cliente_id INT          -- un cliente es dueño de muchas mascotas
);

CREATE TABLE servicio (
    id INT,
    nombre VARCHAR(100),
    duracion INT,
    precio INT,
    orden INT
);

CREATE TABLE empleado (
    id INT,
    nombre VARCHAR(100),
    orden INT
);

CREATE TABLE cita (
    id INT,
    fecha_hora VARCHAR(100),
    estado VARCHAR(100),
    mascota_id INT,         -- una mascota tiene muchas citas
    servicio_id INT,        -- un servicio se presta en muchas citas
    empleado_id INT         -- un empleado atiende muchas citas
);

CREATE TABLE pago (
    id INT,
    monto INT,
    metodo VARCHAR(100),
    cita_id INT             -- una cita completada se paga una sola vez
);

CREATE TABLE encargado (
    id INT,
    usuario VARCHAR(100),
    contrasena VARCHAR(100)
);
