-- 020_usuario_inactivo_demo.sql
-- Datos de PRUEBA para ver el monitoreo en acción sin esperar meses (solo desarrollo, datos ficticios):
--   un propietario que se registró hace 200 días y nunca volvió a entrar, con una regla de 90 días,
--   un activo y un heredero con el correo ya verificado.
-- Es idempotente: si el usuario demo ya existe, no hace nada.
--
-- Propietario: demo.inactivo@example.com  (contraseña Legado2026!)
-- Heredero:    heredero.demo@example.com  (entra al portal con un código)

DO $$
DECLARE
  v_usuario INT;
  v_activo  INT;
  v_heredero INT;
BEGIN
  IF EXISTS (SELECT 1 FROM usuario WHERE correo = 'demo.inactivo@example.com') THEN
    RETURN;
  END IF;

  INSERT INTO usuario (id_rol, nombres, apellidos, dni, correo, password_hash, telefono, fecha_registro)
  SELECT id_rol, 'Rosa', 'Inactiva Demo', '00000088', 'demo.inactivo@example.com',
         '$2b$10$uRRCD5t6DSOMuZWJ70zdZO3HzWP1thM0ZitoSpKO0i2TkiHVokk1q', '900000088', NOW() - INTERVAL '200 days'
  FROM rol WHERE nombre = 'PROPIETARIO'
  RETURNING id_usuario INTO v_usuario;

  INSERT INTO regla_liberacion (id_usuario, dias_inactividad, min_confirmaciones, dias_periodo_espera, requiere_validador, dias_gracia)
  VALUES (v_usuario, 90, 1, 7, FALSE, 7);

  INSERT INTO activo_digital (id_usuario, id_tipo, nombre, descripcion, indicaciones_cifradas)
  SELECT v_usuario, id_tipo, 'Correo de prueba (demo)', 'Activo de demostración', NULL
  FROM tipo_activo WHERE nombre = 'Correo electrónico'
  RETURNING id_activo INTO v_activo;

  INSERT INTO beneficiario (id_usuario_propietario, nombres, apellidos, dni, correo, telefono, parentesco, correo_verificado)
  VALUES (v_usuario, 'Hugo', 'Heredero Demo', '12345670', 'heredero.demo@example.com', '900000089', 'Hijo/a', TRUE)
  RETURNING id_beneficiario INTO v_heredero;

  INSERT INTO activo_beneficiario (id_activo, id_beneficiario, prioridad) VALUES (v_activo, v_heredero, 1);
END $$;
