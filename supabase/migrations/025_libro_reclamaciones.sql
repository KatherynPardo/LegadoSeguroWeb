-- 025: Libro de reclamaciones virtual. Cada hoja registrada recibe un código (LR-AÑO-000001) que se le entrega
-- al consumidor. El reclamo es la disconformidad con el servicio; la queja, con la atención recibida.
CREATE SEQUENCE IF NOT EXISTS seq_codigo_reclamo START 1;

CREATE TABLE IF NOT EXISTS reclamo (
    id_reclamo      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo          VARCHAR(20)   NOT NULL UNIQUE,
    tipo            VARCHAR(10)   NOT NULL,                   -- 'RECLAMO' | 'QUEJA'
    nombres         VARCHAR(100)  NOT NULL,
    apellidos       VARCHAR(100)  NOT NULL,
    tipo_documento  VARCHAR(10)   NOT NULL,                   -- 'DNI' | 'CE' | 'PASAPORTE'
    documento       VARCHAR(15)   NOT NULL,
    correo          VARCHAR(150)  NOT NULL,
    telefono        VARCHAR(20),
    direccion       VARCHAR(200)  NOT NULL,
    servicio        VARCHAR(100)  NOT NULL DEFAULT 'Plataforma LegadoSeguro',
    monto           NUMERIC(10,2),                            -- monto reclamado, si lo hay
    detalle         TEXT          NOT NULL,
    pedido          TEXT          NOT NULL,                   -- lo que el consumidor pide como solución
    estado          VARCHAR(20)   NOT NULL DEFAULT 'REGISTRADO',  -- 'REGISTRADO' | 'EN_PROCESO' | 'RESUELTO'
    respuesta       TEXT,
    fecha_registro  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    fecha_respuesta TIMESTAMPTZ,
    ip_origen       VARCHAR(45)
);
