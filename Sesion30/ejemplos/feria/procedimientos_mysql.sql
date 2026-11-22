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
-- Descuenta una entrada solo si la venta está abierta y quedan entradas, y
-- guarda la venta. Que el DNI y la referencia de pago no se repitan lo
-- aseguran los UNIQUE de venta: el INSERT falla y se deshace el descuento.
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
BEGIN
    -- Ante cualquier error se deshace todo.
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- El UPDATE bloquea la entrada hasta el COMMIT: dos compras a la vez no
    -- venden más entradas de las que hay. Si no cambia ninguna fila,
    -- la venta está cerrada o no quedan entradas.
    UPDATE entrada
    SET disponibles = disponibles - 1
    WHERE id = 1
      AND disponibles > 0
      AND venta_activa = 1;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Venta cerrada o entradas agotadas.';
    END IF;

    SELECT nombre, precio
    INTO p_entrada, p_precio
    FROM entrada
    WHERE id = 1;

    INSERT INTO venta (entrada_id, dni, nombre, correo, precio, referencia_pago)
    VALUES (1, p_dni, TRIM(p_nombre), TRIM(p_correo), p_precio, TRIM(p_referencia_pago));

    SELECT id, fecha_venta
    INTO p_venta_id, p_fecha_venta
    FROM venta
    WHERE id = LAST_INSERT_ID();

    COMMIT;
END //

DELIMITER ;

-- Luis Rojas compra su entrada.
CALL comprar_entrada('70123456', 'Luis Rojas', 'luis.rojas@example.com', 'PAGO-0001',
                     @venta_id, @fecha_venta, @entrada, @precio);
SELECT @venta_id AS venta_id, @fecha_venta AS fecha_venta, @entrada AS entrada, @precio AS precio;

-- Luis intenta comprar otra con el mismo DNI: el UNIQUE rechaza el INSERT
-- y el procedimiento hace ROLLBACK (se deshace el descuento).
CALL comprar_entrada('70123456', 'Luis Rojas', 'luis.rojas@example.com', 'PAGO-0002',
                     @venta_id, @fecha_venta, @entrada, @precio);

CALL ver_entrada();
CALL contar_ventas(@total);
SELECT @total AS total;
