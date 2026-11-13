-- 022: consentimiento expreso para el tratamiento de la selfie del heredero (Ley 29733).
-- La fecha y la IP quedan guardadas junto a la foto: sin consentimiento no se guarda ninguna selfie.
ALTER TABLE verificacion_beneficiario
  ADD COLUMN IF NOT EXISTS fecha_consentimiento TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ip_consentimiento VARCHAR(45);
