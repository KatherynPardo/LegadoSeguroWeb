-- 016_documentos_por_tipo_y_tarjetas.sql
-- 1) Los documentos que debe reunir un heredero dependen del TIPO de los activos que recibe.
-- 2) Cada activo puede llevar indicaciones para el heredero (cifradas).
-- 3) Tarjetas de crédito y de débito, con sus datos (solo los últimos 4 dígitos).
-- Es aditiva: se puede ejecutar más de una vez.

-- ---------------------------------------------------------------
-- Tipos de activo: tarjetas y una guía de qué indicar en cada tipo
-- ---------------------------------------------------------------
ALTER TABLE tipo_activo ADD COLUMN IF NOT EXISTS es_tarjeta        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tipo_activo ADD COLUMN IF NOT EXISTS es_credito        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tipo_activo ADD COLUMN IF NOT EXISTS guia_indicaciones VARCHAR(300);

INSERT INTO tipo_activo (nombre, categoria_sensibilidad, requiere_entidad, es_tarjeta, es_credito)
SELECT v.nombre, 'FINANCIERA', TRUE, TRUE, v.es_credito
FROM (VALUES ('Tarjeta de crédito', TRUE), ('Tarjeta de débito', FALSE)) AS v(nombre, es_credito)
WHERE NOT EXISTS (SELECT 1 FROM tipo_activo t WHERE t.nombre = v.nombre);

UPDATE tipo_activo SET guia_indicaciones = 'Indica el usuario, la contraseña y qué hacer con la cuenta (cerrarla, conservarla en recuerdo...).' WHERE nombre = 'Red social';
UPDATE tipo_activo SET guia_indicaciones = 'Indica el correo, su contraseña y el celular de recuperación (con su clave de desbloqueo).' WHERE nombre = 'Correo electrónico';
UPDATE tipo_activo SET guia_indicaciones = 'Indica en qué agencia o app se gestiona, qué clave usa y quién conoce los datos de acceso.' WHERE nombre = 'Cuenta bancaria';
UPDATE tipo_activo SET guia_indicaciones = 'Indica dónde está guardada la frase de recuperación y qué billetera o plataforma se usa.' WHERE nombre = 'Billetera de cripto';
UPDATE tipo_activo SET guia_indicaciones = 'Indica la app o el banco para gestionarla y qué hacer con ella (cancelarla, pagar la deuda...).' WHERE nombre IN ('Tarjeta de crédito', 'Tarjeta de débito');

-- Emisores de tarjetas que faltaban en el catálogo de bancos
INSERT INTO entidad_financiera (nombre)
SELECT v.nombre FROM (VALUES ('CMR Falabella'), ('Banco Ripley'), ('Diners Club'), ('American Express')) AS v(nombre)
WHERE NOT EXISTS (SELECT 1 FROM entidad_financiera e WHERE LOWER(e.nombre) = LOWER(v.nombre));

-- ---------------------------------------------------------------
-- Indicaciones del activo para el heredero (cifradas)
-- ---------------------------------------------------------------
ALTER TABLE activo_digital ADD COLUMN IF NOT EXISTS indicaciones_cifradas TEXT;

-- ---------------------------------------------------------------
-- Datos de las tarjetas: solo los 4 últimos dígitos (nunca el número completo, el CVV ni la clave)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_tarjeta (
    id_activo             INT PRIMARY KEY,
    ultimos4              VARCHAR(4) NOT NULL,
    linea_credito_cifrada TEXT,
    dia_pago              SMALLINT,
    dia_cierre            SMALLINT,
    CONSTRAINT fk_dt_activo     FOREIGN KEY (id_activo) REFERENCES activo_digital(id_activo),
    CONSTRAINT ck_dt_ultimos4   CHECK (ultimos4 ~ '^[0-9]{4}$'),
    CONSTRAINT ck_dt_dia_pago   CHECK (dia_pago BETWEEN 1 AND 31),
    CONSTRAINT ck_dt_dia_cierre CHECK (dia_cierre BETWEEN 1 AND 31)
);

ALTER TABLE detalle_tarjeta ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- Requisitos por tipo de activo. Un requisito sin filas aquí aplica a TODOS los activos.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS requisito_tipo (
    id_requisito INT NOT NULL,
    id_tipo      INT NOT NULL,
    CONSTRAINT pk_requisito_tipo PRIMARY KEY (id_requisito, id_tipo),
    CONSTRAINT fk_rt_requisito FOREIGN KEY (id_requisito) REFERENCES requisito_documental(id_requisito),
    CONSTRAINT fk_rt_tipo      FOREIGN KEY (id_tipo)      REFERENCES tipo_activo(id_tipo)
);

ALTER TABLE requisito_tipo ENABLE ROW LEVEL SECURITY;

INSERT INTO requisito_documental (nombre, descripcion, obligatorio)
SELECT 'Estado de cuenta reciente', 'Último estado de cuenta, para identificar la cuenta y el saldo.', FALSE
WHERE NOT EXISTS (SELECT 1 FROM requisito_documental WHERE LOWER(nombre) = 'estado de cuenta reciente');

-- Asignación inicial: lo financiero pide más documentos; los correos y redes sociales solo piden los generales
INSERT INTO requisito_tipo (id_requisito, id_tipo)
SELECT r.id_requisito, t.id_tipo
FROM requisito_documental r
JOIN tipo_activo t ON (
     (r.nombre IN ('Declaratoria de herederos o testamento', 'Partida de nacimiento o de matrimonio')
        AND t.nombre IN ('Cuenta bancaria', 'Tarjeta de crédito', 'Tarjeta de débito', 'Billetera de cripto'))
  OR (r.nombre = 'Carta poder notarial'
        AND t.nombre IN ('Cuenta bancaria', 'Tarjeta de crédito', 'Tarjeta de débito'))
  OR (r.nombre = 'Estado de cuenta reciente' AND t.nombre = 'Cuenta bancaria')
)
ON CONFLICT (id_requisito, id_tipo) DO NOTHING;
