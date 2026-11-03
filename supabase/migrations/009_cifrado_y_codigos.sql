-- 009_cifrado_y_codigos.sql
-- 1) Columnas para guardar cifrados el monto y los datos de ahorro.
-- 2) Tabla de códigos de verificación por correo (registro y herederos).
-- Es aditiva: se puede ejecutar más de una vez.

-- La descripción cifrada es más larga que 300 caracteres, por eso pasa a TEXT
ALTER TABLE activo_digital ALTER COLUMN descripcion TYPE TEXT;
ALTER TABLE activo_digital ADD COLUMN IF NOT EXISTS monto_cifrado  TEXT;
ALTER TABLE activo_digital ADD COLUMN IF NOT EXISTS ahorro_cifrado TEXT;

-- El historial también guarda el monto cifrado (la columna monto queda vacía en los registros nuevos)
ALTER TABLE historial_monto ALTER COLUMN monto DROP NOT NULL;
ALTER TABLE historial_monto ADD COLUMN IF NOT EXISTS monto_cifrado TEXT;

-- Códigos de verificación: se guardan cifrados (hash), duran 10 minutos y tienen 5 intentos
CREATE TABLE IF NOT EXISTS codigo_verificacion (
    id_codigo        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proposito        VARCHAR(30)  NOT NULL,
    destino          VARCHAR(150) NOT NULL,
    id_usuario       INT,
    codigo_hash      VARCHAR(255) NOT NULL,
    fecha_creacion   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    fecha_expiracion TIMESTAMPTZ  NOT NULL,
    intentos         INT          NOT NULL DEFAULT 0,
    usado            BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_codigo_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

ALTER TABLE codigo_verificacion ENABLE ROW LEVEL SECURITY;
