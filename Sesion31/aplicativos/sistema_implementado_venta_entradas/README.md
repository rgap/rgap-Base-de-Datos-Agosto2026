# Fogón · venta de entradas

Aplicación mínima en Node.js y MySQL para **Fogón**, una feria gastronómica de tres días (4, 5 y 6 de diciembre de 2026).

- Hay **una sola entrada**, válida para los tres días.
- La portada presenta la feria y contiene la compra: el visitante escribe su **DNI**, su **nombre** y su **correo** (para el comprobante) y paga en una **pasarela simulada de Lemon Squeezy**.
- Cada DNI compra **una sola entrada**.
- La administración tiene dos vistas: configurar la entrada (precio, disponibles, venta abierta o cerrada) y consultar las ventas. La protege un único usuario y contraseña compartidos.
- Todos los formularios tienen un botón **«Datos demo»** que los completa con datos válidos sin enviarlos.

## La idea: la regla de la compra vive en MySQL

Es el mismo sistema que `55_venta_de_entradas_para_feria_gastronomica`. Lo que cambia es **dónde vive la regla de la compra**.

Cuando la venta abre, muchos visitantes pagan a la vez. Si dos compras leen al mismo tiempo que queda una entrada, ambas podrían registrarse (sobreventa). Eso lo resuelve MySQL, no la aplicación:

- La compra se registra con `CALL comprar_entrada(...)`. El procedimiento descuenta una entrada con un `UPDATE` que solo cambia la fila si la venta está abierta y quedan entradas, y la bloquea hasta el `COMMIT`. Luego guarda la venta.
- Los `UNIQUE` de `venta` impiden repetir el DNI o la referencia del pago. Si algo falla, el procedimiento hace `ROLLBACK`.
- Configurar la entrada (`configurar_entrada`) e iniciar sesión (`credencial_valida`) también pasan por rutinas de la base.

Por eso este caso usa MySQL y no SQLite: SQLite no tiene procedimientos almacenados. En `57_venta_de_entradas_con_usuario_y_permisos` se agrega un usuario de MySQL para la aplicación que solo puede leer y llamar a las rutinas.

## Ejecutar

Requisitos:

- **Node.js 22.5** o superior.
- **MySQL 8.0.16** o superior, en marcha (desde esa versión MySQL aplica los `CHECK`).

### macOS

```bash
brew install mysql
brew services start mysql

npm run db:crear   # crea la base feria y aplica specs/modelo_fisico.sql
npm install        # instala mysql2
npm start
```

`npm run db:crear` pide la contraseña de `root` dos veces. En Homebrew está vacía: pulsa Enter.

### Windows

