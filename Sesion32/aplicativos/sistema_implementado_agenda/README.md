# Agenda de contactos con trigger

Aplicación mínima en Node.js y MySQL de **agenda de contactos**: registra, edita, elimina y busca contactos (nombre, teléfono, correo, favorito y fecha de registro), crea, edita, elimina y busca grupos con nombre, descripción y color, y pone cada contacto en uno o varios grupos con su rol ahí. Es una relación N:M con su tabla intermedia `contacto_grupo`.

Es el mismo sistema que `12_agenda_de_contactos`, pero con MySQL en lugar de SQLite. Lo central aquí es **la regla de la fecha de registro**: nunca es posterior a hoy. En SQLite basta un `CHECK (fecha_registro <= CURRENT_DATE)`. MySQL no lo permite: un `CHECK` no puede usar funciones de fecha, porque su resultado cambia cada día (error 3814). Por eso la regla la cumplen dos **triggers** sobre `contacto`, uno antes de cada `INSERT` y otro antes de cada `UPDATE`. Si la fecha es futura, cancelan la operación con `SIGNAL`.

## Ejecutar

Requiere Node.js 22.5 o superior y un servidor MySQL 8.0.16 o superior en marcha. En macOS con Homebrew:

```bash
brew install mysql
brew services start mysql
```

1. Crear la base, las tablas y los triggers (una sola vez, como `root`; en Homebrew la contraseña de `root` está vacía, así que basta con pulsar Enter):

   ```bash
   npm run db:crear      # crea la base agenda y aplica specs/modelo_fisico_mysql.sql
   ```

2. Instalar la dependencia (`mysql2`) e iniciar:

   ```bash
   npm install
   npm start
   ```

Queda disponible en `http://localhost:3000`. Se puede cambiar el puerto con `PORT` y la conexión con `DATABASE_URL` (por defecto `mysql://root@localhost:3306/agenda`; si `root` tiene contraseña: `mysql://root:CONTRASEÑA@localhost:3306/agenda`).

## Comprobar que la base protege la fecha

```bash
mysql -u root -p agenda
```

```sql
-- Sin fecha: la base pone la de hoy en Lima.
INSERT INTO contacto (nombre) VALUES ('Sin fecha');
SELECT nombre, fecha_registro FROM contacto WHERE nombre = 'Sin fecha';

-- Fecha futura al registrar: lo rechaza el trigger de INSERT.
INSERT INTO contacto (nombre, fecha_registro) VALUES ('Del futuro', '2099-01-01');
-- ERROR 1644 (45000): La fecha de registro no puede ser futura.

-- Fecha futura al corregir: lo rechaza el trigger de UPDATE.
UPDATE contacto SET fecha_registro = '2099-01-01' WHERE id = 1;
-- ERROR 1644 (45000): La fecha de registro no puede ser futura.

-- Los triggers de la tabla.
SHOW TRIGGERS;
```

Para ver por qué no basta un `CHECK`:

```sql
CREATE TABLE prueba (f DATE CHECK (f <= CURRENT_DATE));
-- ERROR 3814 (HY000): An expression of a check constraint 'prueba_chk_1' contains disallowed function: curdate.
```

Para empezar de cero basta el pie «Reiniciar datos» de la aplicación.

## Estructura

```text
server.js       # inicia el servidor
src/
  app.js        # rutas, validación de entrada y respuestas HTTP; sirve la página
  db.js         # conexión y operaciones MySQL; traduce el SIGNAL del trigger a un error 400; reinicio de datos
public/
  index.html    # pestañas Contactos y Grupos, con sus diálogos
  agenda.js     # lógica de la página y botones "Datos demo"
  reset.js      # pie "Reiniciar datos"
  style.css
specs/          # requisitos, modelos y esquema MySQL (tablas y triggers)
package.json    # ejecución, dependencia mysql2 y versión de Node
```

## API

- `GET /api/contactos` — los contactos, favoritos primero y luego por nombre, con sus grupos y su rol.
- `POST /api/contactos` — registra con `{ nombre, telefono?, correo?, es_favorito?, fecha_registro? }`; `201`, o `400` si falta el nombre, el correo ya existe o la fecha es futura.
- `PATCH /api/contactos/:id` — marca o desmarca favorito con `{ es_favorito }`.
- `PUT /api/contactos/:id` — edita con los mismos campos y reglas que al registrar; sin fecha, conserva la que tenía; `200`, `400` o `404`.
- `DELETE /api/contactos/:id` — elimina el contacto y lo saca de sus grupos; `404` si no existe.
- `GET /api/grupos` — los grupos por nombre, con cuántos contactos tiene cada uno.
- `POST /api/grupos` — crea con `{ nombre, descripcion?, color? }`; `201`, o `400` si el nombre se repite o el color no es rojo, verde, azul o gris.
- `PUT /api/grupos/:id` — edita con los mismos campos y reglas que al crear; sin color, conserva el que tenía; `200`, `400` o `404`.
- `DELETE /api/grupos/:id` — elimina el grupo; sus contactos salen de él pero siguen en la agenda; `404` si no existe.
- `POST /api/pertenencias` — pone un contacto en un grupo con `{ contacto_id, grupo_id, rol? }`; `400` si ya está en ese grupo.
- `POST /api/reset` — vuelve a los datos de ejemplo. Utilidad de demostración.

Si MySQL no está en marcha o el esquema no se aplicó, la API responde `503` y la consola del servidor indica qué revisar.

## Modelo

Tres tablas y dos triggers, todo en `specs/modelo_fisico_mysql.sql`:

- `contacto` — nombre obligatorio, correo único, favorito 0/1 y fecha de registro (`DATE`, por defecto hoy en Lima).
- `grupo` — nombre único (sin distinguir mayúsculas ni tildes) y color de una lista, gris por defecto.
- `contacto_grupo` — la tabla intermedia, con clave primaria compuesta `(contacto_id, grupo_id)` y el `rol` de cada pareja.
- `contacto_fecha_no_futura_al_registrar` (`BEFORE INSERT`) y `contacto_fecha_no_futura_al_corregir` (`BEFORE UPDATE`) — rechazan una fecha de registro posterior a hoy en Lima.

En `12_agenda_de_contactos` la misma regla es un `CHECK` de SQLite. Aquí la cumple la base con triggers: si mañana otra aplicación o un script escribe en `contacto`, tampoco podrá guardar una fecha futura.
