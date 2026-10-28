# Cliente en Node.js

Un programa que se conecta a MySQL igual que Workbench: con host, puerto, usuario, contraseña y base de datos.

Necesita la base `peluqueria` de la sesión 21 y el servidor MySQL encendido.

```powershell
npm install
```

La contraseña se pasa en la variable de entorno `MYSQL_PASSWORD`, para no escribirla en el código. En PowerShell:

```powershell
$env:MYSQL_PASSWORD="tu_contraseña"
npm run conectar
```

Prueba también a cambiar el puerto a `3307` o la base a `peluqueria2` en `conectar.js` y lee el código de error que aparece.
