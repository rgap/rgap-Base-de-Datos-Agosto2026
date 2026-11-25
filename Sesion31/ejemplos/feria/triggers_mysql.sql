-- Triggers, de lo simple a lo aplicado (MySQL).
-- Caso de estudio: venta de entradas para la feria gastronómica Fogón.
-- Antes ejecuta la práctica 1 (ejemplos/practicas/mysql/): modelo físico y registros.
-- Ejecútalo por partes: selecciona una parte y pulsa el rayo.

USE feria_entrada;

-- ---------------------------------------------------------------
-- 1. Tu primer trigger: se vende una entrada, queda una menos
-- ---------------------------------------------------------------

DROP TRIGGER IF EXISTS venta_descuenta_disponible;

-- Después de cada INSERT en venta, descuenta una entrada.
CREATE TRIGGER venta_descuenta_disponible
AFTER INSERT ON venta
FOR EACH ROW
UPDATE entrada SET disponibles = disponibles - 1 WHERE id = NEW.entrada_id;

INSERT INTO venta (dni, nombre, correo, precio, referencia_pago)
VALUES ('70123456', 'Luis Rojas', 'luis.rojas@example.com', 45.00, 'PAGO-0001');

SELECT nombre, precio, disponibles FROM entrada;

-- ---------------------------------------------------------------
-- 2. Completar los datos antes de guardar: NEW
-- ---------------------------------------------------------------

DROP TRIGGER IF EXISTS venta_completa_datos;

DELIMITER //

-- Antes de guardar cada venta: el correo va en minúsculas y el precio
-- es el de la entrada, escriba lo que escriba quien inserta.
CREATE TRIGGER venta_completa_datos
BEFORE INSERT ON venta
FOR EACH ROW
BEGIN
    SET NEW.correo = LOWER(TRIM(NEW.correo));
    SET NEW.precio = (SELECT precio FROM entrada WHERE id = NEW.entrada_id);
END //

DELIMITER ;

INSERT INTO venta (dni, nombre, correo, precio, referencia_pago)
VALUES ('70123457', 'María Torres', 'Maria.Torres@Example.com', 1.00, 'PAGO-0002');

SELECT dni, nombre, correo, precio FROM venta;
SELECT nombre, precio, disponibles FROM entrada;

-- ---------------------------------------------------------------
-- 3. Detener una operación: una venta no se borra
-- ---------------------------------------------------------------

DROP TRIGGER IF EXISTS venta_no_se_borra;

DELIMITER //

-- Antes de cada DELETE en venta: lo cancela con un error propio.
CREATE TRIGGER venta_no_se_borra
BEFORE DELETE ON venta
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Una venta no se puede borrar.';
END //

DELIMITER ;

DELETE FROM venta WHERE dni = '70123456';

SELECT COUNT(*) AS ventas FROM venta;

-- ---------------------------------------------------------------
-- 4. El historial de precios: OLD y NEW
-- ---------------------------------------------------------------

DROP TABLE IF EXISTS cambio_precio;

-- Una fila por cada cambio de precio de la entrada.
CREATE TABLE cambio_precio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    precio_anterior DECIMAL(10, 2) NOT NULL,
    precio_nuevo DECIMAL(10, 2) NOT NULL,
    fecha DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP())
);

DROP TRIGGER IF EXISTS entrada_guarda_cambio_precio;

DELIMITER //

-- Después de cada UPDATE en entrada: si cambió el precio, lo anota.
-- OLD es la fila antes del cambio; NEW, la fila después.
CREATE TRIGGER entrada_guarda_cambio_precio
AFTER UPDATE ON entrada
FOR EACH ROW
BEGIN
    IF OLD.precio <> NEW.precio THEN
        INSERT INTO cambio_precio (precio_anterior, precio_nuevo)
        VALUES (OLD.precio, NEW.precio);
    END IF;
END //

DELIMITER ;

UPDATE entrada SET precio = 50.00 WHERE id = 1;

SELECT precio_anterior, precio_nuevo FROM cambio_precio;

-- ---------------------------------------------------------------
-- 5. Todo junto: una compra con un solo INSERT
-- ---------------------------------------------------------------

-- Sin precio: lo pone el trigger venta_completa_datos.
INSERT INTO venta (dni, nombre, correo, referencia_pago)
VALUES ('70123458', 'Pedro Huamán', ' Pedro.Huaman@Example.com ', 'PAGO-0003');

SELECT dni, nombre, correo, precio FROM venta;
SELECT nombre, precio, disponibles FROM entrada;
SELECT precio_anterior, precio_nuevo FROM cambio_precio;

-- ---------------------------------------------------------------
-- 6. Si el trigger falla, el INSERT tampoco se guarda
-- ---------------------------------------------------------------

UPDATE entrada SET disponibles = 0 WHERE id = 1;

-- El trigger de la parte 1 dejaría disponibles en -1: el CHECK lo rechaza.
INSERT INTO venta (dni, nombre, correo, referencia_pago)
VALUES ('70123459', 'Rosa Quispe', 'rosa.quispe@example.com', 'PAGO-0004');

SELECT COUNT(*) AS ventas FROM venta;

-- ---------------------------------------------------------------
-- 7. Ver los triggers de la base
-- ---------------------------------------------------------------

SHOW TRIGGERS;
