-- 017_linea_credito_es_el_monto.sql
-- La línea de crédito de una tarjeta ya no es un dato aparte: se registra como el MONTO del activo
-- (opcional, con moneda e historial), igual que en los demás activos. Se quita la columna duplicada.
-- Es aditiva: se puede ejecutar más de una vez.

ALTER TABLE detalle_tarjeta DROP COLUMN IF EXISTS linea_credito_cifrada;
