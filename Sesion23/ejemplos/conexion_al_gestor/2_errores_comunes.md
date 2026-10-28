# Errores al conectarse y qué significan

Cada error indica en qué paso de la conexión se quedó el cliente. Revísalos en este orden.

## MySQL

| Mensaje | Paso que falló | Qué revisar |
| --- | --- | --- |
| `ERROR 2003 (HY000): Can't connect to MySQL server on 'localhost:3306' (10061)` | llegar al servidor | ¿el servicio está encendido?, ¿host y puerto correctos? |
| `ERROR 1045 (28000): Access denied for user 'root'@'localhost' (using password: YES)` | identificarse | usuario y contraseña; si el usuario existe para ese host |
| `ERROR 1049 (42000): Unknown database 'peluqueria'` | elegir la base | ¿la base existe?, ¿está bien escrita? |

- El `(10061)` al final del error 2003 lo pone Windows: significa «nadie escucha en ese puerto».
- `using password: NO` significa que no se envió ninguna contraseña.
- Desde Node.js (`mysql2`) los mismos errores llegan con un código: `ECONNREFUSED` (2003), `ER_ACCESS_DENIED_ERROR` (1045) y `ER_BAD_DB_ERROR` (1049).

## SQL Server (SSMS)

| Mensaje | Paso que falló | Qué revisar |
| --- | --- | --- |
| `A network-related or instance-specific error occurred while establishing a connection to SQL Server` | llegar al servidor | ¿el servicio `SQL Server (SQLEXPRESS)` está encendido?, ¿el nombre de la instancia es correcto? |
| `Login failed for user '...'. (Error: 18456)` | identificarse | usuario, contraseña y tipo de autenticación |
| `The certificate chain was issued by an authority that is not trusted` | cifrar la conexión | marca **Trust server certificate** |

## ¿Está encendido el servidor?

- **Ventana Servicios**: `Windows + R` → `services.msc` → busca `MySQL80` (o `SQL Server (SQLEXPRESS)`). *Estado* debe decir **En ejecución**; si no, clic derecho → *Iniciar*.
- **Terminal**:

  ```powershell
  mysqladmin -u root -p ping
  # mysqld is alive
  ```

## Provocar los errores a propósito

```powershell
mysql -h 127.0.0.1 -P 3306 -u root -p                 # escribe una contraseña equivocada -> 1045
mysql -h 127.0.0.1 -P 3307 -u root -p                 # puerto donde nadie escucha        -> 2003
mysql -h 127.0.0.1 -P 3306 -u root -p peluqueria2     # base que no existe                -> 1049
```
