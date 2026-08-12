# Slides 25–26 · Componentes físicos

Aquí bajamos del mundo lógico al **mundo real del disco duro**.

## Qué es un archivo

Una **unidad física almacenada en el disco duro** donde el SGBD guarda los datos y la
información del sistema. Y se dividen en **dos tipos**.

## Tipo 1: archivos de datos

Aquí vive la información propiamente dicha: las **tablas**, los **registros**, los
**índices**. Es donde están guardados Ana, sus pedidos y los productos.

En SQL Server hay dos variantes:

- **.MDF** — principal y **único** por base de datos.
- **.NDF** — secundarios y **opcionales**, pueden ser varios.

*(Detalle completo en el slide 27.)*

## Tipo 2: archivo de registro de transacciones (log)

El **.LDF**. No guarda los datos en sí, sino el **historial de todas las operaciones**: cada
inserción, cada modificación, cada borrado. Es lo que permite deshacer con **ROLLBACK** y
recuperar la base ante una caída.

*(Detalle completo en el slide 28.)*

## La forma más simple de resumirlo

> El archivo de **datos** guarda el **qué** (la información actual).
> El archivo de **log** guarda el **cómo se llegó ahí** (el historial de los cambios).

## Filegroups

Por encima de los archivos de datos están los **filegroups** o grupos de archivos: carpetas
lógicas que agrupan varios archivos de datos para administrarlos juntos. Hay uno
**primario**, obligatorio, y puedes crear otros **de usuario**.

*(Detalle completo en el slide 29.)*

## El diagrama en cascada del slide 26

La idea central de la diapositiva es esta jerarquía:

```
DATABASE
├── PRIMARY / FILE GROUP  ──►  .MDF  +  .NDF  ──►  Tablas
└── LOG                   ──►  .LDF
```

Léelo de arriba abajo: la **base de datos** se compone de filegroups más el archivo de log;
los **filegroups** contienen los archivos .MDF y .NDF; y dentro de esos archivos viven, al
final, las **tablas**.

Fíjate en un detalle que suele pasar desapercibido: **el archivo de log cuelga directo de la
base de datos**, no de un filegroup. Los filegroups agrupan archivos de datos, nunca el log.

## Para clase

Recorre el camino inverso al de la sesión: parte de la tabla `PRODUCTOS` que ya conocen y
sube preguntando "¿y esto dónde está guardado?" hasta llegar a la base de datos. Es el mismo
diagrama, pero descubierto por ellos.
