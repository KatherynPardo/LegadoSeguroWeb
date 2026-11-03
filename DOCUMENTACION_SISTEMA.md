# Documentación del desarrollo de LegadoSeguro

**Guía de documentación de proyectos web** · Del análisis a la puesta en marcha

> **Documento dinámico.** Se actualiza junto con el sistema:
> - El **diccionario de datos** (sección 2) se genera solo, leyendo la base de datos real. Para actualizarlo: `cd backend` y `npm run diccionario`.
> - Cada módulo nuevo se documenta con la misma plantilla de la sección 7.
> - Las capturas de pantalla se guardan en `docs/capturas/` (la lista de las que faltan está en `docs/capturas/LEEME.md`).
>
> Este documento sigue el esquema del curso. El archivo [MANUAL_CONSTRUCCION.md](MANUAL_CONSTRUCCION.md) queda como referencia técnica detallada y [AVANCES.md](AVANCES.md) como bitácora por fecha.

**Estado de este documento:** las secciones 0 a 11 y 13 a 15 están completas. La **sección 12 (Despliegue en Vercel)** y la **integración con Culqi** están **pendientes** porque todavía no se hicieron; se indican con claridad más abajo. Las capturas de pantalla se agregan en `docs/capturas/`.

---

## Índice

0. [Reglas de presentación](#0-reglas-de-presentación)
1. [Presentación y análisis del proyecto](#1-presentación-y-análisis-del-proyecto)
2. [Diseño del sistema](#2-diseño-del-sistema)
3. [Preparación del entorno de desarrollo](#3-preparación-del-entorno-de-desarrollo)
4. [Creación inicial del proyecto](#4-creación-inicial-del-proyecto)
5. [Git y GitHub](#5-git-y-github)
6. [Base de datos en Supabase](#6-base-de-datos-en-supabase)
7. [Desarrollo del sistema por módulos](#7-desarrollo-del-sistema-por-módulos)
8. [Integraciones externas](#8-integraciones-externas)
9. [Dashboard y reportes](#9-dashboard-y-reportes)
10. [Pruebas del sistema](#10-pruebas-del-sistema)
11. [Registro de errores y soluciones](#11-registro-de-errores-y-soluciones)
12. [Despliegue en Vercel](#12-despliegue-en-vercel)
13. [Puesta en marcha](#13-puesta-en-marcha)
14. [Manual de usuario](#14-manual-de-usuario)
15. [Instalación del proyecto en otra computadora](#15-instalación-del-proyecto-en-otra-computadora)
16. [Cierre del proyecto](#16-cierre-del-proyecto)
17. [Checklist final antes de entregar](#17-checklist-final-antes-de-entregar)

---

## 0. Reglas de presentación

- Cada procedimiento sigue el formato del curso: **Paso, Objetivo, Acción, Comando/código, Explicación, Evidencia, Resultado esperado, Error frecuente, Solución y Verificación**.
- Los comandos se escriben **uno por línea**: en PowerShell antiguo, `&&` no funciona.
- Las claves, contraseñas y tokens **no aparecen**: se muestran como `********` o `[TU-CLAVE]`.
- Los datos de prueba (por ejemplo `carlos.ramirez@example.com`) son ficticios.
- Las capturas se guardan en `docs/capturas/` con el nombre indicado en cada sección.

---

## 1. Presentación y análisis del proyecto

| | |
|---|---|
| **Sistema** | LegadoSeguro: plataforma web de gestión de legado y testamento digital |
| **Autora / grupo** | Katheryn Pardo Acosta · Curso JavaScript Avanzado (UTP, 2026-02) |
| **Problema que resuelve** | Cuando una persona fallece o deja de estar disponible, sus cuentas, correos y datos digitales (incluidos los bancarios) quedan inaccesibles para su familia, o se pierden. No hay una forma ordenada, segura y legal de decidir de antemano quién recibe qué. |
| **Usuarios principales** | El **propietario** (quien registra su legado), el **heredero** (quien lo recibe) y el **administrador** de la plataforma. |

**Objetivo general.** Permitir que el propietario registre sus activos digitales, designe herederos verificados y defina reglas para entregarlos solo cuando realmente corresponda, con trazabilidad y datos protegidos.

**Alcance**

| Incluye | No incluye (por ahora) |
|---|---|
| Registro e ingreso de usuarios con verificación de correo por código | Cobro real de planes con Culqi |
| Activos digitales con tipo, banco, monto cifrado e historial | Despliegue público en Vercel |
| Herederos verificados por código, con checklist de documentos | Subida de archivos (DNI, certificados) |
| Regla de liberación configurable y procesos de liberación automáticos | Comparación facial automática de la selfie |
| Planes con límite de herederos | Notificaciones por SMS o llamada |
| Dashboard, reportes, historial y auditoría | Aplicación móvil |
| Portal del heredero (ingreso por código) | |

### Requerimientos funcionales

| Código | Requerimiento |
|---|---|
| RF-01 | El usuario puede registrarse (con su DNI validado en RENIEC), confirmar su correo con un código e iniciar y cerrar sesión. |
| RF-02 | El usuario puede recuperar su contraseña con un código enviado a su correo. |
| RF-03 | El propietario puede registrar, listar, editar y eliminar activos digitales, indicando tipo, banco y (opcionalmente) el monto. |
| RF-04 | El propietario puede designar, editar y eliminar herederos; cada heredero se verifica con un código enviado a su correo. |
| RF-05 | El propietario puede asignar uno o varios herederos a cada activo. |
| RF-06 | El propietario define su regla de liberación: días de inactividad, confirmaciones mínimas, espera final y validador externo. |
| RF-07 | El sistema detecta la inactividad y abre automáticamente un proceso de liberación; el propietario puede cancelarlo. |
| RF-08 | El administrador mantiene el catálogo de documentos que se piden a los herederos; el propietario elige cuáles aplican a cada heredero. |
| RF-09 | El heredero ingresa a su portal con un código y marca los documentos que ya reunió. |
| RF-10 | El sistema ofrece un plan Básico gratuito (2 herederos) y avisa cuándo mejorar de plan. |
| RF-11 | El propietario consulta su dashboard, sus reportes y su historial. |
| RF-12 | El administrador consulta los usuarios y la auditoría, y puede activar o desactivar cuentas. |

### Requerimientos no funcionales

| Código | Requerimiento | Cómo se cumple |
|---|---|---|
| RNF-01 | Seguridad de contraseñas | bcrypt (no se puede descifrar) |
| RNF-02 | Seguridad de datos sensibles | Descripción, montos e historial de montos cifrados con AES-256-GCM |
| RNF-03 | Sesiones seguras | JWT de 8 horas; el heredero usa un token distinto que no sirve en las pantallas del propietario |
| RNF-04 | Protección contra abuso | Límite de consultas por minuto en las rutas públicas |
| RNF-05 | Trazabilidad | Auditoría con usuario, acción, fecha e IP |
| RNF-06 | Integridad de datos | Llaves foráneas y restricciones (`CHECK`, `UNIQUE`) en la propia base |
| RNF-07 | Diseño responsive | Bootstrap y reglas propias para pantallas pequeñas (verificación pendiente, ver sección 10) |
| RNF-08 | Usabilidad | Interfaz basada en el diseño de Figma, con mensajes de error claros |

### Roles de usuario

| Rol | Funciones principales | Restricciones |
|---|---|---|
| **ADMINISTRADOR** | Ver y activar o desactivar usuarios; ver la auditoría; mantener el catálogo de documentos | No puede desactivar su propia cuenta |
| **PROPIETARIO** (benefactor) | Gestionar sus activos, herederos, regla, procesos, plan, reportes e historial | Solo ve y modifica **sus** datos; el plan Básico permite hasta 2 herederos |
| **BENEFICIARIO** (heredero) | Entrar al portal y ver y marcar su checklist de documentos | Solo si su correo fue verificado; no ve nada del propietario salvo su nombre y su propia lista |

---

## 2. Diseño del sistema

### 2.1 Modelo entidad-relación

El modelo tiene **32 tablas** organizadas en módulos:

| Módulo | Tablas |
|---|---|
| Usuarios y seguridad | `rol`, `usuario`, `token_recuperacion`, `actividad_usuario`, `auditoria`, `codigo_verificacion` |
| Activos y herederos | `tipo_activo`, `activo_digital`, `beneficiario`, `activo_beneficiario`, `validador_externo`, `entidad_financiera`, `historial_monto`, `requisito_documental`, `requisito_tipo`, `documento_heredero`, `detalle_tarjeta` |
| Regla y proceso de liberación | `verificacion_beneficiario`, `regla_liberacion`, `reporte_fallecimiento`, `proceso_liberacion`, `proceso_activo`, `confirmacion_beneficiario`, `validacion_externa`, `objecion`, `entrega` |
| Orientación legal y notificaciones | `guia_legal`, `orientacion_legal_generada`, `notificacion` |
| Suscripciones y pagos | `plan`, `suscripcion`, `pago` |

Las 24 tablas originales se crearon en la primera migración; las otras 8 se agregaron al construir cada función nueva (`entidad_financiera`, `historial_monto`, `codigo_verificacion`, `requisito_documental`, `documento_heredero`, `verificacion_beneficiario`, `requisito_tipo`, `detalle_tarjeta`). Cada cambio quedó como una migración numerada en `supabase/migrations/`.

El diagrama entidad-relación por módulos está en Lucidchart (ver el enlace en la presentación del proyecto). Las relaciones, con sus cardinalidades, se listan al final del diccionario de datos (2.2), generadas desde la base real.

![Modelo entidad-relación](docs/capturas/02-modelo-er.png)

### 2.2 Diccionario de datos

Se genera automáticamente. Si cambia la base de datos, se ejecuta `npm run diccionario` en la carpeta `backend` y esta sección se reescribe sola.

<!-- DICCIONARIO:INICIO -->

**Generado automáticamente desde la base de datos el 3/11/2026** · 32 tablas.

#### actividad_usuario

Cada ingreso o registro de un usuario, con la IP. El monitoreo de inactividad lee esta tabla.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_actividad | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_usuario | INT | FK → usuario | NOT NULL | Referencia a usuario. |
| fecha_actividad | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora del evento. |
| tipo_evento | VARCHAR(50) | — | NOT NULL | Tipo de evento (INICIO_SESION, REGISTRO...). |
| ip_origen | VARCHAR(45) | — | Puede ser vacío | Dirección IP desde la que se hizo la acción. |

#### activo_beneficiario

Qué heredero recibe cada activo y con qué prioridad (relación muchos a muchos).

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_activo | INT | PK, FK → activo_digital | NOT NULL | Referencia a activo_digital. |
| id_beneficiario | INT | PK, FK → beneficiario | NOT NULL | Referencia a beneficiario. |
| prioridad | INT | — | NOT NULL; Por defecto 1 | Orden de prioridad del heredero en el activo. |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ACTIVO' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |

#### activo_digital

Cada activo digital del propietario: cuenta, correo, red social, cuenta bancaria, etc.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_activo | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_usuario | INT | FK → usuario | NOT NULL | Referencia a usuario. |
| id_tipo | INT | FK → tipo_activo | NOT NULL | Referencia a tipo_activo. |
| nombre | VARCHAR(150) | — | NOT NULL | Nombre. |
| descripcion | TEXT | — | Puede ser vacío | Texto descriptivo (en activo_digital va cifrado). |
| ubicacion_referencia | VARCHAR(200) | — | Puede ser vacío | Referencia de dónde está el activo. |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ACTIVO' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |
| fecha_registro | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora de creación. |
| id_entidad | INT | FK → entidad_financiera | Puede ser vacío | Referencia a entidad_financiera. |
| moneda | VARCHAR(3) | — | Puede ser vacío; CHECK (((moneda)= ANY ((ARRAY['PEN', 'USD'])[]))) | PEN (soles) o USD (dólares). |
| monto | NUMERIC(14,2) | — | Puede ser vacío; CHECK ((monto >= (0))) | Monto sin cifrar (queda vacío: el monto va en monto_cifrado). |
| registrar_monto | BOOLEAN | — | NOT NULL; Por defecto false | Si el usuario decidió registrar el monto del activo. |
| monto_cifrado | TEXT | — | Puede ser vacío | Monto cifrado con AES-256. |
| indicaciones_cifradas | TEXT | — | Puede ser vacío | — |

#### auditoria

Registro de acciones importantes: quién, qué, cuándo y desde qué IP.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_auditoria | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_usuario | INT | FK → usuario | Puede ser vacío | Referencia a usuario. |
| fecha | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora del hecho. |
| accion | VARCHAR(100) | — | NOT NULL | Acción realizada. |
| entidad | VARCHAR(100) | — | Puede ser vacío | Tabla o entidad afectada. |
| id_entidad | INT | — | Puede ser vacío | — |
| descripcion | VARCHAR(300) | — | Puede ser vacío | Texto descriptivo (en activo_digital va cifrado). |
| ip_origen | VARCHAR(45) | — | Puede ser vacío | Dirección IP desde la que se hizo la acción. |

#### beneficiario

Herederos designados por cada propietario.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_beneficiario | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_usuario_propietario | INT | FK → usuario | NOT NULL | Referencia a usuario. |
| nombres | VARCHAR(100) | — | NOT NULL | Nombres de la persona. |
| apellidos | VARCHAR(100) | — | NOT NULL | Apellidos de la persona. |
| dni | VARCHAR(15) | — | NOT NULL | Documento de identidad (8 dígitos). |
| correo | VARCHAR(150) | — | NOT NULL | Correo electrónico. |
| telefono | VARCHAR(20) | — | Puede ser vacío | Teléfono de contacto (9 dígitos). |
| parentesco | VARCHAR(50) | — | Puede ser vacío | Relación con el propietario. |
| clave_acceso_hash | VARCHAR(255) | — | Puede ser vacío | Ya no se usa: el heredero entra con códigos por correo. |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ACTIVO' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |
| correo_verificado | BOOLEAN | — | NOT NULL; Por defecto false | Si el heredero confirmó su correo con un código. |

#### codigo_verificacion

Códigos de 6 dígitos enviados por correo (registro, herederos, recuperación y portal).

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_codigo | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| proposito | VARCHAR(30) | — | NOT NULL | Para qué es el código (REGISTRO, HEREDERO, RECUPERACION o PORTAL). |
| destino | VARCHAR(150) | — | NOT NULL | Correo al que se envió el código. |
| id_usuario | INT | FK → usuario | Puede ser vacío | Referencia a usuario. |
| codigo_hash | VARCHAR(255) | — | NOT NULL | Código de 6 dígitos cifrado. |
| fecha_creacion | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora de creación. |
| fecha_expiracion | TIMESTAMPTZ | — | NOT NULL | Fecha y hora en que vence. |
| intentos | INT | — | NOT NULL; Por defecto 0 | Intentos fallidos (máximo 5). |
| usado | BOOLEAN | — | NOT NULL; Por defecto false | Si ya se usó o se reemplazó. |

#### confirmacion_beneficiario

Respuesta de cada heredero a la solicitud de confirmación de un proceso.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_confirmacion | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_proceso | INT | FK → proceso_liberacion | NOT NULL | Referencia a proceso_liberacion. |
| id_activo | INT | FK → activo_digital | NOT NULL | Referencia a activo_digital. |
| id_beneficiario | INT | FK → beneficiario | NOT NULL | Referencia a beneficiario. |
| resultado | VARCHAR(20) | — | NOT NULL; Por defecto 'PENDIENTE' | Resultado de la acción. |
| fecha | TIMESTAMPTZ | — | Puede ser vacío | Fecha y hora del hecho. |

#### detalle_tarjeta



| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_activo | INT | PK, FK → activo_digital | NOT NULL | Referencia a activo_digital. |
| ultimos4 | VARCHAR(4) | — | NOT NULL; CHECK (((ultimos4)~ '^[0-9]{4}$')) | — |
| linea_credito_cifrada | TEXT | — | Puede ser vacío | — |
| dia_pago | INT2 | — | Puede ser vacío; CHECK (((dia_pago >= 1) AND (dia_pago <= 31))) | — |
| dia_cierre | INT2 | — | Puede ser vacío; CHECK (((dia_cierre >= 1) AND (dia_cierre <= 31))) | — |

#### documento_heredero

Checklist de cada heredero: qué documento, en qué estado y dónde está el original.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_documento | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_beneficiario | INT | FK → beneficiario | NOT NULL | Referencia a beneficiario. |
| id_requisito | INT | FK → requisito_documental | NOT NULL | Referencia a requisito_documental. |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'PENDIENTE'; CHECK (((estado)= ANY ((ARRAY['PENDIENTE', 'ENTREGADO'])[]))) | Estado del registro (por ejemplo ACTIVO o INACTIVO). |
| ubicacion | VARCHAR(200) | — | Puede ser vacío | Dónde está el original del documento (nota del propietario). |
| fecha_entrega | TIMESTAMPTZ | — | Puede ser vacío | Fecha y hora en que se marcó como entregado. |

Valores únicos adicionales: (id_beneficiario, id_requisito).

#### entidad_financiera

Catálogo de bancos; los de fábrica son de todos y los creados por un usuario, solo suyos.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_entidad | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_usuario_creador | INT | FK → usuario | Puede ser vacío | Referencia a usuario. |
| nombre | VARCHAR(100) | — | NOT NULL | Nombre. |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ACTIVO' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |

Valores únicos adicionales: (lower((nombre)::text)).

#### entrega

Entrega de cada activo a su heredero, con el acceso autorizado.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_entrega | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_proceso | INT | FK → proceso_liberacion | NOT NULL | Referencia a proceso_liberacion. |
| id_activo | INT | FK → activo_digital | NOT NULL | Referencia a activo_digital. |
| id_beneficiario | INT | FK → beneficiario | NOT NULL | Referencia a beneficiario. |
| token_acceso_hash | VARCHAR(255) | — | NOT NULL | Token de acceso cifrado. |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'AUTORIZADA' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |
| fecha_autorizacion | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora en que se autorizó el acceso. |
| fecha_acceso | TIMESTAMPTZ | — | Puede ser vacío | Fecha y hora del primer acceso. |

#### guia_legal

Textos de orientación legal para guiar a los herederos.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_guia | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| tema | VARCHAR(150) | — | NOT NULL | Tema de la guía. |
| contenido | TEXT | — | NOT NULL | Texto completo. |
| version | INT | — | NOT NULL; Por defecto 1 | Número de versión. |
| fecha_actualizacion | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora de la última actualización. |

#### historial_monto

Cada cambio de monto de un activo, con fecha, usuario e IP.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_historial | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_activo | INT | FK → activo_digital | NOT NULL | Referencia a activo_digital. |
| monto | NUMERIC(14,2) | — | Puede ser vacío | Monto sin cifrar (queda vacío: el monto va en monto_cifrado). |
| moneda | VARCHAR(3) | — | NOT NULL | PEN (soles) o USD (dólares). |
| fecha | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora del hecho. |
| id_usuario | INT | FK → usuario | Puede ser vacío | Referencia a usuario. |
| ip_origen | VARCHAR(45) | — | Puede ser vacío | Dirección IP desde la que se hizo la acción. |
| monto_cifrado | TEXT | — | Puede ser vacío | Monto cifrado con AES-256. |

#### notificacion

Mensajes enviados a propietarios o herederos durante un proceso.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_notificacion | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_proceso | INT | FK → proceso_liberacion | Puede ser vacío | Referencia a proceso_liberacion. |
| id_usuario_destinatario | INT | FK → usuario | Puede ser vacío | Referencia a usuario. |
| id_beneficiario_destinatario | INT | FK → beneficiario | Puede ser vacío | Referencia a beneficiario. |
| canal | VARCHAR(20) | — | NOT NULL | Canal de envío (correo, SMS, llamada...). |
| asunto | VARCHAR(150) | — | Puede ser vacío | Asunto del mensaje. |
| mensaje | VARCHAR(500) | — | NOT NULL | Contenido del mensaje. |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ENVIADA' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |
| fecha_envio | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora de envío. |

#### objecion

Objeciones presentadas durante un proceso (por un heredero o por el propietario).

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_objecion | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_proceso | INT | FK → proceso_liberacion | NOT NULL | Referencia a proceso_liberacion. |
| id_beneficiario | INT | FK → beneficiario | Puede ser vacío | Referencia a beneficiario. |
| id_usuario | INT | FK → usuario | Puede ser vacío | Referencia a usuario. |
| motivo | VARCHAR(300) | — | NOT NULL | Motivo o razón. |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ABIERTA' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |
| fecha | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora del hecho. |
| fecha_resolucion | TIMESTAMPTZ | — | Puede ser vacío | Fecha y hora de resolución. |

#### orientacion_legal_generada

Qué guía legal se entregó por cada activo en un proceso.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_orientacion | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_proceso | INT | FK → proceso_liberacion | NOT NULL | Referencia a proceso_liberacion. |
| id_activo | INT | FK → activo_digital | NOT NULL | Referencia a activo_digital. |
| id_guia | INT | FK → guia_legal | NOT NULL | Referencia a guia_legal. |
| entidad_referencial | VARCHAR(150) | — | Puede ser vacío | Entidad a la que acudir. |
| fecha_generacion | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora de generación. |

#### pago

Pagos de las suscripciones (se llenará al conectar Culqi).

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_pago | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_suscripcion | INT | FK → suscripcion | NOT NULL | Referencia a suscripcion. |
| monto | NUMERIC(10,2) | — | NOT NULL | Monto sin cifrar (queda vacío: el monto va en monto_cifrado). |
| fecha_pago | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora del pago. |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'COMPLETADO' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |
| referencia_pago_externa | VARCHAR(100) | — | Puede ser vacío | Código de operación de la pasarela de pago (Culqi). |

#### plan

Planes de suscripción (Básico gratuito y Premium) y su límite de herederos.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_plan | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| nombre | VARCHAR(50) | — | NOT NULL | Nombre. |
| tipo | VARCHAR(20) | — | NOT NULL | Tipo (FREE o PREMIUM en los planes). |
| precio | NUMERIC(10,2) | — | NOT NULL; Por defecto 0 | Precio mensual en soles. |
| descripcion | VARCHAR(300) | — | Puede ser vacío | Texto descriptivo (en activo_digital va cifrado). |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ACTIVO' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |
| limite_herederos | INT | — | Puede ser vacío | Máximo de herederos del plan (vacío = ilimitado). |

#### proceso_activo

Activos que entran a un proceso de liberación.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_proceso | INT | PK, FK → proceso_liberacion | NOT NULL | Referencia a proceso_liberacion. |
| id_activo | INT | PK, FK → activo_digital | NOT NULL | Referencia a activo_digital. |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'PENDIENTE' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |

#### proceso_liberacion

Cada proceso de entrega del legado, desde que se detecta hasta que termina.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_proceso | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_usuario_propietario | INT | FK → usuario | NOT NULL | Referencia a usuario. |
| id_regla | INT | FK → regla_liberacion | NOT NULL | Referencia a regla_liberacion. |
| id_reporte_origen | INT | FK → reporte_fallecimiento | Puede ser vacío | Referencia a reporte_fallecimiento. |
| fecha_inicio | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora de inicio. |
| fecha_fin | TIMESTAMPTZ | — | Puede ser vacío | Fecha y hora de fin (vacío = sigue abierto). |
| estado | VARCHAR(30) | — | NOT NULL; Por defecto 'DETECTADO' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |
| motivo | VARCHAR(200) | — | Puede ser vacío | Motivo o razón. |
| fecha_espera | TIMESTAMPTZ | — | Puede ser vacío | — |

#### regla_liberacion

Cuándo y cómo se libera el legado: días de inactividad, confirmaciones y espera.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_regla | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_usuario | INT | FK → usuario | NOT NULL | Referencia a usuario. |
| dias_inactividad | INT | — | NOT NULL; CHECK (((dias_inactividad >= 7) AND (dias_inactividad <= 3650))) | Días sin actividad antes de iniciar el proceso (7 a 3650). |
| min_confirmaciones | INT | — | NOT NULL; Por defecto 1 | Herederos que deben confirmar como mínimo. |
| dias_periodo_espera | INT | — | NOT NULL | Días de espera final antes de liberar. |
| requiere_validador | BOOLEAN | — | NOT NULL; Por defecto false | Si se exige validador externo para activos financieros. |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ACTIVA' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |

#### reporte_fallecimiento

Aviso de fallecimiento hecho por un beneficiario (segundo disparador del proceso).

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_reporte | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_beneficiario_reportante | INT | FK → beneficiario | NOT NULL | Referencia a beneficiario. |
| id_usuario_revisor | INT | FK → usuario | Puede ser vacío | Referencia a usuario. |
| fecha_reporte | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora del reporte. |
| documentacion_adjunta | VARCHAR(300) | — | Puede ser vacío | Referencia a la documentación presentada. |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'PENDIENTE' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |
| fecha_revision | TIMESTAMPTZ | — | Puede ser vacío | Fecha y hora de la revisión. |

#### requisito_documental

Catálogo de documentos que debe reunir un heredero (lo mantiene el administrador).

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_requisito | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| nombre | VARCHAR(150) | — | NOT NULL | Nombre. |
| descripcion | VARCHAR(300) | — | Puede ser vacío | Texto descriptivo (en activo_digital va cifrado). |
| obligatorio | BOOLEAN | — | NOT NULL; Por defecto false | Si el documento se asigna a todos los herederos. |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ACTIVO' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |

Valores únicos adicionales: (lower((nombre)::text)).

#### requisito_tipo



| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_requisito | INT | PK, FK → requisito_documental | NOT NULL | Referencia a requisito_documental. |
| id_tipo | INT | PK, FK → tipo_activo | NOT NULL | Referencia a tipo_activo. |

#### rol

Perfiles del sistema: administrador, propietario y beneficiario.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_rol | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| nombre | VARCHAR(50) | — | NOT NULL | Nombre. |
| descripcion | VARCHAR(200) | — | Puede ser vacío | Texto descriptivo (en activo_digital va cifrado). |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ACTIVO' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |

#### suscripcion

Plan que tiene o tuvo cada usuario.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_suscripcion | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_usuario | INT | FK → usuario | NOT NULL | Referencia a usuario. |
| id_plan | INT | FK → plan | NOT NULL | Referencia a plan. |
| fecha_inicio | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora de inicio. |
| fecha_fin | TIMESTAMPTZ | — | Puede ser vacío | Fecha y hora de fin (vacío = sigue abierto). |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ACTIVA' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |

#### tipo_activo

Tipos de activo digital y su sensibilidad (BAJA o FINANCIERA).

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_tipo | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| nombre | VARCHAR(80) | — | NOT NULL | Nombre. |
| categoria_sensibilidad | VARCHAR(20) | — | NOT NULL | BAJA o FINANCIERA. |
| requiere_entidad | BOOLEAN | — | NOT NULL; Por defecto false | Si el tipo de activo exige elegir un banco. |
| es_tarjeta | BOOLEAN | — | NOT NULL; Por defecto false | — |
| es_credito | BOOLEAN | — | NOT NULL; Por defecto false | — |
| guia_indicaciones | VARCHAR(300) | — | Puede ser vacío | — |

#### token_recuperacion

Reservada para enlaces de recuperación; hoy la recuperación usa codigo_verificacion.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_token | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_usuario | INT | FK → usuario | NOT NULL | Referencia a usuario. |
| token_hash | VARCHAR(255) | — | NOT NULL | Token cifrado. |
| fecha_generacion | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora de generación. |
| fecha_expiracion | TIMESTAMPTZ | — | NOT NULL | Fecha y hora en que vence. |
| usado | BOOLEAN | — | NOT NULL; Por defecto false | Si ya se usó o se reemplazó. |

#### usuario

Cuentas de quienes ingresan al sistema (propietarios y administradores).

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_usuario | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_rol | INT | FK → rol | NOT NULL | Referencia a rol. |
| nombres | VARCHAR(100) | — | NOT NULL | Nombres de la persona. |
| apellidos | VARCHAR(100) | — | NOT NULL | Apellidos de la persona. |
| dni | VARCHAR(15) | — | NOT NULL | Documento de identidad (8 dígitos). |
| correo | VARCHAR(150) | — | NOT NULL; UNIQUE | Correo electrónico. |
| password_hash | VARCHAR(255) | — | NOT NULL | Contraseña cifrada con bcrypt (nunca en texto plano). |
| telefono | VARCHAR(20) | — | Puede ser vacío | Teléfono de contacto (9 dígitos). |
| fecha_registro | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | Fecha y hora de creación. |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ACTIVO' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |
| ip_registro | VARCHAR(45) | — | Puede ser vacío | Dirección IP desde la que se creó la cuenta. |

#### validacion_externa

Resultado de la validación del validador externo en un proceso.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_validacion | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_proceso | INT | FK → proceso_liberacion | NOT NULL | Referencia a proceso_liberacion. |
| id_validador | INT | FK → validador_externo | NOT NULL | Referencia a validador_externo. |
| resultado | VARCHAR(20) | — | NOT NULL; Por defecto 'PENDIENTE' | Resultado de la acción. |
| fecha | TIMESTAMPTZ | — | Puede ser vacío | Fecha y hora del hecho. |
| observacion | VARCHAR(300) | — | Puede ser vacío | Observación. |

#### validador_externo

Persona de confianza que aprueba la liberación de activos financieros.

| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_validador | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_usuario_propietario | INT | FK → usuario | NOT NULL | Referencia a usuario. |
| nombres | VARCHAR(100) | — | NOT NULL | Nombres de la persona. |
| correo | VARCHAR(150) | — | NOT NULL | Correo electrónico. |
| telefono | VARCHAR(20) | — | Puede ser vacío | Teléfono de contacto (9 dígitos). |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ACTIVO' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |

#### verificacion_beneficiario



| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_proceso | INT | PK, FK → proceso_liberacion | NOT NULL | Referencia a proceso_liberacion. |
| id_beneficiario | INT | PK, FK → beneficiario | NOT NULL | Referencia a beneficiario. |
| dni_validado | BOOLEAN | — | NOT NULL; Por defecto false | — |
| fecha_dni | TIMESTAMPTZ | — | Puede ser vacío | — |
| selfie_cifrada | TEXT | — | Puede ser vacío | — |
| fecha_selfie | TIMESTAMPTZ | — | Puede ser vacío | — |

#### Relaciones entre tablas

Cada fila es una llave foránea. La cardinalidad se lee de la tabla padre (1) a la tabla hija (N).

| Tabla padre (1) | Tabla hija (N) | Campo de la hija | Cardinalidad |
|---|---|---|---|
| usuario | actividad_usuario | id_usuario | 1 : N |
| activo_digital | activo_beneficiario | id_activo | 1 : N |
| beneficiario | activo_beneficiario | id_beneficiario | 1 : N |
| entidad_financiera | activo_digital | id_entidad | 1 : N |
| tipo_activo | activo_digital | id_tipo | 1 : N |
| usuario | activo_digital | id_usuario | 1 : N |
| usuario | auditoria | id_usuario | 1 : N |
| usuario | beneficiario | id_usuario_propietario | 1 : N |
| usuario | codigo_verificacion | id_usuario | 1 : N |
| activo_digital | confirmacion_beneficiario | id_activo | 1 : N |
| beneficiario | confirmacion_beneficiario | id_beneficiario | 1 : N |
| proceso_liberacion | confirmacion_beneficiario | id_proceso | 1 : N |
| activo_digital | detalle_tarjeta | id_activo | 1 : 1 |
| beneficiario | documento_heredero | id_beneficiario | 1 : N |
| requisito_documental | documento_heredero | id_requisito | 1 : N |
| usuario | entidad_financiera | id_usuario_creador | 1 : N |
| activo_digital | entrega | id_activo | 1 : N |
| beneficiario | entrega | id_beneficiario | 1 : N |
| proceso_liberacion | entrega | id_proceso | 1 : N |
| activo_digital | historial_monto | id_activo | 1 : N |
| usuario | historial_monto | id_usuario | 1 : N |
| beneficiario | notificacion | id_beneficiario_destinatario | 1 : N |
| proceso_liberacion | notificacion | id_proceso | 1 : N |
| usuario | notificacion | id_usuario_destinatario | 1 : N |
| beneficiario | objecion | id_beneficiario | 1 : N |
| proceso_liberacion | objecion | id_proceso | 1 : N |
| usuario | objecion | id_usuario | 1 : N |
| activo_digital | orientacion_legal_generada | id_activo | 1 : N |
| guia_legal | orientacion_legal_generada | id_guia | 1 : N |
| proceso_liberacion | orientacion_legal_generada | id_proceso | 1 : N |
| suscripcion | pago | id_suscripcion | 1 : N |
| activo_digital | proceso_activo | id_activo | 1 : N |
| proceso_liberacion | proceso_activo | id_proceso | 1 : N |
| regla_liberacion | proceso_liberacion | id_regla | 1 : N |
| reporte_fallecimiento | proceso_liberacion | id_reporte_origen | 1 : N |
| usuario | proceso_liberacion | id_usuario_propietario | 1 : N |
| usuario | regla_liberacion | id_usuario | 1 : N |
| beneficiario | reporte_fallecimiento | id_beneficiario_reportante | 1 : N |
| usuario | reporte_fallecimiento | id_usuario_revisor | 1 : N |
| requisito_documental | requisito_tipo | id_requisito | 1 : N |
| tipo_activo | requisito_tipo | id_tipo | 1 : N |
| plan | suscripcion | id_plan | 1 : N |
| usuario | suscripcion | id_usuario | 1 : N |
| usuario | token_recuperacion | id_usuario | 1 : N |
| rol | usuario | id_rol | 1 : N |
| proceso_liberacion | validacion_externa | id_proceso | 1 : N |
| validador_externo | validacion_externa | id_validador | 1 : N |
| usuario | validador_externo | id_usuario_propietario | 1 : N |
| beneficiario | verificacion_beneficiario | id_beneficiario | 1 : N |
| proceso_liberacion | verificacion_beneficiario | id_proceso | 1 : N |

<!-- DICCIONARIO:FIN -->

### 2.3 Arquitectura y tecnologías

```
Usuario ──► Frontend (Angular, puerto 4200) ──HTTP/JSON──► Backend / API (Express, puerto 5000) ──SQL──► Base de datos (Supabase PostgreSQL)
                                                                       │
                                                                       └──► Servicios externos: apiperu.dev (DNI), correo SMTP, (Culqi: pendiente)
```

| Capa | Tecnología | Para qué se usa |
|---|---|---|
| Interfaz | Angular 22 (componentes independientes y signals) + Bootstrap | Pantallas y formularios |
| API | Node.js + Express + TypeScript | Reglas de negocio y seguridad |
| Base de datos | Supabase (PostgreSQL) | Almacenamiento |
| Contraseñas | bcryptjs | Cifrado irreversible |
| Datos sensibles | AES-256-GCM (módulo `crypto` de Node) | Cifrado reversible con llave |
| Sesiones | jsonwebtoken (JWT) | Identificar al usuario en cada pedido |
| Correos | nodemailer | Códigos de verificación |
| DNI | apiperu.dev (a través del backend) | Validar nombres con RENIEC |

**Decisión de diseño:** Angular **nunca** habla con la base de datos. Solo el backend tiene las credenciales, y valida el rol de quien hace cada pedido.

**Organización del código (por capas)**

```
backend/src/
  config/        variables de entorno y conexión a la base
  routes/        qué URL existe y qué controlador la atiende
  controllers/   reciben el pedido, validan y responden
  services/      consultas SQL y reglas de negocio
  models/        formas de los datos (tipos de TypeScript)
  middlewares/   sesión, roles y límites de consultas
  utils/         ayudas pequeñas (IP, cifrado, validaciones)
  scripts/       tareas de una sola vez (cifrar datos viejos, generar el diccionario)

frontend/src/app/
  pages/         una carpeta por pantalla
  components/    piezas reutilizables (menú, ventana modal, logo)
  services/      hablan con la API
  models/        formas de los datos
  core/          guardias de rutas, interceptor y configuración
```

---

## 3. Preparación del entorno de desarrollo

**Paso 3.1: Instalar las herramientas**

- **Objetivo:** tener lo necesario para programar y ejecutar el proyecto.
- **Acción:** se instalaron Visual Studio Code, Node.js (versión LTS), Git y las extensiones recomendadas por el proyecto (`frontend/.vscode/extensions.json`).
- **Comandos de verificación:**

```powershell
node -v
```

```powershell
npm -v
```

```powershell
git --version
```

- **Explicación:** cada comando imprime la versión instalada; si Windows dice que "no se reconoce", esa herramienta no está instalada o hay que reabrir la terminal.
- **Resultado esperado (versiones usadas):** Node.js `v24.18.0`, npm `11.16.0`, Git `2.55.0`.
- **Evidencia:** ![Versiones](docs/capturas/03-versiones.png)
- **Error frecuente:** `ng` o `tsx` "no se reconoce". **Solución:** falta `npm install` en esa carpeta (ver sección 11).

**Paso 3.2: Instalar el CLI de Angular**

```powershell
npm install -g @angular/cli
```

Instala el comando `ng` para todo el equipo. Alternativa sin instalar nada global: `npx ng serve`.

**Paso 3.3: Crear las cuentas**

| Servicio | Para qué |
|---|---|
| GitHub | Guardar y compartir el código |
| Supabase | Base de datos PostgreSQL |
| apiperu.dev | Consulta de DNI (uso académico, con token propio) |
| Gmail (opcional) | Enviar los códigos de verificación (contraseña de aplicación) |
| Vercel y Culqi | Pendientes (secciones 8 y 12) |

---

## 4. Creación inicial del proyecto

**Paso 4.1: Backend**

- **Objetivo:** crear la API.
- **Acción y comandos:**

```powershell
mkdir backend
cd backend
npm init -y
npm install express cors dotenv pg bcryptjs jsonwebtoken nodemailer
npm install -D typescript tsx @types/node @types/express @types/cors @types/pg @types/jsonwebtoken @types/nodemailer
```

- **Explicación:** `express` es el servidor; `cors` permite que Angular (otro puerto) lo llame; `dotenv` lee el archivo `.env`; `pg` conecta con PostgreSQL; `bcryptjs` cifra contraseñas; `jsonwebtoken` crea las sesiones; `nodemailer` envía correos. Las dependencias con `-D` solo se usan al programar (`tsx` ejecuta TypeScript directamente).
- **Scripts en `package.json`:** `npm run dev` (arranca con recarga automática), `npm run build`, `npm run start`, `npm run cifrar` y `npm run diccionario`.
- **Archivos principales:** `src/server.ts` (arranque y monitoreo), `src/app.ts` (configuración de Express), `tsconfig.json` (opciones de TypeScript, con `"include": ["src"]`).
- **Evidencia:** ![Backend iniciado](docs/capturas/04-backend-iniciado.png)
- **Resultado esperado:** la consola dice `Servidor LegadoSeguroWeb en http://localhost:5000`.

**Paso 4.2: Frontend**

```powershell
ng new frontend
cd frontend
ng serve
```

- **Explicación:** `ng new` crea la aplicación Angular; `ng serve` la levanta en `http://localhost:4200`. Los archivos principales son `package.json` (dependencias), `angular.json` (configuración), `src/main.ts` (arranque), `src/app/app.routes.ts` (rutas) y `src/styles.css` (estilos globales y paleta de colores).
- **Estructura inicial:** ![Estructura de carpetas](docs/capturas/05-estructura.png)
- **Resultado esperado:** el navegador muestra la aplicación en `http://localhost:4200`.

**Detalle importante (Angular sin zone.js):** esta versión actualiza la pantalla solo cuando cambia un **signal**. Por eso los datos que llegan de la API se guardan siempre en `signal(...)`.

---

## 5. Git y GitHub

```powershell
git init
git add .
git commit -m "Inicio del proyecto"
git branch -M master
git remote add origin https://github.com/KatherynPardo/LegadoSeguroWeb.git
git push -u origin master
```

| Comando | Qué hace |
|---|---|
| `git init` | Convierte la carpeta en un repositorio |
| `git add .` | Prepara todos los cambios para guardarlos |
| `git commit -m "..."` | Guarda una versión con un mensaje que describe el cambio |
| `git branch -M master` | Nombra la rama principal |
| `git remote add origin URL` | Conecta el repositorio local con GitHub |
| `git push -u origin master` | Sube los commits a GitHub |

- **Repositorio:** https://github.com/KatherynPardo/LegadoSeguroWeb
- **Commits:** el proyecto lleva más de 19 commits, uno por cada avance con mensaje descriptivo (por ejemplo "Checklist de documentos por roles y portal del heredero").
- **Seguridad:** el archivo `.env` está en `.gitignore`, así que las claves **no se suben**. Se puede comprobar con `git check-ignore -v backend/.env`.
- **Evidencia:** ![Repositorio en GitHub](docs/capturas/06-github.png)

---

## 6. Base de datos en Supabase

**Paso 6.1: Crear el proyecto y las tablas**

- **Objetivo:** tener la base de datos con el modelo entidad-relación.
- **Acción:** se creó un proyecto en Supabase y se ejecutaron, **en orden**, las migraciones de `supabase/migrations/` en **SQL Editor**.

| Migración | Qué hace |
|---|---|
| `001_esquema_inicial` | Crea las 24 tablas con PK, FK y restricciones |
| `002_seguridad_rls` | Activa RLS en todas las tablas |
| `003_datos_iniciales` | Roles, tipos de activo, planes y datos de prueba |
| `004_usuario_demo` | Contraseña cifrada del usuario de prueba |
| `005_proceso_demo` | Un proceso de liberación de prueba |
| `006_usuario_admin` | Usuario administrador de prueba |
| `007_auditoria_ip` | Columnas de IP |
| `008_bancos_y_montos` | Bancos, montos e historial |
| `009_cifrado_y_codigos` | Columnas cifradas y códigos de verificación |
| `010_sin_clave_heredero` | El heredero ya no guarda clave |
| `011_heredero_verificado` | Marca de correo verificado |
| `012_plan_basico` | Plan Básico con límite de herederos |
| `013_dias_inactividad_libres` | Restricción de 7 a 3650 días |
| `014_checklist_documentos` | Catálogo y checklist de documentos |

- **Explicación:** cada migración es un archivo SQL; las últimas son **aditivas** (se pueden volver a ejecutar sin error). Así el historial de cambios de la base queda registrado.
- **Evidencia:** ![Tablas en Supabase](docs/capturas/07-supabase-tablas.png)

**Paso 6.2: Seguridad (RLS)**

Con **RLS activado y sin políticas**, la API pública de Supabase no puede leer ni escribir ninguna tabla. El backend se conecta con el usuario `postgres` (dueño de las tablas), así que solo el backend, con credenciales privadas, toca los datos.

**Paso 6.3: Variables de entorno (sin revelar secretos)**

Archivo `backend/.env` (se crea copiando `backend/.env.example`):

```
DATABASE_URL=postgresql://postgres.xxxx:********@aws-0-...pooler.supabase.com:5432/postgres
PORT=5000
JWT_SECRET=********
ENCRYPTION_KEY=********
DNI_PROVIDER=apiperu
DNI_API_TOKEN=********
# Opcional (correos reales):
SMTP_HOST=smtp.gmail.com
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=********
```

| Variable | Para qué sirve |
|---|---|
| `DATABASE_URL` | Conexión a Supabase (Connect → Session pooler) |
| `JWT_SECRET` | Firma de las sesiones |
| `ENCRYPTION_KEY` | Llave de cifrado de montos y descripciones. **No se debe cambiar después de guardar datos** |
| `DNI_API_TOKEN` | Token de apiperu.dev |
| `SMTP_*` | Cuenta de correo para los códigos. Si faltan, el código aparece en la consola del backend |

---

## 7. Desarrollo del sistema por módulos

Cada módulo sigue la misma plantilla: objetivo, requerimiento, archivos, interfaz, código principal, explicación, operaciones, validaciones, prueba y errores.

### 7.1 Módulo: Login (inicio de sesión)

- **Objetivo:** que un usuario con cuenta ingrese de forma segura.
- **Requerimiento:** RF-01, RNF-01, RNF-03.
- **Archivos:** `backend/src/services/auth.service.ts`, `controllers/auth.controller.ts`, `routes/auth.routes.ts`, `middlewares/auth.middleware.ts`; `frontend/.../pages/login`, `services/auth.service.ts`, `core/auth.interceptor.ts`, `core/auth.guard.ts`.
- **Interfaz:** ![Login](docs/capturas/10-login.png)
- **Código principal:**

```ts
// backend/src/services/auth.service.ts (resumen)
const coincide = await bcrypt.compare(password, usuario.password_hash);
if (!coincide) return null;

// El token lleva el id del usuario y vence en 8 horas
const token = jwt.sign({ id: usuario.id_usuario }, JWT_SECRET, { expiresIn: '8h' });
```

- **Explicación:** la contraseña escrita se compara con el hash guardado; la contraseña real nunca se guarda. Si es correcta, se crea un **token JWT**. El frontend lo guarda y lo envía en cada pedido (`auth.interceptor.ts`); el middleware `verificarToken` lo revisa en el backend.
- **Operaciones:** iniciar sesión, cerrar sesión, ruta protegida (el guardia `authGuard` manda al login si no hay sesión).
- **Validaciones:** correo y contraseña obligatorios; el mismo mensaje ("Correo o contraseña incorrectos") para cualquier fallo, para no revelar qué falló; solo entran cuentas `ACTIVO`.
- **Prueba:** ver sección 10 (casos P-01 a P-03).
- **Errores encontrados:** `ETIMEDOUT` al conectar con la base (ver sección 11).

### 7.2 Módulo: Registro con DNI y código por correo

- **Objetivo:** crear cuentas verdaderas: con nombres validados en RENIEC y correo confirmado.
- **Requerimiento:** RF-01.
- **Archivos:** `services/reniec.service.ts`, `services/verificacion.service.ts`, `services/correo.service.ts`, `services/auth.service.ts`; `frontend/.../pages/registro`.
- **Interfaz:** ![Registro paso 1](docs/capturas/11-registro-1.png) ![Registro paso 2](docs/capturas/12-registro-2.png)
- **Flujo:**
  1. El usuario escribe su DNI y pulsa **Buscar**: los nombres vienen de RENIEC (apiperu.dev) y quedan de solo lectura.
  2. Al enviar, el backend **vuelve a consultar** RENIEC y usa esos nombres (no los que mande el navegador). La cuenta queda `PENDIENTE` y se envía un código de 6 dígitos.
  3. El usuario escribe el código; si es correcto, la cuenta pasa a `ACTIVO` y entra al sistema.
- **Código principal (el código de verificación):**

```ts
// backend/src/services/verificacion.service.ts (resumen)
const codigo = String(crypto.randomInt(100000, 1000000)); // 6 dígitos
const hash = await bcrypt.hash(codigo, 10);               // se guarda cifrado
// ... se guarda con vencimiento de 10 minutos y 5 intentos
```

- **Explicación:** el código nunca se guarda en claro. Vence en **10 minutos**, permite **5 intentos** y **solo sirve una vez**. Si no hay SMTP configurado, el correo se imprime en la consola del backend (modo prueba).
- **Operaciones:** buscar DNI, crear cuenta, confirmar código, reenviar código.
- **Validaciones:** DNI de 8 dígitos; correo válido; teléfono de 9 dígitos; contraseña de al menos 6 caracteres; correo y DNI únicos (error 409); la consulta de DNI está limitada a 10 por minuto por IP.
- **Prueba:** casos P-04 a P-08 (sección 10).
- **Errores encontrados:** DNI inventado rechazado por RENIEC durante las pruebas (comportamiento correcto; ver sección 11).

### 7.3 Módulo: Recuperar contraseña

- **Objetivo:** recuperar el acceso sin revelar qué correos existen.
- **Requerimiento:** RF-02.
- **Archivos:** `services/auth.service.ts` (`solicitarRecuperacion`, `restablecerPassword`), `controllers/auth.controller.ts`; `frontend/.../pages/recuperar`.
- **Interfaz:** ![Recuperar contraseña](docs/capturas/13-recuperar.png)
- **Explicación:** el usuario escribe su correo y recibe un código; con él elige una contraseña nueva (cifrada con bcrypt). **La respuesta es siempre la misma exista o no el correo**, para que nadie averigüe qué correos tienen cuenta. El cambio queda en la auditoría con la IP.
- **Validaciones:** código de 6 dígitos; contraseña de al menos 6 caracteres; código vigente y de un solo uso.
- **Prueba:** casos P-09 y P-10.

### 7.4 Módulo: Activos digitales

- **Objetivo:** registrar y administrar los activos que se dejarán como legado.
- **Requerimiento:** RF-03, RF-05, RNF-02.
- **Archivos:** `services/activo.service.ts`, `controllers/activo.controller.ts`, `routes/activo.routes.ts`, `models/activo.model.ts`, `utils/cifrado.ts`, `utils/validar.ts`; `frontend/.../pages/activos`, `services/activo.service.ts`.
- **Interfaz:** ![Mis Activos](docs/capturas/14-activos.png) ![Nuevo activo](docs/capturas/15-activo-formulario.png)
- **Código principal (cifrado de datos sensibles):**

```ts
// backend/src/utils/cifrado.ts (resumen)
const cifrador = crypto.createCipheriv('aes-256-gcm', clave, iv);
const cifrado = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()]);
return `enc:${iv}:${etiqueta}:${cifrado}`;   // así se guarda en la base
```

- **Explicación:** la descripción y el monto se guardan **cifrados** (`enc:...`) con la llave `ENCRYPTION_KEY`. Si alguien copiara la base de datos, vería texto ilegible. El backend los descifra antes de enviarlos a la pantalla.
- **Operaciones:** crear, listar, **editar**, **eliminar** (el activo queda `INACTIVO` para no romper procesos pasados), asignar herederos, ver historial de montos.
- **Reglas de negocio:**
  - La **sensibilidad** depende del tipo (BAJA o FINANCIERA).
  - Solo las **cuentas bancarias** exigen elegir un **banco** (catálogo con botón "Nuevo banco").
  - El **monto es opcional** en cualquier activo (por ejemplo, una cuenta monetizada), con moneda soles o dólares. Cada cambio queda en `historial_monto` con fecha, usuario e IP.
  - Si se desmarca "registrar monto", se borran el monto y su historial.
  - No se puede eliminar un activo que está en un proceso de liberación abierto.
- **Validaciones:** nombre y descripción obligatorios (con máximo de largo); tipo válido; banco válido; monto de 0 en adelante con moneda; herederos que existan y sean del propietario.
- **Prueba:** casos P-11 a P-16.
- **Tarjetas:** hay tipos de activo para tarjeta de crédito y de débito. Se guardan solo los **4 últimos dígitos**, el emisor (el mismo combo de bancos) y, en crédito, la línea, el día de pago y el cierre de facturación. **No se guardan el número completo, el CVV ni la clave** (ver Paso 8.10e del manual).
- **Indicaciones para el heredero:** cada activo tiene un cuadro cifrado, con una guía distinta según el tipo, que se entrega al heredero solo cuando se libera el proceso.
- **Error encontrado:** al activar el cifrado, la descripción cifrada no entraba en `VARCHAR(300)`; se cambió la columna a `TEXT` (migración 009).

### 7.5 Módulo: Herederos

- **Objetivo:** designar a quienes recibirán el legado, verificando que el correo es realmente suyo.
- **Requerimiento:** RF-04, RF-10.
- **Archivos:** `services/beneficiario.service.ts`, `controllers/beneficiario.controller.ts`, `routes/beneficiario.routes.ts`; `frontend/.../pages/beneficiarios`.
- **Interfaz:** ![Mis Herederos](docs/capturas/16-herederos.png) ![Aviso de plan](docs/capturas/17-aviso-plan.png)
- **Código principal (límite del plan):**

```ts
// backend/src/services/beneficiario.service.ts (resumen)
const limite = await limiteDeHerederos(idUsuario);
if (limite !== null && cuenta.rows[0].n >= limite) {
  throw new ReglaHeredero(`Tu plan permite hasta ${limite} herederos`, 403, 'LIMITE_PLAN', limite);
}
```

- **Explicación:** al registrar un heredero, el sistema envía un **código al correo del heredero**; el propietario debe pedírselo y escribirlo. Así nadie registra un correo ajeno (evita la **suplantación de identidad**). El heredero aparece como "Identidad verificada" o "Pendiente de verificar". Al llegar al límite del plan, la pantalla muestra una ventana invitando a mejorar el plan, y el backend también lo exige (error 403 con código `LIMITE_PLAN`).
- **Operaciones:** designar (con búsqueda de nombres por DNI), listar en tarjetas, editar (el DNI no cambia; si cambia el correo se pide un código nuevo), eliminar (queda `INACTIVO` y se le quitan los activos), ver y editar sus documentos.
- **Validaciones:** todos los campos obligatorios; DNI de 8 dígitos y único por propietario (409); teléfono de 9 dígitos; correo válido; código correcto.
- **Prueba:** casos P-17 a P-21.

### 7.6 Módulo: Reglas de liberación

- **Objetivo:** que cada propietario decida **cuándo** se inicia la entrega de su legado.
- **Requerimiento:** RF-06.
- **Archivos:** `services/regla.service.ts`, `controllers/regla.controller.ts`, `models/regla.model.ts`; `frontend/.../pages/reglas`.
- **Interfaz:** ![Reglas de liberación](docs/capturas/18-reglas.png)
- **Explicación:** el usuario escribe cuántos **días de inactividad** esperar (libres, entre 7 y 3650, con atajos de 15, 30, 90, 180 y 365), cuántas **confirmaciones mínimas** necesita de sus herederos (no pueden superar la cantidad de herederos), el **período de espera final** y si exige **validador externo** para los activos financieros. Cada usuario tiene **una sola regla activa**; guardar actualiza esa regla. El panel de la derecha ("Así funcionará tu regla") se actualiza al cambiar los valores.
- **Validaciones en tres niveles:** la pantalla, el controlador y la **base de datos** (restricción `ck_regla_dias_inactividad`).
- **Prueba:** casos P-22 a P-24.

### 7.7 Módulo: Procesos de liberación

- **Objetivo:** detectar la inactividad y abrir automáticamente el proceso de entrega.
- **Requerimiento:** RF-07.
- **Archivos:** `services/monitoreo.service.ts`, `services/proceso.service.ts`, `controllers/proceso.controller.ts`, `server.ts`; `frontend/.../pages/procesos`.
- **Interfaz:** ![Procesos](docs/capturas/19-procesos.png) ![Detalle del proceso](docs/capturas/20-proceso-detalle.png)
- **Código principal (detección de inactividad):**

```sql
-- backend/src/services/monitoreo.service.ts (resumen)
SELECT r.id_regla, r.id_usuario, r.dias_inactividad
FROM regla_liberacion r JOIN usuario u ON u.id_usuario = r.id_usuario
WHERE r.estado = 'ACTIVA' AND u.estado = 'ACTIVO'
  AND NOT EXISTS (SELECT 1 FROM proceso_liberacion p
                  WHERE p.id_usuario_propietario = r.id_usuario AND p.fecha_fin IS NULL)
  AND COALESCE((SELECT MAX(a.fecha_actividad) FROM actividad_usuario a WHERE a.id_usuario = r.id_usuario),
               u.fecha_registro) < NOW() - make_interval(days => r.dias_inactividad)
```

- **Explicación:** al arrancar el backend y luego **cada hora**, se revisa a cada usuario con regla activa. Si su última actividad (cada inicio de sesión se registra en `actividad_usuario`) es más antigua que los días de su regla y no tiene un proceso abierto, se crea un `proceso_liberacion` en estado `DETECTADO`, con sus activos y las confirmaciones pendientes de los herederos asignados (todo en una transacción).
- **Operaciones:** listar, ver detalle (activos, confirmaciones, objeciones, entregas) y **cancelar** (queda en la auditoría).
- **Estados:** `DETECTADO`, `EN_CONFIRMACION`, `EN_ESPERA`, `LIBERADO`, `CANCELADO`.
- **Etapas del heredero:** avisos por correo, tres verificaciones (código, DNI y selfie cifrada), confirmar participación o presentar objeción, espera final y liberación con entregas (pantalla del Figma 06). Detalle en el Paso 8.10d de [MANUAL_CONSTRUCCION.md](MANUAL_CONSTRUCCION.md).
- **Limitación actual:** la selfie se guarda cifrada como evidencia, **sin comparación facial automática**; y el portal del validador externo (que aprobaría las entregas de activos financieros) no está hecho.
- **Prueba:** casos P-25 a P-27.

### 7.8 Módulo: Checklist de documentos y portal del heredero

- **Objetivo:** que cada heredero sepa qué documentos debe reunir cuando se le entregue el legado.
- **Requerimiento:** RF-08, RF-09, RNF-03.
- **Archivos:** `services/documento.service.ts`, `services/portal.service.ts`, `controllers/documento.controller.ts`, `controllers/portal.controller.ts`, `middlewares/portal.middleware.ts`; `frontend/.../pages/portal`, `services/portal.service.ts`, `pages/admin`, `pages/beneficiarios`.
- **Interfaz:** ![Portal: ingreso](docs/capturas/21-portal-ingreso.png) ![Portal: checklist](docs/capturas/22-portal-checklist.png) ![Solicitud de liberación (Figma 06)](docs/capturas/29-solicitud-liberacion.png) ![Documentos del heredero](docs/capturas/23-documentos-propietario.png) ![Catálogo del administrador](docs/capturas/24-catalogo-admin.png)
- **Tres roles, tres vistas:**

| Rol | Qué hace |
|---|---|
| Administrador | Mantiene el catálogo de documentos y decide **a qué tipos de activo aplica cada uno** (DNI y certificado de defunción para todos; declaratoria, carta poder y estado de cuenta para activos financieros). |
| Propietario | Al designar a un heredero elige los **activos que recibirá**; la lista de documentos del heredero **se deduce de esos activos** y en **Documentos** solo anota dónde está cada original. |
| Heredero | Entra al portal con su correo y un código (sin contraseña), ve una barra de avance y marca cada documento que ya tiene. |

- **Código principal (el token del heredero no sirve para el propietario):**

```ts
// backend/src/middlewares/auth.middleware.ts (resumen)
if (datos.tipo === 'HEREDERO') {
  res.status(401).json({ mensaje: 'Esta sesión es de un heredero' });
  return;
}
```

- **Explicación:** el token del heredero lleva `tipo: HEREDERO` y el backend lo rechaza en las pantallas del propietario; y el token del propietario se rechaza en el portal. Solo pueden entrar herederos con correo verificado; si el correo no es de un heredero, la respuesta es la misma y no se envía código. Un heredero solo puede marcar **sus** documentos.
- **Alcance:** es una lista de control; **no se adjuntan archivos**.
- **Prueba:** casos P-28 a P-32 (incluye pruebas de seguridad entre roles).
- **Error encontrado:** el marcado de documentos devolvía error 500 por un parámetro SQL con tipos inconsistentes (ver sección 11).

### 7.9 Módulo: Suscripción

- **Objetivo:** ofrecer un plan gratuito limitado y uno de pago.
- **Requerimiento:** RF-10.
- **Archivos:** `services/suscripcion.service.ts`, `controllers/suscripcion.controller.ts`; `frontend/.../pages/suscripcion`.
- **Interfaz:** ![Suscripción](docs/capturas/25-suscripcion.png)
- **Explicación:** el plan **Básico** es gratis e incluye hasta 2 herederos; el **Premium** (S/ 29.90) no tiene límite. El límite está en la base de datos (`plan.limite_herederos`; vacío significa ilimitado). La pantalla muestra el plan actual, el uso, la comparación de planes y el historial de pagos. Quien ya tenía más herederos que el límite los conserva, pero no puede designar nuevos.
- **Pendiente:** **el pago del Premium con Culqi.** Hoy el botón está desactivado y el backend responde que el pago aún no está disponible; no se simula ningún cobro. Solo se puede volver al plan gratuito.
- **Prueba:** casos P-33 y P-34.

### 7.10 Módulo: Administración, historial y perfil

- **Objetivo:** control del sistema por el administrador, y transparencia y datos propios para cada usuario.
- **Requerimiento:** RF-11, RF-12, RNF-05.
- **Archivos:** `controllers/admin.controller.ts`, `services/admin.service.ts`, `middlewares/admin.middleware.ts`, `services/historial.service.ts`, `services/perfil.service.ts`; `frontend/.../pages/admin`, `pages/historial`, `pages/perfil`.
- **Interfaz:** ![Administración](docs/capturas/26-administracion.png) ![Mi historial](docs/capturas/27-historial.png) ![Mi perfil](docs/capturas/28-perfil.png)
- **Explicación:**
  - **Administración:** lista de usuarios con fecha de creación, IP de registro y último acceso; botón para activar o desactivar cuentas (un usuario desactivado ya no puede iniciar sesión); auditoría de las últimas acciones del sistema. El rol se valida **en la base de datos en cada pedido** (`soloAdmin`), no solo en la pantalla.
  - **Mi historial:** cada usuario ve sus propias acciones e ingresos con fecha e IP.
  - **Mi perfil:** edición de datos personales (el DNI no se cambia) y cambio de contraseña con confirmación.
- **Validaciones:** el administrador no puede desactivar su propia cuenta; teléfono de 9 dígitos y correo válido en el perfil.
- **Prueba:** casos P-35 a P-37.

---

## 8. Integraciones externas

### 8.1 Supabase

- **Conexión:** el backend usa la librería `pg` con `DATABASE_URL` (Session pooler de Supabase) en `src/config/database.ts`.
- **Consultas:** siempre **parametrizadas** (`$1`, `$2`...) para evitar inyección SQL.
- **Autenticación y almacenamiento:** no se usa la autenticación de Supabase ni su almacenamiento; el sistema tiene su propio login (bcrypt y JWT). **Storage** se usaría si más adelante se suben archivos.
- **Prueba:** `GET /api/salud` confirma la conexión con la base.

### 8.2 apiperu.dev (consulta de DNI / RENIEC)

- **Para qué:** traer los nombres reales de una persona por su DNI, al registrarse y al designar herederos.
- **Cómo:** el frontend llama al backend (`/api/reniec/dni/:dni` o `/api/auth/dni/:dni`) y el backend llama a apiperu.dev con el token. **El token nunca sale del backend.**
- **Cómo se probó:** con DNI propios y de familiares con su consentimiento (uso académico). Si no hay token configurado, la pantalla lo avisa y los datos se escriben a mano.
- **Protección:** límite de 10 consultas por minuto por IP en la ruta pública, para no gastar el token.

### 8.3 Correo (nodemailer)

- **Para qué:** enviar los códigos de verificación.
- **Cómo:** `src/services/correo.service.ts`. Con `SMTP_HOST` configurado (por ejemplo, Gmail con contraseña de aplicación) envía correos reales; **sin SMTP, el correo se muestra en la consola del backend**, lo que permite probar y exponer sin cuenta de correo.
- **Cómo se probó:** en modo consola, copiando el código impreso.

### 8.4 Culqi (pagos)

**Pendiente.** Están listas las tablas `plan`, `suscripcion` y `pago` y la pantalla de Suscripción, pero el cobro no está conectado. Lo que falta:

1. Crear la cuenta de Culqi en modo de pruebas y obtener las llaves (la pública para el navegador, la privada solo para el backend).
2. Tokenizar la tarjeta en el navegador con Culqi.js.
3. Crear el cargo desde el backend y guardar el resultado en `pago` y `suscripcion`.
4. Probar con las tarjetas de prueba de Culqi.

> **Importante:** nunca publicar llaves privadas, contraseñas ni tokens reales.

---

## 9. Dashboard y reportes

### 9.1 Dashboard (centro de mando)

![Dashboard](docs/capturas/30-dashboard.png)

| Indicador | Qué muestra | De dónde salen los datos | Qué decisión permite |
|---|---|---|---|
| **Salud del legado (0 a 100)** | Qué tan completo está el legado | `activo_digital`, `activo_beneficiario`, `beneficiario`, `regla_liberacion` | Saber si falta algo por configurar |
| **Próximos pasos** | Lo que falta, con enlace para resolverlo | Los mismos datos | Qué hacer primero |
| **Tu regla en acción** | Días desde el ingreso anterior frente al límite de la regla | `actividad_usuario`, `regla_liberacion` | Cuánto margen queda antes de que se inicie un proceso |
| **Cifras** | Activos, herederos, regla activa y procesos en curso | Conteos de cada tabla | Panorama rápido |
| **Alerta de proceso** | Aviso si hay un proceso en curso | `proceso_liberacion` | Decidir si cancelarlo |
| **Actividad reciente** | Últimas acciones | `auditoria`, `actividad_usuario`, `activo_digital` | Revisar qué pasó últimamente |

**Fórmula de la salud del legado:** 5 pasos de **20 puntos** cada uno. Puntaje = 20 × (pasos cumplidos).

1. Tiene al menos un activo digital.
2. Todos sus activos tienen heredero asignado.
3. Tiene al menos un heredero designado.
4. Todos sus herederos están verificados.
5. Tiene una regla de liberación activa.

**Consulta principal** (en `services/dashboard.service.ts`): cuenta los activos sin heredero con `COUNT(*) FILTER (WHERE NOT EXISTS (...))`, los herederos verificados con `COUNT(*) FILTER (WHERE correo_verificado)` y busca la regla activa.

### 9.2 Reportes

![Reportes](docs/capturas/31-reportes.png)

| Reporte | Qué muestra | De dónde sale | Decisión que permite |
|---|---|---|---|
| Activos registrados / sin heredero | Cuántos activos hay y cuántos no tienen heredero | `activo_digital`, `activo_beneficiario` | Asignar herederos pendientes |
| Herederos verificados | "X de Y" | `beneficiario.correo_verificado` | Verificar a quienes faltan |
| Dinero registrado | Suma por moneda, con ojito para ocultarlo | `activo_digital.monto_cifrado` (se descifra y suma en el backend) | Ver el patrimonio declarado |
| Activos por tipo | Barras por tipo (los financieros en rojo) | `activo_digital`, `tipo_activo` | Ver cómo se reparte el legado |
| Procesos por estado | Conteo por estado | `proceso_liberacion` | Seguimiento de procesos |

> **Diferencia entre ambos:** el Dashboard dice *cómo estoy y qué hago ahora*; Reportes *analiza lo que tengo*.

---

## 10. Pruebas del sistema

Las pruebas del backend se hicieron contra la base real (con datos temporales que se borraron después) usando `curl` en un puerto alterno.

### 10.1 Pruebas funcionales

| Caso | Entrada | Esperado | Obtenido | Estado |
|---|---|---|---|---|
| P-01 | Login con credenciales correctas | 200 con token y rol | 200 con token y rol | Aprobado |
| P-02 | Login con contraseña incorrecta | 401 con mensaje genérico | 401 | Aprobado |
| P-03 | Login antes de confirmar el correo | 401 | 401 | Aprobado |
| P-04 | Registro con DNI de 3 dígitos | 400 | 400 "El DNI debe tener 8 dígitos" | Aprobado |
| P-05 | Registro con correo ya existente | 409 | 409 | Aprobado |
| P-06 | Registro válido | 201 y código por consola | 201 y código | Aprobado |
| P-07 | Confirmar con código incorrecto | 400 | 400 | Aprobado |
| P-08 | Confirmar con el código correcto y reusarlo | 200; el segundo uso, 400 | 200 y 400 | Aprobado |
| P-09 | Recuperar con correo inexistente | Misma respuesta y sin código | 200 y 0 códigos enviados | Aprobado |
| P-10 | Restablecer con código; probar clave vieja y nueva | Vieja 401, nueva 200 | 401 y 200 | Aprobado |
| P-11 | Crear activo sin descripción | 400 | 400 | Aprobado |
| P-12 | Cuenta bancaria sin banco | 400 | 400 "Elige el banco" | Aprobado |
| P-13 | Monto negativo / sin moneda | 400 | 400 | Aprobado |
| P-14 | Crear activo con S/ 2000 y editar a US$ 2500 | Historial con 2 filas | 2 filas | Aprobado |
| P-15 | Editar sin cambiar el monto | No agrega fila | No agregó | Aprobado |
| P-16 | Desmarcar "registrar monto" | Monto e historial borrados | Historial vacío | Aprobado |
| P-17 | Heredero con teléfono de 3 dígitos | 400 | 400 | Aprobado |
| P-18 | Heredero sin código de verificación | 400 | 400 | Aprobado |
| P-19 | Heredero con código correcto | 201 | 201 | Aprobado |
| P-20 | Mismo DNI dos veces | 409 | 409 | Aprobado |
| P-21 | Heredero por encima del límite del plan | 403 `LIMITE_PLAN` | 403 | Aprobado |
| P-22 | Días de inactividad 5, 5000 y 15.5 | 400 | 400 | Aprobado |
| P-23 | Días de inactividad 15 y 25 | 200 | 200 | Aprobado |
| P-24 | La base rechaza 3 días aunque se salte el backend | Error de restricción | `ck_regla_dias_inactividad` | Aprobado |
| P-25 | Listar procesos | El proceso de prueba | Lo devolvió | Aprobado |
| P-26 | Proceso inexistente / id inválido | 404 / 400 | 404 / 400 | Aprobado |
| P-27 | Cancelar un proceso abierto | `CANCELADO` y auditoría | Verificado en una transacción revertida | Aprobado |
| P-28 | Heredero verificado pide código y entra | Token de heredero | Token | Aprobado |
| P-29 | Correo que no es heredero pide código | Misma respuesta y sin código | 200 y 0 códigos | Aprobado |
| P-30 | Heredero marca y desmarca un documento | Cambia de estado | Cambió | Aprobado |
| P-31 | Heredero marca un documento ajeno | 404 | 404 | Aprobado |
| P-32 | Propietario agrega y quita carta poder | Los obligatorios no se quitan | Quedaron 2 | Aprobado |
| P-33 | Ver suscripción | Plan y límite | Devolvió el plan y el límite | Aprobado |
| P-34 | Pagar el Premium | 409 (Culqi pendiente) | 409 | Aprobado |
| P-35 | Admin lista usuarios y auditoría | 200 | 200 | Aprobado |
| P-36 | Admin desactiva y activa un usuario | 200 y auditoría con IP | Verificado | Aprobado |
| P-37 | Mi historial | Acciones e ingresos | Devolvió registros | Aprobado |
| P-38 | El monitoreo detecta inactividad y abre el proceso | Proceso EN_CONFIRMACION y 3 avisos (dueño y 2 herederos) | Los 3 avisos guardados | Aprobado |
| P-39 | Heredero confirma o manda la selfie sin cumplir los pasos | 409 | 409 | Aprobado |
| P-40 | DNI que no coincide / DNI correcto | 400 / 200 con DNI enmascarado | 400 / 200 (`****1111`) | Aprobado |
| P-41 | Selfie que no es JPEG / selfie correcta | 400 / 200 y cifrada en la base | 400 / 200 y `enc:...` | Aprobado |
| P-42 | Un heredero actúa por otro / el propietario usa el portal | 404 / 401 | 404 / 401 | Aprobado |
| P-43 | Heredero objeta; se intenta liberar con objeción abierta | No se libera | 0 liberados | Aprobado |
| P-44 | El propietario resuelve la objeción y confirman los dos herederos | EN_ESPERA | EN_ESPERA | Aprobado |
| P-45 | Termina la espera | LIBERADO y 4 entregas (2 activos × 2 herederos) | LIBERADO y 4 entregas | Aprobado |
| P-46 | Validador exigido por la regla | Activo financiero PENDIENTE_VALIDADOR; el otro AUTORIZADA | Correcto | Aprobado |
| P-47 | El heredero ve su entrega | Descripción descifrada solo en las autorizadas | Correcto | Aprobado |
| P-48 | Confirmar un proceso terminado | 409 | 409 | Aprobado |
| P-49 | Tarjeta de crédito sin datos / con últimos 4 inválidos / sin línea ni fechas / día de pago 40 | 400 | 400 con mensaje claro | Aprobado |
| P-50 | Tarjeta de crédito completa y de débito con 4 dígitos | 201 | 201 | Aprobado |
| P-51 | Una red social con datos de tarjeta | 400 | 400 | Aprobado |
| P-52 | La base no guarda número completo, CVV ni clave | Sin columnas para ellos | Verificado en `detalle_tarjeta` | Aprobado |
| P-53 | Indicaciones y línea de crédito en la base | Valores `enc:...` | `enc:...` | Aprobado |
| P-54 | Heredero con tarjetas vs. heredero con un correo | 5 documentos vs. 2 | 5 y 2 | Aprobado |
| P-55 | Reasignar activos al editar un heredero | Cambian sus documentos | De 2 a 5 | Aprobado |
| P-56 | El administrador crea un requisito para tarjetas de crédito | Solo les aparece a quienes las reciben | Correcto | Aprobado |
| P-57 | Pedir 3 confirmaciones con 2 herederos o con plan Básico | 400 | 400 | Aprobado |

### 10.2 Pruebas de integración (Frontend → Backend → Supabase)

| Prueba | Resultado |
|---|---|
| Compilación del frontend (`ng build`) | Sin errores |
| Compilación del backend (`tsc --noEmit`) | Sin errores |
| Pantallas de registro (con código), activos, herederos y reglas funcionando en el navegador contra la base real | Observado por la autora durante el desarrollo; falta adjuntar las capturas |

### 10.3 Pruebas de seguridad

| Prueba | Esperado | Obtenido |
|---|---|---|
| Ruta protegida sin sesión | 401 | 401 |
| Usuario normal en `/api/admin` | 403 | 403 |
| Token de heredero en pantallas del propietario | 401 | 401 |
| Token de propietario en el portal | 401 | 401 |
| Activo o heredero de otro usuario | 404 | 404 |
| Contraseñas y claves | Cifradas / ocultas | bcrypt en la base; `.env` ignorado por Git |
| Descripción y monto en la base | Ilegibles | Valores `enc:...` |
| Abuso de rutas públicas | 429 al pasar el límite | 429 |

### 10.4 Pruebas responsive

**Pendiente.** Hay reglas para pantallas pequeñas (menú que pasa a la parte superior, tarjetas que se reorganizan), pero **todavía no se verificaron de forma sistemática** en PC, tablet y celular. Se debe completar con capturas usando las herramientas del navegador (F12, modo dispositivo): ![Responsive](docs/capturas/40-responsive.png)

---

## 11. Registro de errores y soluciones

| # | Error | Causa | Solución | Resultado |
|---|---|---|---|---|
| 1 | `ETIMEDOUT` al conectar con la base | Una VPN o la red bloqueaba el puerto 5432, o el proyecto de Supabase estaba pausado | Apagar la VPN, probar otra red (`Test-NetConnection`) o pulsar **Restore** en Supabase | El backend se conectó y respondió `/api/salud` |
| 2 | `EADDRINUSE :::5000` | Había otro backend encendido en el mismo puerto | Cerrar la terminal vieja (`Ctrl+C`) o todas las terminales | El backend arrancó |
| 3 | `ng` / `tsx` "no se reconoce" | No se había ejecutado `npm install` en esa carpeta (o falta el CLI de Angular) | `npm install` en la carpeta, y `npx ng serve` | Frontend y backend arrancaron |
| 4 | La pantalla de Perfil salía vacía | Angular sin zone.js solo actualiza con signals y los datos estaban en propiedades normales | Guardar los datos en un `signal` (`cargado`) | Los datos aparecieron |
| 5 | `TS6059` en el backend | El `tsconfig.json` incluía un archivo de otra carpeta | Dejar `"include": ["src"]` | Compiló |
| 6 | El navegador rellenó el correo y la clave del heredero con los del login | Autocompletado de Chrome | `autocomplete="off"` y `"new-password"` en el formulario | Los campos quedaron vacíos |
| 7 | `El token '&&' no es un separador válido` | PowerShell antiguo no entiende `&&` | Ejecutar un comando por línea | Los comandos corrieron |
| 8 | Error 500 al marcar un documento del heredero | PostgreSQL no podía deducir el tipo del parámetro `$3` usado dos veces | Escribir `$3::varchar` en ambos usos | Respondió 200 |
| 9 | `NG5002 Unexpected closing tag "td"` | Una etiqueta de la plantilla quedó mal cerrada al editar | Restaurar el `@else` que faltaba en la celda | Compiló |
| 10 | La descripción cifrada no entraba en la columna | `VARCHAR(300)` es corto para el texto cifrado | Cambiar la columna a `TEXT` (migración 009) | Se guardaron descripciones cifradas |

---

## 12. Despliegue en Vercel

> **ESTADO: PENDIENTE.** El sistema todavía **no está desplegado**: hoy funciona en `localhost`. Esta sección se completará al desplegar. Antes hay que decidir cómo se publica el backend, porque Vercel está pensado para el frontend y funciones sin estado: el backend Express (con su monitoreo cada hora) normalmente se aloja aparte (por ejemplo en Render o Railway).

Pasos previstos:

1. Crear o ingresar a la cuenta de Vercel.
2. Vincular GitHub.
3. Importar el repositorio y elegir la carpeta `frontend`.
4. Cambiar `API_URL` (`frontend/src/app/core/api.config.ts`) para que apunte al backend publicado.
5. Configurar las variables de entorno del backend en su servicio de alojamiento (**no** en el repositorio).
6. Activar `trust proxy` en `backend/src/app.ts` para que la IP registrada sea la real.
7. Ejecutar el despliegue y corregir errores de build.
8. Verificar la URL pública.

URL pública: *(pendiente)*

---

## 13. Puesta en marcha

Se necesitan **dos terminales** abiertas a la vez.

**Terminal 1: backend**

```powershell
cd backend
npm install
npm run dev
```

**Terminal 2: frontend**

```powershell
cd frontend
npm install
npx ng serve
```

**Comprobaciones**

| Qué se comprueba | Cómo | Estado |
|---|---|---|
| Conexión con la base | `http://localhost:5000/api/salud` muestra `"estado":"ok"` | Verificado |
| Login y cierre de sesión | Ingresar con `carlos.ramirez@example.com` y cerrar sesión | Verificado |
| Registros, consultas, modificaciones y eliminaciones | Activos y herederos (crear, editar, eliminar) | Verificado |
| Dashboard y reportes | Muestran datos reales | Backend verificado; revisar la pantalla en el navegador |
| Pagos o servicios externos | Consulta de DNI y correos funcionan; **Culqi pendiente** | Parcial |
| Acceso desde Internet | **Pendiente** (depende del despliegue, sección 12) | Pendiente |

---

## 14. Manual de usuario

> Las capturas se agregan en `docs/capturas/` (ver `docs/capturas/LEEME.md`).

### 14.1 Cómo crear tu cuenta e iniciar sesión

1. Abre el sistema y pulsa **Regístrate**.
2. Escribe tu DNI y pulsa **Buscar**: tus nombres aparecen solos.
3. Completa correo, teléfono y contraseña, y pulsa **Crear cuenta**.
4. Revisa tu correo, escribe el código de 6 dígitos y pulsa **Confirmar y entrar**.
5. La próxima vez, usa **Iniciar Sesión** con tu correo y contraseña. Si la olvidaste, pulsa **¿Olvidaste tu contraseña?**.

### 14.2 Cómo registrar un activo

1. Ve a **Mis Activos** y pulsa **+ Nuevo Activo**.
2. Escribe el nombre y la descripción, y elige el tipo (si es cuenta bancaria, elige el banco).
3. Si quieres, marca "Registrar el monto" y escribe la moneda y la cantidad.
4. Marca a los herederos que lo recibirán y pulsa **Guardar**.
5. Para cambiarlo después, usa los íconos de cada fila: herederos, historial de montos, editar y eliminar.

### 14.3 Cómo designar a un heredero

1. Ve a **Mis Herederos** y pulsa **+ Designar Beneficiario**.
2. Escribe el DNI y pulsa **Buscar**; completa correo, teléfono y parentesco.
3. Pulsa **Enviar código al correo del heredero**, pídele el código de 6 dígitos y escríbelo.
4. Pulsa **Guardar**. Verás su tarjeta con "Identidad verificada".
5. Con **Documentos** eliges qué papeles deberá reunir.
6. Si llegas al límite de tu plan, aparece un aviso con el botón **Ver planes**.

### 14.4 Cómo configurar tu regla de liberación

1. Ve a **Reglas de Liberación**.
2. Escribe cuántos días sin entrar deben pasar antes de iniciar el proceso (o usa un atajo).
3. Elige cuántos herederos deben confirmar y la espera final.
4. Activa el validador externo si quieres protección extra para tus activos financieros.
5. Pulsa **Guardar cambios**.

### 14.5 Cómo consultar el dashboard, los reportes y el historial

- **Dashboard:** tu salud del legado, los pasos pendientes y cuánto margen tienes.
- **Reportes:** resumen de tus activos; el ojito oculta o muestra el dinero.
- **Historial:** ábrelo desde Reportes para ver tus acciones e ingresos.

### 14.6 Si eres heredero

1. Entra a `/portal` (desde el login: **Entra a tu espacio**).
2. Escribe el correo con el que te designaron y pide tu código.
3. Escribe el código de 6 dígitos.
4. Marca cada documento cuando ya lo tengas.

### 14.7 Cómo cerrar sesión

Pulsa **Cerrar sesión** abajo a la izquierda, bajo tu nombre. Tu nombre abre tu **perfil**, donde puedes cambiar tus datos y tu contraseña.

---

## 15. Instalación del proyecto en otra computadora

```powershell
git clone https://github.com/KatherynPardo/LegadoSeguroWeb.git
cd LegadoSeguroWeb
cd backend
npm install
copy .env.example .env
```

Abrir `backend/.env` y completar:

| Variable | Qué poner |
|---|---|
| `DATABASE_URL` | La conexión de **su** proyecto de Supabase (o la compartida, enviada por un canal privado, nunca por GitHub) |
| `JWT_SECRET` | Una frase larga cualquiera |
| `ENCRYPTION_KEY` | Una frase larga; **no cambiarla después** |
| `DNI_PROVIDER` / `DNI_API_TOKEN` | Opcionales; sin token, los nombres se escriben a mano |
| `SMTP_*` | Opcionales; sin ellos, los códigos salen en la consola del backend |

Preparar la base de datos (si usa su propio proyecto): ejecutar en **SQL Editor** las migraciones `001` a `016` de `supabase/migrations/`, en orden.

Encender el backend y, en otra terminal, el frontend:

```powershell
npm run dev
```

```powershell
cd ..
cd frontend
npm install
npx ng serve
```

**Cómo comprobar que quedó bien**

1. `http://localhost:5000/api/salud` responde `"estado":"ok"`.
2. `http://localhost:4200` muestra el login.
3. Ingresar con `carlos.ramirez@example.com` / contraseña de prueba (ver `supabase/migrations/004_usuario_demo.sql`) lleva al dashboard.

Cuentas externas necesarias: Supabase (obligatoria); apiperu.dev y una cuenta de correo (opcionales).

---

## 16. Cierre del proyecto

**Resultados obtenidos.** Módulos terminados: login, registro con verificación, recuperación de contraseña, activos (con bancos, montos cifrados e historial), herederos (con verificación y límite de plan), reglas de liberación, procesos con monitoreo automático, checklist de documentos con portal del heredero, suscripción, dashboard, reportes, historial, administración y perfil. Base de datos de **32 tablas** con 16 migraciones documentadas.

| | |
|---|---|
| **URL pública** | *(pendiente de despliegue)* |
| **GitHub** | https://github.com/KatherynPardo/LegadoSeguroWeb |

**Limitaciones**
- No está desplegado públicamente.
- El cobro con Culqi no está conectado.
- La selfie del heredero se guarda como evidencia, pero no se compara automáticamente con su DNI.
- El portal del validador externo (que aprobaría las entregas de activos financieros) no está hecho.
- No se adjuntan archivos.
- Los correos reales requieren configurar una cuenta SMTP.
- Pruebas responsive y de navegador pendientes de verificar de forma sistemática.

**Mejoras futuras**
- Portal del validador externo y comparación facial de la selfie.
- Indicaciones por activo que viajan al heredero cuando se libera el proceso.
- Cobro con Culqi y despliegue en la nube.
- Notificaciones por SMS o llamada, y autenticador (TOTP).
- Subida de documentos con Supabase Storage.

**Conclusiones del grupo.** *(Se completan al cierre del curso.)*

---

## 17. Checklist final antes de entregar

| | Elemento | Estado |
|---|---|---|
| [x] | El documento inicia desde el análisis y llega hasta la puesta en marcha | Sí |
| [ ] | El documento termina con el sistema **desplegado** | **No: falta el despliegue (sección 12)** |
| [x] | El modelo ER coincide con la base de datos implementada | Sí: el diccionario se genera desde la base real |
| [x] | Cada módulo tiene explicación, código y prueba | Sí |
| [ ] | Cada módulo tiene evidencia (capturas) | **Falta agregar las capturas de `docs/capturas/`** |
| [x] | Los comandos pueden copiarse y ejecutarse | Sí (uno por línea) |
| [x] | Las claves y datos sensibles están ocultos | Sí |
| [x] | GitHub contiene el proyecto actualizado | Sí (cada avance tiene su commit) |
| [ ] | La URL de Vercel funciona | **No: pendiente** |
| [ ] | El sistema fue probado en producción | **No: pendiente** |
| [x] | Existe una sección de errores y soluciones | Sí (10 errores) |
| [x] | Otro estudiante podría reproducir el proyecto siguiendo esta guía | Sí, hasta la puesta en marcha local |

**Criterio central de evaluación:** una persona que no participó en el proyecto debe poder comprender cómo fue construido y repetir el proceso paso a paso.