1. Instala **Node.js** (instalador LTS de [nodejs.org](https://nodejs.org)) y **MySQL Community Server** (instalador MSI de [dev.mysql.com/downloads/mysql](https://dev.mysql.com/downloads/mysql/)). Durante la configuración de MySQL elige una contraseña para `root`. MySQL queda como servicio de Windows y arranca solo.

2. Agrega el cliente `mysql` al `Path`; el instalador no lo hace. En PowerShell, para la ventana actual (cambia `8.4` por tu versión):

   ```powershell
   $env:Path += ";C:\Program Files\MySQL\MySQL Server 8.4\bin"
   ```

   Para dejarlo fijo, agrega esa carpeta a la variable de entorno `Path` de Windows.

3. Crea la base, instala e inicia, con la contraseña de `root` en `DATABASE_URL`:

   ```powershell
   npm run db:crear   # pide la contraseña de root dos veces
   npm install
   $env:DATABASE_URL = "mysql://root:CONTRASEÑA@localhost:3306/feria"
   npm start
   ```

   En `cmd` la variable se fija con `set DATABASE_URL=mysql://root:CONTRASEÑA@localhost:3306/feria`.

Notas:

- `npm run db:crear` funciona igual en PowerShell: npm ejecuta los scripts con `cmd.exe`, que sí entiende la redirección `<`.
- Si PowerShell dice que la ejecución de scripts está deshabilitada al usar `npm`, ejecuta una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, o escribe `npm.cmd` en lugar de `npm`.
- Si la contraseña tiene caracteres como `@`, `:` o `/`, escríbelos codificados en la URL (por ejemplo, `@` es `%40`).

### Configuración

La aplicación queda en `http://localhost:3000`.

| Variable       | Por defecto                                 | Para qué                                                                 |
| -------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `PORT`         | `3000`                                      | Puerto del servidor.                                                     |
| `DATABASE_URL` | `mysql://root@localhost:3306/feria` | Conexión a MySQL. Con contraseña: `mysql://root:CONTRASEÑA@localhost:3306/feria`. |

Si MySQL no está en marcha o el esquema no se aplicó, la API responde `503` y la consola del servidor indica qué revisar. Para empezar de cero, usa el pie **«Reiniciar datos»** de la aplicación.

## Comprobar que la base protege la venta

```bash
mysql -u root -p feria
```

```sql
-- Comprar sí: es la única vía. Descuenta una entrada y guarda la venta.
CALL comprar_entrada('70123456', 'Luis Rojas', 'luis@correo.com', 'orden-1', @id, @fecha, @entrada, @precio);
SELECT @id, @fecha, @entrada, @precio;

-- El mismo DNI otra vez: el INSERT falla por el UNIQUE de dni y el procedimiento deshace el descuento.
CALL comprar_entrada('70123456', 'Luis Rojas', 'luis@correo.com', 'orden-2', @id, @fecha, @entrada, @precio);
```

Para ver el bloqueo:

1. Abre dos sesiones de `mysql`.
2. Deja una sola entrada disponible: `CALL configurar_entrada(45, 1, 1);`.
3. Llama a `comprar_entrada` con DNI distintos en las dos sesiones a la vez.

Una compra se registra y la otra recibe «Venta cerrada o entradas agotadas.».

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
- Si el pago se aprueba, la simulación genera una referencia de orden (UUID) y el navegador llama a `POST /api/compras`. El backend registra la compra con `comprar_entrada`. Si la rechaza (DNI que ya compró, sin entradas, venta cerrada…), la ventana lo explica e indica que no se hizo ningún cargo.
- En una integración real, la compra se registraría al recibir el webhook `order_created` firmado de Lemon Squeezy, no por una llamada del navegador.

## Acceso de administración

- Credenciales iniciales: usuario **`admin`**, contraseña **`admin`**.
- Viven en la tabla `administrador` de `specs/modelo_fisico.sql`: el usuario en claro y la contraseña como hash SHA-256. Para cambiarlas, edita esa fila.
- El backend calcula el hash y se lo pasa a `credencial_valida`, que responde si coincide.
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

Tres tablas y tres rutinas, todo en `specs/modelo_fisico.sql`.

| Objeto               | Tipo          | Qué guarda o hace                                                                                                                                                                   |
| -------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entrada`            | Tabla         | Una sola fila (`CHECK id = 1`) con `precio` (`DECIMAL(10,2)`), `disponibles` y `venta_activa`.                                                                                      |
| `venta`              | Tabla         | `dni` (8 dígitos, `UNIQUE`: una entrada por persona), `nombre`, `correo`, `precio` al pagar, `referencia_pago` (`UNIQUE`: un pago no se registra dos veces) y `fecha_venta` en UTC. |
| `administrador`      | Tabla         | La credencial única: usuario y hash de la contraseña.                                                                                                                               |
| `comprar_entrada`    | Procedimiento | Descuenta una entrada si la venta está abierta y queda alguna (el `UPDATE` bloquea la fila), inserta la venta y confirma. Ante cualquier error hace `ROLLBACK`. Devuelve id, fecha, entrada y precio por parámetros `OUT`. |
| `configurar_entrada` | Procedimiento | Fija precio, disponibles y estado. Rechaza un precio con más de dos decimales.                                                                                                     |
| `credencial_valida`  | Función       | Devuelve si el usuario (distingue mayúsculas) y el hash coinciden.                                                                                                                  |

En `55_venta_de_entradas_para_feria_gastronomica` la misma transacción la arma la aplicación en `src/db.js`. Aquí la arma la base: si mañana otra aplicación (una boletería, un script) vende entradas, también tendrá que pasar por `comprar_entrada`.

## Estructura

```text
server.js         # inicia el servidor
src/
  app.js          # rutas y respuestas HTTP; sirve las páginas
  db.js           # conexión a MySQL: CALL comprar_entrada y configurar_entrada; lectura de entrada y ventas; credencial_valida; reinicio de datos
  validation.js   # validación de la configuración de la entrada y de la compra
  auth.js         # inicio de sesión: hash de contraseña (node:crypto), comprobado por MySQL, y sesiones en memoria
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
specs/            # requisitos y esquema MySQL (tablas, procedimientos y función)
package.json      # ejecución, dependencia mysql2 y versión de Node
```
