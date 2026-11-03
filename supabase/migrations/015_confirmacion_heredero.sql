-- 015_confirmacion_heredero.sql
-- Confirmación del heredero dentro de un proceso de liberación (Figma 06):
--   verificacion_beneficiario: pasos de identidad de cada heredero en un proceso (DNI y selfie).
--   proceso_liberacion.fecha_espera: cuándo empezó el período de espera final.
-- Es aditiva: se puede ejecutar más de una vez.

CREATE TABLE IF NOT EXISTS verificacion_beneficiario (
    id_proceso      INT NOT NULL,
    id_beneficiario INT NOT NULL,
    dni_validado    BOOLEAN     NOT NULL DEFAULT FALSE,
    fecha_dni       TIMESTAMPTZ,
    selfie_cifrada  TEXT,          -- foto del heredero, cifrada con AES-256 (evidencia para revisión)
    fecha_selfie    TIMESTAMPTZ,
    CONSTRAINT pk_verificacion_beneficiario PRIMARY KEY (id_proceso, id_beneficiario),
    CONSTRAINT fk_vb_proceso      FOREIGN KEY (id_proceso)      REFERENCES proceso_liberacion(id_proceso),
    CONSTRAINT fk_vb_beneficiario FOREIGN KEY (id_beneficiario) REFERENCES beneficiario(id_beneficiario)
);

ALTER TABLE verificacion_beneficiario ENABLE ROW LEVEL SECURITY;

ALTER TABLE proceso_liberacion ADD COLUMN IF NOT EXISTS fecha_espera TIMESTAMPTZ;
