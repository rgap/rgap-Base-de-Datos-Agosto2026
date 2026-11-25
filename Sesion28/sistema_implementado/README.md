# Fogón · venta de entradas

Aplicación mínima en Node.js y SQLite para **Fogón**, una feria gastronómica de tres días (4, 5 y 6 de diciembre de 2026).

- Hay **una sola entrada**, válida para los tres días.
- La portada presenta la feria y contiene la compra: el visitante escribe su **DNI**, su **nombre** y su **correo** (para el comprobante) y paga en una **pasarela simulada de Lemon Squeezy**.
- Cada DNI compra **una sola entrada**.
- La administración tiene dos vistas: configurar la entrada (precio, disponibles, venta abierta o cerrada) y consultar las ventas. La protege un único usuario y contraseña compartidos.
- Todos los formularios tienen un botón **«Datos demo»** que los completa con datos válidos sin enviarlos.

## Ejecutar

Requisito: **Node.js 22.5** o superior. No hay dependencias externas ni servidor de base de datos: SQLite viene con Node (`node:sqlite`).

> Entre Node 22.5 y 22.12, `node:sqlite` está detrás de una opción. En esas versiones inicia con `node --experimental-sqlite server.js` en lugar de `npm start`.

### macOS y Linux

```bash
npm start
```

### Windows

