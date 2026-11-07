-- Práctica 1 (SQL Server 2017 o superior), paso 2 de 3: registros de la feria.
-- Antes ejecuta practica_1_modelo_fisico.sql.
-- Carga los datos de ejemplo.
USE feria;
GO

INSERT INTO entrada (id, nombre, descripcion, precio, disponibles, venta_activa) VALUES
    (1, N'Entrada Fogón 2026',
     N'Acceso a los tres días de la feria: más de 40 stands, cocina en vivo y mercado de productores.',
     45.00, 500, 1);

-- IDENTITY_INSERT permite escribir el id a mano.
SET IDENTITY_INSERT compra ON;
INSERT INTO compra (id, dni, nombre, precio, referencia_pago, fecha_compra) VALUES
    (1, '70123456', N'Luis Rojas', 45.00, N'PAGO-0001', '2026-11-05 18:30');
SET IDENTITY_INSERT compra OFF;
GO
