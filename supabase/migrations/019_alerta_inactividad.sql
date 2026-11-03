-- 019_alerta_inactividad.sql
-- Antes de abrir un proceso de liberación, el sistema avisa al propietario y le da un plazo de gracia
-- para entrar. Solo si no entra en ese plazo se abre el proceso y se avisa a los herederos.
-- Es aditiva: se puede ejecutar más de una vez.

-- Días de gracia que tiene el propietario después de la alerta (los configura en su regla)
ALTER TABLE regla_liberacion ADD COLUMN IF NOT EXISTS dias_gracia INT NOT NULL DEFAULT 7;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_regla_dias_gracia') THEN
    ALTER TABLE regla_liberacion ADD CONSTRAINT ck_regla_dias_gracia CHECK (dias_gracia BETWEEN 1 AND 60);
  END IF;
END $$;

-- Cada alerta enviada a un propietario por inactividad
CREATE TABLE IF NOT EXISTS alerta_inactividad (
    id_alerta    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario   INT NOT NULL,
    id_regla     INT NOT NULL,
    fecha_alerta TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_limite TIMESTAMPTZ NOT NULL,                    -- hasta cuándo puede entrar para evitar el proceso
    estado       VARCHAR(20) NOT NULL DEFAULT 'ENVIADA',  -- ENVIADA | RESUELTA (entró) | VENCIDA (se abrió el proceso)
    CONSTRAINT fk_alerta_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_alerta_regla   FOREIGN KEY (id_regla)   REFERENCES regla_liberacion(id_regla),
    CONSTRAINT ck_alerta_estado  CHECK (estado IN ('ENVIADA', 'RESUELTA', 'VENCIDA'))
);

ALTER TABLE alerta_inactividad ENABLE ROW LEVEL SECURITY;
