# Caso de estudio: venta de entradas para una feria gastronómica con procedimiento almacenado

## 1. Problema

Una feria gastronómica de tres días necesita vender su entrada en línea. Hay una sola entrada, válida para toda la feria (no se vende por día), con un precio y una cantidad limitada de entradas a la venta.

Se requiere una aplicación que permita al visitante comprar su entrada desde la página principal, pagando con tarjeta, y que la compra quede registrada a nombre de la persona identificada por su DNI y su nombre, con un correo al que se le envía el comprobante. Cada persona (DNI) puede comprar una sola entrada. El administrador fija el precio y cuántas entradas hay a la venta, abre o cierra la venta y consulta las ventas.

Cuando la venta abre, muchos visitantes pagan al mismo tiempo. Si dos compras leen a la vez que queda una entrada, ambas podrían registrarse y se venderían entradas que no existen (sobreventa). Por eso la compra no la arma la aplicación con varias consultas sueltas: la base de datos la realiza completa en un procedimiento almacenado que bloquea la entrada mientras compra.

## 2. Alcance y supuestos

- La aplicación administra una única edición de la feria y una única entrada, válida para los tres días (4, 5 y 6 de diciembre de 2026). La entrada viene registrada desde el inicio.
- La entrada tiene un nombre, una descripción, un precio en soles, una cantidad de entradas disponibles y un estado de venta (abierta o cerrada).
- La página principal es pública y es la página de compra: presenta la feria, muestra el precio y las entradas disponibles y permite comprar.
- Comprar es público: no hay cuentas de visitante. Cada compra es de una sola entrada y se registra a nombre de la persona que la usará, identificada por su DNI (8 dígitos) y su nombre. El comprador indica además un correo electrónico, al que se le envía el comprobante de la compra.
- Cada DNI puede comprar una sola entrada. Cada compra descuenta una de las entradas disponibles.
- Solo se puede comprar con la venta abierta y si quedan entradas disponibles.
- El visitante paga con tarjeta. Los datos de la tarjeta no se guardan; la compra conserva la referencia del pago.
- Si el pago no se aprueba, no se registra la compra ni se descuenta la entrada.
- El precio se guarda en la compra tal como estaba al momento de pagar.
- La fecha y hora de la compra se asignan automáticamente.
- La configuración de la entrada y la consulta de ventas se realizan desde una vista de administración separada.
- El acceso a la administración está protegido por un único usuario y contraseña compartidos; no hay cuentas de usuario ni registro. El administrador inicia sesión con esas credenciales y puede cerrar la sesión, que además caduca por tiempo de inactividad.
- Todas las operaciones son iniciadas por el rol correspondiente.

Quedan fuera de alcance: varios tipos de entrada o categorías, entradas por día, la edición del nombre y la descripción de la entrada, otros medios de pago, cupones o promociones, asientos numerados, emisión de códigos QR, envío de otros correos aparte del comprobante, anulación o devolución de compras, cuentas de visitante, consulta de compras por el propio visitante, control de fechas de la feria, imágenes de la entrada, cuentas de usuario y el cambio o la recuperación de la contraseña de administración.

## 3. Roles

**Visitante de la feria:** accede a la página principal, consulta el precio y las entradas disponibles, indica su DNI, su nombre y su correo y paga su entrada con tarjeta.

**Administrador de la feria:** inicia sesión con el usuario y la contraseña compartidos, fija el precio y las entradas disponibles, abre o cierra la venta y consulta las ventas.
