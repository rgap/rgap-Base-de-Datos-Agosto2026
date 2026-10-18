# Caso de estudio: sistema de administración de una peluquería de mascotas

## 1. Problema

Una peluquería de mascotas necesita registrar clientes y sus mascotas, programar servicios con un empleado y conservar el pago de las citas completadas.

Se requiere una aplicación que permita organizar la agenda, controlar el estado de las citas y registrar su pago total.

## 2. Alcance y supuestos

- De cada cliente se guarda su nombre y, si lo da, su teléfono. De cada mascota, su especie y, opcionalmente, su nombre y su raza.
- Cada cita corresponde a una mascota, un servicio y un empleado, en una fecha y hora, y tiene un estado.
- Cada servicio tiene una duración y un precio en soles definidos.
- Los servicios y empleados se agregan, consultan, ordenan y eliminan desde la aplicación; el orden elegido se conserva.
- Al completarse una cita se registra su pago: el monto y el método (efectivo, tarjeta o transferencia).
- La aplicación es de uso interno: el acceso requiere iniciar sesión con usuario y contraseña.
- Existe una única credencial de encargado, guardada en el sistema.
- Todas las operaciones son iniciadas por el usuario.

Quedan fuera de alcance: múltiples sedes, inventario, paquetes de servicios, recordatorios, reprogramación, facturación, pagos parciales, la edición de servicios y empleados, y la administración de varias cuentas o roles.

## 3. Roles

**Encargado o recepcionista:** inicia sesión, registra clientes y mascotas mediante las citas, administra la agenda, mantiene y ordena el catálogo de servicios y empleados y registra los pagos. Es el único rol del sistema.
