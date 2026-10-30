-- 007_auditoria_ip.sql
-- Guarda desde qué dirección IP se registra una cuenta, se inicia sesión o se hace una acción
-- de auditoría. Es aditiva: se puede ejecutar más de una vez.

ALTER TABLE usuario           ADD COLUMN IF NOT EXISTS ip_registro VARCHAR(45);
ALTER TABLE actividad_usuario ADD COLUMN IF NOT EXISTS ip_origen   VARCHAR(45);
ALTER TABLE auditoria         ADD COLUMN IF NOT EXISTS ip_origen   VARCHAR(45);
