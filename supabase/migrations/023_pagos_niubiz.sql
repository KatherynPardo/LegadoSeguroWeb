-- 023: pagos con Niubiz (formulario Pago Web). Cada intento de cobro es una fila de "pago" identificada por un
-- número de pedido único (numérico, máximo 9 dígitos, como exige Niubiz). Estados de "pago": PENDIENTE (esperando
-- la respuesta de Niubiz), PROCESANDO, COMPLETADO, DENEGADO y REVISAR (no se pudo confirmar el resultado).
CREATE SEQUENCE IF NOT EXISTS seq_numero_pedido START 1000 MAXVALUE 999999999;

ALTER TABLE pago
  ADD COLUMN IF NOT EXISTS numero_pedido       INT,
  ADD COLUMN IF NOT EXISTS id_transaccion      VARCHAR(30),
  ADD COLUMN IF NOT EXISTS tarjeta_enmascarada VARCHAR(25),
  ADD COLUMN IF NOT EXISTS codigo_accion       VARCHAR(5),
  ADD COLUMN IF NOT EXISTS descripcion_accion  VARCHAR(200);

CREATE UNIQUE INDEX IF NOT EXISTS ux_pago_numero_pedido ON pago (numero_pedido) WHERE numero_pedido IS NOT NULL;
