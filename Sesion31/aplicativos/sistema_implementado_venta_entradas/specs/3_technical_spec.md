# Especificación técnica

## Tecnologías

- Node.js 22.5 o superior.
- MySQL 8.0.16 o superior (desde esa versión MySQL aplica los `CHECK`). SQLite no sirve: no tiene procedimientos almacenados.
- Una dependencia externa: `mysql2` (cliente de MySQL para Node.js; Node no trae uno nativo).
- Módulos nativos `node:http`, `node:crypto`, `node:fs`, `node:path` y `node:url`.
- HTML, CSS y JavaScript del navegador.
- Tipografías web opcionales servidas desde Google Fonts (`Archivo Black`, `Inter`).
- Pasarela de pago: simulación local del checkout overlay de Lemon Squeezy (`public/checkout.js`); no se carga `lemon.js` ni se llama a la API de Lemon Squeezy.

## Estructura

```text
server.js
src/
  app.js
  db.js                 # conexión a MySQL; llama a comprar_entrada, configurar_entrada y credencial_valida; reaplica el esquema al reiniciar
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

`server.js` solo inicia el servidor. `src/app.js` implementa las rutas HTTP y sirve las páginas y los recursos estáticos; `src/db.js` concentra MySQL (lectura de la entrada, llamadas a `configurar_entrada` y `comprar_entrada`, listado de ventas, llamada a `credencial_valida` y reinicio de los datos); `src/validation.js` las reglas de entrada, y `src/auth.js` la autenticación de administración. La interfaz usa HTML semántico, CSS y JavaScript nativo con `fetch`, sin frameworks ni proceso de compilación. La navegación lateral de administración alterna entre `/admin` y `/admin/ventas`; cada vista incluye además en su encabezado un botón que abre la portada y otro que cierra la sesión.

## Flujo de pago simulado

1. El visitante escribe su DNI, su nombre y su correo en el formulario de la portada (o pulsa «Datos demo»); el navegador valida esos campos.
2. «Pagar» abre la ventana de `checkout.js` (imita el checkout overlay de Lemon Squeezy en modo de prueba). Valida la tarjeta en el navegador: número con dígito verificador (Luhn), vencimiento futuro y CVC de 3 o 4 dígitos. `4000 0000 0000 0002` se rechaza como tarjeta declinada.
3. Si el pago se aprueba, la simulación genera una referencia de pago (UUID, como el `identifier` de una orden de Lemon Squeezy) y emite el equivalente al evento `Checkout.Success`.
4. El navegador envía `POST /api/compras` con el DNI, el nombre, el correo y la referencia del pago. Los datos de la tarjeta nunca salen de la ventana de pago.
5. El backend valida los datos y llama a `CALL comprar_entrada(...)`. El procedimiento hace toda la compra dentro de MySQL (ver «Base de datos»). Si la rechaza, la API responde `409` con el mensaje del procedimiento y la ventana informa que no se realizó ningún cargo.
6. La confirmación indica el correo al que se envía el comprobante. El envío real del correo no está implementado: la aplicación solo registra el correo con la compra.

Al ser una simulación, el backend confía en la referencia que recibe; una integración real verificaría el pago con el webhook `order_created` firmado de Lemon Squeezy antes de registrar la compra.

## Base de datos

El esquema (`specs/modelo_fisico.sql`) se aplica una vez con el cliente `mysql` (`npm run db:crear`), que antes crea la base `feria`. Crea las tablas `entrada`, `venta` y `administrador`, los procedimientos `comprar_entrada` y `configurar_entrada` y la función `credencial_valida`.

La aplicación se conecta con el usuario de `DATABASE_URL` (por defecto `root`). Las escrituras de la aplicación pasan por los procedimientos; el reinicio de los datos es la única excepción.

`comprar_entrada` abre su propia transacción:

1. Descuenta una entrada con `UPDATE entrada SET disponibles = disponibles - 1 WHERE id = 1 AND disponibles > 0 AND venta_activa = 1`. El `UPDATE` bloquea la fila hasta el `COMMIT`: una segunda compra simultánea espera en este paso y luego ve las entradas ya descontadas.
2. Si `ROW_COUNT()` es 0, la venta está cerrada o no quedan entradas: lanza `SIGNAL SQLSTATE '45000'` con el mensaje.
3. Lee el nombre y el precio vigente, inserta la venta y confirma. Si el DNI ya compró o la referencia de pago ya existe, el `INSERT` falla por el `UNIQUE` (error 1062) y la API responde `409` con un mensaje según la clave repetida.

Ante cualquier error hace `ROLLBACK` y vuelve a lanzar el error: no se descuenta la entrada ni se guarda la venta. Devuelve el id, la fecha, el nombre de la entrada y el precio por parámetros `OUT` (`CALL comprar_entrada(?, ?, ?, ?, @venta_id, @fecha_venta, @entrada, @precio)` y luego `SELECT` de esas variables en la misma conexión).

`configurar_entrada` rechaza un precio con más de dos decimales y actualiza la entrada; si hay una compra en curso, espera a que termine porque usa la misma fila. `credencial_valida` es una función, no un procedimiento, porque devuelve un valor que se usa dentro de una consulta (`SELECT credencial_valida(...)`).

El reinicio de los datos (utilidad de demostración «Reiniciar datos») funciona como en el caso sin procedimiento: `src/db.js` elimina las tablas y vuelve a aplicar `specs/modelo_fisico.sql` en una conexión con `multipleStatements`. Las líneas `DELIMITER` son del cliente `mysql`, no de SQL; `src/db.js` las quita y cambia cada `END //` por `END;` antes de enviar el archivo.

## Modelos

Las reglas de datos las garantiza la base. El esquema usa `PRIMARY KEY`, `UNIQUE`, `FOREIGN KEY` y `CHECK`: una sola fila de `entrada` (`id = 1`), precio positivo, entradas disponibles enteras no negativas, DNI de 8 dígitos y único en `venta`, correo con formato básico `usuario@dominio.ext` y referencia de pago única. Que el precio tenga como máximo dos decimales, que la venta esté abierta y que quede una entrada disponible lo aseguran los procedimientos. `src/validation.js` repite las reglas de formato solo para responder con mensajes claros.

El conceptual identifica entidades y atributos; sus tipos son marcadores del editor. El lógico usa tipos portables y checks comunes para los cuatro exportadores de dbml-editor (MySQL 8.0.16+ y SQL Server 2017+). Los textos que participan en claves usan `varchar(255)` para que puedan indexarse. El físico concreta MySQL: `DECIMAL(10,2)` para los precios, `DATETIME` en UTC para la fecha de venta y `VARBINARY(255)` para el usuario de administración (distingue mayúsculas). Las rutinas solo existen en el físico.

## Páginas

- `/` — `index.html`: portada pública con la entrada y la compra.
- `/login` — `login.html`: inicio de sesión de administración.
- `/admin` — `administracion.html` (requiere sesión): configurar la entrada.
- `/admin/ventas` — `ventas.html` (requiere sesión): compras registradas.
