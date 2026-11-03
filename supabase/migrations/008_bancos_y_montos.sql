-- 008_bancos_y_montos.sql
-- Bancos (catálogo ampliable por el usuario), monto opcional por activo e historial de montos.
-- Es aditiva: se puede ejecutar más de una vez.

-- 1. Catálogo de entidades financieras. id_usuario_creador NULL = viene de fábrica, para todos.
CREATE TABLE IF NOT EXISTS entidad_financiera (
    id_entidad         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario_creador INT,
    nombre             VARCHAR(100) NOT NULL,
    estado             VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT fk_ef_usuario FOREIGN KEY (id_usuario_creador) REFERENCES usuario(id_usuario)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_entidad_nombre ON entidad_financiera (LOWER(nombre));

INSERT INTO entidad_financiera (nombre)
SELECT v.nombre FROM (VALUES
  ('BCP'), ('BBVA'), ('Interbank'), ('Scotiabank'), ('Banco de la Nación'), ('Banco Pichincha'),
  ('BanBif'), ('Mibanco'), ('Caja Cusco'), ('Caja Arequipa'), ('Caja Huancayo'), ('Caja Piura'),
  ('Caja Trujillo'), ('Caja Sullana')
) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM entidad_financiera e WHERE LOWER(e.nombre) = LOWER(v.nombre));

-- 2. Monto opcional en cualquier activo (por ejemplo, una cuenta monetizada) y banco para los financieros
ALTER TABLE activo_digital ADD COLUMN IF NOT EXISTS id_entidad      INT;
ALTER TABLE activo_digital ADD COLUMN IF NOT EXISTS moneda          VARCHAR(3);
ALTER TABLE activo_digital ADD COLUMN IF NOT EXISTS monto           NUMERIC(14,2);
ALTER TABLE activo_digital ADD COLUMN IF NOT EXISTS registrar_monto BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_activo_entidad') THEN
    ALTER TABLE activo_digital
      ADD CONSTRAINT fk_activo_entidad FOREIGN KEY (id_entidad) REFERENCES entidad_financiera(id_entidad);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_activo_moneda') THEN
    ALTER TABLE activo_digital ADD CONSTRAINT ck_activo_moneda CHECK (moneda IN ('PEN', 'USD'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_activo_monto') THEN
    ALTER TABLE activo_digital ADD CONSTRAINT ck_activo_monto CHECK (monto >= 0);
  END IF;
END $$;

-- 3. Qué tipos de activo piden banco (por ahora, solo la cuenta bancaria)
ALTER TABLE tipo_activo ADD COLUMN IF NOT EXISTS requiere_entidad BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE tipo_activo SET requiere_entidad = TRUE WHERE nombre = 'Cuenta bancaria';

-- 4. Historial: cada vez que cambia el monto de un activo queda una fila
CREATE TABLE IF NOT EXISTS historial_monto (
    id_historial INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_activo    INT NOT NULL,
    monto        NUMERIC(14,2) NOT NULL,
    moneda       VARCHAR(3)    NOT NULL,
    fecha        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    id_usuario   INT,
    ip_origen    VARCHAR(45),
    CONSTRAINT fk_hm_activo  FOREIGN KEY (id_activo)  REFERENCES activo_digital(id_activo),
    CONSTRAINT fk_hm_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- 5. Mismo criterio de seguridad que el resto de tablas: RLS sin políticas
ALTER TABLE entidad_financiera ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_monto    ENABLE ROW LEVEL SECURITY;
