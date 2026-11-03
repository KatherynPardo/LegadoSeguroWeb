-- 013_dias_inactividad_libres.sql
-- Los días de inactividad de la regla son libres (ya no solo 90, 180, 270 o 365), pero la base
-- también los controla: entre 7 días y 10 años. Es aditiva: se puede ejecutar más de una vez.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_regla_dias_inactividad') THEN
    ALTER TABLE regla_liberacion
      ADD CONSTRAINT ck_regla_dias_inactividad CHECK (dias_inactividad BETWEEN 7 AND 3650);
  END IF;
END $$;
