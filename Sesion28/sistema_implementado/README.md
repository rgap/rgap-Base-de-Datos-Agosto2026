# Venta de entradas para una feria gastronómica

Aplicación mínima en Node.js para **Fogón**, una feria gastronómica de tres días (4, 5 y 6 de diciembre de 2026). Hay **una sola entrada**, válida para los tres días. La portada pública presenta la feria y contiene la compra: el visitante escribe su **DNI**, su **nombre** y su **correo** (al que se envía el comprobante) y paga en una **pasarela de pago simulada de Lemon Squeezy**. Cada DNI puede comprar una sola entrada. La administración tiene dos vistas: configurar la entrada (precio, entradas disponibles y venta abierta o cerrada) y consultar las ventas. Está protegida por un único usuario y contraseña compartidos (no hay cuentas de usuario).

Todos los formularios tienen un botón **«Datos demo»** que los completa con datos de ejemplo válidos sin enviarlos.

## Ejecutar

Requiere Node.js 22.5 o superior. No tiene dependencias externas.

```bash
npm start
```

Queda disponible en `http://localhost:3000`. Se puede cambiar el puerto con `PORT` y el archivo de base de datos con `SQLITE_DATABASE`.

## Estructura

```text
server.js       # inicia el servidor
src/
  app.js        # rutas y respuestas HTTP; sirve las páginas
  db.js         # entrada, configuración, compra transaccional y ventas en SQLite
  validation.js # validación de la configuración de la entrada y de la compra
  auth.js       # inicio de sesión de administración: hash de contraseña (node:crypto) y sesiones en memoria
public/
  index.html          # portada con la entrada y el formulario de compra
  compra.js           # datos de la entrada, formulario de compra y datos demo
  checkout.js         # simulación del checkout overlay de Lemon Squeezy
  login.html, login.js
  administracion.html, administracion.js   # configurar la entrada
  ventas.html, ventas.js                   # compras registradas
  admin-common.js     # utilidades de administración
  reset.js            # pie "Reiniciar datos"
  style.css
specs/      # requisitos y esquema SQLite
package.json    # ejecución y versión de Node
```

## Vistas

- `/` — portada pública con la entrada: precio, entradas disponibles y el formulario de compra (DNI, nombre, correo, «Pagar» y «Datos demo»). Con la venta cerrada o sin entradas disponibles, el formulario queda deshabilitado con un aviso.
- `/login` — inicio de sesión de administración.
- `/admin` — configurar la entrada: precio, entradas disponibles y venta abierta o cerrada, con un resumen de entradas vendidas, entradas disponibles y monto recaudado (requiere sesión).
- `/admin/ventas` — compras registradas con búsqueda por DNI, nombre, correo o referencia y resumen de entradas vendidas y monto recaudado (requiere sesión).

## Pasarela de pago simulada (Lemon Squeezy)

`public/checkout.js` imita el *checkout overlay* de Lemon Squeezy en modo de prueba; no carga `lemon.js` ni se conecta con Lemon Squeezy, y no se cobra nada.

- Tarjeta aprobada: `4242 4242 4242 4242`. Tarjeta rechazada: `4000 0000 0000 0002`. Cualquier vencimiento futuro (MM/AA) y CVC de 3 dígitos. El botón «Datos demo» de la ventana de pago completa la tarjeta aprobada.
- La tarjeta se valida solo en el navegador (Luhn, vencimiento, CVC) y **nunca se envía ni se guarda**.
- Si el pago se aprueba, la simulación genera una referencia de orden (UUID) y el navegador llama a `POST /api/compras`. El backend registra la compra en una transacción; si la rechaza (DNI que ya compró, sin entradas disponibles, venta cerrada…), la ventana lo explica e indica que no se realizó ningún cargo.
- En una integración real, la compra se registraría al recibir el webhook `order_created` firmado de Lemon Squeezy, no por una llamada del navegador.

## Acceso de administración

Las vistas `/admin` y sus operaciones exigen una sesión iniciada en `/login`. Credenciales iniciales: usuario **`admin`**, contraseña **`admin`**. Viven en la tabla `administrador` de `specs/modelo_fisico.sql` (el usuario en claro y la contraseña como hash SHA-256); para cambiarlas, edita esa fila. La sesión usa una cookie `HttpOnly` y caduca a las 12 horas de inactividad. La portada, la compra y `POST /api/reset` (utilidad de demostración del pie "Reiniciar datos") no requieren sesión.

## API

- `POST /api/login` — abre sesión con `{ usuario, password }`; `401` si alguna credencial es incorrecta.
- `POST /api/logout` — cierra la sesión actual.
- `GET /api/entrada` — la entrada: `nombre`, `descripcion`, `precio`, `disponibles`, `venta_activa`, `vendidas` y `recaudado`. Público.
- `PATCH /api/entrada` — fija `{ precio, disponibles, venta_activa }` y devuelve la entrada actualizada; requiere sesión. `400` si el precio no es positivo con dos decimales como máximo o las entradas disponibles no son un entero no negativo.
- `POST /api/compras` — registra una compra pagada: `{ dni, nombre, correo, referencia_pago }`. Público. `400` si los datos son inválidos (DNI de 8 dígitos, nombre obligatorio, correo válido); `409` si la venta está cerrada, si el DNI ya compró, si la referencia de pago ya se registró o si no quedan entradas disponibles.
- `GET /api/compras` — ventas (más recientes primero): `fecha_venta`, `dni`, `nombre`, `correo`, `precio` y `referencia_pago`; requiere sesión.
- `POST /api/reset` — reinicia todos los datos al estado inicial. Utilidad de demostración.

## Modelo

Tres tablas: `entrada` (una sola fila, `CHECK id = 1`, con `precio`, `disponibles` y `venta_activa`), `venta` y `administrador`. `venta` guarda el `dni` (8 dígitos, `UNIQUE`: una entrada por persona), el `nombre`, el `correo` para el comprobante, el `precio` al pagar y la `referencia_pago` (`UNIQUE`: un pago no se registra dos veces).

La compra es una transacción: descuenta una entrada con `UPDATE entrada SET disponibles = disponibles - 1 WHERE id = 1 AND venta_activa = 1 AND disponibles >= 1` (si no cambia ninguna fila, la venta está cerrada o no quedan entradas) e inserta la venta. Los `UNIQUE` de `dni` y `referencia_pago` rechazan un DNI que ya compró o un pago repetido, y el `ROLLBACK` deshace el descuento.
