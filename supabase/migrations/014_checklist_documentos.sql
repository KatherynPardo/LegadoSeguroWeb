-- 014_checklist_documentos.sql
-- Checklist de documentos que cada heredero debe reunir.
--   requisito_documental: catálogo que mantiene el ADMINISTRADOR.
--   documento_heredero:   qué documentos corresponden a cada heredero, su estado y dónde está el original
--                         (lo define el PROPIETARIO; el HEREDERO marca los que ya tiene).
-- Es aditiva: se puede ejecutar más de una vez.

CREATE TABLE IF NOT EXISTS requisito_documental (
    id_requisito INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre       VARCHAR(150) NOT NULL,
    descripcion  VARCHAR(300),
    obligatorio  BOOLEAN      NOT NULL DEFAULT FALSE,
    estado       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO'
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_requisito_nombre ON requisito_documental (LOWER(nombre));

CREATE TABLE IF NOT EXISTS documento_heredero (
    id_documento    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_beneficiario INT NOT NULL,
    id_requisito    INT NOT NULL,
    estado          VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',  -- 'PENDIENTE' | 'ENTREGADO'
    ubicacion       VARCHAR(200),                                -- dónde está el original (nota del propietario)
    fecha_entrega   TIMESTAMPTZ,
    CONSTRAINT fk_dh_beneficiario FOREIGN KEY (id_beneficiario) REFERENCES beneficiario(id_beneficiario),
    CONSTRAINT fk_dh_requisito    FOREIGN KEY (id_requisito)    REFERENCES requisito_documental(id_requisito),
    CONSTRAINT uq_dh_heredero_requisito UNIQUE (id_beneficiario, id_requisito),
    CONSTRAINT ck_dh_estado CHECK (estado IN ('PENDIENTE', 'ENTREGADO'))
);

ALTER TABLE requisito_documental ENABLE ROW LEVEL SECURITY;
ALTER TABLE documento_heredero   ENABLE ROW LEVEL SECURITY;

-- Catálogo inicial
INSERT INTO requisito_documental (nombre, descripcion, obligatorio)
SELECT v.nombre, v.descripcion, v.obligatorio FROM (VALUES
  ('Copia del DNI del heredero',              'Copia legible del DNI vigente de quien recibe el legado.', TRUE),
  ('Certificado de defunción del titular',    'Acta o certificado de defunción de la persona que dejó el legado.', TRUE),
  ('Partida de nacimiento o de matrimonio',   'Documento que acredita el parentesco con el titular.', FALSE),
  ('Carta poder notarial',                    'Solo si el heredero actúa mediante un representante.', FALSE),
  ('Declaratoria de herederos o testamento',  'Necesaria para reclamar activos financieros.', FALSE)
) AS v(nombre, descripcion, obligatorio)
WHERE NOT EXISTS (SELECT 1 FROM requisito_documental r WHERE LOWER(r.nombre) = LOWER(v.nombre));

-- Los herederos que ya existían reciben los documentos obligatorios
INSERT INTO documento_heredero (id_beneficiario, id_requisito)
SELECT b.id_beneficiario, r.id_requisito
FROM beneficiario b
CROSS JOIN requisito_documental r
WHERE b.estado = 'ACTIVO' AND r.obligatorio = TRUE AND r.estado = 'ACTIVO'
ON CONFLICT (id_beneficiario, id_requisito) DO NOTHING;
