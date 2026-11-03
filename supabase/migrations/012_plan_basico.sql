-- 012_plan_basico.sql
-- Plan Básico gratuito con límite de herederos. El Premium no tiene límite (NULL).
-- Es aditiva: se puede ejecutar más de una vez.

ALTER TABLE plan ADD COLUMN IF NOT EXISTS limite_herederos INT;

UPDATE plan SET nombre = 'Básico',  descripcion = 'Gratis. Hasta 2 herederos',     limite_herederos = 2    WHERE tipo = 'FREE';
UPDATE plan SET nombre = 'Premium', descripcion = 'Herederos ilimitados',          limite_herederos = NULL WHERE tipo = 'PREMIUM';
