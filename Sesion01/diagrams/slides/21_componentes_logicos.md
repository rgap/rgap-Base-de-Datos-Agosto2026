# Slide 21 · Bloque 2 — Componentes lógicos y físicos

Separador del segundo bloque. Conviene aprovecharlo para plantear el marco completo antes de
entrar al detalle, porque los slides 22 a 29 solo tienen sentido dentro de esta distinción.

## Una base de datos vive en dos niveles a la vez

**Nivel lógico.** Cómo tú y yo **pensamos y vemos** los datos. Aquí entran:

- **Tablas** (relaciones)
- **Registros** (filas)
- **Campos** (columnas)
- **Relaciones** entre tablas (PK ↔ FK)
- **Vistas** y consultas
- **Transacciones**

Es la parte que le importa al **usuario y al diseñador**. Cuando alguien dice "el cliente
Ana tiene tres pedidos", está hablando en nivel lógico. Nadie piensa en bloques de disco al
decir eso.

**Nivel físico.** Los **archivos reales** donde todo eso queda almacenado en el disco duro:

- Archivos de datos (**.MDF**, **.NDF**)
- Archivo de log o registro de transacciones (**.LDF**)
- **Filegroups** que agrupan archivos de datos

Es la parte que le importa al **administrador de base de datos**.

## La conexión entre ambos

Cuando creas una tabla —algo lógico— el SGBD la traduce por debajo y la guarda en esos
archivos físicos, sin que tengas que preocuparte de dónde ni cómo.

> **Tú piensas en tablas; el SGBD piensa en archivos.**

## Una precisión importante

El componente lógico **no es el dato en sí**: es la **estructura** que organiza el dato y le
da forma. La tabla `PRODUCTOS` es el componente lógico; "Audífonos X, S/ 300, stock 42" es
el dato que vive dentro de esa estructura.

## Para clase

Dibuja dos columnas en la pizarra, LÓGICO y FÍSICO, y ve pegando los términos a medida que
avanzan los slides 22 a 29. Al final del bloque el cuadro queda completo y sirve de resumen
sin que tengas que rehacerlo.
