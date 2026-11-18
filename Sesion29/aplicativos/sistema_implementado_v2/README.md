# Venta de entradas para una feria gastronómica con procedimiento almacenado

Aplicación mínima en Node.js y MySQL para **Fogón**, una feria gastronómica de tres días (4, 5 y 6 de diciembre de 2026). Hay **una sola entrada**, válida para los tres días. La portada pública presenta la feria y contiene la compra: el visitante escribe su **DNI**, su **nombre** y su **correo** (al que se envía el comprobante) y paga en una **pasarela de pago simulada de Lemon Squeezy**. Cada DNI puede comprar una sola entrada. La administración tiene dos vistas: configurar la entrada (precio, entradas disponibles y venta abierta o cerrada) y consultar las ventas. Está protegida por un único usuario y contraseña compartidos (no hay cuentas de usuario).

Todos los formularios tienen un botón **«Datos demo»** que los completa con datos de ejemplo válidos sin enviarlos.

Es el mismo sistema que `55_venta_de_entradas_para_feria_gastronomica`, pero lo central aquí es **dónde vive la regla de la compra**. Cuando la venta abre, muchos visitantes pagan a la vez; si dos compras leen al mismo tiempo que queda una entrada, ambas podrían registrarse (sobreventa). Eso no lo resuelve la aplicación sino MySQL:

- La única forma de registrar una compra es `CALL comprar_entrada(...)`, un procedimiento almacenado con `SQL SECURITY DEFINER`. Bloquea la entrada con `SELECT ... FOR UPDATE`, comprueba la venta abierta, el DNI, la referencia del pago y las entradas disponibles, descuenta una y guarda la venta. Si algo falla hace `ROLLBACK`.
- La aplicación se conecta con el usuario `app_feria`, que **no puede** hacer `INSERT`, `UPDATE` ni `DELETE` en ninguna tabla. Aunque un error en el código intentara vender sin descontar, MySQL lo rechazaría.
- La configuración de la entrada (`configurar_entrada`) y el inicio de sesión (`credencial_valida`) también pasan por rutinas de la base. La aplicación ni siquiera puede leer la tabla `administrador`.

Por eso este caso usa MySQL y no SQLite: SQLite no tiene procedimientos almacenados ni usuarios con permisos.

## Ejecutar

Requiere Node.js 22.5 o superior y un servidor MySQL 8.0.16 o superior en marcha. En macOS con Homebrew:

```bash
brew install mysql
brew services start mysql
```

1. Crear la base, las tablas, las rutinas y el usuario de la aplicación (una sola vez, como `root`; en Homebrew la contraseña de `root` está vacía, así que basta con pulsar Enter):

   ```bash
   npm run db:crear      # equivale a: mysql -u root -p < ../_specs/modelo_fisico.sql
   ```

2. Instalar la dependencia (`mysql2`) e iniciar:

   ```bash
   npm install
   npm start
   ```

Queda disponible en `http://localhost:3000`. Se puede cambiar el puerto con `PORT` y la conexión con `DATABASE_URL` (por defecto `mysql://app_feria:app_feria@localhost:3306/feria_entradas`).

## Comprobar que la base protege la venta

Conéctate como lo hace la aplicación:

```bash
mysql -u app_feria -papp_feria feria_entradas
```

```sql
-- Comprar sí: es la única vía. Descuenta una entrada y guarda la venta.
CALL comprar_entrada('70123456', 'Luis Rojas', 'luis@correo.com', 'orden-1', @id, @fecha, @entrada, @precio);
SELECT @id, @fecha, @entrada, @precio;

-- El mismo DNI otra vez: lo rechaza el procedimiento y no descuenta nada.
CALL comprar_entrada('70123456', 'Luis Rojas', 'luis@correo.com', 'orden-2', @id, @fecha, @entrada, @precio);

-- Todo lo demás lo rechaza MySQL ("command denied").
UPDATE entrada SET disponibles = 1000;
INSERT INTO venta (dni, nombre, correo, precio, referencia_pago) VALUES ('11111111', 'x', 'x@x.pe', 1, 'x');
DELETE FROM venta;
SELECT * FROM administrador;
```

Para ver el bloqueo, abre dos sesiones como `app_feria`. Deja la entrada con una sola disponible (`CALL configurar_entrada(45, 1, 1);`) y llama a `comprar_entrada` con DNI distintos en las dos a la vez. Una compra se registra y la otra recibe «Ya no quedan entradas disponibles.».

Para empezar de cero: `mysql -u root -p -e "DROP DATABASE feria_entradas"` y repetir el paso 1.

## Estructura

