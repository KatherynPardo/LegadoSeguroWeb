-- 004_usuario_demo.sql
-- Usuario de prueba para poder iniciar sesión (SOLO desarrollo, datos ficticios).
-- Ejecutar en Supabase -> SQL Editor si necesitas recrear la contraseña.
--
-- Correo:     carlos.ramirez@example.com
-- Contraseña: Legado2026!
-- El valor guardado es el hash bcrypt de esa contraseña, nunca la contraseña en texto plano.

UPDATE usuario
SET password_hash = '$2b$10$uRRCD5t6DSOMuZWJ70zdZO3HzWP1thM0ZitoSpKO0i2TkiHVokk1q'
WHERE correo = 'carlos.ramirez@example.com';
