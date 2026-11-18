# Especificación técnica

## Tecnologías

- Node.js 22.5 o superior.
- Módulos nativos (`node:http`, `node:sqlite`, `node:crypto`, `node:fs`, `node:path`, `node:url`); sin dependencias externas.
- SQLite, HTML, CSS y JavaScript del navegador.
- Tipografías web opcionales servidas desde Google Fonts (`Archivo Black`, `Inter`).
- Pasarela de pago: simulación local del checkout overlay de Lemon Squeezy (`public/checkout.js`); no se carga `lemon.js` ni se llama a la API de Lemon Squeezy.

## Estructura

```text
server.js
src/
  app.js
  db.js
  validation.js
  auth.js               # inicio de sesión de administración: hash de contraseña y sesiones en memoria
package.json
public/
  index.html            # portada pública con la entrada y el formulario de compra
  login.html            # inicio de sesión de administración
  administracion.html   # administración: configurar la entrada
  ventas.html           # administración: ventas registradas
  compra.js             # portada: datos de la entrada y formulario de compra (DNI, nombre, correo, datos demo, pagar)
  checkout.js           # simulación del checkout overlay de Lemon Squeezy (modo de prueba)
  login.js              # envío del formulario de inicio de sesión; botón de datos demo
  administracion.js     # formulario de la entrada (precio, entradas disponibles, venta abierta) y resumen
  ventas.js             # listado de compras con búsqueda y resumen
  admin-common.js       # utilidades de administración: aviso flotante, redirección sin sesión y cerrar sesión
  reset.js              # pie de demostración "Reiniciar datos" con confirmación propia
  style.css
specs/
```

`server.js` solo inicia el servidor. `src/app.js` implementa las rutas HTTP y sirve las páginas y los recursos estáticos; `src/db.js` concentra SQLite (inicialización desde `specs/modelo_fisico.sql`, lectura y configuración de la entrada, compra transaccional, listado de ventas y lectura de la credencial de administración); `src/validation.js` las reglas de entrada, y `src/auth.js` la autenticación de administración. La interfaz usa HTML semántico, CSS y JavaScript nativo con `fetch`, sin frameworks ni proceso de compilación. La navegación lateral de administración alterna entre `/admin` y `/admin/ventas`; cada vista incluye además en su encabezado un botón que abre la portada y otro que cierra la sesión.

## Flujo de pago simulado

1. El visitante escribe su DNI, su nombre y su correo en el formulario de la portada (o pulsa «Datos demo»); el navegador valida esos campos.
2. «Pagar» abre la ventana de `checkout.js` (imita el checkout overlay de Lemon Squeezy en modo de prueba). Valida la tarjeta en el navegador: número con dígito verificador (Luhn), vencimiento futuro y CVC de 3 o 4 dígitos. `4000 0000 0000 0002` se rechaza como tarjeta declinada.
3. Si el pago se aprueba, la simulación genera una referencia de pago (UUID, como el `identifier` de una orden de Lemon Squeezy) y emite el equivalente al evento `Checkout.Success`.
4. El navegador envía `POST /api/compras` con el DNI, el nombre, el correo y la referencia del pago. Los datos de la tarjeta nunca salen de la ventana de pago.
5. El backend registra la compra en una transacción: descuenta una entrada disponible con `UPDATE … SET disponibles = disponibles - 1 WHERE … AND disponibles >= 1 AND venta_activa = 1` y guarda la fila de `venta` (el `UNIQUE` del DNI impide una segunda compra de la misma persona). Si algo falla, la ventana informa que no se realizó ningún cargo.
6. La confirmación indica el correo al que se envía el comprobante. El envío real del correo no está implementado: la aplicación solo registra el correo con la compra.

Al ser una simulación, el backend confía en la referencia que recibe; una integración real verificaría el pago con el webhook `order_created` firmado de Lemon Squeezy antes de registrar la compra.

## Modelos

Las reglas de datos las garantiza el esquema con `PRIMARY KEY`, `UNIQUE`, `FOREIGN KEY` y `CHECK`: una sola fila de `entrada` (`id = 1`), precio positivo con dos decimales, entradas disponibles enteras no negativas, DNI de 8 dígitos y único en `venta`, correo con formato básico `usuario@dominio.ext` y referencia de pago única. Que la venta esté abierta y que quede una entrada disponible lo asegura la transacción de compra.

El conceptual identifica entidades y atributos; sus tipos son marcadores del editor. El lógico usa tipos portables y checks comunes para los cuatro exportadores de dbml-editor (MySQL 8.0.16+ y SQL Server 2017+). Los textos que participan en claves usan `varchar(255)` para que puedan indexarse. El físico concreta SQLite: fechas en texto, comprobaciones de enteros con `typeof` cuando corresponda y decimales con `round`. La exportación no incluye datos iniciales ni todas las reglas de las operaciones; la intercalación, la precisión y los límites de texto se concretan por motor.

## Páginas

- `/` — `index.html`: portada pública con la entrada y la compra.
- `/login` — `login.html`: inicio de sesión de administración.
- `/admin` — `administracion.html` (requiere sesión): configurar la entrada.
- `/admin/ventas` — `ventas.html` (requiere sesión): compras registradas.
