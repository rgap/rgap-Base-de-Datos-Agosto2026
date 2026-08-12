# Sesión 1 — Base de Datos (SI33) · Guía docente

Material de preparación de clase construido slide por slide sobre la presentación
**PPT_SESION_1_SI33_PULCCJ.pdf** (43 diapositivas, Universidad Tecnológica del Perú).

Cada archivo de `slides/` corresponde a una diapositiva o a un bloque de diapositivas:
contiene la explicación, el ejemplo aplicado al **caso guía de e-commerce**, la analogía
para clase y las preguntas que conviene lanzar a los alumnos.

## Índice

| Archivo | Slides | Tema |
|---|---|---|
| `00_caso_guia_ecommerce.md` | — | Caso transversal de e-commerce (modelo de datos base) |
| `01-07_apertura_y_encuadre.md` | 1–7 | Portada, motivación, logro, conocimientos previos |
| `08_dato_informacion_conocimiento.md` | 8 | Dato → Información → Conocimiento |
| `09_definicion_de_base_de_datos.md` | 9 | Qué es una base de datos |
| `10_ciclo_de_vida.md` | 10 | Ciclo de vida de una base de datos |
| `11_modelos_de_datos.md` | 11 | Los seis modelos de datos |
| `12-13_modelo_relacional.md` | 12–13 | Codd y la terminología relacional |
| `14_modelo_entidad_relacion.md` | 14 | MER y sus cuatro notaciones |
| `15-16_sgbd_y_su_entorno.md` | 15–16 | SGBD y entorno (Elmasri & Navathe) |
| `17-18_integridad_de_datos.md` | 17–18 | Los cuatro tipos de integridad |
| `19_redundancia_de_datos.md` | 19 | Redundancia (mala y buena) |
| `20_consistencia_de_datos.md` | 20 | Consistencia de datos |
| `21_componentes_logicos.md` | 21 | Bloque 2: componentes lógicos vs físicos |
| `22-23_registros_de_datos.md` | 22–23 | Campo, valor, registro, tabla |
| `24_registro_de_transacciones.md` | 24 | Begin → Commit / Rollback |
| `25-26_componentes_fisicos.md` | 25–26 | Archivos de datos y de log |
| `27_archivos_de_datos_mdf_ndf.md` | 27 | .MDF principal y .NDF secundarios |
| `28_archivo_de_log_ldf.md` | 28 | Archivo de registro de transacciones |
| `29_filegroups.md` | 29 | Grupos de archivos primario y de usuario |
| `31-40_cuestionario_de_repaso.md` | 31–40 | Las 10 preguntas con respuestas y justificación |
| `41-42_repaso_y_bibliografia.md` | 41–42 | Cierre, síntesis y fuentes |

## Carpetas

- `slides/` — un markdown por diapositiva o bloque.
- `img/` — todos los diagramas en formato **SVG** (escalables, se pegan directo al PPT).
- `mermaid/` — el código fuente Mermaid de los diagramas que lo tienen, por si quieres editarlos.

## Nota sobre las imágenes

Todos los diagramas usan el mismo caso de e-commerce, de modo que la clase avanza sobre
un solo ejemplo que se va enriqueciendo. Los SVG se pueden insertar en PowerPoint
(Insertar → Imagen) sin perder calidad al proyectar.
