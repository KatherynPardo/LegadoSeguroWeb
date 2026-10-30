-- 001_esquema_inicial.sql
-- LegadoSeguro: esquema de la base de datos (24 tablas) en PostgreSQL / Supabase.
-- Modelo entidad-relación de 24 entidades adaptado desde SQL Server.
--
-- Cómo ejecutarlo: Supabase -> SQL Editor -> New query -> pegar todo -> Run.
-- Orden de ejecución: 001, 002, 003 y 004 (cada archivo depende del anterior).
--
-- Cambios respecto al script original de SQL Server:
--   INT IDENTITY(1,1)   -> INT GENERATED ALWAYS AS IDENTITY
--   NVARCHAR(n)         -> VARCHAR(n)      NVARCHAR(MAX) -> TEXT
--   DATETIME2           -> TIMESTAMPTZ     SYSDATETIME() -> NOW()
--   BIT / DEFAULT 0     -> BOOLEAN / DEFAULT FALSE
--   [PLAN]              -> plan

-- 1. TABLAS ---------------------------------------------------------------

-- Usuarios y seguridad

CREATE TABLE rol (
    id_rol      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL,
    descripcion VARCHAR(200),
    estado      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO'
);

CREATE TABLE usuario (
    id_usuario      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_rol          INT NOT NULL,
    nombres         VARCHAR(100) NOT NULL,
    apellidos       VARCHAR(100) NOT NULL,
    dni             VARCHAR(15)  NOT NULL,
    correo          VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    telefono        VARCHAR(20),
    fecha_registro  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    estado          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
);

