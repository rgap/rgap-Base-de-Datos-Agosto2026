import express from "express";
import { DatabaseSync } from "node:sqlite";

// Abrir la base de datos
const baseDeDatos = new DatabaseSync("base_de_datos/agenda.db");

// Crear la página web
const pagina = express();

// Cuando alguien entra a la página...
pagina.get("/", (request, response) => {
  // ...ejecutar el SQL...
  const resultado = baseDeDatos.prepare("SELECT * FROM contacto").all();

  // ...armar una tabla HTML con las filas...
  const columnas = resultado.length > 0 ? Object.keys(resultado[0]) : [];

  const encabezado = columnas.map((columna) => `<th>${columna}</th>`).join("");

  const filas = resultado
    .map((fila) => {
      const celdas = columnas.map((columna) => `<td>${fila[columna]}</td>`).join("");
      return `<tr>${celdas}</tr>`;
    })
    .join("");

  // ...y mostrar el resultado
  response.send(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Agenda</title>
        <style>
          body { font-family: system-ui, sans-serif; margin: 40px; color: #222; }
          table { border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px 16px; text-align: left; }
          th { background: #f0f0f0; }
          tr:nth-child(even) td { background: #fafafa; }
        </style>
      </head>
      <body>
        <h1>Agenda</h1>
        <p>${resultado.length} registros</p>
        <table>
          <tr>${encabezado}</tr>
          ${filas}
        </table>
      </body>
    </html>
  `);
});

// Encender la página en http://localhost:3000
pagina.listen(3000);
