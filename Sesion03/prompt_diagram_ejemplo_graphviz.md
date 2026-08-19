Actúa como un experto Modelador de Bases de Datos Relacionales.

Realiza un modelo entidad-relación (ER) a partir del siguiente caso de estudio:

[caso_de_estudio]

Caso 04: Control de pagos

Una bodega requiere controlar las cuentas de crédito que se crean para los clientes. Un cliente puede tener una cuenta con un monto máximo de consumo o realizar un pago previo y consumirlo en el tiempo. La bodega entrega un ticket al cliente que abre una c uenta a fin de que ese ticket sea presentado por la persona que realiza una compra, debido a que el cliente o cualquier familiar o persona que porte el ticket puede hacer uso de éste. El monto consumido se debita del crédito otorgado o saldo restante, hast a que quede agotado. Queda a criterio de la dueña de la bodega otorgar créditos adicionales, para lo cual se abre una nueva cuenta y se entrega un nuevo ticket. Así mismo, la dueña puede suspender una cuenta, sin importar si se agotó el crédito o saldo.

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
- Que los labels no se sobrepongan con las relaciones.
- Que los espaciados entre tablas sean x1.5 veces los tamaños de los labels juntos. 
- Representa las cardinalidades utilizando la siguiente notación:

| Notación | Significado     |
| -------- | --------------- |
| **0..1** | Cero o uno      |
| **1..1** | Exactamente uno |
| **0..N** | Cero o muchos   |
| **1..N** | Uno o muchos    |

**Formato de salida:**

- Graphviz DOT