CREATE TABLE token_recuperacion (
    id_token          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario        INT NOT NULL,
    token_hash        VARCHAR(255) NOT NULL,
    fecha_generacion  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    fecha_expiracion  TIMESTAMPTZ  NOT NULL,
    usado             BOOLEAN      NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_token_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Activos y beneficiarios

CREATE TABLE tipo_activo (
    id_tipo                INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre                 VARCHAR(80) NOT NULL,
    categoria_sensibilidad VARCHAR(20) NOT NULL  -- 'BAJA' | 'FINANCIERA'
);

CREATE TABLE activo_digital (
    id_activo            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario           INT NOT NULL,
    id_tipo              INT NOT NULL,
    nombre               VARCHAR(150) NOT NULL,
    descripcion          VARCHAR(300),
    ubicacion_referencia VARCHAR(200),
    estado               VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    fecha_registro       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_activo_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_activo_tipo    FOREIGN KEY (id_tipo)    REFERENCES tipo_activo(id_tipo)
);

CREATE TABLE beneficiario (
    id_beneficiario        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario_propietario INT NOT NULL,
    nombres                VARCHAR(100) NOT NULL,
    apellidos              VARCHAR(100) NOT NULL,
    dni                    VARCHAR(15)  NOT NULL,
    correo                 VARCHAR(150) NOT NULL,
    telefono               VARCHAR(20),
    parentesco             VARCHAR(50),
    clave_acceso_hash      VARCHAR(255) NOT NULL,
    estado                 VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT fk_beneficiario_usuario FOREIGN KEY (id_usuario_propietario) REFERENCES usuario(id_usuario)
);

CREATE TABLE activo_beneficiario (
    id_activo       INT NOT NULL,
    id_beneficiario INT NOT NULL,
    prioridad       INT NOT NULL DEFAULT 1,
    estado          VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT pk_activo_beneficiario PRIMARY KEY (id_activo, id_beneficiario),
    CONSTRAINT fk_ab_activo       FOREIGN KEY (id_activo)       REFERENCES activo_digital(id_activo),
    CONSTRAINT fk_ab_beneficiario FOREIGN KEY (id_beneficiario) REFERENCES beneficiario(id_beneficiario)
);

CREATE TABLE validador_externo (
    id_validador           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario_propietario INT NOT NULL,
    nombres                VARCHAR(100) NOT NULL,
    correo                 VARCHAR(150) NOT NULL,
    telefono               VARCHAR(20),
    estado                 VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT fk_validador_usuario FOREIGN KEY (id_usuario_propietario) REFERENCES usuario(id_usuario)
);

-- Reglas y monitoreo

CREATE TABLE regla_liberacion (
    id_regla            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario          INT NOT NULL,
    dias_inactividad    INT NOT NULL,
    min_confirmaciones  INT NOT NULL DEFAULT 1,
    dias_periodo_espera INT NOT NULL,
    requiere_validador  BOOLEAN NOT NULL DEFAULT FALSE,
    estado              VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    CONSTRAINT fk_regla_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE actividad_usuario (
    id_actividad     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario       INT NOT NULL,
    fecha_actividad  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    tipo_evento      VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_actividad_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Proceso de liberación

CREATE TABLE reporte_fallecimiento (
    id_reporte                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_beneficiario_reportante INT NOT NULL,
    id_usuario_revisor         INT,
    fecha_reporte              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    documentacion_adjunta      VARCHAR(300),
    estado                     VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
    fecha_revision             TIMESTAMPTZ,
    CONSTRAINT fk_reporte_beneficiario FOREIGN KEY (id_beneficiario_reportante) REFERENCES beneficiario(id_beneficiario),
    CONSTRAINT fk_reporte_revisor      FOREIGN KEY (id_usuario_revisor)         REFERENCES usuario(id_usuario)
);

CREATE TABLE proceso_liberacion (
    id_proceso             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario_propietario INT NOT NULL,
    id_regla               INT NOT NULL,
    id_reporte_origen      INT,
    fecha_inicio           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin              TIMESTAMPTZ,
    estado                 VARCHAR(30) NOT NULL DEFAULT 'DETECTADO',
    motivo                 VARCHAR(200),
    CONSTRAINT fk_proceso_usuario FOREIGN KEY (id_usuario_propietario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_proceso_regla   FOREIGN KEY (id_regla)               REFERENCES regla_liberacion(id_regla),
    CONSTRAINT fk_proceso_reporte FOREIGN KEY (id_reporte_origen)      REFERENCES reporte_fallecimiento(id_reporte)
);

CREATE TABLE proceso_activo (
    id_proceso INT NOT NULL,
    id_activo  INT NOT NULL,
    estado     VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT pk_proceso_activo PRIMARY KEY (id_proceso, id_activo),
    CONSTRAINT fk_pa_proceso FOREIGN KEY (id_proceso) REFERENCES proceso_liberacion(id_proceso),
    CONSTRAINT fk_pa_activo  FOREIGN KEY (id_activo)  REFERENCES activo_digital(id_activo)
);

CREATE TABLE confirmacion_beneficiario (
    id_confirmacion INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_proceso      INT NOT NULL,
    id_activo       INT NOT NULL,
    id_beneficiario INT NOT NULL,
    resultado       VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    fecha           TIMESTAMPTZ,
    CONSTRAINT fk_conf_proceso      FOREIGN KEY (id_proceso)      REFERENCES proceso_liberacion(id_proceso),
    CONSTRAINT fk_conf_activo       FOREIGN KEY (id_activo)       REFERENCES activo_digital(id_activo),
    CONSTRAINT fk_conf_beneficiario FOREIGN KEY (id_beneficiario) REFERENCES beneficiario(id_beneficiario)
);

CREATE TABLE validacion_externa (
    id_validacion INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_proceso    INT NOT NULL,
    id_validador  INT NOT NULL,
    resultado     VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    fecha         TIMESTAMPTZ,
    observacion   VARCHAR(300),
    CONSTRAINT fk_ve_proceso   FOREIGN KEY (id_proceso)   REFERENCES proceso_liberacion(id_proceso),
    CONSTRAINT fk_ve_validador FOREIGN KEY (id_validador) REFERENCES validador_externo(id_validador)
);

CREATE TABLE objecion (
    id_objecion      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_proceso       INT NOT NULL,
    id_beneficiario  INT,
    id_usuario       INT,
    motivo           VARCHAR(300) NOT NULL,
    estado           VARCHAR(20)  NOT NULL DEFAULT 'ABIERTA',
    fecha            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    fecha_resolucion TIMESTAMPTZ,
    CONSTRAINT fk_obj_proceso      FOREIGN KEY (id_proceso)      REFERENCES proceso_liberacion(id_proceso),
    CONSTRAINT fk_obj_beneficiario FOREIGN KEY (id_beneficiario) REFERENCES beneficiario(id_beneficiario),
    CONSTRAINT fk_obj_usuario      FOREIGN KEY (id_usuario)      REFERENCES usuario(id_usuario)
);

CREATE TABLE entrega (
    id_entrega         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_proceso         INT NOT NULL,
    id_activo          INT NOT NULL,
    id_beneficiario    INT NOT NULL,
    token_acceso_hash  VARCHAR(255) NOT NULL,
    estado             VARCHAR(20)  NOT NULL DEFAULT 'AUTORIZADA',
    fecha_autorizacion TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    fecha_acceso       TIMESTAMPTZ,
    CONSTRAINT fk_ent_proceso      FOREIGN KEY (id_proceso)      REFERENCES proceso_liberacion(id_proceso),
    CONSTRAINT fk_ent_activo       FOREIGN KEY (id_activo)       REFERENCES activo_digital(id_activo),
    CONSTRAINT fk_ent_beneficiario FOREIGN KEY (id_beneficiario) REFERENCES beneficiario(id_beneficiario)
);

-- Orientación legal

CREATE TABLE guia_legal (
    id_guia             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tema                VARCHAR(150) NOT NULL,
    contenido           TEXT         NOT NULL,
    version             INT          NOT NULL DEFAULT 1,
    fecha_actualizacion TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE orientacion_legal_generada (
    id_orientacion      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_proceso          INT NOT NULL,
    id_activo           INT NOT NULL,
    id_guia             INT NOT NULL,
    entidad_referencial VARCHAR(150),
    fecha_generacion    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_olg_proceso FOREIGN KEY (id_proceso) REFERENCES proceso_liberacion(id_proceso),
    CONSTRAINT fk_olg_activo  FOREIGN KEY (id_activo)  REFERENCES activo_digital(id_activo),
    CONSTRAINT fk_olg_guia    FOREIGN KEY (id_guia)    REFERENCES guia_legal(id_guia)
);

-- Notificaciones y auditoría

CREATE TABLE notificacion (
    id_notificacion              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_proceso                   INT,
    id_usuario_destinatario      INT,
    id_beneficiario_destinatario INT,
    canal                        VARCHAR(20)  NOT NULL,  -- 'CORREO' | 'SMS' | 'WHATSAPP'
    asunto                       VARCHAR(150),
    mensaje                      VARCHAR(500) NOT NULL,
    estado                       VARCHAR(20)  NOT NULL DEFAULT 'ENVIADA',
    fecha_envio                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notif_proceso      FOREIGN KEY (id_proceso)                   REFERENCES proceso_liberacion(id_proceso),
    CONSTRAINT fk_notif_usuario      FOREIGN KEY (id_usuario_destinatario)      REFERENCES usuario(id_usuario),
    CONSTRAINT fk_notif_beneficiario FOREIGN KEY (id_beneficiario_destinatario) REFERENCES beneficiario(id_beneficiario)
);

CREATE TABLE auditoria (
    id_auditoria INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario   INT,
    fecha        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    accion       VARCHAR(100) NOT NULL,
    entidad      VARCHAR(100),
    id_entidad   INT,
    descripcion  VARCHAR(300),
    CONSTRAINT fk_aud_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- Suscripciones y pagos

CREATE TABLE plan (
    id_plan     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre      VARCHAR(50)   NOT NULL,
    tipo        VARCHAR(20)   NOT NULL,  -- 'FREE' | 'PREMIUM'
    precio      NUMERIC(10,2) NOT NULL DEFAULT 0,
    descripcion VARCHAR(300),
    estado      VARCHAR(20)   NOT NULL DEFAULT 'ACTIVO'
);

CREATE TABLE suscripcion (
    id_suscripcion INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario     INT NOT NULL,
    id_plan        INT NOT NULL,
    fecha_inicio   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin      TIMESTAMPTZ,
    estado         VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    CONSTRAINT fk_susc_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_susc_plan    FOREIGN KEY (id_plan)    REFERENCES plan(id_plan)
);

CREATE TABLE pago (
    id_pago                 INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_suscripcion          INT NOT NULL,
    monto                   NUMERIC(10,2) NOT NULL,
    fecha_pago              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    estado                  VARCHAR(20)   NOT NULL DEFAULT 'COMPLETADO',
    referencia_pago_externa VARCHAR(100),
    CONSTRAINT fk_pago_suscripcion FOREIGN KEY (id_suscripcion) REFERENCES suscripcion(id_suscripcion)
);

