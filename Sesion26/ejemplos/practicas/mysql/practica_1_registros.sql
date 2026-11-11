-- Práctica 1 (MySQL 8), paso 2 de 3: registros de la feria.
-- Antes ejecuta practica_1_modelo_fisico.sql.
-- Carga la entrada con 500 disponibles. Todavía no hay ventas.
USE feria;

INSERT INTO entrada (id, nombre, descripcion, precio, disponibles, venta_activa) VALUES
    (1, 'Entrada Fogón 2026',
     'Acceso a los tres días de la feria: más de 40 stands, cocina en vivo y mercado de productores.',
     45.00, 500, 1);
