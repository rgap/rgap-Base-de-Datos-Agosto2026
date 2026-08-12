# Slides 31–40 · Cuestionario de repaso

Diez preguntas de opción múltiple. Abajo va cada enunciado con su alternativa correcta, la
justificación y **por qué fallan las otras**, que es lo que realmente hace falta al momento
de revisar en clase.

Al final hay una tabla de respuestas para corrección rápida.

---

## Pregunta 1 — Definición de "dato"

*¿Cuál de las siguientes definiciones corresponde correctamente al concepto de "dato"?*

- A. Datos organizados y procesados que resultan útiles para la toma de decisiones.
- **B. Hechos conocidos que pueden ser registrados y que tienen un significado implícito.** ✅
- C. Entendimiento ganado a través de la experiencia y el aprendizaje.
- D. Colección de información almacenada sin redundancias perjudiciales.

**Por qué B.** Es la definición literal del slide 8.

**Las trampas.** La A es la definición de **información**; la C, la de **conocimiento**; la
D, la de **base de datos**. La pregunta está diseñada para ver si distinguen los cuatro
conceptos, no para que recuerden uno.

---

## Pregunta 2 — Empresa de logística

*Almacena nombre, dirección y teléfono de cada cliente en tres sistemas distintos sin
sincronizar. Cuando el cliente cambia de dirección, facturación sigue usando la antigua.*

- A. Integridad de entidad.
- **B. Redundancia no controlada e inconsistencia de datos.** ✅
- C. Integridad referencial incorrecta.
- D. Ausencia de un modelo entidad-relación.

**Por qué B.** El escenario tiene **dos problemas encadenados**: el mismo dato guardado en
tres sistemas (**redundancia no controlada**) y, como no están sincronizados, el mismo
cliente termina con dos direcciones distintas según a quién le preguntes
(**inconsistencia**). La B captura las dos caras.

**Por qué no las otras.**
- **A** (entidad) trata de claves primarias y de que cada fila sea única e identificable.
  Aquí no hay problema de identificación de filas.
- **C** (referencial) trata de claves foráneas apuntando a registros que existan. El caso no
  habla de relaciones rotas entre tablas, sino de datos desactualizados.
- **D** es un distractor tramposo: que falte un MER no es el problema descrito. El MER es
  una herramienta de diseño, no la causa directa de esta falla.

**La idea de fondo (slides 19 y 20):** la redundancia es la **causa**, la inconsistencia es
el **síntoma**.

---

## Pregunta 3 — Contribución de Codd

*¿Cuál fue la contribución principal de Edgar F. Codd?*

- A. Diseñó el primer motor de base de datos orientado a objetos.
- B. Creó el lenguaje SQL para consultar bases de datos jerárquicas.
- C. Inventó el modelo de grafos para representar relaciones complejas.
- **D. Propuso el modelo relacional, que organiza los datos en tablas con filas y
  columnas.** ✅

**Por qué D.** Codd propuso el modelo relacional en los años 70 (slides 12–13).

**Nota didáctica.** La B es hábil: SQL sí nació del trabajo de Codd, pero **no es para bases
jerárquicas**, y él no lo creó personalmente. Vale la pena señalarlo, porque muchos alumnos
la marcan por asociación.

---

## Pregunta 4 — Biblioteca universitaria

*Quiere asegurar que ningún libro se registre sin un ISBN único y que no existan filas
duplicadas. ¿Qué tipo de integridad aplica?*

- A. Integridad referencial.
- B. Integridad de dominio.
- **C. Integridad de entidad.** ✅
- D. Integridad definida por el usuario.

**Por qué C.** Las palabras **"único"** y **"sin filas duplicadas"** son la firma
inconfundible de la **clave primaria**. El ISBN funciona como PK del libro: no se repite y
no puede quedar vacío.

**Por qué no las otras.** La A sería si habláramos de una FK hacia otra tabla; la B, si
fuera sobre el tipo, rango o formato del dato; la D, si fuera una regla propia del negocio.
Aquí es identificación única, o sea entidad.

---

## Pregunta 5 — Función principal del SGBD

*¿Cuál es la función principal de un Sistema de Gestión de Base de Datos?*

- A. Definir el modelo entidad-relación de la organización.
- B. Eliminar toda redundancia de datos en los sistemas de información.
- **C. Facilitar la definición, construcción, manipulación y compartición de bases de datos
  entre aplicaciones.** ✅
- D. Diseñar el esquema físico de almacenamiento en disco.

**Por qué C.** Es la definición de Elmasri y Navathe de los slides 15–16.

**Por qué no las otras.**
- **A**: definir el MER es tarea del **diseñador**, no del software.
- **B**: falla por el "**toda**". Algo de redundancia puede ser válida —el precio histórico
  del slide 19— y el SGBD no la elimina por sí solo.
- **D**: diseñar el esquema físico es trabajo del **administrador**, no la función principal
  del sistema.

---

