-- 018_dni_unico_por_propietario.sql
-- Un propietario no puede tener dos herederos vigentes con el mismo DNI. Antes solo lo revisaba el backend;
-- si se pulsaba dos veces "Guardar" podían crearse dos iguales. Ahora lo exige la propia base de datos.
-- Es aditiva: se puede ejecutar más de una vez.

-- 1. Los duplicados que ya existían se desactivan, dejando el primero de cada DNI
WITH repetidos AS (
  SELECT id_beneficiario,
         ROW_NUMBER() OVER (PARTITION BY id_usuario_propietario, dni ORDER BY id_beneficiario) AS orden
  FROM beneficiario
  WHERE estado = 'ACTIVO'
)
UPDATE beneficiario b SET estado = 'INACTIVO'
FROM repetidos r
WHERE b.id_beneficiario = r.id_beneficiario AND r.orden > 1;

-- Los activos de un heredero desactivado se le quitan
DELETE FROM activo_beneficiario ab
USING beneficiario b
WHERE b.id_beneficiario = ab.id_beneficiario AND b.estado = 'INACTIVO';

-- 2. La regla queda en la base
CREATE UNIQUE INDEX IF NOT EXISTS ux_beneficiario_dni_propietario
  ON beneficiario (id_usuario_propietario, dni) WHERE estado = 'ACTIVO';
