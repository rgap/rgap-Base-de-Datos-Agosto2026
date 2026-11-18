CREATE TABLE entrada (
    -- Una sola entrada, válida para los tres días (Regla 1).
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    nombre VARCHAR(255) NOT NULL CHECK (TRIM(nombre) <> ''),
    descripcion VARCHAR(500),
    precio DECIMAL(10, 2) NOT NULL CHECK (precio > 0),
    disponibles INT NOT NULL DEFAULT 0 CHECK (disponibles >= 0),
    venta_activa TINYINT NOT NULL DEFAULT 1 CHECK (venta_activa IN (0, 1))
);

CREATE TABLE venta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entrada_id INT NOT NULL DEFAULT 1,
    -- Una entrada por persona (Regla 4).
    dni CHAR(8) NOT NULL UNIQUE CHECK (dni REGEXP '^[0-9]{8}$'),
    nombre VARCHAR(120) NOT NULL CHECK (TRIM(nombre) <> ''),
    correo VARCHAR(254) NOT NULL CHECK (correo LIKE '%_@_%._%' AND correo NOT LIKE '% %'),
    -- Precio de la entrada al momento de pagar (Regla 8).
    precio DECIMAL(10, 2) NOT NULL CHECK (precio > 0),
    -- Un pago no se registra dos veces (Regla 7).
    referencia_pago VARCHAR(255) NOT NULL UNIQUE CHECK (TRIM(referencia_pago) <> ''),
    fecha_venta DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
    FOREIGN KEY (entrada_id) REFERENCES entrada (id)
);

-- Credencial única de administración (Regla 9); contrasena es el SHA-256 en hexadecimal.
CREATE TABLE administrador (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    -- VARBINARY compara bytes: el usuario distingue mayúsculas (Regla 9).
    usuario VARBINARY(255) NOT NULL UNIQUE,
    contrasena CHAR(64) NOT NULL
);


DELIMITER //

CREATE PROCEDURE comprar_entrada(
    IN p_dni CHAR(8),
    IN p_nombre VARCHAR(120),
    IN p_correo VARCHAR(254),
    IN p_referencia_pago VARCHAR(255),
    OUT p_venta_id INT,
    OUT p_fecha_venta DATETIME,
    OUT p_entrada VARCHAR(255),
    OUT p_precio DECIMAL(10, 2)
)
MODIFIES SQL DATA
BEGIN
    DECLARE v_disponibles INT;
    DECLARE v_venta_activa TINYINT;

    -- Ante cualquier error se deshace todo (Regla 6).
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- FOR UPDATE bloquea la entrada hasta el COMMIT: dos compras a la vez no
    -- venden más entradas de las que hay (Regla 5).
    SELECT nombre, precio, disponibles, venta_activa
    INTO p_entrada, p_precio, v_disponibles, v_venta_activa
    FROM entrada
    WHERE id = 1
    FOR UPDATE;

    IF v_venta_activa = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La venta de entradas está cerrada.';
    END IF;

    IF EXISTS (SELECT 1 FROM venta WHERE dni = p_dni) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Este DNI ya tiene una entrada comprada. Solo se permite una entrada por persona.';
    END IF;

    IF EXISTS (SELECT 1 FROM venta WHERE referencia_pago = p_referencia_pago) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Este pago ya fue registrado.';
    END IF;

    IF v_disponibles < 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Ya no quedan entradas disponibles.';
    END IF;

    UPDATE entrada SET disponibles = disponibles - 1 WHERE id = 1;

    INSERT INTO venta (entrada_id, dni, nombre, correo, precio, referencia_pago)
    VALUES (1, p_dni, TRIM(p_nombre), TRIM(p_correo), p_precio, TRIM(p_referencia_pago));

    SET p_venta_id = LAST_INSERT_ID();
    SELECT fecha_venta INTO p_fecha_venta FROM venta WHERE id = p_venta_id;

    COMMIT;
END //

CREATE PROCEDURE configurar_entrada(
    -- Más decimales que la columna, para rechazar un tercer decimal en vez de redondearlo (Regla 2).
    IN p_precio DECIMAL(20, 6),
    IN p_disponibles INT,
    IN p_venta_activa TINYINT
)
MODIFIES SQL DATA
BEGIN
    IF p_precio IS NULL OR p_precio <= 0 OR p_precio <> ROUND(p_precio, 2) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El precio debe ser positivo y tener como máximo dos decimales.';
    END IF;

    UPDATE entrada
    SET precio = p_precio, disponibles = p_disponibles, venta_activa = p_venta_activa
    WHERE id = 1;
END //

CREATE FUNCTION credencial_valida(p_usuario VARCHAR(255), p_contrasena_hash CHAR(64))
RETURNS BOOLEAN
READS SQL DATA
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM administrador
        WHERE usuario = p_usuario
          AND contrasena = p_contrasena_hash
    );
END //

DELIMITER ;

INSERT IGNORE INTO entrada (id, nombre, descripcion, precio, disponibles, venta_activa) VALUES
    (1, 'Entrada Fogón 2026',
     'Acceso a los tres días de la feria: más de 40 stands, cocina en vivo y mercado de productores.',
     45.00, 500, 1);

-- Usuario "admin", contraseña "admin".
INSERT IGNORE INTO administrador (id, usuario, contrasena) VALUES
    (1, 'admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918');
