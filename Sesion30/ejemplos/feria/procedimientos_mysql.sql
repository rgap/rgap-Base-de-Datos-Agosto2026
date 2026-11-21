-- Procedimientos almacenados, de lo simple a lo completo (MySQL).
-- Caso de estudio: venta de entradas para la feria gastronómica Fogón.
-- Antes ejecuta la práctica 1 (ejemplos/practicas/mysql/): modelo físico y registros.
-- Ejecútalo por partes: selecciona una parte y pulsa el rayo.

USE feria_entrada;

-- ---------------------------------------------------------------
-- 1. Sin parámetros y con una sola instrucción
-- ---------------------------------------------------------------

DROP PROCEDURE IF EXISTS ver_entrada;

CREATE PROCEDURE ver_entrada()
SELECT nombre, precio, disponibles, venta_activa FROM entrada;

CALL ver_entrada();

-- ---------------------------------------------------------------
-- 2. Con un parámetro de entrada (IN)
-- ---------------------------------------------------------------

DROP PROCEDURE IF EXISTS cambiar_disponibles;

CREATE PROCEDURE cambiar_disponibles(IN p_disponibles INT)
UPDATE entrada SET disponibles = p_disponibles WHERE id = 1;

CALL cambiar_disponibles(300);
CALL ver_entrada();

-- ---------------------------------------------------------------
-- 3. Con un parámetro de salida (OUT)
-- ---------------------------------------------------------------

DROP PROCEDURE IF EXISTS contar_ventas;

-- El procedimiento escribe en p_total; quien lo llama lo recibe en @total.
CREATE PROCEDURE contar_ventas(OUT p_total INT)
SELECT COUNT(*) INTO p_total FROM venta;

CALL contar_ventas(@total);
SELECT @total AS total;

-- ---------------------------------------------------------------
-- 4. Una función que lee una tabla: credencial_valida
-- ---------------------------------------------------------------

DROP FUNCTION IF EXISTS credencial_valida;

DELIMITER //

-- FUNCIÓN: credencial_valida
-- Devuelve verdadero si el usuario y el hash SHA-256 de la
-- contraseña coinciden con la credencial de administración.
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

-- SHA2(texto, 256) calcula el hash SHA-256 de la contraseña.
SELECT credencial_valida('admin', SHA2('admin', 256)) AS valida;
SELECT credencial_valida('Admin', SHA2('admin', 256)) AS valida;

-- ---------------------------------------------------------------
-- 5. Con IF y un error propio: configurar_entrada
-- ---------------------------------------------------------------

DROP PROCEDURE IF EXISTS configurar_entrada;

DELIMITER //

-- PROCEDIMIENTO ALMACENADO: configurar_entrada
-- El administrador fija el precio, las entradas
-- disponibles y si la venta está abierta.
CREATE PROCEDURE configurar_entrada(
    -- Más decimales que la columna, para rechazar un tercer decimal en vez de redondearlo.
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

DELIMITER ;

-- Un precio con tres decimales: el procedimiento se detiene y no cambia nada.
CALL configurar_entrada(45.555, 500, 1);

-- Un precio válido: vuelve a 45.00 y 500 entradas.
CALL configurar_entrada(45.00, 500, 1);
CALL ver_entrada();

-- ---------------------------------------------------------------
-- 6. Con una transacción: comprar_entrada
-- ---------------------------------------------------------------

DROP PROCEDURE IF EXISTS comprar_entrada;

DELIMITER //

-- PROCEDIMIENTO ALMACENADO: comprar_entrada
-- Registra la compra de una entrada en una sola transacción.
-- Comprueba que la venta esté abierta, que el DNI y la referencia de pago no
-- se repitan y que queden entradas; descuenta una y guarda la venta.
-- Devuelve el id y la fecha de la venta, el nombre de la entrada y el precio pagado.
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

    -- Ante cualquier error se deshace todo.
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- FOR UPDATE bloquea la entrada hasta el COMMIT: dos compras a la vez no
    -- venden más entradas de las que hay.
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

DELIMITER ;

-- Luis Rojas compra su entrada.
CALL comprar_entrada('70123456', 'Luis Rojas', 'luis.rojas@example.com', 'PAGO-0001',
                     @venta_id, @fecha_venta, @entrada, @precio);
SELECT @venta_id AS venta_id, @fecha_venta AS fecha_venta, @entrada AS entrada, @precio AS precio;

-- Luis intenta comprar otra con el mismo DNI: el procedimiento hace ROLLBACK.
CALL comprar_entrada('70123456', 'Luis Rojas', 'luis.rojas@example.com', 'PAGO-0002',
                     @venta_id, @fecha_venta, @entrada, @precio);

CALL ver_entrada();
CALL contar_ventas(@total);
SELECT @total AS total;
