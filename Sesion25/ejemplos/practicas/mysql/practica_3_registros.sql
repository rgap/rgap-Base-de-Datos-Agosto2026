-- Práctica 3 (MySQL 8), paso 2 de 2: registros del sistema de cupones.
-- Antes ejecuta practica_3_modelo_fisico.sql.
-- Borra los cupones que haya y carga los de ejemplo.
USE cupones;

DELETE FROM cupon;

INSERT INTO cupon (id, codigo, descripcion, tipo_descuento, valor_descuento,
                   estado, vigente_desde, vigente_hasta) VALUES
    (1, 'BIENVENIDA10', '10 % en tu primera compra', 'porcentaje', 10, 'activo', '2026-01-01', NULL),
    (2, 'NOVIEMBRE20', 'S/ 20 menos en noviembre', 'monto_fijo', 20, 'activo', '2026-11-01', '2026-12-01'),
    (3, 'VERANO15', '15 % en verano', 'porcentaje', 15, 'activo', '2026-01-01', '2026-04-01'),
    (4, 'NAVIDAD25', '25 % en Navidad', 'porcentaje', 25, 'activo', '2026-12-15', '2026-12-26'),
    (5, 'PRUEBA50', 'Cupón de prueba del sistema', 'monto_fijo', 50, 'inactivo', '2026-10-01', NULL);
