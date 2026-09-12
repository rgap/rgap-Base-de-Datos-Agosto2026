# Practica Calificada 1 - Diseño de modelo de datos

## Introducción

En esta práctica elaborarán el diseño lógico de datos de cada uno de los siete casos de estudio presentados a continuación. A partir del problema, el alcance, los supuestos y los roles, deberán determinar qué información necesita conservar cada aplicación y cómo organizarla en un modelo relacional coherente.

El objetivo es representar los datos necesarios y sus relaciones, justificando las decisiones de modelado. La entrega corresponde al diseño lógico: no se requiere programar la aplicación, crear una base de datos ni presentar scripts SQL.

## Indicaciones

1. Lean cada caso y revisen su demo.
2. Identifiquen las tablas y sus atributos, claves primarias y foráneas.
3. Dibujen las relaciones entre las tablas e indiquen sus cardinalidades.
4. Eviten guardar información repetida y expliquen brevemente sus decisiones.

Si un caso no necesita guardar datos, expliquen por qué. Pueden usar la herramienta de diagramación que prefieran.

## Entregables

Entreguen un solo documento con sus nombres y, para cada caso:

- El diagrama del diseño lógico.
- Una explicación del diseño y los supuestos utilizados.

Si el caso no necesita guardar datos, basta con la explicación.

## Criterios de evaluación

- Correspondencia del modelo con el problema, el alcance y los supuestos de cada caso.
- Selección adecuada de tablas, atributos y claves.
- Coherencia de las relaciones y cardinalidades.
- Normalización y tratamiento adecuado de la redundancia y los datos calculados.
- Claridad de los diagramas y calidad de las justificaciones.

---

## 1. Caso de estudio: selector aleatorio de películas

### 1.1. Problema

Una persona tiene varias películas posibles para ver y quiere escoger una al azar.

Se necesita una aplicación donde se pueda escribir una lista de títulos y obtener uno elegido al azar.

### 1.2. Alcance y supuestos

- La aplicación es de uso personal, para una sola persona a la vez. No hace falta iniciar sesión.
- Los títulos solo existen mientras se está usando la aplicación en ese momento; no quedan guardados para después.
- Todas las acciones las realiza la persona usuaria.

Quedan fuera de alcance: cuentas de usuario, historial de elecciones anteriores, listas guardadas de películas, filtros, puntuaciones, recomendaciones e integración con otras aplicaciones o servicios.

### 1.3. Roles

**Usuario:** escribe las películas candidatas y pide que se elija una al azar.

### 1.4. Demo

