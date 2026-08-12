# Slide 27 · Archivos de datos: .MDF y .NDF

## Archivo de datos principal — .MDF

De *Main Data File*. Tres características clave:

- **Obligatorio.** Toda base de datos tiene uno, sí o sí.
- **Único.** Solo puede haber **un** MDF por base de datos.
- **Punto de partida.** Contiene la información de arranque de la base —dónde encontrar todo
  lo demás— además de guardar datos.

## Archivos de datos secundarios — .NDF

De *Next Data File*. Sus rasgos son exactamente los opuestos:

- **Opcionales.** Puede no haber ninguno.
- **Múltiples.** Puedes tener tantos como necesites.

### ¿Para qué sirven?

**1. Repartir la carga.** Cuando la base crece mucho, distribuyes los datos en varios
archivos ubicados en **discos distintos**, y el sistema lee y escribe en paralelo, más
rápido.

**2. Organizar.** Puedes separar, por ejemplo, las tablas históricas en un NDF aparte.

## La diferencia en una sola frase

> El **principal** siempre está y es **uno solo**.
> Los **secundarios** son **opcionales** y pueden ser **muchos**.

## Aplicado al e-commerce

Al inicio, la tienda pequeña vive feliz con un solo **.MDF**. Pero supón que crece a
millones de pedidos al año: podrías dejar clientes y productos activos en el MDF, y mandar
los pedidos de años anteriores a un **.NDF** en otro disco. La base sigue siendo **una
sola**, pero físicamente está repartida para rendir mejor.

Ese matiz —una base, varios archivos— es el que más cuesta al principio y conviene decirlo
explícitamente.

## Analogía para clase

El **MDF** es el edificio principal de una empresa: siempre existe y es el único que tiene
recepción. Los **NDF** son los almacenes anexos que abres cuando ya no cabe todo en el
edificio principal.
