# Slides 41–42 · Repaso, conclusiones y bibliografía

## Slide 41 — Síntesis de la sesión

Un mapa de una sola página para cerrar. Si tienes cinco minutos, reconstrúyelo en la pizarra
preguntándoles a ellos.

### Bloque 1 — Fundamentos

- **Dato → Información → Conocimiento.** El salto de dato a información es **contexto**;
  de información a conocimiento, **experiencia**.
- **Base de datos.** Colección de datos interrelacionados, sin redundancias perjudiciales,
  independiente de los programas y compartida por varias aplicaciones.
- **Ciclo de vida.** Seis fases; el SGBD y los diseños lógico y físico se definen en la fase
  de **diseño**.
- **Modelos de datos.** Jerárquico, redes, relacional, orientado a objetos, documental y
  grafos. Ninguno es el mejor: cada uno responde bien un tipo de pregunta.
- **Modelo relacional.** Codd, años 70. Relación (tabla), tupla, atributo, grado,
  cardinalidad, clave primaria.
- **MER.** Entidades, atributos y relaciones. Cuatro notaciones: UML, pata de gallo, Chen,
  IDEF1X.
- **SGBD.** Define, construye, manipula y comparte. Es el único portero hacia los datos.
- **Integridad.** Entidad, referencial, dominio y definida por el usuario.
- **Redundancia y consistencia.** La redundancia es la causa; la inconsistencia, el síntoma.

### Bloque 2 — Componentes

| Nivel lógico | Nivel físico |
|---|---|
| Tablas | Archivos de datos (.MDF, .NDF) |
| Registros (filas) | Archivo de log (.LDF) |
| Campos (columnas) | Filegroups |
| Relaciones (PK ↔ FK) | |
| Transacciones | |

> **Tú piensas en tablas; el SGBD piensa en archivos.**

### Las tres frases que deberían llevarse

1. Un dato sin contexto no informa nada.
2. Un dato, un solo lugar — salvo cuando lo que guardas es un **hecho histórico**.
3. Una transacción es todo o nada.

---

## Slide 42 — Bibliografía

- **Coronel, C., Morris, S. y Rob, P. (2011).** *Bases de datos: diseño, implementación y
  administración.* Cengage Learning.
  → Fuente del **ciclo de vida** de las seis fases (slide 10).

- **Elmasri, R. y Navathe, S. B. (2007).** *Fundamentos de sistemas de bases de datos.*
  Addison Wesley.
  → Fuente de la definición de **SGBD** y de su **entorno** (slides 15–16).

## Slide 43 — Cierre

Logo institucional. Buen momento para anunciar el tema de la Sesión 2 y dejar una pregunta
abierta que enlace: por ejemplo, *"si el MER es solo un dibujo, ¿cómo se convierte en tablas
reales?"*.
