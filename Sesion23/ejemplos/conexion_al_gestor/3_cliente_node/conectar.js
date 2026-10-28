// Un programa también es un cliente: se conecta al servidor MySQL con los
// mismos cinco datos que la terminal o MySQL Workbench.
import mysql from 'mysql2/promise';

const datos = {
  host: 'localhost',                     // ¿en qué computadora está el servidor?
  port: 3306,                            // ¿a qué programa de esa computadora?
  user: 'root',                          // ¿quién se conecta?
  password: process.env.MYSQL_PASSWORD,  // ¿cómo lo demuestra? (fuera del código)
  database: 'peluqueria',                // ¿con qué base empieza a trabajar?
};

try {
  const conexion = await mysql.createConnection(datos);
  console.log(`Conectado a ${datos.host}:${datos.port} como ${datos.user}`);

  const [filas] = await conexion.query(
    'SELECT nombre, precio FROM servicio ORDER BY orden');
  console.table(filas);

  await conexion.end();  // cierra la conexión, no el servidor
} catch (error) {
  // El código dice en qué paso falló: ECONNREFUSED, ER_ACCESS_DENIED_ERROR o ER_BAD_DB_ERROR
  console.error(`No se pudo conectar: ${error.code}`);
  console.error(error.message);
  process.exitCode = 1;
}
