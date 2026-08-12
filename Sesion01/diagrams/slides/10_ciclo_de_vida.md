# Slide 10 · Ciclo de vida de una base de datos

Según Coronel, Morris y Rob. Son **seis fases** y es un ciclo, no una línea: al final se
vuelve a empezar.

## Las seis fases

**1. Estudio inicial.** Se analiza la organización, se detectan sus problemas y necesidades,
se define el alcance y las restricciones. Todavía no se dibuja nada.

**2. Diseño de base de datos.** Se crean los diseños **conceptual, lógico y físico**, y se
**selecciona el SGBD**. Es la fase más técnica y la más determinante.

**3. Implementación y carga.** Se instala el SGBD, se crea la base y se cargan los datos.

**4. Prueba y evaluación.** Se verifica que funcione: integridad, rendimiento, seguridad,
respaldos. Si algo falla, se vuelve al diseño.

**5. Operación.** La base entra en producción y la usan los usuarios reales.

**6. Mantenimiento y evolución.** Correcciones, mejoras, nuevos requerimientos. De aquí se
regresa al inicio del ciclo.

## Aplicado al e-commerce

| Fase | Qué pasa en la tienda |
|---|---|
| Estudio inicial | Se entrevista al dueño: vende por WhatsApp, pierde pedidos, no sabe su stock real |
| Diseño | Se dibujan CLIENTES, PEDIDOS, DETALLE, PRODUCTOS, CATEGORIAS; se elige PostgreSQL |
| Implementación y carga | Se crean las tablas y se migran los 3 000 productos del Excel |
| Prueba y evaluación | Se simulan 50 compras simultáneas para ver si el stock se descuadra |
| Operación | La tienda abre al público |
| Mantenimiento | Llega el requerimiento de cupones de descuento: nueva tabla, nuevo ciclo |

## El punto que hay que dejar clarísimo

**La selección del SGBD ocurre en la fase de diseño**, no en la de implementación. Es la
confusión más común y es justamente lo que evalúa la pregunta 6 del cuestionario. La regla
mnemotécnica: si el enunciado menciona los **diseños lógico y físico**, la respuesta es
**diseño**.

## Para clase

Pregunta provocadora: *"¿en qué fase creen que se descubren los errores más caros?"*.
La respuesta incómoda es que los errores de la fase 2 se descubren en la 4 o en la 5, y
para entonces ya cuestan diez veces más. Es un buen argumento para que tomen en serio el
modelado.
