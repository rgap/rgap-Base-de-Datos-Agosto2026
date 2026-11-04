-- Práctica 1 (SQL Server 2017 o superior), paso 2 de 2: registros de la peluquería.
-- Antes ejecuta practica_1_modelo_fisico.sql.
-- Borra los datos que haya y carga los de ejemplo.
USE peluqueria;
GO

DELETE FROM pago;
DELETE FROM cita;
DELETE FROM mascota;
DELETE FROM cliente;
DELETE FROM servicio;
DELETE FROM empleado;
GO

-- IDENTITY_INSERT permite escribir el id a mano.
SET IDENTITY_INSERT servicio ON;
INSERT INTO servicio (id, nombre, duracion, precio, orden) VALUES
    (1, N'Baño e higiene', 45, 35.00, 1),
    (2, N'Corte de pelo', 60, 55.00, 2),
    (3, N'Corte de uñas', 15, 15.00, 3),
    (4, N'Baño completo con corte', 90, 80.00, 4);
SET IDENTITY_INSERT servicio OFF;

SET IDENTITY_INSERT empleado ON;
INSERT INTO empleado (id, nombre, orden) VALUES
    (1, N'Ana Torres', 1),
    (2, N'Bruno Díaz', 2),
    (3, N'Carla Núñez', 3);
SET IDENTITY_INSERT empleado OFF;

SET IDENTITY_INSERT cliente ON;
INSERT INTO cliente (id, nombre, telefono) VALUES
    (1, N'Lucía Ramos', '987111222'),
    (2, N'Pedro Salas', '987333444'),
    (3, N'Rosa Medina', '987555666'),
    (4, N'Bruno Díaz', '987777888');
SET IDENTITY_INSERT cliente OFF;

SET IDENTITY_INSERT mascota ON;
INSERT INTO mascota (id, nombre, especie, raza, cliente_id) VALUES
    (1, N'Firulais', N'perro', N'mestizo', 1),
    (2, N'Michi', N'gato', N'siamés', 4),
    (3, N'Rocky', N'perro', N'bulldog', 2),
    (4, N'Luna', N'gato', NULL, 3);
SET IDENTITY_INSERT mascota OFF;

SET IDENTITY_INSERT cita ON;
INSERT INTO cita (id, fecha_hora, estado, mascota_id, servicio_id, empleado_id) VALUES
    (1, '2026-09-08 10:00', 'completada', 1, 1, 1),
    (2, '2026-09-15 11:00', 'completada', 3, 2, 2),
    (3, '2026-09-22 09:00', 'completada', 4, 3, 1),
    (4, '2026-10-06 10:00', 'completada', 1, 2, 1),
    (5, '2026-10-13 11:00', 'completada', 3, 1, 2),
    (6, '2026-10-20 09:00', 'completada', 2, 2, 1),
    (7, '2026-11-10 10:00', 'programada', 1, 1, 2),
    (8, '2026-11-04 09:00', 'completada', 4, 3, 1),
    (9, '2026-11-04 10:00', 'completada', 3, 1, 2),
    (10, '2026-11-04 11:00', 'completada', 2, 2, 1);
SET IDENTITY_INSERT cita OFF;

-- La cita 6 todavía no se cobra y la 7 todavía no ocurre.
-- Las citas 8, 9 y 10 son de hoy, 4 de noviembre.
SET IDENTITY_INSERT pago ON;
INSERT INTO pago (id, monto, metodo, cita_id) VALUES
    (1, 35.00, 'efectivo', 1),
    (2, 55.00, 'tarjeta', 2),
    (3, 15.00, 'efectivo', 3),
    (4, 55.00, 'efectivo', 4),
    (5, 35.00, 'tarjeta', 5),
    (6, 15.00, 'efectivo', 8),
    (7, 35.00, 'tarjeta', 9),
    (8, 55.00, 'transferencia', 10);
SET IDENTITY_INSERT pago OFF;
GO
