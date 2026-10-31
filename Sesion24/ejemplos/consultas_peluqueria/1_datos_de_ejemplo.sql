-- Datos de ejemplo para la sesión 24 (MySQL 8).
-- Necesita la base peluqueria de la práctica 1:
--   ejemplos/practicas/practica_1_modelo_fisico_mysql.sql
-- Ese script ya carga los servicios y los empleados.
--
-- OJO: este archivo BORRA los clientes, mascotas, citas y pagos que tengas en
-- peluqueria y los vuelve a cargar. Así todos vemos los mismos resultados.

USE peluqueria;

-- Se borra en este orden por las claves foráneas: primero lo que depende de otra tabla.
DELETE FROM pago;
DELETE FROM cita;
DELETE FROM mascota;
DELETE FROM cliente;

-- Bruno Díaz también trabaja en la peluquería: tiene el mismo dni como cliente y como empleado.
INSERT INTO cliente (id, nombre, dni, telefono) VALUES
    (1, 'Lucía Ramos', '45123678', '987111222'),
    (2, 'Pedro Salas', '46234789', '987333444'),
    (3, 'Rosa Medina', '47345890', '987555666'),
    (4, 'Bruno Díaz', '48456901', '987777888');

INSERT INTO mascota (id, nombre, especie, raza, cliente_id) VALUES
    (1, 'Firulais', 'perro', 'mestizo', 1),
    (2, 'Michi', 'gato', 'siamés', 4),
    (3, 'Rocky', 'perro', 'bulldog', 2),
    (4, 'Luna', 'gato', NULL, 3);

-- Noviembre: una cita que todavía no ocurre.
-- Carla Núñez (empleado 3) todavía no tiene citas.
-- El servicio 4 (Baño completo con corte) nadie lo ha pedido.
INSERT INTO cita (id, fecha_hora, estado, mascota_id, servicio_id, empleado_id) VALUES
    (1, '2026-09-08 10:00', 'completada', 1, 1, 1),
    (2, '2026-09-15 11:00', 'completada', 3, 2, 2),
    (3, '2026-09-22 09:00', 'completada', 4, 3, 1),
    (4, '2026-10-06 10:00', 'completada', 1, 2, 1),
    (5, '2026-10-13 11:00', 'completada', 3, 1, 2),
    (6, '2026-10-20 09:00', 'completada', 2, 2, 1),
    (7, '2026-11-10 10:00', 'programada', 1, 1, 2);

-- La cita 6 ya se atendió, pero falta cobrarla. La 7 todavía no ocurre.
INSERT INTO pago (id, monto, metodo, cita_id) VALUES
    (1, 35.00, 'efectivo', 1),
    (2, 55.00, 'tarjeta', 2),
    (3, 15.00, 'efectivo', 3),
    (4, 55.00, 'efectivo', 4),
    (5, 35.00, 'tarjeta', 5);

-- Revisa que todo esté cargado.
SELECT id, nombre, precio FROM servicio;
SELECT id, nombre, dni FROM empleado;
SELECT id, nombre, dni, telefono FROM cliente;
SELECT id, nombre, especie, cliente_id FROM mascota;
SELECT id, fecha_hora, estado, mascota_id, servicio_id, empleado_id FROM cita;
SELECT id, monto, metodo, cita_id FROM pago;
