-- 005_proceso_demo.sql
-- DATOS DE PRUEBA (ficticios): un proceso de liberación en curso para el usuario de prueba,
-- para poder ver la pantalla "Procesos" sin esperar a que pasen 180 días de inactividad.
-- Es solo información en la base: la pantalla la lee igual que cualquier otro proceso real.
-- Ejecutar DESPUES de 001, 002, 003 y 004. Se puede ejecutar más de una vez (no duplica).
--
-- Qué crea (solo si el usuario 1 aún no tiene procesos):
--   1. Una regla de liberación activa, si no tenía ninguna (180 días, 2 confirmaciones, 15 días, validador).
--   2. Un proceso EN_CONFIRMACION iniciado hace 3 días.
--   3. Sus activos (proceso_activo) y las confirmaciones pedidas a los beneficiarios asignados
--      (confirmacion_beneficiario): el primer beneficiario ya confirmó y el resto está pendiente.

DO $$
DECLARE
  v_regla    INT;
  v_proceso  INT;
  v_primero  INT;
BEGIN
  IF EXISTS (SELECT 1 FROM proceso_liberacion WHERE id_usuario_propietario = 1) THEN
    RETURN;
  END IF;

  SELECT id_regla INTO v_regla
  FROM regla_liberacion
  WHERE id_usuario = 1 AND estado = 'ACTIVA'
  ORDER BY id_regla DESC LIMIT 1;

  IF v_regla IS NULL THEN
    INSERT INTO regla_liberacion (id_usuario, dias_inactividad, min_confirmaciones, dias_periodo_espera, requiere_validador)
    VALUES (1, 180, 2, 15, TRUE)
    RETURNING id_regla INTO v_regla;
  END IF;

  INSERT INTO proceso_liberacion (id_usuario_propietario, id_regla, fecha_inicio, estado, motivo)
  VALUES (1, v_regla, NOW() - INTERVAL '3 days', 'EN_CONFIRMACION', 'Inactividad superior a 180 días (datos de prueba)')
  RETURNING id_proceso INTO v_proceso;

  INSERT INTO proceso_activo (id_proceso, id_activo, estado)
  SELECT v_proceso, id_activo, 'PENDIENTE'
  FROM activo_digital
  WHERE id_usuario = 1 AND estado = 'ACTIVO';

  SELECT MIN(ab.id_beneficiario) INTO v_primero
  FROM activo_beneficiario ab
  JOIN activo_digital a ON a.id_activo = ab.id_activo
  WHERE a.id_usuario = 1;

  INSERT INTO confirmacion_beneficiario (id_proceso, id_activo, id_beneficiario, resultado, fecha)
  SELECT v_proceso, ab.id_activo, ab.id_beneficiario,
         CASE WHEN ab.id_beneficiario = v_primero THEN 'CONFIRMADA' ELSE 'PENDIENTE' END,
         CASE WHEN ab.id_beneficiario = v_primero THEN NOW() - INTERVAL '1 day' ELSE NULL END
  FROM activo_beneficiario ab
  JOIN activo_digital a ON a.id_activo = ab.id_activo
  WHERE a.id_usuario = 1 AND a.estado = 'ACTIVO';
END $$;
