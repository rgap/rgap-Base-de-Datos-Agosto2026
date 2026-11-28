// Punto de arranque: solo crea el servidor HTTP y lo pone a escuchar.
// Las rutas y las validaciones de entrada están en src/app.js; el acceso a
// MySQL, en src/db.js.
import { createServer } from "node:http";

import { handleRequest } from "./src/app.js";

// El puerto se puede fijar con la variable de entorno PORT; por defecto 3000.
const port = Number(process.env.PORT) || 3000;

createServer(handleRequest).listen(port, () => {
  console.log(`Agenda de contactos disponible en http://localhost:${port}`);
});
