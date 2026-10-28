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

  // ...y mostrar el resultado
  response.send(resultado);
});

// Encender la página en http://localhost:3000
pagina.listen(3000);
