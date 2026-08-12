# Slide 9 · Definición de base de datos

## La definición del slide

Una base de datos es una **colección de datos interrelacionados**, almacenados **sin
redundancias perjudiciales**, que:

- representa algún **aspecto del mundo real**;
- mantiene los datos **independientes de los programas** que los usan;
- sirve a **una o más aplicaciones** a la vez.

## Desarmando la definición

Conviene ir frase por frase, porque cada una carga un concepto que se retoma después:

| Frase | Qué implica | Dónde se retoma |
|---|---|---|
| Datos **interrelacionados** | No son listas sueltas: hay vínculos entre ellos | Slide 14 (MER) |
| **Sin redundancias perjudiciales** | Ojo con el adjetivo: no dice "sin redundancia" | Slide 19 |
| Representa el **mundo real** | Modelar es recortar la realidad relevante | Slide 14 |
| **Independiente de los programas** | Puedes cambiar la app sin rehacer los datos | Slide 15 |
| Sirve a **varias aplicaciones** | Un solo repositorio, muchos consumidores | Slide 15 |

La frase de "sin redundancias **perjudiciales**" es la más rica: el propio autor admite que
alguna redundancia puede existir y ser correcta. Vale la pena marcarla ahora y cobrarla en
el slide 19 con el caso del precio histórico.

## Cómo enseñarlo

Toma un ejemplo que ellos conocen: la base de datos de la universidad. Contiene alumnos,
docentes, cursos, matrículas y notas; todo interrelacionado. El DNI del alumno está una
sola vez, no repetido en cada curso en que se matricula. Y sirve al mismo tiempo al
sistema de matrícula, al de notas y al de trámites.

Pregunta puente hacia la redundancia: *"¿qué pasaría si el correo del alumno estuviera
guardado por separado en cada uno de esos tres sistemas?"*.

## Llevado al e-commerce

![Modelo entidad-relación del e-commerce](../img/modelo_er_ecommerce.svg)

Los datos de Ana están **una sola vez** en `CLIENTES`. Sus 15 pedidos no repiten su
dirección: la referencian con `id_cliente`. Eso es exactamente "sin redundancias
perjudiciales".
