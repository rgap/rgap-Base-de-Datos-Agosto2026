# Especificación técnica

## Tecnologías

- Node.js 22.5 o superior.
- MySQL 8.0.16 o superior (desde esa versión MySQL aplica los `CHECK`).
- Una dependencia externa: `mysql2` (cliente de MySQL para Node.js; Node no trae uno nativo).
- Módulos nativos `node:http`, `node:fs`, `node:path` y `node:url`.
- HTML, CSS y JavaScript del navegador.

## Estructura

```text
server.js
src/
  app.js
  db.js
package.json
public/
  index.html
  agenda.js
  reset.js
  style.css
specs/
```

`server.js` solo inicia el servidor. `src/app.js` implementa las rutas HTTP, valida la entrada y sirve la interfaz; `src/db.js` concentra MySQL (contactos, grupos, pertenencias y reinicio de los datos). La interfaz es una sola página con HTML semántico, CSS y JavaScript nativo con `fetch`, sin frameworks ni proceso de compilación.

## API

- `GET /api/contactos` — `[{ id, nombre, telefono, correo, es_favorito, fecha_registro, grupos: [{ id, nombre, color, rol }] }]`, favoritos primero y luego por nombre.
- `POST /api/contactos` — registra con `{ nombre, telefono?, correo?, es_favorito?, fecha_registro? }`; `201` con el contacto, `400` si falta el nombre, el correo ya existe o la fecha es futura o inválida.
- `PATCH /api/contactos/:id` — cambia `{ es_favorito }`; `200` con el contacto, `404` si no existe.
- `PUT /api/contactos/:id` — edita con `{ nombre, telefono?, correo?, es_favorito?, fecha_registro? }` y las mismas reglas que `POST`; sin fecha, conserva la que tenía; `200` con el contacto, `400` por las mismas causas que `POST`, `404` si no existe.
- `DELETE /api/contactos/:id` — elimina el contacto y sus filas de `contacto_grupo`; `200`, o `404` si no existe.
- `GET /api/grupos` — `[{ id, nombre, descripcion, color, contactos }]`, por nombre; `contactos` es cuántos tiene.
- `POST /api/grupos` — crea con `{ nombre, descripcion?, color? }`; `201`, o `400` si falta el nombre, ya existe o el color no es válido.
- `PUT /api/grupos/:id` — edita con los mismos campos y reglas que `POST`; sin color, conserva el que tenía; `200` con el grupo, `400` o `404`.
- `DELETE /api/grupos/:id` — elimina el grupo y sus filas de `contacto_grupo`; sus contactos siguen; `200`, o `404` si no existe.
- `POST /api/pertenencias` — pone un contacto en un grupo con `{ contacto_id, grupo_id, rol? }`; `201`, o `400` si alguno no existe o el contacto ya está en ese grupo.
- `POST /api/reset` — vuelve a los datos iniciales (botón «Reiniciar datos» del pie, utilidad de demostración).

Los textos se recortan; un teléfono, correo, descripción o rol vacío se guarda como `NULL`.

Si MySQL no está en marcha, las credenciales de `DATABASE_URL` no sirven o el esquema no se aplicó, la API responde `503` y la consola del servidor indica qué revisar.

## Base de datos

El esquema (`specs/modelo_fisico_mysql.sql`) se aplica una vez con el cliente `mysql` (`npm run db:crear`), que antes crea la base `agenda`. Crea las tablas `contacto`, `grupo` y `contacto_grupo`, los triggers de `contacto` y los datos iniciales. La aplicación se conecta con `DATABASE_URL` (por defecto `mysql://root@localhost:3306/agenda`).

### Por qué un trigger

La Regla 3 dice que la fecha de registro nunca es posterior a hoy. En SQLite eso cabe en un `CHECK (fecha_registro <= CURRENT_DATE)`. MySQL no lo acepta: rechaza el `CREATE TABLE` con el error 3814 («contains disallowed function: curdate»), porque un `CHECK` solo puede usar funciones cuyo resultado no cambia con el tiempo. La regla se mueve a dos triggers `BEFORE` sobre `contacto`:

