-- SQL dump generated using DBML (dbml.dbdiagram.io)
-- Database: MySQL
-- Generated at: 2026-10-21T06:14:15.572Z

CREATE TABLE `cliente` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `telefono` varchar(20) UNIQUE
);

CREATE TABLE `mascota` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `nombre` varchar(50) COMMENT 'Opcional',
  `especie` varchar(30) NOT NULL,
  `raza` varchar(50),
  `cliente_id` integer NOT NULL
);

CREATE TABLE `servicio` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `nombre` varchar(100) UNIQUE NOT NULL,
  `duracion` integer NOT NULL CHECK (duracion > 0) COMMENT 'En minutos',
  `precio` decimal(8,2) NOT NULL CHECK (precio > 0) COMMENT 'En soles',
  `orden` integer NOT NULL
);

CREATE TABLE `empleado` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `nombre` varchar(100) UNIQUE NOT NULL,
  `orden` integer NOT NULL
);

CREATE TABLE `cita` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `fecha_hora` datetime NOT NULL,
  `estado` varchar(20) NOT NULL CHECK (estado IN ('programada', 'completada', 'cancelada')) DEFAULT 'programada',
  `mascota_id` integer NOT NULL,
  `servicio_id` integer NOT NULL,
  `empleado_id` integer NOT NULL
);

CREATE TABLE `pago` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `monto` decimal(8,2) NOT NULL COMMENT 'En soles',
  `metodo` varchar(20) NOT NULL CHECK (metodo IN ('efectivo', 'tarjeta', 'transferencia')),
  `cita_id` integer UNIQUE NOT NULL
);

CREATE TABLE `encargado` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `usuario` varchar(50) UNIQUE NOT NULL,
  `contrasena` varchar(255) NOT NULL COMMENT 'Hash con sal de la contraseña, nunca en claro'
);

CREATE UNIQUE INDEX `mascota_index_0` ON `mascota` (`cliente_id`, `nombre`);

CREATE UNIQUE INDEX `cita_index_1` ON `cita` (`empleado_id`, `fecha_hora`);

ALTER TABLE `mascota` ADD FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id`);

ALTER TABLE `cita` ADD FOREIGN KEY (`mascota_id`) REFERENCES `mascota` (`id`);

ALTER TABLE `cita` ADD FOREIGN KEY (`servicio_id`) REFERENCES `servicio` (`id`);

ALTER TABLE `cita` ADD FOREIGN KEY (`empleado_id`) REFERENCES `empleado` (`id`);

ALTER TABLE `pago` ADD FOREIGN KEY (`cita_id`) REFERENCES `cita` (`id`);
