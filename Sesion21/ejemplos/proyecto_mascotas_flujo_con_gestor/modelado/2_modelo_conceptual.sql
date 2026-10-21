-- Flujo B: el gestor se conoce desde el inicio (MySQL).
-- Modelo conceptual: todavía no hay código. Se escribe como comentarios al
-- inicio del archivo SQL para dejar claro qué se va a guardar.

-- ENTIDADES Y ATRIBUTOS
--   cliente   : nombre, teléfono
--   mascota   : nombre, especie, raza
--   servicio  : nombre, duración, precio, orden
--   empleado  : nombre, orden
--   cita      : fecha y hora, estado
--   pago      : monto, método
--   encargado : usuario, contraseña

-- RELACIONES
--   cliente  1 ── N  mascota   un cliente es dueño de muchas mascotas
--   mascota  1 ── N  cita      una mascota tiene muchas citas
--   servicio 1 ── N  cita      un servicio se presta en muchas citas
--   empleado 1 ── N  cita      un empleado atiende muchas citas
--   cita     1 ── 1  pago      una cita completada se paga una sola vez

-- REGLAS DEL NEGOCIO
--   Un empleado no atiende dos citas a la misma hora.
--   El estado de una cita es programada, completada o cancelada.
--   El pago es en efectivo, con tarjeta o por transferencia.
