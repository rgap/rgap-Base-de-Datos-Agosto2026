-- Práctica 2 (MySQL 8): funciones de ventana.
-- Antes haz la práctica 1.

USE peluqueria;

-- ¿Cuánto llevamos cobrado hoy (4 de noviembre) después de cada pago?
SELECT c.fecha_hora, p.monto,
    SUM(p.monto) OVER (ORDER BY c.fecha_hora) AS acumulado
FROM pago p JOIN cita c ON c.id = p.cita_id
WHERE CAST(c.fecha_hora AS DATE) = '2026-11-04'
ORDER BY c.fecha_hora;
-- 2026-11-04 09:00:00  15.00   15.00
-- 2026-11-04 10:00:00  35.00   50.00
-- 2026-11-04 11:00:00  55.00  105.00
