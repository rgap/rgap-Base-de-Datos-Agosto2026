# Caso de estudio: agenda de contactos

## 1. Problema

Marco guarda sus contactos: nombre, teléfono y correo. A algunos los marca como favoritos, para tenerlos más a mano. De cada contacto quiere saber también la fecha en que lo registró en la agenda.

Los ordena en grupos, como Familia, Trabajo o Amigos. Un contacto puede estar en varios grupos a la vez: Ana es su prima y además trabaja con él, así que la quiere en Familia y también en Trabajo. Y de cada contacto en cada grupo quiere anotar qué papel tiene ahí: prima, jefa, vecino…

De cada grupo anota su nombre y una descripción: para qué es ese grupo, o quiénes van en él. A cada grupo le pone además un color, para distinguirlo de un vistazo.

## 2. Objetivo

Registrar y consultar los contactos de Marco, sus grupos y quién está en cada uno, con el rol que tiene ahí.

## 3. Alcance y supuestos

- La aplicación es de uso personal y monousuario. No existe autenticación.
- Marco crea sus grupos y les pone nombre, descripción y color.
- Todo contacto tiene nombre. El teléfono y el correo pueden faltar.
- No puede haber dos contactos con el mismo correo.
- Un contacto es favorito o no lo es: no hay término medio. Un contacto nuevo no es favorito hasta que Marco lo marca.
- Al registrar un contacto, la agenda anota la fecha de ese día. La fecha de registro es solo el día: no hace falta la hora. Nadie se registra en el futuro: la fecha de registro nunca es posterior al día de hoy.
- Todo grupo tiene nombre, y no hay dos grupos que se llamen igual. Su descripción y su color son opcionales.
- El color de un grupo se anota con su nombre, y es uno de cuatro: rojo, verde, azul o gris. Un grupo nuevo es gris hasta que Marco le elige otro.
- Un contacto puede estar en varios grupos, o en ninguno todavía.
- Un grupo puede tener muchos contactos, o ninguno todavía, por ejemplo recién creado.
- Un contacto está en un mismo grupo una sola vez.
- De cada contacto en cada grupo se puede anotar su rol en ese grupo: una o dos palabras.
- Marco puede corregir o eliminar contactos y grupos. Si elimina un grupo, sus contactos siguen en la agenda.
- Marco puede buscar contactos y grupos escribiendo parte de un dato.
- Marco no numera sus contactos ni sus grupos: la agenda les pone el número sola.

Quedan fuera de alcance: fotos, cumpleaños, grupos dentro de otros grupos y compartir contactos con otras personas.

## 4. Roles

**Usuario:** registra y consulta sus contactos, sus grupos y quién está en cada uno. Es el único rol del sistema.
