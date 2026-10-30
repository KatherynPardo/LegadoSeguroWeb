-- 003_datos_iniciales.sql
-- Datos iniciales y de prueba (ficticios): roles, un usuario, tipos de activo, activos,
-- beneficiarios y planes. Los ids se generan solos empezando en 1, por eso las FK usan 1, 2...
-- Ejecutar DESPUES de 001 y 002.

INSERT INTO rol (nombre, descripcion) VALUES
  ('PROPIETARIO',   'Persona que registra su legado digital'),
  ('BENEFICIARIO',  'Heredero designado'),
  ('ADMINISTRADOR', 'Gestiona la plataforma');

INSERT INTO usuario (id_rol, nombres, apellidos, dni, correo, password_hash, telefono) VALUES
  (1, 'Carlos', 'Ramírez Vega', '45678912', 'carlos.ramirez@example.com', 'HASH_DE_PRUEBA_NO_REAL', '987654321');

INSERT INTO tipo_activo (nombre, categoria_sensibilidad) VALUES
  ('Red social',           'BAJA'),
  ('Correo electrónico',   'BAJA'),
  ('Cuenta bancaria',      'FINANCIERA'),
  ('Billetera de cripto',  'FINANCIERA');

INSERT INTO activo_digital (id_usuario, id_tipo, nombre, descripcion, ubicacion_referencia) VALUES
  (1, 1, 'Facebook personal', 'Cuenta de Facebook de Carlos',  'facebook.com'),
  (1, 2, 'Gmail principal',   'Correo personal',               'gmail.com'),
  (1, 3, 'Cuenta de ahorros', 'Ahorros en banco (referencia)', 'Banco de ejemplo');

INSERT INTO beneficiario (id_usuario_propietario, nombres, apellidos, dni, correo, telefono, parentesco, clave_acceso_hash) VALUES
  (1, 'Lucía',  'Ramírez Torres', '70112233', 'lucia.ramirez@example.com',  '911222333', 'Hija',   'HASH_DE_PRUEBA_NO_REAL'),
  (1, 'Martín', 'Ramírez Torres', '70445566', 'martin.ramirez@example.com', '944555666', 'Hijo',   'HASH_DE_PRUEBA_NO_REAL'),
  (1, 'Rosa',   'Torres Vega',    '07889900', 'rosa.torres@example.com',    '977888999', 'Esposa', 'HASH_DE_PRUEBA_NO_REAL');

INSERT INTO activo_beneficiario (id_activo, id_beneficiario, prioridad) VALUES
  (1, 1, 1),
  (2, 1, 1),
  (3, 3, 1);

INSERT INTO plan (nombre, tipo, precio, descripcion) VALUES
  ('Gratuito', 'FREE',    0.00,  'Hasta 5 activos y 2 beneficiarios'),
  ('Premium',  'PREMIUM', 29.90, 'Activos y beneficiarios ilimitados');


-- Comprobación: cada beneficiario con los activos que recibe
SELECT b.id_beneficiario, b.nombres, b.apellidos, b.parentesco, a.nombre AS activo
FROM beneficiario b
JOIN activo_beneficiario ab ON ab.id_beneficiario = b.id_beneficiario
JOIN activo_digital a       ON a.id_activo = ab.id_activo
ORDER BY b.id_beneficiario;
