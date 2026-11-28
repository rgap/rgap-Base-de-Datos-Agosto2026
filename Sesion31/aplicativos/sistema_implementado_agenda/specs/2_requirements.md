# Requirements

## 1. Historias de usuario

### Historia 1. Registrar un contacto

**Como** usuario,
**quiero** registrar un contacto con su nombre, teléfono y correo,
**para** tenerlo guardado en mi agenda.

**Criterios**

- El nombre es obligatorio; el teléfono y el correo son opcionales, conforme a Regla 1.
- Un correo ya registrado en otro contacto debe rechazarse con un mensaje comprensible, conforme a Regla 1.
- Se puede marcar el contacto como favorito al registrarlo; si no, queda como no favorito, conforme a Regla 2.
- La fecha de registro no se ingresa: la agenda anota la de hoy, conforme a Regla 3.
- Después de registrarlo, el contacto aparece de inmediato en la lista.

---

### Historia 2. Ver y marcar los contactos

**Como** usuario,
**quiero** ver mis contactos con sus datos y sus grupos, y marcar o desmarcar favoritos,
**para** encontrar rápido a quien busco.

**Criterios**

- La lista muestra cada contacto con su nombre, teléfono, correo, fecha de registro, si es favorito y los grupos en que está, con su rol en cada uno.
- Los favoritos aparecen primero, bajo el título «Favoritos»; los demás, bajo «Todos los contactos»; dentro de cada bloque, por nombre.
- Cada contacto tiene un botón para marcarlo o desmarcarlo como favorito.
- Cuando no haya contactos, debe mostrarse un mensaje comprensible.

---

### Historia 3. Crear un grupo

**Como** usuario,
**quiero** crear grupos con nombre, descripción y color,
**para** ordenar mis contactos.

**Criterios**

- El nombre es obligatorio y no puede repetirse, conforme a Regla 4.
- La descripción es opcional; el color es uno de rojo, verde, azul o gris, y si no se elige es gris, conforme a Regla 4.
- La lista de grupos muestra cada grupo con su color, su descripción y cuántos contactos tiene.

---

### Historia 4. Poner un contacto en un grupo

**Como** usuario,
**quiero** poner un contacto en un grupo, con su rol ahí,
**para** saber quién está en cada grupo y qué papel tiene.

**Criterios**

- Se elige un contacto y un grupo existentes, y opcionalmente un rol, conforme a Regla 5.
- Un contacto puede estar en varios grupos, pero en un mismo grupo una sola vez; un segundo intento debe rechazarse con un mensaje comprensible, conforme a Regla 5.

---

### Historia 5. Editar o eliminar un contacto

**Como** usuario,
**quiero** corregir los datos de un contacto o quitarlo de la agenda,
**para** mantener mi agenda al día.

**Criterios**

- Cada contacto tiene un botón para editarlo, que muestra sus datos actuales: nombre, teléfono, correo y favorito.
- Se aplican las mismas reglas que al registrarlo: nombre obligatorio y correo que no tenga otro contacto, conforme a Regla 1 y Regla 2.
- La fecha de registro no se cambia: se conserva la que tenía, conforme a Regla 3.
- Editar un contacto no cambia sus grupos ni su rol en ellos.
- Desde la edición se puede eliminar el contacto, después de confirmarlo; también sale de todos sus grupos, conforme a Regla 6.
- Después de guardar o eliminar, la lista se actualiza de inmediato.

---

### Historia 6. Editar o eliminar un grupo

**Como** usuario,
**quiero** cambiar el nombre, la descripción o el color de un grupo, o quitarlo,
**para** que mis grupos sigan teniendo sentido.

**Criterios**

- Cada grupo tiene un botón para editarlo, que muestra sus datos actuales.
- Se aplican las mismas reglas que al crearlo: nombre obligatorio y que no tenga otro grupo, y color rojo, verde, azul o gris, conforme a Regla 4.
- Desde la edición se puede eliminar el grupo, después de confirmarlo; sus contactos salen del grupo pero siguen en la agenda, conforme a Regla 6.

---

### Historia 7. Buscar contactos y grupos