- `contacto_fecha_no_futura_al_registrar` (`BEFORE INSERT`).
- `contacto_fecha_no_futura_al_corregir` (`BEFORE UPDATE`).

Ambos comparan `NEW.fecha_registro` con el día de hoy en Lima, `DATE(UTC_TIMESTAMP() - INTERVAL 5 HOUR)` (Lima no tiene horario de verano), y si es posterior cancelan la operación con `SIGNAL SQLSTATE '45000'` y el mensaje «La fecha de registro no puede ser futura.». Hacen falta los dos: un trigger responde a un solo evento, y corregir un contacto también podría dejarle una fecha futura.

`src/db.js` traduce el `SQLSTATE '45000'` a un `400` con el mensaje del trigger. `src/app.js` compara antes con el día de hoy en Lima solo para responder sin ir a la base; la garantía es el trigger.

El valor por defecto de la fecha sí puede usar la hora actual: es la expresión `DEFAULT (DATE(UTC_TIMESTAMP() - INTERVAL 5 HOUR))`. En un `BEFORE INSERT` sin fecha, `NEW.fecha_registro` ya trae ese valor.

### Reinicio

El reinicio de los datos (utilidad de demostración «Reiniciar datos») elimina las tablas, y con ellas sus triggers, y vuelve a aplicar `specs/modelo_fisico_mysql.sql` en una conexión con `multipleStatements`. Las líneas `DELIMITER` son del cliente `mysql`, no de SQL; `src/db.js` las quita y cambia cada `END //` por `END;` antes de enviar el archivo.

## Modelos

Tres tablas: `contacto`, `grupo` y la tabla intermedia `contacto_grupo`, que guarda la relación N:M con su clave primaria compuesta `(contacto_id, grupo_id)` y el `rol` de la pareja.

Las claves foráneas de `contacto_grupo` no borran en cascada. Por eso, al eliminar un contacto o un grupo, `src/db.js` borra primero sus filas de `contacto_grupo` y luego el registro, en una sola transacción (Regla 6).

El físico MySQL guarda `es_favorito` como `BOOLEAN` (en MySQL, `TINYINT(1)`: 0/1) con un `CHECK`, la fecha como `DATE` y los textos como `VARCHAR` con su largo máximo. Los textos usan la intercalación por defecto (`utf8mb4_0900_ai_ci`), que no distingue mayúsculas ni tildes: «amigos» choca con «Amigos» en el nombre único del grupo, y la lista ordena «Díaz» junto a «Diaz».

El conceptual identifica entidades y atributos; sus tipos son marcadores del editor. El lógico usa tipos portables y conserva la regla de la fecha como `check`, igual que en la agenda sin trigger. El físico concreta MySQL: es el único que la convierte en triggers.

## Páginas

- `/` — `index.html` + `agenda.js`: pestañas Contactos (tarjetas con favorito y grupos) y Grupos (tarjetas con sus miembros y su rol). Cada contacto y cada grupo tienen «Editar», que abre el mismo diálogo de alta con sus datos y un botón «Eliminar»; antes de eliminar se pide confirmación en un diálogo propio. Cada pestaña tiene una barra con el buscador, un contador («2 de 3 contactos») y el botón de alta; el buscador filtra en el navegador la lista ya cargada, sin distinguir mayúsculas ni tildes, y resalta lo que coincide. Los contactos se agrupan en «Favoritos» y «Todos los contactos». El formulario de contacto no pide la fecha de registro: al registrar, la pone la base (hoy en Lima) y al editar se conserva. La API sigue aceptando `fecha_registro` y validándola. Los formularios (nuevo contacto, nuevo grupo, poner en un grupo) se abren en diálogos con un botón «Datos demo» que rellena el siguiente ejemplo aún no registrado.
