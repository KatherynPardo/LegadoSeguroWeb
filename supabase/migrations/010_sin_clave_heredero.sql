-- 010_sin_clave_heredero.sql
-- El heredero ya no tiene una clave guardada: confirma su identidad con códigos enviados a su correo.
-- Tampoco se usa ya el método de ahorro con rango (se mantiene solo el monto exacto con su historial).
-- Es aditiva: se puede ejecutar más de una vez.

ALTER TABLE beneficiario ALTER COLUMN clave_acceso_hash DROP NOT NULL;
ALTER TABLE activo_digital DROP COLUMN IF EXISTS ahorro_cifrado;
