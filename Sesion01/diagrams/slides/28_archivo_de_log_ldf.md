# Slide 28 · Archivo de log (.LDF)

El **archivo de registro de transacciones**, con extensión **.LDF**.

## Qué guarda

No guarda los datos actuales, sino el **historial de cada operación** que se ejecuta sobre la
base: cada inserción, cada modificación, cada borrado, con el antes y el después.

## Para qué sirve

**1. ROLLBACK.** Permite deshacer una transacción incompleta. Si la compra de Ana falla a
mitad de camino, el SGBD lee el log y revierte lo ya hecho.

**2. Recuperación ante fallos.** Si el servidor se cae, al reiniciar el SGBD usa el log para
dejar la base en un estado coherente: completa lo que estaba confirmado y deshace lo que no.

**3. Respaldo y replicación.** Los respaldos de log permiten restaurar a un punto exacto en
el tiempo, y son la base de la replicación entre servidores.

## Características que conviene mencionar

- Es **independiente de los filegroups**: cuelga directamente de la base de datos.
- **Toda base tiene al menos uno.**
- Crece con la actividad, no con la cantidad de datos: una base pequeña con muchísimas
  operaciones puede tener un log enorme.

## La frase que resume el bloque

> El archivo de **datos** responde *"¿cómo están las cosas ahora?"*.
> El archivo de **log** responde *"¿cómo llegaron a estar así?"*.

## Aplicado al e-commerce

Cuando Ana confirma su compra, el log anota: se creó el pedido 1024, se insertó la línea de
detalle, el stock del producto 88 pasó de 42 a 41. Si el sistema se cae entre la segunda y
la tercera operación, al reiniciar el SGBD lee ese registro y deshace las dos primeras. Sin
el .LDF, ese rollback sería imposible.

## Para clase

Buena pregunta de cierre: *"si borro el archivo de log, ¿pierdo mis datos?"*. La respuesta
matizada —los datos actuales siguen en el .MDF, pero pierdes la capacidad de deshacer y de
recuperarte de una caída— obliga a distinguir bien los dos archivos.