[Ver demo](https://rgapdemo-selector-aleatorio-peliculas.vercel.app/)

---

## 2. Caso de estudio: contador de vasos de agua

### 2.1. Problema

Ana quiere saber cuántos vasos de agua ha tomado hoy, pero pierde la cuenta durante el día.

Se requiere una aplicación personal que permita sumar un vaso y consultar el total del día.

### 2.2. Alcance y supuestos

- La aplicación es de uso personal y monousuario. No existe autenticación.
- El contador se almacena de forma persistente y se conserva entre sesiones.
- Todas las operaciones son iniciadas por el usuario.

Quedan fuera de alcance: historial por día, reinicio automático a medianoche, metas diarias, restar vasos y estadísticas.

### 2.3. Roles

**Usuario:** registra y consulta sus vasos de agua. Es el único rol del sistema.

### 2.4. Demo

[Ver demo](https://rgapdemo-contador-vasos.vercel.app/)

---

## 3. Caso de estudio: flujo de caja

### 3.1. Problema

Una salchipapería necesita anotar cada ingreso y egreso de efectivo durante el día —ventas, compra de insumos, vueltos y otros gastos— y saber, en cualquier momento, cuánto entró, cuánto salió y con cuánto se queda. También necesita poder revisar días anteriores o un mes completo para ver cómo le fue.

Se requiere una aplicación que registre los movimientos con su hora, descripción, tipo e importe, y que muestre totales para el día actual o para cualquier día o mes pasado que se elija.

### 3.2. Alcance y supuestos

- La aplicación es monousuario y no requiere autenticación.
- Cada movimiento es un ingreso o un egreso, con una descripción de qué fue.
- La hora de un movimiento se asigna automáticamente al anotarlo; no se puede elegir una fecha u hora distinta a la actual.
- Por defecto se muestran los movimientos y los totales del día actual.
- Además del día actual, se puede elegir cualquier día pasado o un mes completo para consultar sus movimientos y sus totales.
- Todas las operaciones son iniciadas por el usuario.

Quedan fuera de alcance: categorías de movimiento, múltiples cajas o negocios, edición y eliminación de movimientos, cierres formales de caja, saldo inicial o arrastrado entre días, y reportes exportables.

### 3.3. Roles

**Responsable de caja:** anota los movimientos del día y consulta los totales del día actual, de un día pasado o de un mes. Es el único rol del sistema.

### 3.4. Demo

[Ver demo](https://rgapdemo-sistema-de-flujo-de-caja-s.vercel.app/)

---

## 4. Caso de estudio: sistema de cupones de descuento

### 4.1. Problema

Una tienda quiere lanzar códigos promocionales con un periodo de vigencia definido, poder retirarlos temporalmente cuando ya no interesan y eliminarlos cuando dejan de ser útiles.

Se requiere una aplicación que permita registrar cupones, definir su vigencia, activarlos o desactivarlos, eliminarlos y consultar cuáles están vigentes. La consulta tiene dos audiencias distintas: quien administra las promociones necesita ver todos los cupones (activos, inactivos, dentro o fuera de vigencia), y quien podría usar un cupón solo necesita ver los que están vigentes ahora mismo. El registro, el cambio de estado, la eliminación y el listado completo son tareas de administración y no deben quedar expuestos a cualquier visitante.

### 4.2. Alcance y supuestos

- El panel de administración es de un solo administrador y requiere autenticación con usuario y contraseña.
- La vista pública de ofertas no requiere autenticación.
- Un cupón está activo o inactivo. El responsable puede desactivar un cupón y volver a activarlo.
- Un cupón inactivo no es visible en la tienda aunque su periodo de vigencia siga abierto.
- El responsable puede eliminar un cupón de forma permanente.
- Todas las operaciones son iniciadas por el usuario.

Quedan fuera de alcance: categorías o restricción por catálogo, cuentas de usuario y roles, recuperación de contraseña, aplicar cupones a compras reales, límites de uso, restricción a un cliente específico, combinación de cupones entre sí, integración con un carrito de compras, edición de los datos de un cupón ya registrado e historial de cupones eliminados.

### 4.3. Roles

**Responsable de promociones:** inicia sesión en el panel con el usuario y la contraseña de administración; registra cupones, los activa o desactiva, los elimina y consulta el listado completo. Es quien administra el sistema.

**Cliente:** consulta únicamente los cupones vigentes desde la página pública de ofertas de la tienda, sin acceso al formulario de registro ni al listado completo. No requiere cuenta ni inicio de sesión.

### 4.4. Demo

[Ver demo](https://rgapdemo-sistema-cupones.vercel.app/)

---

## 5. Caso de estudio: sistema de objetos perdidos

### 5.1. Problema

Una organización encuentra objetos y necesita devolverlos a sus dueños. Hoy, quien perdió algo tiene que acercarse a preguntar una y otra vez.

Se quiere que **cualquier persona pueda ver desde fuera los objetos encontrados y enviar un reclamo** describiendo detalles que solo el dueño conocería, y que el encargado registre los hallazgos, revise los reclamos recibidos y decida a quién se le devuelve cada objeto.

### 5.2. Alcance y supuestos

- La aplicación tiene dos caras: una **vista pública** sin autenticación y un **panel del encargado** protegido con usuario y contraseña.
- Cualquier persona puede consultar los objetos disponibles y enviar un reclamo; no necesita cuenta.
- El reclamante debe dejar su nombre y un celular de contacto para que el encargado pueda responderle.
- Al registrar un hallazgo, los datos de quien entregó el objeto son opcionales.
- Cada objeto corresponde a un único hallazgo.
- Un objeto está disponible o devuelto.

Quedan fuera de alcance: fotos y archivos adjuntos, búsqueda automática de coincidencias, notificaciones automáticas (SMS o correo), cuentas para el público, historial de reclamos resueltos en la vista pública, edición y eliminación de hallazgos, y auditoría de usuarios.

### 5.3. Roles

**Encargado de objetos perdidos:** inicia sesión en el panel; registra hallazgos, revisa los reclamos recibidos y decide si corresponde devolver un objeto. Es quien administra el sistema.

**Persona que perdió un objeto (público):** consulta desde la vista pública los objetos que siguen disponibles y envía un reclamo con evidencia y su contacto. No inicia sesión.

### 5.4. Demo

[Ver demo](https://rgapdemo-objetos-perdidos.vercel.app/)

---

## 6. Caso de estudio: sistema de administración de una peluquería de mascotas

### 6.1. Problema

Una peluquería de mascotas necesita registrar clientes y sus mascotas, programar servicios con un empleado y conservar el pago de las citas completadas.

Se requiere una aplicación que permita organizar la agenda, controlar el estado de las citas y registrar su pago total.

### 6.2. Alcance y supuestos

- Cada cita corresponde a una mascota, un servicio y un empleado.
- Cada servicio tiene una duración y un precio en soles definidos.
- Los servicios y empleados se agregan, consultan, ordenan y eliminan desde la aplicación.
- La aplicación es de uso interno: el acceso requiere iniciar sesión con usuario y contraseña.
- Existe una única credencial de encargado.
- Todas las operaciones son iniciadas por el usuario.

Quedan fuera de alcance: múltiples sedes, inventario, paquetes de servicios, recordatorios, reprogramación, facturación, pagos parciales, la edición de servicios y empleados, y la administración de varias cuentas o roles.

### 6.3. Roles

**Encargado o recepcionista:** inicia sesión, registra clientes y mascotas mediante las citas, administra la agenda, mantiene y ordena el catálogo de servicios y empleados y registra los pagos. Es el único rol del sistema.

### 6.4. Demo

[Ver demo](https://rgapdemo-peluqueria-canina.vercel.app/)

---

## 7. Caso de estudio: catálogo web de polos temáticos con filtros

### 7.1. Problema

Una tienda de polos temáticos necesita publicar un catálogo donde cada polo pertenezca a un tema (no a una marca), tenga un precio único, se ofrezca en una o más tallas identificadas por SKU y pueda encontrarse filtrando por tema o por precio.

Se requiere una aplicación que permita al administrador registrar polos con el stock de sus tallas, ajustar el stock de cada talla y activar o desactivar polos, y al visitante descubrir la oferta desde una portada y consultar el catálogo mediante criterios combinables.

### 7.2. Alcance y supuestos

- La aplicación administra un único catálogo de polos.
- Todos los productos son polos, por lo que no existe una categoría de producto.
- El precio es del polo y es el mismo para todas sus tallas.
- Al registrar un polo se registra el stock de una o más tallas, cada una identificada por su propio SKU.
- El stock de cada talla se expresa como un número entero de unidades.
- Los temas y las tallas son catálogos maestros iniciales incluidos en la base de datos.
- La portada y el catálogo son públicos.
- El registro se realiza desde una vista de administración separada.
- El administrador puede ajustar el stock de una talla ya registrada y activar o desactivar un polo.
- El visitante ordena un polo por WhatsApp: la aplicación solo arma un mensaje y abre el chat; no hay carrito, pago ni pedido dentro del sitio.
- El acceso a la administración está protegido por un único usuario y contraseña compartidos; no hay cuentas de usuario ni registro. El administrador inicia sesión con esas credenciales y puede cerrar la sesión, que además caduca por tiempo de inactividad.
- Todas las operaciones son iniciadas por el rol correspondiente.

Quedan fuera de alcance: categorías de producto, marcas, carrito, pago o registro de pedidos dentro del sitio, promociones, múltiples almacenes, reserva de stock, agregar o quitar tallas de un polo ya registrado, edición de los demás datos del polo (nombre, tema, precio, descripción, imágenes), eliminación de polos, administración de los catálogos maestros, cuentas de usuario y el cambio o la recuperación de la contraseña de administración.

### 7.3. Roles

**Visitante del catálogo:** accede a la portada, consulta los polos publicados, utiliza filtros para encontrar opciones, abre el detalle de un polo, elige una talla y ordena por WhatsApp.

**Administrador del catálogo:** inicia sesión con el usuario y la contraseña compartidos, registra polos desde la vista de administración, ajusta el stock de sus tallas, activa o desactiva polos y puede consultar el resultado en el catálogo público.

### 7.4. Demo

[Ver demo](https://rgapdemo-catalogo-productos.vercel.app/)
