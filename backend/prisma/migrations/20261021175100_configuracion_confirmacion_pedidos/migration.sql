CREATE TABLE `configuracion_sistema` (
    `clave` VARCHAR(80) NOT NULL,
    `valor` VARCHAR(255) NOT NULL,
    `actualizado` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`clave`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
