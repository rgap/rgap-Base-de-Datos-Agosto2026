-- Datos de ejemplo para practicar subconsultas (MySQL 8).
-- Necesita la base peluqueria de la sesión 21:
--   Sesion21/ejemplos/proyecto_mascotas_flujo_con_gestor/modelado/4_modelo_fisico.sql
-- Ese script ya carga los servicios y los empleados; aquí se agregan
-- clientes, mascotas, citas y pagos.

USE peluqueria;

INSERT IGNORE INTO cliente (id, nombre, telefono) VALUES
    (1, 'Lucía Ramos', '987111222'),
    (2, 'Pedro Salas', '987333444'),
    (3, 'Rosa Medina', '987555666');

INSERT IGNORE INTO mascota (id, nombre, especie, raza, cliente_id) VALUES
    (1, 'Firulais', 'perro', 'mestizo', 1),
    (2, 'Michi', 'gato', 'siamés', 1),
    (3, 'Rocky', 'perro', 'bulldog', 2),
    (4, 'Luna', 'gato', NULL, 3);

-- Carla Núñez (empleado 3) todavía no tiene citas.
INSERT IGNORE INTO cita (id, fecha_hora, estado, mascota_id, servicio_id, empleado_id) VALUES
    (1, '2026-10-05 10:00', 'completada', 1, 2, 1),
    (2, '2026-10-05 11:00', 'completada', 3, 1, 2),
    (3, '2026-10-06 09:00', 'completada', 2, 3, 1),
    (4, '2026-10-07 15:00', 'cancelada',  4, 4, 2),
    (5, '2026-11-02 10:00', 'programada', 1, 1, 1);

-- Solo las citas completadas tienen pago.
INSERT IGNORE INTO pago (id, monto, metodo, cita_id) VALUES
    (1, 55.00, 'efectivo', 1),
    (2, 35.00, 'tarjeta', 2),
    (3, 15.00, 'efectivo', 3);

-- Revisa que todo esté cargado.
SELECT id, nombre, precio FROM servicio;
SELECT id, nombre FROM empleado;
SELECT id, nombre, especie, cliente_id FROM mascota;
SELECT id, estado, mascota_id, servicio_id, empleado_id FROM cita;
