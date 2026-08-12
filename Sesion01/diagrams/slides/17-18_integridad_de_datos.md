# Slides 17–18 · Integridad de datos

La **integridad** es que los datos guardados sean **correctos, precisos y consistentes** a
lo largo del tiempo: que la información sea confiable y no se corrompa ni se contradiga.
Quien hace cumplir estas reglas es el **SGBD**.

## Los cuatro tipos

### 1. Integridad de entidad

Cada fila debe poder identificarse de forma **única**, y eso se logra con la **clave
primaria**. La regla: la PK **no se repite** y **no admite nulos**.

### 2. Integridad referencial

Se refiere a las **claves foráneas**. Una FK solo puede apuntar a un valor que **realmente
exista** en la otra tabla.

### 3. Integridad de dominio

Cada columna solo acepta valores válidos, dentro de un **rango, tipo o formato** definido.

### 4. Integridad definida por el usuario

Reglas propias del **negocio**, que no entran en las categorías anteriores.

---

## Los cuatro aplicados al e-commerce

| Tipo | Regla en la tienda | Qué impide |
|---|---|---|
| **Entidad** | `id_producto` es PK de PRODUCTOS | Dos productos con el mismo identificador, o un producto sin identificar |
| **Referencial** | `PEDIDOS.id_cliente` apunta a CLIENTES | Un pedido del cliente 100 cuando ese cliente no existe: pedidos huérfanos |
| **Dominio** | `precio > 0`, `stock` entero ≥ 0 | Precios negativos, texto en una columna numérica, −7 unidades en almacén |
| **Usuario** | Un pedido no se confirma con total = 0; el correo debe llevar `@` | Reglas que solo tienen sentido en *este* negocio |

## La idea de cierre

Entre los cuatro **blindan** la base para que nunca guarde información absurda o
contradictoria. Ninguno sobra: quítale la referencial y aparecen pedidos sin dueño; quítale
la de dominio y aparece stock negativo.

## Para clase

Proyecta cuatro intentos de inserción fallidos (un producto con id repetido, un pedido de un
cliente inexistente, un precio de −50, un pedido con total 0) y pídeles que digan qué tipo
de integridad rechaza cada uno. Es un ejercicio de dos minutos y discrimina muy bien quién
entendió.

## Ojo con la pregunta 4 del cuestionario

El enunciado de la biblioteca habla de un **ISBN único** y de **no tener filas duplicadas**.
Las palabras "único" y "sin duplicados" son la firma de la **clave primaria**, o sea
**integridad de entidad**. No confundir con la de dominio, que hablaría del *formato* del
ISBN.
