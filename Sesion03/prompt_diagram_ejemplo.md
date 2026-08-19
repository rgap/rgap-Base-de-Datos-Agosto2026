Realiza un modelo entidad-relación (ER) a partir del siguiente caso de estudio:

[caso_de_estudio]

Caso 01: Grupos empresariales

Realice el modelo entidad -relación bajo las siguientes premisas:

• Un grupo empresarial (id_grupo) tiene muchas empresas (id_empresa). Cada empresa pertenece solamente a un grupo.

• Las empresas están conectadas por una relación de jerarquía. Cada subsidiaria es asignada a una empresa de nivel superior, esto es, la empresa padre.

• Cada empresa tiene varias plantas de producción (id_planta). Cada planta está bajo el control de una sola empresa.

• Las plantas de producción producen muchos productos diversos (id_producto) . Los productos son exclusivos a cada planta, es decir, un producto es producido por solo una planta.

[/caso_de_estudio]

Especificaciones:

- Sin leyenda
- Sin titulo ni subtitulo
- Sin tipos de datos 
- Sin decir PK, FK
- Utiliza notación de pata de gallo.
- Incluye doble label en cada relación: uno en cada extremo.
- Representa las cardinalidades utilizando la siguiente notación:

| Notación | Significado     |
| -------- | --------------- |
| **0..1** | Cero o uno      |
| **1..1** | Exactamente uno |
| **0..N** | Cero o muchos   |
| **1..N** | Uno o muchos    |

Formato de salida:

- SVG
