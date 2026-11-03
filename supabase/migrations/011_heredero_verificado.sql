-- 011_heredero_verificado.sql
-- Marca si el heredero confirmó su correo con un código (se muestra como "Identidad verificada").
-- Es aditiva: se puede ejecutar más de una vez.

ALTER TABLE beneficiario ADD COLUMN IF NOT EXISTS correo_verificado BOOLEAN NOT NULL DEFAULT FALSE;

-- Los herederos que ya validaron un código antes de esta migración quedan como verificados
UPDATE beneficiario b
SET correo_verificado = TRUE
WHERE EXISTS (
  SELECT 1 FROM codigo_verificacion c
  WHERE c.proposito = 'HEREDERO' AND c.usado = TRUE
    AND c.destino = LOWER(b.correo) AND c.id_usuario = b.id_usuario_propietario
);
