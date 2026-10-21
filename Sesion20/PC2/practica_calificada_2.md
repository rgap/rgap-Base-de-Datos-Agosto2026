# Práctica Calificada 2 - Modelo lógico y SQL

## Parte 1: Lecciones de Aprende SQL

Realizar las lecciones de https://www.aprendesql.dev/ desde **Lección 12** a **Lección 20**, incluidos Examen de Manipulacion de datos y Estructura de tablas.

## Parte 2: Ruta de Modelo Lógico

Usar la plataforma https://rgap-db-labs.vercel.app/ para realizar la **Ruta de Modelo Lógico**: Fundamentos y Casos de estudio.

Desarrollar primero la sección de **Fundamentos** y luego resolver **todos los casos de estudio** de la ruta. Deben elaborar el **modelo lógico de cada uno de los casos**, no solo de uno.

- Analizen los **casos de estudio** que van desarrollando, revisando la transformación de entidades, atributos, relaciones y cardinalidades en tablas, columnas, claves primarias y claves foráneas.
- Terminalos hasta que el modelo sea valido (en verde).

## Estas son las preguntas por caso de estudio:

Respondan estas preguntas justificando sus respuestas.

### Caso 1: Selector aleatorio de películas

1. ¿Qué cambiaría si se pidiera conservar el historial de selecciones de peliculas incluso despues de cerrar todo el navegador?

### Caso 2: Contador de vasos

1. ¿Por qué se restringe el identificador a `id = 1`?

### Caso 3: Sistema de flujo de caja simple

1. ¿Escribir «los movimientos no se editan ni eliminan» como nota en el modelo lógico impide borrarlos en un gestor de base de datos? ¿Cómo harías para hacer cumplir esa regla?

### Caso 4: Sistema de cupones de descuento

1. ¿Qué significa que `vigente_hasta` sea nulo?
2. Escribe el codigo SQL de las tablas en SQLite y explica por que no es conveniente guardar la contraseña explicita en una base datos.

### Caso 5: Sistema de objetos perdidos

1. ¿Por qué `reclamo` tiene una clave primaria compuesta por persona y objeto?

### Caso 6: Sistema de administración de peluquerías caninas

1. ¿Por qué `pago.cita_id` es único? ¿Qué permitiría quitar esa restricción?

### Caso 7: Catálogo web de productos con filtros

1. ¿Para qué convendría hacer `ON DELETE CASCADE` en este caso y por qué?


## Modalidad

Individual

## Rubrica y calificación

Parte 1 [5 puntos]
Parte 2: Capturas de los modelos lógicos completados [7 puntos]
Parte 3: Respuestas a las preguntas [8 puntos]

Tota: 20 puntos

## Entregable

Entregar **un solo documento** con lo siguiente para cada caso de estudio:

- Parte 1: Incluir captura de pantalla de Lecciones completas.
- Parte 2: Incluir **captura de pantalla de cada modelo de caso de estudio completado**, que se vea el modelo lógico (el diagrama) completo, seguido de la **solución de las preguntas del caso**.

Ejemplo de entregable: https://docs.google.com/document/d/1GMgyERY8WZDCO61TfQybd4skZTtJey1j/edit?usp=sharing&ouid=103159609695592780097
