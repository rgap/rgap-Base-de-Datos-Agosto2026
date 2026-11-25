-- Usuarios, permisos, roles y copia de seguridad (MySQL).
-- Caso de estudio: venta de entradas para la feria gastronómica Fogón.
-- Antes ejecuta otra vez la práctica 1 (ejemplos/practicas/mysql/): la base sin triggers.
-- Ejecútalo por partes, conectado como root. Las partes 5 y 8 van en otra conexión.

USE feria_entrada;

-- ---------------------------------------------------------------
-- 1. El procedimiento que usará la aplicación (sesión 30)
-- ---------------------------------------------------------------

DROP PROCEDURE IF EXISTS comprar_entrada;

DELIMITER //

-- PROCEDIMIENTO ALMACENADO: comprar_entrada
-- Registra la compra de una entrada en una sola transacción.
-- SQL SECURITY DEFINER: se ejecuta con los permisos de quien lo creó (root),
-- no con los de quien lo llama.
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
SQL SECURITY DEFINER
BEGIN
    -- Ante cualquier error se deshace todo.
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

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

-- ---------------------------------------------------------------
-- 2. Una vista sin datos personales, para contabilidad
-- ---------------------------------------------------------------

DROP VIEW IF EXISTS resumen_ventas;

-- Cuántas ventas hay y cuánto se recaudó. Sin DNI, nombres ni correos.
CREATE VIEW resumen_ventas AS
SELECT COUNT(*) AS ventas, COALESCE(SUM(precio), 0) AS recaudado
FROM venta;

-- ---------------------------------------------------------------
-- 3. El usuario de la aplicación
-- ---------------------------------------------------------------

DROP USER IF EXISTS 'app_feria'@'localhost';

-- 'localhost': solo puede conectarse desde la misma computadora.
CREATE USER 'app_feria'@'localhost' IDENTIFIED BY 'Feria#2026';

-- ---------------------------------------------------------------
-- 4. Sus permisos: leer y comprar, nada más
-- ---------------------------------------------------------------

GRANT SELECT ON feria_entrada.entrada TO 'app_feria'@'localhost';
GRANT SELECT ON feria_entrada.venta TO 'app_feria'@'localhost';
GRANT EXECUTE ON PROCEDURE feria_entrada.comprar_entrada TO 'app_feria'@'localhost';

SHOW GRANTS FOR 'app_feria'@'localhost';

-- ---------------------------------------------------------------
-- 5. Pruébalo: abre una conexión nueva con el usuario app_feria
-- ---------------------------------------------------------------

-- En Workbench: Database > Connect to Database, Username: app_feria.
-- Ahí ejecuta, una por una:
--
-- USE feria_entrada;
-- SELECT nombre, precio, disponibles FROM entrada;
-- UPDATE entrada SET precio = 1.00 WHERE id = 1;
-- INSERT INTO venta (dni, nombre, correo, precio, referencia_pago)
-- VALUES ('70123456', 'Luis Rojas', 'luis.rojas@example.com', 1.00, 'PAGO-0001');
-- CALL comprar_entrada('70123456', 'Luis Rojas', 'luis.rojas@example.com', 'PAGO-0001',
--                      @venta_id, @fecha_venta, @entrada, @precio);
-- SELECT nombre, precio, disponibles FROM entrada;

-- ---------------------------------------------------------------
-- 6. Quitar un permiso: REVOKE
-- ---------------------------------------------------------------

-- Alguien le dio a la aplicación un permiso que no necesita.
GRANT INSERT ON feria_entrada.venta TO 'app_feria'@'localhost';

REVOKE INSERT ON feria_entrada.venta FROM 'app_feria'@'localhost';

SHOW GRANTS FOR 'app_feria'@'localhost';

-- ---------------------------------------------------------------
-- 7. Un rol para contabilidad
-- ---------------------------------------------------------------

DROP USER IF EXISTS 'carmen'@'localhost', 'jorge'@'localhost';
DROP ROLE IF EXISTS 'contabilidad';

-- El rol junta los permisos; las personas reciben el rol.
CREATE ROLE 'contabilidad';
GRANT SELECT ON feria_entrada.resumen_ventas TO 'contabilidad';

CREATE USER 'carmen'@'localhost' IDENTIFIED BY 'Carmen#2026';
CREATE USER 'jorge'@'localhost' IDENTIFIED BY 'Jorge#2026';

GRANT 'contabilidad' TO 'carmen'@'localhost', 'jorge'@'localhost';

-- Sin esta línea, el rol no se activa al conectarse.
SET DEFAULT ROLE 'contabilidad' TO 'carmen'@'localhost', 'jorge'@'localhost';

-- ---------------------------------------------------------------
-- 8. Pruébalo: abre una conexión nueva con el usuario carmen
-- ---------------------------------------------------------------

-- USE feria_entrada;
-- SELECT * FROM resumen_ventas;
-- SELECT dni, nombre, correo FROM venta;

-- ---------------------------------------------------------------
-- 9. Jorge deja contabilidad: se le quita el rol
-- ---------------------------------------------------------------

REVOKE 'contabilidad' FROM 'jorge'@'localhost';

SHOW GRANTS FOR 'jorge'@'localhost';

-- ---------------------------------------------------------------
-- 10. Copia de seguridad (en la terminal, no en Workbench)
-- ---------------------------------------------------------------

-- En PowerShell, dentro de C:\Program Files\MySQL\MySQL Server 8.4\bin
-- (antes crea la carpeta C:\copias).
--
-- Sacar la copia (--routines: incluye procedimientos y funciones):
-- .\mysqldump -u root -p --routines --databases feria_entrada --result-file=C:\copias\feria_entrada.sql
--
-- Simula un error en Workbench, solo si la copia terminó bien:
-- DROP TABLE venta;
-- SELECT COUNT(*) FROM venta;
--
-- Volver a la copia, otra vez en PowerShell:
-- .\mysql -u root -p -e "source C:\copias\feria_entrada.sql"
--
-- Comprueba en Workbench:
-- SELECT dni, nombre, precio FROM venta;
