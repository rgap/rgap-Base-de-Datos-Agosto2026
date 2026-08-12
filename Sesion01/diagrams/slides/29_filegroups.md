# Slide 29 · Filegroups (grupos de archivos)

## Qué es un filegroup

Una **agrupación lógica de archivos de datos**. Piénsalo como una carpeta o una etiqueta que
reúne varios archivos (.MDF y .NDF) bajo un mismo nombre para administrarlos juntos.

**Ojo:** agrupa **archivos de datos**, nunca el archivo de log, que va siempre por su cuenta.

## Para qué sirven

Para **organizar y administrar** dónde se guarda físicamente cada cosa. En lugar de manejar
archivo por archivo, manejas grupos completos. Eso da dos ventajas concretas:

**1. Rendimiento.** Puedes poner un filegroup en un disco rápido y otro en uno más lento,
según qué tan seguido se usen esos datos.

**2. Mantenimiento.** Puedes respaldar o poner fuera de línea un filegroup completo sin
tocar el resto de la base.

## Los dos tipos

### Filegroup primario

- **Obligatorio**: siempre existe.
- Contiene el archivo principal (**.MDF**) más cualquier archivo que no asignes
  explícitamente a otro grupo.

### Filegroups de usuario

- **Opcionales**: los creas tú cuando quieres separar ciertos datos en grupos específicos.

---

## ¿Quién crea los filegroups: yo o la base?

Es de las preguntas más frecuentes y la respuesta tiene dos partes.

**El filegroup primario se crea solo, automáticamente**, en el momento en que creas la base
de datos. No haces nada: el SGBD lo genera junto con el .MDF y lo mete ahí sin que se lo
pidas. Viene de fábrica.

**Los filegroups de usuario los creas tú, manualmente y a propósito.** Eres tú, como
administrador, quien decide crearlos cuando tienes una razón concreta: repartir carga,
separar datos históricos, mover ciertas tablas a otro disco. **La base nunca los crea sola.**

Y hay un **segundo paso que también es tuyo**: después de crear un filegroup de usuario, tú
decides qué se guarda ahí. Al crear una tabla puedes indicarle explícitamente en qué
filegroup vivirá; **si no dices nada, la tabla cae por defecto en el primario**.

> Resumen para el cuaderno: el **primario** es automático y obligatorio, nace con la base;
> los **de usuario** son manuales y opcionales, nacen cuando el administrador los necesita.

**Analogía:** cuando te mudas a una casa nueva, ya viene con una habitación principal (el
primario). Si quieres un cuarto extra para guardar cosas específicas, tú mandas a
construirlo (los de usuario).

## Aplicado al e-commerce

- **Filegroup primario:** tablas del día a día —clientes, productos, pedidos activos— en un
  disco SSD rápido.
- **Filegroup de usuario "historico":** pedidos de años anteriores, que casi no se consultan,
  en un disco más económico.

La base es **una sola**, pero organizada en grupos según su uso.

## Analogía para clase

Los filegroups son como las **secciones de una biblioteca**: los libros (los archivos) se
agrupan por sección (el filegroup) para encontrarlos y administrarlos mejor. Y el
bibliotecario (el SGBD) sabe exactamente en qué sección buscar.
