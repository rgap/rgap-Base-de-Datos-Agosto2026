-- Expresiones de tabla comunes: CTE (MySQL 8).
-- Primero ejecuta 1_datos_de_ejemplo.sql.
-- Un CTE es una subconsulta con nombre, escrita antes de la consulta.

USE peluqueria;

-- ---------------------------------------------------------------
-- 1. La misma consulta: subconsulta en FROM y CTE
-- ---------------------------------------------------------------

-- Con subconsulta en FROM.
SELECT MAX(total)
FROM (SELECT empleado_id, COUNT(*) AS total
      FROM cita
      GROUP BY empleado_id) AS conteo;
-- 4

-- Con CTE: primero se define conteo, después se usa.
WITH conteo AS (
    SELECT empleado_id, COUNT(*) AS total
    FROM cita
    GROUP BY empleado_id
)
SELECT MAX(total)
FROM conteo;
-- 4

-- ---------------------------------------------------------------
-- 2. Un CTE solo existe durante su consulta
-- ---------------------------------------------------------------

-- SELECT * FROM conteo;
-- ERROR 1146 (42S02): Table 'peluqueria.conteo' doesn't exist

-- ---------------------------------------------------------------
-- 3. Un CTE se puede usar dos veces
-- ---------------------------------------------------------------

-- ¿Qué empleado tiene más citas? Sin CTE, el conteo se escribe dos veces.
SELECT e.nombre, conteo.total
FROM empleado e
JOIN (SELECT empleado_id, COUNT(*) AS total
      FROM cita
      GROUP BY empleado_id) AS conteo
  ON conteo.empleado_id = e.id
WHERE conteo.total = (SELECT MAX(total)
                      FROM (SELECT empleado_id, COUNT(*) AS total
                            FROM cita
                            GROUP BY empleado_id) AS otro);
-- Ana Torres  4

-- Con CTE, se escribe una vez y se usa dos.
WITH conteo AS (
    SELECT empleado_id, COUNT(*) AS total
    FROM cita
    GROUP BY empleado_id
)
SELECT e.nombre, conteo.total
FROM empleado e
JOIN conteo ON conteo.empleado_id = e.id
WHERE conteo.total = (SELECT MAX(total) FROM conteo);
-- Ana Torres  4

-- ---------------------------------------------------------------
-- 4. Varios CTE: uno por paso
-- ---------------------------------------------------------------

-- WITH se escribe una sola vez; los CTE se separan con comas.
-- Cada CTE puede usar los anteriores.
WITH atendidas AS (
    SELECT id FROM cita WHERE estado = 'completada'
),
cobradas AS (
    SELECT cita_id FROM pago
)
SELECT id FROM atendidas
EXCEPT
SELECT cita_id FROM cobradas;
-- 6

-- ---------------------------------------------------------------
-- 5. Todo junto: la lista de cobros
-- ---------------------------------------------------------------

-- ¿Qué citas faltan cobrar, de qué fecha y por cuánto?
WITH atendidas AS (
    SELECT id FROM cita WHERE estado = 'completada'
),
cobradas AS (
    SELECT cita_id FROM pago
),
sin_cobrar AS (
    SELECT id FROM atendidas
    EXCEPT
    SELECT cita_id FROM cobradas
)
SELECT c.id, c.fecha_hora, s.nombre AS servicio, s.precio
FROM sin_cobrar sc
JOIN cita c ON c.id = sc.id
JOIN servicio s ON s.id = c.servicio_id;
-- 6  2026-10-20 09:00:00  Corte de pelo  55.00
