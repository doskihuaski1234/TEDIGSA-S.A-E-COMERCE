-- TEDIGSA: tablas exclusivas para el chat.
-- Revisar antes de ejecutar. No altera las tablas existentes.

CREATE TABLE IF NOT EXISTS `chat_conversacion` (
  `id_conversacion` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `estado` VARCHAR(20) NOT NULL DEFAULT 'Abierta',
  `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_actualizacion` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id_conversacion`),
  INDEX `chat_conversacion_id_usuario_idx` (`id_usuario`),
  INDEX `chat_conversacion_estado_idx` (`estado`),
  CONSTRAINT `chat_conversacion_id_usuario_fkey`
    FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_mensaje` (
  `id_mensaje` INT NOT NULL AUTO_INCREMENT,
  `id_conversacion` INT NOT NULL,
  `id_autor` INT NOT NULL,
  `remitente` VARCHAR(30) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `fecha_envio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id_mensaje`),
  INDEX `chat_mensaje_conversacion_fecha_idx` (`id_conversacion`, `fecha_envio`),
  INDEX `chat_mensaje_id_autor_idx` (`id_autor`),
  CONSTRAINT `chat_mensaje_id_conversacion_fkey`
    FOREIGN KEY (`id_conversacion`) REFERENCES `chat_conversacion` (`id_conversacion`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chat_mensaje_id_autor_fkey`
    FOREIGN KEY (`id_autor`) REFERENCES `usuario` (`id_usuario`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;