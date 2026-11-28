# Requirements

## 1. Historias de usuario

### Historia 1. Ver la feria y su entrada

**Como** visitante de la feria,
**quiero** ver en la página principal la feria con el precio y las entradas disponibles,
**para** decidir si compro.

**Criterios**

- La ruta principal debe mostrar una página pública diferenciada de la administración.
- La página principal debe mostrar el nombre y la descripción de la entrada, su precio, las entradas disponibles (o "Agotado") y si la venta está abierta.
- La página principal debe contener el formulario de compra; no hay otra página pública de entradas.
- La página principal debe conservar un acceso secundario a la vista de administración; si no hay sesión activa, ese acceso lleva primero a la pantalla de inicio de sesión (Historia 5).

---

### Historia 2. Comprar mi entrada con la pasarela de pago

**Como** visitante de la feria,
**quiero** identificarme con mi DNI y mi nombre, indicar mi correo y pagar mi entrada,
**para** que quede registrada a mi nombre y reciba el comprobante.

**Criterios**

- Cada compra es de una sola entrada. El comprador debe indicar su DNI (exactamente 8 dígitos), su nombre y un correo electrónico válido, al que se envía el comprobante de la compra. Los errores se muestran junto al campo correspondiente.
- El formulario ofrece un botón «Datos demo» que alterna entre tres compradores de ejemplo (DNI, nombre y correo), entre ellos Luis Rojas con DNI 70123456, sin enviarlos.
- Si la venta está cerrada o no quedan entradas disponibles, el formulario se muestra deshabilitado con un mensaje comprensible.
- El botón «Pagar» abre una ventana que simula el checkout overlay de Lemon Squeezy en modo de prueba, con el resumen del pedido, el comprador, el correo al que se enviará el comprobante y un formulario de tarjeta (número, vencimiento, CVC y nombre en la tarjeta) con su propio botón «Datos demo» (tarjeta de prueba) y un botón «Pagar».
- La simulación acepta la tarjeta de prueba `4242 4242 4242 4242` y rechaza `4000 0000 0000 0002` con un mensaje comprensible; valida además el formato del número, que el vencimiento no haya pasado y el CVC. Los datos de la tarjeta nunca se envían a la aplicación ni se guardan.
- Si el pago se aprueba, la compra se registra con el DNI, el nombre, el correo, el precio y la referencia del pago, y se muestra una confirmación con la referencia, el detalle y el correo al que se envía el comprobante.
- Si el DNI ya compró una entrada, la compra se rechaza con un mensaje comprensible.
- Si la compra no puede registrarse (DNI que ya compró, sin entradas disponibles o venta cerrada), se informa con un mensaje comprensible y se indica que no se realizó ningún cargo.
- Tras una compra, las entradas disponibles mostradas se actualizan y el formulario se vacía.
- La ventana de pago debe cerrarse con la tecla Escape, con su botón de cerrar o al hacer clic fuera (salvo mientras se procesa el pago), y devolver el foco al elemento que la abrió.

---

### Historia 3. Configurar la entrada

**Como** administrador de la feria,
**quiero** fijar el precio y cuántas entradas hay a la venta y abrir o cerrar la venta,
**para** controlar cuántas entradas se venden y cuándo.

**Criterios**

- La vista solo está disponible con una sesión de administración activa (Historia 5).
- El formulario muestra el precio, las entradas disponibles y el estado de la venta actuales.
- El precio en soles debe ser positivo y admitir como máximo dos decimales; las entradas disponibles deben ser un entero no negativo. Una entrada inválida se rechaza con un mensaje comprensible.
- Cambiar el precio no modifica el precio guardado en las compras ya registradas.
- Con la venta cerrada, la página principal no permite comprar.
- El formulario ofrece un botón «Datos demo» que lo completa con valores de ejemplo sin guardarlos.
- La vista muestra un resumen: entradas vendidas, entradas disponibles y monto recaudado.
- Los cambios deben reflejarse de inmediato en la página principal.

---

### Historia 4. Consultar las ventas

**Como** administrador de la feria,
**quiero** consultar las compras registradas,
**para** saber quién compró su entrada y cuánto se recaudó.

**Criterios**

- La vista solo está disponible con una sesión de administración activa (Historia 5).
- Debe listar las compras, de la más reciente a la más antigua, con fecha, comprador (nombre, DNI y correo), precio pagado y referencia del pago.
- El administrador debe poder buscar por DNI, nombre o correo del comprador o referencia del pago.
- Debe mostrar un resumen de las compras listadas: entradas vendidas y monto recaudado.
- Cuando no haya compras, o ninguna coincida, debe mostrarse un mensaje comprensible.
- La navegación lateral de administración alterna entre la entrada y las ventas; cada vista ofrece además un acceso a la página principal y un control para cerrar la sesión en su encabezado.

---

### Historia 5. Iniciar sesión en la administración

**Como** administrador de la feria,
**quiero** iniciar sesión con el usuario y la contraseña compartidos,
**para** acceder a la administración sin que lo haga cualquier visitante.

**Criterios**

