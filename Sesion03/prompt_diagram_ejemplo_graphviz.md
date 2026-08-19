Actúa como un experto Modelador de Bases de Datos Relacionales.

Realiza un modelo entidad-relación (ER) a partir del siguiente caso de estudio:

[caso_de_estudio]

Caso 03: Diseño de encuestas

Realizar un modelo para organizar los datos de un futuro sistema de diseño de encuestas, donde se pueden crear preguntas de tres tipos: opción única, opción múltiple y de texto. El modelo debe soportar la creación de encuestas, sus preguntas y opciones. Po r otro lado, debe soportarse el registro de destinatarios de encuestas pues éstas serán distribuidas vía correo electrónico. Por cada destinatario que responde una encuesta se registran sus respuestas para un posterior procesamiento.

[/caso_de_estudio]

**Especificaciones:**

- Sin leyenda.
- Sin título ni subtítulo.
- Sin tipos de datos.
- Sin indicar PK ni FK.
- Utiliza notación de pata de gallo.
- Incluye doble label en cada relación: uno en cada extremo, iniciando cada etiqueta desde su respectivo extremo.
- No agregues elementos adicionales fuera de: tablas, atributos, relaciones, cardinalidades y etiquetas de las relaciones.
- Asegurate del espaciado entre tablas para que no se sobrepongan las entidades ni las relaciones ni las cardinalidades, ni los labels.
- Representa las cardinalidades utilizando la siguiente notación:

| Notación | Significado     |
| -------- | --------------- |
| **0..1** | Cero o uno      |
| **1..1** | Exactamente uno |
| **0..N** | Cero o muchos   |
| **1..N** | Uno o muchos    |

**Formato de salida:**

- Graphviz DOT
