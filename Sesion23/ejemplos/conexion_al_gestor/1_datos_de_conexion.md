# Datos de conexión: dónde se escriben en cada cliente

Todo cliente necesita los mismos cinco datos para hablar con un servidor de base de datos:

| Dato | Pregunta que responde | En clase (MySQL) |
| --- | --- | --- |
| Host | ¿En qué computadora está el servidor? | `localhost` (o `127.0.0.1`) |
| Puerto | ¿A qué programa de esa computadora? | `3306` |
| Usuario | ¿Quién se conecta? | `root` |
| Contraseña | ¿Cómo demuestra que es él? | la que elegiste al instalar |
| Base de datos (opcional) | ¿Con cuál empieza a trabajar? | `peluqueria` |

Si no se escriben host ni puerto, el cliente usa los valores por defecto: `localhost` y `3306`.

## 1. Terminal: cliente `mysql`

```powershell
mysql -h localhost -P 3306 -u root -p peluqueria
```

- `-h` host, `-P` (mayúscula) puerto, `-u` usuario, `-p` (minúscula) pide la contraseña.
- Lo que escribes en `Enter password:` no se ve: es a propósito.
- Si la terminal no reconoce `mysql`, usa el acceso directo **MySQL 8.0 Command Line Client** (se conecta como `root` y solo pide la contraseña).

Ya conectado:

```sql
SELECT USER(), DATABASE(), @@port;   -- quién soy, en qué base estoy, puerto del servidor
exit                                  -- cierra la conexión (no el servidor)
```

## 2. MySQL Workbench

Botón **+** junto a *MySQL Connections* → ventana **Setup New Connection**:

| Campo | Valor | Qué es |
| --- | --- | --- |
| Connection Name | Peluquería local | solo un nombre para la lista; no es un dato de conexión |
| Connection Method | Standard (TCP/IP) | conectarse con host y puerto |
| Hostname | `127.0.0.1` | localhost escrito con la IP |
| Port | `3306` | puerto |
| Username | `root` | usuario |
| Password | *Store in Vault…* | guarda la contraseña en tu computadora |
| Default Schema | `peluqueria` | en MySQL, *schema* y base de datos son lo mismo |

Luego **Test Connection** y **OK**.

## 3. SSMS (SQL Server)

Ventana **Connect to Server**:

| Campo | Valor | Qué es |
| --- | --- | --- |
| Server type | Database Engine | el motor de base de datos |
| Server name | `localhost` o `localhost\SQLEXPRESS` | host + instancia |
| Authentication | Windows Authentication | entras con tu usuario de Windows |
| Encrypt | Mandatory | cifra la conexión |
| Trust server certificate | marcado | acepta el certificado del servidor local |

- **Instancia**: una instalación de SQL Server con nombre propio. La edición Express se instala como `SQLEXPRESS`. La instancia por defecto se escribe solo `localhost` (o `.`).
- **Puerto**: la instancia por defecto escucha en `1433`. Para escribirlo, SQL Server usa **coma**: `localhost,1433`.
- **SQL Server Authentication**: usuario y contraseña del propio gestor, como en MySQL.

## 4. Desde un programa: cadena de conexión

```text
MySQL:       mysql://root:clave@localhost:3306/peluqueria
SQL Server:  Server=localhost,1433;Database=peluqueria;User Id=app;Password=clave;TrustServerCertificate=True
```

La contraseña nunca se sube a GitHub: se guarda en una **variable de entorno**. Ver `3_cliente_node/`.

## 5. Local y remota

| | Local | Remota |
| --- | --- | --- |
| Host | `localhost` | la IP o el nombre del servidor, por ejemplo `192.168.1.20` |
| Usuario | `'root'@'localhost'` | uno creado para ese host, por ejemplo `'app'@'192.168.1.%'` |
| Firewall | no interviene | debe dejar pasar el puerto `3306` |

Nunca abras el puerto del gestor a todo internet ni dejes entrar a `root` desde `'%'`.
