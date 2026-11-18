-- 1. Entrada de la feria: una sola, válida para los tres días (RN-01)
CREATE TABLE IF NOT EXISTS entrada (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    nombre TEXT NOT NULL CHECK (trim(nombre) <> ''),
    descripcion TEXT,
    -- Precio en soles, positivo y con como máximo dos decimales (RN-02).
    precio REAL NOT NULL CHECK (precio > 0 AND round(precio, 2) = precio),
    -- Entradas que aún se pueden vender, entero no negativo (RN-03); cada venta
    -- descuenta una.
    disponibles INTEGER NOT NULL DEFAULT 0 CHECK (typeof(disponibles) = 'integer' AND disponibles >= 0),
    -- 1 = venta abierta, 0 = venta cerrada (RN-05).
    venta_activa INTEGER NOT NULL DEFAULT 1 CHECK (venta_activa IN (0, 1))
);

-- 2. Ventas: una entrada por persona, identificada por su DNI (RN-04), pagada
--    en la pasarela simulada de Lemon Squeezy
CREATE TABLE IF NOT EXISTS venta (
    id INTEGER PRIMARY KEY,
    entrada_id INTEGER NOT NULL DEFAULT 1 REFERENCES entrada(id),
    -- DNI peruano: exactamente 8 dígitos, como texto para conservar los ceros a
    -- la izquierda. UNIQUE: cada persona compra una sola entrada.
    dni TEXT NOT NULL UNIQUE CHECK (length(dni) = 8 AND dni NOT GLOB '*[^0-9]*'),
    nombre TEXT NOT NULL CHECK (trim(nombre) <> ''),
    -- Correo al que se envía el comprobante de la compra (RN-10).
    correo TEXT NOT NULL CHECK (correo LIKE '%_@_%._%' AND correo NOT LIKE '% %'),
    -- Precio de la entrada al momento de pagar (RN-08).
    precio REAL NOT NULL CHECK (precio > 0 AND round(precio, 2) = precio),
    -- Identificador de la orden devuelto por la pasarela; un pago no se registra dos veces (RN-07).
    referencia_pago TEXT NOT NULL UNIQUE CHECK (trim(referencia_pago) <> ''),
    fecha_venta TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Acceso de administración: una sola credencial compartida (RN-09).
--    No hay cuentas de usuario; la aplicación no ofrece cambiarla.
CREATE TABLE IF NOT EXISTS administrador (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    -- Nombre de usuario; se compara distinguiendo mayúsculas.
    usuario TEXT NOT NULL UNIQUE,
    -- SHA-256 de la contraseña en hexadecimal; lo calcula el backend. Sin salt:
    -- la aplicación es monousuario.
    contrasena TEXT NOT NULL
);

-- Entrada inicial de la feria; el administrador ajusta su precio, sus entradas
-- disponibles y el estado de la venta.
INSERT OR IGNORE INTO entrada (id, nombre, descripcion, precio, disponibles, venta_activa) VALUES
    (1, 'Entrada Fogón 2026',
     'Acceso a los tres días de la feria: más de 40 stands, cocina en vivo y mercado de productores.',
     45.00, 500, 1);

-- Credencial inicial de administración (usuario: "admin", contraseña: "admin").
-- Para usar otra, reemplaza el usuario y el hash de esta fila.
INSERT OR IGNORE INTO administrador (id, usuario, contrasena) VALUES
    (1, 'admin',
     '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918');