```text
server.js       # inicia el servidor
src/
  app.js        # rutas y respuestas HTTP; sirve las páginas
  db.js         # conexión como app_feria: CALL comprar_entrada, configurar_entrada y reiniciar_datos; lectura de entrada y ventas; credencial_valida
  validation.js # validación de la configuración de la entrada y de la compra
  auth.js       # inicio de sesión de administración: hash de contraseña (node:crypto), comprobado por MySQL, y sesiones en memoria
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
../_specs/      # requisitos y esquema MySQL (tablas, procedimientos, función y permisos)
package.json    # ejecución, dependencia mysql2 y versión de Node
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
- Si el pago se aprueba, la simulación genera una referencia de orden (UUID) y el navegador llama a `POST /api/compras`. El backend registra la compra con `comprar_entrada`; si la rechaza (DNI que ya compró, sin entradas disponibles, venta cerrada…), la ventana lo explica e indica que no se realizó ningún cargo.
- En una integración real, la compra se registraría al recibir el webhook `order_created` firmado de Lemon Squeezy, no por una llamada del navegador.

## Acceso de administración

Las vistas `/admin` y sus operaciones exigen una sesión iniciada en `/login`. Credenciales iniciales: usuario **`admin`**, contraseña **`admin`**. Viven en la tabla `administrador` de `../_specs/modelo_fisico.sql` (el usuario en claro y la contraseña como hash SHA-256); para cambiarlas, edita esa fila. El backend calcula el hash y se lo pasa a `credencial_valida`, que responde si coincide. La sesión usa una cookie `HttpOnly` y caduca a las 12 horas de inactividad. La portada, la compra y `POST /api/reset` (utilidad de demostración del pie "Reiniciar datos") no requieren sesión.

## API

- `POST /api/login` — abre sesión con `{ usuario, password }`; `401` si alguna credencial es incorrecta.
- `POST /api/logout` — cierra la sesión actual.
- `GET /api/entrada` — la entrada: `nombre`, `descripcion`, `precio`, `disponibles`, `venta_activa`, `vendidas` y `recaudado`. Público.
- `PATCH /api/entrada` — fija `{ precio, disponibles, venta_activa }` y devuelve la entrada actualizada; requiere sesión. `400` si el precio no es positivo con dos decimales como máximo o las entradas disponibles no son un entero no negativo.
- `POST /api/compras` — registra una compra pagada: `{ dni, nombre, correo, referencia_pago }`. Público. `400` si los datos son inválidos (DNI de 8 dígitos, nombre obligatorio, correo válido); `409` si la venta está cerrada, si el DNI ya compró, si la referencia de pago ya se registró o si no quedan entradas disponibles.
- `GET /api/compras` — ventas (más recientes primero): `fecha_venta`, `dni`, `nombre`, `correo`, `precio` y `referencia_pago`; requiere sesión.
- `POST /api/reset` — reinicia todos los datos al estado inicial con `reiniciar_datos`. Utilidad de demostración: es la única vía por la que la aplicación puede borrar ventas y en un sistema real no existiría.

Si MySQL no está en marcha o el esquema no se aplicó, la API responde `503` y la consola del servidor indica qué revisar.

## Modelo

Tres tablas y cuatro rutinas, todo en `../_specs/modelo_fisico.sql`:

- `entrada` — una sola fila (`CHECK id = 1`) con `precio` (`DECIMAL(10,2)`), `disponibles` y `venta_activa`.
- `venta` — el `dni` (8 dígitos, `UNIQUE`: una entrada por persona), el `nombre`, el `correo` para el comprobante, el `precio` al pagar, la `referencia_pago` (`UNIQUE`: un pago no se registra dos veces) y la `fecha_venta` en UTC.
- `administrador` — la credencial única (usuario y hash de la contraseña).
- `comprar_entrada` (procedimiento) — bloquea la entrada (`SELECT ... FOR UPDATE`), comprueba venta abierta, DNI nuevo, referencia nueva y al menos una entrada disponible, descuenta una, inserta la venta y confirma. Ante cualquier error hace `ROLLBACK`. Devuelve el id, la fecha, la entrada y el precio por parámetros `OUT`.
- `configurar_entrada` (procedimiento) — fija precio, disponibles y estado; rechaza un precio con más de dos decimales.
- `reiniciar_datos` (procedimiento) — utilidad de demostración: borra las ventas y restablece la entrada.
- `credencial_valida` (función) — devuelve si el usuario (distinguiendo mayúsculas) y el hash coinciden.

En `55_venta_de_entradas_para_feria_gastronomica` la misma transacción la arma la aplicación en `src/db.js`. Aquí la arma la base: si mañana otra aplicación (una boletería, un script) vende entradas, también tendrá que pasar por `comprar_entrada`.
