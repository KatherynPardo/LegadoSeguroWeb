-- 006_usuario_admin.sql
-- Usuario administrador de prueba (SOLO desarrollo, datos ficticios).
-- Se puede ejecutar más de una vez: si el correo ya existe, no hace nada.
--
-- Correo:     admin@legadoseguro.pe
-- Contraseña: Admin2026!
-- El valor guardado es el hash bcrypt de esa contraseña, nunca la contraseña en texto plano.

INSERT INTO usuario (id_rol, nombres, apellidos, dni, correo, password_hash, telefono)
SELECT r.id_rol, 'Administrador', 'LegadoSeguro', '00000001', 'admin@legadoseguro.pe',
       '$2b$10$f2kctAOa7eoRvdQBP9Cs7Oa7mQ3XMVd4Tqwblj256KGjb80rrpGxC', NULL
FROM rol r
WHERE r.nombre = 'ADMINISTRADOR'
  AND NOT EXISTS (SELECT 1 FROM usuario WHERE correo = 'admin@legadoseguro.pe');