- Debe existir una pantalla de inicio de sesión pública, separada de la administración, con dos campos: usuario y contraseña.
- Al abrir una vista de administración sin sesión activa, la aplicación debe redirigir a la pantalla de inicio de sesión y, tras autenticarse, volver a la vista solicitada.
- Con el usuario y la contraseña correctos se abre una sesión y se accede a la administración; si alguno es incorrecto se muestra un mensaje comprensible, sin revelar cuál falló, y no se abre sesión.
- La pantalla de inicio de sesión ofrece un botón «Datos demo» que rellena el usuario y la contraseña compartidos sin enviarlos, y conserva el pie de página con el botón para reiniciar los datos (utilidad pública de demostración), igual que el resto de páginas.
- Las operaciones de administración (configurar la entrada y consultar las ventas) deben rechazarse sin una sesión activa. Reiniciar los datos es una utilidad de demostración disponible sin sesión.
- La consulta pública de la entrada y la compra no requieren sesión.
- El administrador debe poder cerrar la sesión; la sesión también caduca por tiempo y, una vez cerrada o caducada, la administración vuelve a exigir inicio de sesión.
- La contraseña nunca se almacena ni se compara en claro: se guarda y se verifica mediante un hash. El usuario se compara distinguiendo mayúsculas.

## 2. Requisitos funcionales

### Requisito 1. Mostrar la entrada

Debe mostrarse en la página principal el nombre, la descripción, el precio, las entradas disponibles y el estado de venta de la entrada.

### Requisito 2. Comprar con la pasarela simulada

Debe ofrecerse en la página principal un formulario de compra (DNI, nombre y correo) y un pago en una ventana que simula el checkout overlay de Lemon Squeezy en modo de prueba. Con el pago aprobado, la compra se registra de forma atómica: se descuenta una de las entradas disponibles y se guarda la compra con el DNI, el nombre, el correo, el precio y la referencia del pago. Cada DNI compra una sola entrada.

### Requisito 3. Configurar la entrada

Debe ser posible fijar el precio y las entradas disponibles y abrir o cerrar la venta. Cada cambio se aplica de inmediato.

### Requisito 4. Consultar ventas

Debe listarse cada compra con su comprador (nombre, DNI y correo), precio y referencia de pago, con búsqueda por texto (DNI, nombre, correo o referencia) y un resumen de entradas vendidas y monto recaudado.

### Requisito 5. Informar entradas inválidas

Deben rechazarse precios o cantidades de entradas disponibles inválidos, DNI inválidos o que ya compraron, correos inválidos, compras sin entradas disponibles o con la venta cerrada y referencias de pago repetidas mediante mensajes comprensibles.

### Requisito 6. Autenticar el acceso de administración

Debe ofrecerse una pantalla de inicio de sesión (usuario y contraseña) y exigirse una sesión activa para abrir las vistas de administración y para sus operaciones. El inicio de sesión compara el usuario (distinguiendo mayúsculas) y la contraseña (contra un hash); una credencial incorrecta se rechaza con un mensaje comprensible que no revela cuál campo falló. Debe ser posible cerrar la sesión, que además caduca por tiempo. La consulta pública de la entrada, la compra y el reinicio de los datos (utilidad de demostración) quedan fuera de la restricción.

### Requisito 7. Datos demo en los formularios

Todos los formularios (compra, tarjeta, configuración de la entrada e inicio de sesión) deben ofrecer un botón «Datos demo» que los complete con datos de ejemplo válidos sin enviarlos.

## 3. Reglas y restricciones de datos

### Regla 1. Una sola entrada

La feria tiene una única entrada, válida para los tres días.

### Regla 2. Precio válido

El precio en soles debe ser positivo y admitir como máximo dos decimales.

### Regla 3. Entradas disponibles válidas

Las entradas disponibles (al configurarlas o tras una compra) deben ser un número entero no negativo.

### Regla 4. Una entrada por DNI

Cada compra es de una sola entrada y guarda el DNI (exactamente 8 dígitos) y el nombre (obligatorio) de la persona. Un DNI no puede repetirse entre las compras.

### Regla 5. Compra posible

Solo se puede comprar con la venta abierta y al menos una entrada disponible; la compra descuenta una.

### Regla 6. Compra atómica

Descontar la entrada disponible y guardar la compra se hace en una sola transacción: o se aplica todo o nada.

### Regla 7. Referencia de pago única

Cada compra guarda la referencia del pago aprobado, que no puede repetirse: un mismo pago no se registra dos veces.

### Regla 8. Precio congelado

La compra guarda el precio vigente de la entrada al pagar.

### Regla 9. Acceso restringido a administración

Las vistas de administración y sus operaciones exigen una sesión activa abierta con el usuario y la contraseña compartidos. La contraseña se guarda y se verifica mediante un hash, nunca en claro; el usuario se compara distinguiendo mayúsculas. La sesión caduca por tiempo y puede cerrarse. La página principal, la compra y el reinicio de los datos permanecen accesibles sin sesión.

### Regla 10. Correo para el comprobante

Cada compra guarda un correo electrónico obligatorio con formato válido (usuario@dominio), al que se envía el comprobante de la compra. El correo puede repetirse entre compras de distintos DNI.

## 4. Trazabilidad

| Historia de usuario                              | Requisito funcional                              | Reglas aplicables                                  |
| ------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------- |
| Historia 1. Ver la feria y su entrada            | Requisito 1                                      | Regla 1, Regla 3                                   |
| Historia 2. Comprar mi entrada                   | Requisito 2, Requisito 5, Requisito 7            | Regla 4, Regla 5, Regla 6, Regla 7, Regla 8, Regla 10 |
| Historia 3. Configurar la entrada                | Requisito 3, Requisito 5, Requisito 6, Requisito 7 | Regla 1, Regla 2, Regla 3, Regla 8, Regla 9      |
| Historia 4. Consultar las ventas                 | Requisito 4, Requisito 6                         | Regla 8, Regla 9, Regla 10                         |
| Historia 5. Iniciar sesión en la administración  | Requisito 6, Requisito 7                         | Regla 9                                            |
