-- 021: el heredero ya no tiene clave propia; entra con un codigo de 6 digitos enviado a su correo
-- (ver 010 y codigo_verificacion). La columna quedo sin uso, asi que se elimina.
ALTER TABLE beneficiario DROP COLUMN IF EXISTS clave_acceso_hash;