**Como** usuario,
**quiero** escribir parte de un dato y ver solo lo que coincide,
**para** encontrar rápido a quien busco.

**Criterios**

- Los contactos se buscan por nombre, teléfono o correo; los grupos, por nombre o descripción.
- La búsqueda no distingue mayúsculas ni tildes: «diaz» encuentra «Díaz».
- El texto que coincide se resalta, y un contador indica cuántos resultados hay de cuántos.
- Si nada coincide, el mensaje ofrece «Limpiar búsqueda».
- La tecla «/» lleva el foco al buscador de la pestaña visible, y «Esc» lo vacía.
- La lista se filtra mientras se escribe y conserva su orden; si nada coincide, se muestra un mensaje comprensible.

## 2. Requisitos funcionales

### Requisito 1. Registrar un contacto

Debe ser posible registrar un contacto con nombre, teléfono, correo y favorito; la agenda anota su fecha de registro.

### Requisito 2. Listar los contactos

Debe ser posible consultar los contactos con sus datos y los grupos en que están, con su rol.

### Requisito 3. Marcar favorito

Debe ser posible marcar o desmarcar un contacto como favorito.

### Requisito 4. Crear y listar grupos

Debe ser posible crear un grupo y consultar los grupos con cuántos contactos tienen.

### Requisito 5. Poner un contacto en un grupo

Debe ser posible registrar que un contacto está en un grupo, con su rol.

### Requisito 6. Editar y eliminar un contacto

Debe ser posible cambiar el nombre, teléfono, correo y favorito de un contacto existente, y eliminarlo.

### Requisito 7. Editar y eliminar un grupo

Debe ser posible cambiar el nombre, la descripción y el color de un grupo existente, y eliminarlo.

### Requisito 8. Buscar contactos y grupos

Debe ser posible filtrar los contactos por nombre, teléfono o correo, y los grupos por nombre o descripción.

## 3. Reglas y restricciones de datos

### Regla 1. Datos del contacto

Todo contacto tiene nombre (hasta 100 caracteres). El teléfono (hasta 20) y el correo (hasta 255) pueden faltar. No hay dos contactos con el mismo correo.

### Regla 2. Favorito

Un contacto es favorito o no lo es. Un contacto nuevo no es favorito hasta que se marca.

### Regla 3. Fecha de registro

La fecha de registro es solo el día. Si no se indica, es la de hoy (hora de Lima). Nunca es posterior al día de hoy.

### Regla 4. Grupo

Todo grupo tiene nombre (hasta 50 caracteres) y no hay dos grupos que se llamen igual. La descripción es opcional. El color es uno de rojo, verde, azul o gris; un grupo nuevo es gris si no se elige otro.

### Regla 5. Contacto en un grupo

Un contacto puede estar en varios grupos y un grupo puede tener muchos contactos, o ninguno. Un contacto está en un mismo grupo una sola vez. El rol es opcional, de hasta 50 caracteres.

### Regla 6. Eliminar

Al eliminar un contacto, se borran también sus pertenencias a grupos. Al eliminar un grupo, se borran sus pertenencias, pero sus contactos siguen en la agenda. Ninguna pertenencia queda apuntando a un contacto o a un grupo que ya no existe.

## 4. Trazabilidad

| Historia de usuario                     | Requisito funcional      | Reglas aplicables         |
| --------------------------------------- | ------------------------ | ------------------------- |
| Historia 1. Registrar un contacto       | Requisito 1              | Regla 1, Regla 2, Regla 3 |
| Historia 2. Ver y marcar los contactos  | Requisito 2, Requisito 3 | Regla 2, Regla 5          |
| Historia 3. Crear un grupo              | Requisito 4              | Regla 4                   |
| Historia 4. Poner un contacto en un grupo | Requisito 5            | Regla 5                   |
| Historia 5. Editar o eliminar un contacto | Requisito 6            | Regla 1, Regla 2, Regla 3, Regla 6 |
| Historia 6. Editar o eliminar un grupo  | Requisito 7              | Regla 4, Regla 6          |
| Historia 7. Buscar contactos y grupos   | Requisito 8              | —                         |
