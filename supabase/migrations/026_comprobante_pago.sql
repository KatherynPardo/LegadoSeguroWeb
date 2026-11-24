-- 026: detalle del pago y comprobante electrónico. Se guarda lo que Niubiz devuelve al autorizar (código de
-- autorización, ECI, marca y fecha) y los datos del comprobante: boleta (por defecto, con el DNI del usuario) o
-- factura (con RUC y razón social que el usuario indica al comprar). Solo los pagos COMPLETADOS tienen comprobante.
CREATE SEQUENCE IF NOT EXISTS seq_boleta  START 1 MAXVALUE 99999999;
CREATE SEQUENCE IF NOT EXISTS seq_factura START 1 MAXVALUE 99999999;

ALTER TABLE pago
  ADD COLUMN IF NOT EXISTS codigo_autorizacion VARCHAR(12),
  ADD COLUMN IF NOT EXISTS eci                 VARCHAR(3),
  ADD COLUMN IF NOT EXISTS marca               VARCHAR(20),
  ADD COLUMN IF NOT EXISTS fecha_transaccion   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tipo_comprobante    VARCHAR(8) NOT NULL DEFAULT 'BOLETA',
  ADD COLUMN IF NOT EXISTS serie               VARCHAR(4),
  ADD COLUMN IF NOT EXISTS numero_comprobante  INT,
  ADD COLUMN IF NOT EXISTS ruc_cliente         VARCHAR(11),
  ADD COLUMN IF NOT EXISTS razon_social        VARCHAR(150);

ALTER TABLE pago DROP CONSTRAINT IF EXISTS ck_pago_tipo_comprobante;
ALTER TABLE pago ADD CONSTRAINT ck_pago_tipo_comprobante CHECK (tipo_comprobante IN ('BOLETA', 'FACTURA'));
ALTER TABLE pago DROP CONSTRAINT IF EXISTS ck_pago_factura_datos;
ALTER TABLE pago ADD CONSTRAINT ck_pago_factura_datos CHECK (tipo_comprobante <> 'FACTURA' OR (ruc_cliente ~ '^[0-9]{11}$' AND razon_social IS NOT NULL));

CREATE UNIQUE INDEX IF NOT EXISTS ux_pago_comprobante ON pago (serie, numero_comprobante) WHERE serie IS NOT NULL;

-- Los pagos aprobados antes de esta migración reciben su boleta (en orden de fecha) para que aparezca en el historial
UPDATE pago p SET serie = 'B001', numero_comprobante = n.numero
FROM (SELECT id_pago, nextval('seq_boleta') AS numero FROM pago WHERE estado = 'COMPLETADO' AND serie IS NULL ORDER BY fecha_pago) n
WHERE p.id_pago = n.id_pago;
