-- 027: correlativos de comprobantes sin saltos. Una secuencia de PostgreSQL no se devuelve si la transacción se
-- revierte (queda un número perdido). Aquí el último número de cada serie vive en una fila que se actualiza dentro
-- de la misma transacción que aprueba el pago: si algo falla y se revierte, el número no se consume, y dos pagos
-- simultáneos se turnan porque la fila queda bloqueada hasta confirmar.
CREATE TABLE IF NOT EXISTS comprobante_serie (
  serie  VARCHAR(4) PRIMARY KEY,
  tipo   VARCHAR(8) NOT NULL CHECK (tipo IN ('BOLETA', 'FACTURA')),
  ultimo INT NOT NULL DEFAULT 0 CHECK (ultimo >= 0)
);

INSERT INTO comprobante_serie (serie, tipo, ultimo) VALUES
  ('B001', 'BOLETA',  COALESCE((SELECT MAX(numero_comprobante) FROM pago WHERE serie = 'B001'), 0)),
  ('F001', 'FACTURA', COALESCE((SELECT MAX(numero_comprobante) FROM pago WHERE serie = 'F001'), 0))
ON CONFLICT (serie) DO UPDATE SET ultimo = GREATEST(comprobante_serie.ultimo, EXCLUDED.ultimo);

ALTER TABLE comprobante_serie ENABLE ROW LEVEL SECURITY;  -- solo el backend (rol de servicio) la usa

DROP SEQUENCE IF EXISTS seq_boleta;
DROP SEQUENCE IF EXISTS seq_factura;
