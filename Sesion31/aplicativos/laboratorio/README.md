# Laboratorio: ¿dónde va cada consulta?

Aplicación en React para la sesión 31. Los alumnos ven la pantalla de un sistema real del curso y piensan qué pasa por dentro al pulsar sus botones.

**Aquí nada se ejecuta.** No necesita MySQL ni un servidor: las consultas, los resultados y los errores ya están escritos en `src/casos/`, copiados de una ejecución real en MySQL 8.4.

## Actividades

1. **Arma el flujo.** Elegir las consultas que ejecuta un botón, ponerlas en orden y decidir si van en una transacción. Algunas piezas sobran. Si el orden está mal, se muestra el error que daría MySQL. Al final, «Ver en la aplicación» recorre los pasos y muestra cómo quedan las tablas.
2. **Ordena la consulta.** Armar una consulta real del proyecto con sus cláusulas desordenadas.
3. **¿Qué devuelve?** Leer una consulta con datos fijos y elegir el resultado.
4. **¿Dónde va?** Decidir dónde se cumple cada regla del sistema: en la aplicación, una restricción, una vista, una función, un procedimiento, un trigger o un permiso. Si es un trigger, también se elige BEFORE o AFTER y los eventos.

## Casos

Todos son proyectos MySQL de `WEB_SYSTEMS_BASE_DE_DATOS`: 9 (flujo de caja), 13 (agenda de contactos), 22 (cupones), 38 (objetos perdidos), 48 (peluquería canina), 56 y 57 (entradas de la feria) y 68 (catálogo de polos).

Las reglas citan el texto de `_specs/2_requirements.md` de cada proyecto. El SQL de cada respuesta dice de dónde sale: del proyecto, de la sesión 31 o propuesto (el proyecto no lo tiene).

## Ejecutar

Requisito: [Node.js](https://nodejs.org) 22 o superior. En Windows, abre PowerShell en esta carpeta y escribe lo mismo.

```
npm install
npm run dev
```

Abre la dirección que aparece (normalmente http://localhost:5173).

Para revisar el contenido de los casos después de cambiarlos:

```
npm test
```

## Estructura

```
src/
  App.jsx              casos, pestañas y pantalla de la aplicación
  revisar.js           revisa las respuestas (sin React, con pruebas)
  casos/               un archivo por proyecto, con todo su contenido
  actividades/         una actividad por archivo
  componentes/         SQL, tablas, piezas y la pantalla de la aplicación
```