## Pregunta 6 — Fase del ciclo de vida

*¿En qué fase se selecciona el SGBD y se crean los diseños lógico y físico?*

- **A. Diseño de base de datos.** ✅
- B. Estudio inicial.
- C. Implementación y carga.
- D. Prueba y evaluación.

**Por qué A.** En la fase de diseño se elige el SGBD y se crean tanto el diseño lógico como
el físico (slide 10).

**La pista:** si el enunciado menciona los **diseños**, la fase es **diseño**.

**Por qué no las otras.** El **estudio inicial** es solo el análisis previo; la
**implementación** es cuando ya construyes y cargas; la **prueba** es cuando validas lo ya
construido.

---

## Pregunta 7 — RR. HH. y Contabilidad

*RR. HH. actualiza el salario en su sistema, pero Contabilidad sigue viendo el anterior
porque usa otra base de datos. ¿Qué principio se violó?*

- A. Integridad de dominio, porque el tipo de dato del salario no es válido.
- **B. Consistencia de datos, porque existen versiones distintas del mismo dato en lugares
  distintos.** ✅
- C. Integridad referencial, porque falta una clave foránea entre ambas tablas.
- D. Redundancia controlada, que es aceptable en este contexto.

**Por qué B.** Es exactamente el caso del slide 20.

**Por qué no las otras.**
- **A**: el salario es un número perfectamente válido; el problema es que está
  desactualizado, no que sea de tipo incorrecto.
- **C**: no hay claves foráneas en juego.
- **D**: esta redundancia no tiene nada de "controlada" — justamente produjo la
  contradicción.

---

## Pregunta 8 — Modelo tipo árbol

*¿Cuál de los siguientes modelos organiza la información en estructuras tipo árbol, con un
nodo padre que puede tener varios nodos hijo?*

- Modelo relacional.
- Modelo de grafos.
- **Modelo jerárquico.** ✅
- Modelo documental.

**Por qué el jerárquico.** La estructura de árbol con un padre y varios hijos es su firma
(slide 11).

**Precisión útil.** El modelo de **grafos** también tiene nodos y conexiones, pero **sin
jerarquía**: cualquier nodo se conecta con cualquier otro. Lo que define al jerárquico es
que cada hijo tiene **un solo padre**.

---

## Pregunta 9 — Transferencia bancaria

*Se transfieren S/ 500 de la cuenta A a la B. El sistema falla a mitad: el saldo se descontó
de A pero no se abonó en B. ¿Qué componente lógico debería evitarlo?*

- A. Registro de datos, porque cada operación es una fila en la tabla.
- B. Modelo entidad-relación, que define las entidades Cuenta y Transferencia.
- C. Integridad de dominio, que valida que el monto sea un número positivo.
- **D. Transacción, que asegura que todas las operaciones se completen o ninguna se aplique
  (rollback).** ✅

**Por qué D.** Es el concepto del slide 24: la transacción trata todas las operaciones como
una **unidad indivisible**. Si algo falla, el ROLLBACK revierte todo y nunca queda el dinero
descontado de A sin llegar a B. **Es todo o nada.**

**Por qué no las otras.** La A es solo una fila, no garantiza nada; la B es diseño
conceptual; la C solo valida que el monto sea un número correcto, pero no protege el proceso
completo.

---

## Pregunta 10 — Objetivo del MER

*El Modelo Entidad-Relación tiene como objetivo principal:*

- A. Definir la estructura física de almacenamiento en el disco duro.
- **B. Proveer un modelo de alto nivel, independiente de cualquier estructura de
  almacenamiento, que identifique entidades, atributos y relaciones.** ✅
- C. Reemplazar al SGBD en la gestión de consultas SQL.
- D. Establecer las reglas de integridad referencial entre las tablas.

**Por qué B.** El MER es un modelo **conceptual**: no se mete todavía con cómo se guardan
las cosas. Se enfoca en el **qué** —qué entidades hay, qué atributos tienen, cómo se
relacionan— (slide 14).

**Por qué no las otras.** La A habla del **nivel físico**, lo contrario del MER; la C
confunde modelo con software; la D es una consecuencia posterior del diseño, no el objetivo
del MER.

---

## Clave de respuestas

| # | Tema | Respuesta |
|---|---|---|
| 1 | Definición de dato | **B** |
| 2 | Redundancia e inconsistencia | **B** |
| 3 | Codd | **D** |
| 4 | Integridad de entidad | **C** |
| 5 | Función del SGBD | **C** |
| 6 | Ciclo de vida | **A** |
| 7 | Consistencia de datos | **B** |
| 8 | Modelo jerárquico | **Modelo jerárquico** |
| 9 | Transacción | **D** |
| 10 | Objetivo del MER | **B** |

**Advertencia para los alumnos:** las respuestas correctas no siguen ningún patrón de
posición. En este cuestionario hay tres B seguidas al inicio y luego alternan. Conviene
decírselo, porque algunos se confían de patrones que no existen.