1. Instala **Node.js** con el instalador LTS de [nodejs.org](https://nodejs.org).
2. En PowerShell o `cmd`, dentro de la carpeta del proyecto:

   ```powershell
   npm start
   ```

Si PowerShell dice que la ejecución de scripts está deshabilitada al usar `npm`, ejecuta una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, o escribe `npm.cmd` en lugar de `npm`.

### Configuración

La aplicación queda en `http://localhost:3000`. La primera vez crea el archivo `feria_entrada.db` y le aplica `specs/modelo_fisico.sql`.

| Variable          | Por defecto        | Para qué                        |
| ----------------- | ------------------ | ------------------------------- |
| `PORT`            | `3000`             | Puerto del servidor.            |
| `SQLITE_DATABASE` | `feria_entrada.db` | Ruta del archivo de SQLite.     |

Para fijarlas en PowerShell: `$env:PORT = "4000"`. En `cmd`: `set PORT=4000`. En macOS y Linux: `PORT=4000 npm start`.

Para empezar de cero, usa el pie **«Reiniciar datos»** de la aplicación.

## Vistas

| Ruta            | Acceso      | Qué muestra                                                                                                                                         |
| --------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | Pública     | La entrada (precio y disponibles) y el formulario de compra: DNI, nombre, correo, «Pagar» y «Datos demo». Con la venta cerrada o sin entradas, el formulario se deshabilita con un aviso. |
| `/login`        | Pública     | Inicio de sesión de administración.                                                                                                                 |
| `/admin`        | Con sesión  | Configurar precio, disponibles y venta abierta o cerrada, con un resumen de entradas vendidas, disponibles y monto recaudado.                       |
| `/admin/ventas` | Con sesión  | Compras registradas, con búsqueda por DNI, nombre, correo o referencia y resumen de entradas vendidas y monto recaudado.                            |

## Pasarela de pago simulada (Lemon Squeezy)

`public/checkout.js` imita el *checkout overlay* de Lemon Squeezy en modo de prueba. No carga `lemon.js`, no se conecta con Lemon Squeezy y no cobra nada.

| Tarjeta               | Resultado |
| --------------------- | --------- |
| `4242 4242 4242 4242` | Aprobada  |
| `4000 0000 0000 0002` | Rechazada |

- Sirve cualquier vencimiento futuro (MM/AA) y un CVC de 3 dígitos. El botón «Datos demo» de la ventana de pago completa la tarjeta aprobada.
- La tarjeta se valida solo en el navegador (Luhn, vencimiento, CVC) y **nunca se envía ni se guarda**.
- Si el pago se aprueba, la simulación genera una referencia de orden (UUID) y el navegador llama a `POST /api/compras`. El backend registra la compra en una transacción. Si la rechaza (DNI que ya compró, sin entradas, venta cerrada…), la ventana lo explica e indica que no se hizo ningún cargo.
- En una integración real, la compra se registraría al recibir el webhook `order_created` firmado de Lemon Squeezy, no por una llamada del navegador.

## Acceso de administración

- Credenciales iniciales: usuario **`admin`**, contraseña **`admin`**.
- Viven en la tabla `administrador` de `specs/modelo_fisico.sql`: el usuario en claro y la contraseña como hash SHA-256. Para cambiarlas, edita esa fila.
- La sesión usa una cookie `HttpOnly` y caduca a las 12 horas de inactividad.
- La portada, la compra y `POST /api/reset` no requieren sesión.

## API

| Método  | Ruta           | Sesión | Qué hace                                                                                                              |
| ------- | -------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| `POST`  | `/api/login`   | No     | Abre sesión con `{ usuario, password }`. `401` si alguna credencial es incorrecta.                                    |
| `POST`  | `/api/logout`  | No     | Cierra la sesión actual.                                                                                              |
| `GET`   | `/api/entrada` | No     | Devuelve la entrada: `nombre`, `descripcion`, `precio`, `disponibles`, `venta_activa`, `vendidas` y `recaudado`.      |
| `PATCH` | `/api/entrada` | Sí     | Fija `{ precio, disponibles, venta_activa }` y devuelve la entrada actualizada.                                       |
| `POST`  | `/api/compras` | No     | Registra una compra pagada: `{ dni, nombre, correo, referencia_pago }`.                                               |
| `GET`   | `/api/compras` | Sí     | Ventas, más recientes primero: `fecha_venta`, `dni`, `nombre`, `correo`, `precio` y `referencia_pago`.                |
| `POST`  | `/api/reset`   | No     | Reinicia los datos: elimina las tablas y vuelve a aplicar `specs/modelo_fisico.sql`. Utilidad de demostración.        |

Errores:

- `PATCH /api/entrada` responde `400` si el precio no es positivo con dos decimales como máximo, o si las entradas disponibles no son un entero no negativo.
- `POST /api/compras` responde `400` si los datos son inválidos (DNI de 8 dígitos, nombre obligatorio, correo válido) y `409` si la venta está cerrada, el DNI ya compró, la referencia de pago ya se registró o no quedan entradas.

## Modelo

Tres tablas, en `specs/modelo_fisico.sql`.

| Tabla           | Qué guarda                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `entrada`       | Una sola fila (`CHECK id = 1`) con `precio`, `disponibles` y `venta_activa`.                                                                    |
| `venta`         | `dni` (8 dígitos, `UNIQUE`: una entrada por persona), `nombre`, `correo`, `precio` al pagar y `referencia_pago` (`UNIQUE`: un pago no se registra dos veces). |
| `administrador` | La credencial única: usuario y hash de la contraseña.                                                                                           |

### La compra es una transacción

`registrarCompra` en `src/db.js`:

1. Abre la transacción con `BEGIN IMMEDIATE`: toma el bloqueo de escritura desde el inicio, así dos compras a la vez no venden más entradas de las que hay.
2. Descuenta una entrada:

   ```sql
   UPDATE entrada
   SET disponibles = disponibles - 1
   WHERE id = 1 AND venta_activa = 1 AND disponibles >= 1
   RETURNING nombre, precio;
   ```

   Si no cambia ninguna fila, la venta está cerrada o no quedan entradas.
3. Inserta la venta con el precio vigente. Los `UNIQUE` de `dni` y `referencia_pago` rechazan un DNI que ya compró o un pago repetido.
4. Si todo sale bien, `COMMIT`. Si algo falla, `ROLLBACK` deshace el descuento.

## Estructura

```text
server.js         # inicia el servidor
src/
  app.js          # rutas y respuestas HTTP; sirve las páginas
  db.js           # entrada, configuración, compra transaccional y ventas en SQLite
  validation.js   # validación de la configuración de la entrada y de la compra
  auth.js         # inicio de sesión: hash de contraseña (node:crypto) y sesiones en memoria
public/
  index.html                               # portada con la entrada y el formulario de compra
  compra.js                                # datos de la entrada, formulario de compra y datos demo
  checkout.js                              # simulación del checkout overlay de Lemon Squeezy
  login.html, login.js                     # inicio de sesión
  administracion.html, administracion.js   # configurar la entrada
  ventas.html, ventas.js                   # compras registradas
  admin-common.js                          # utilidades de administración
  reset.js                                 # pie «Reiniciar datos»
  style.css
specs/            # requisitos y esquema SQLite
package.json      # ejecución y versión de Node
```
