# Manual de construcción de LegadoSeguro

**Autoras:** Katheryn Pardo Acosta, Fiorella Stefany Cabanillas Rojas · **Curso:** JavaScript Avanzado (UTP) · **Ciclo:** VI, 2026-02

## 1. Presentación y análisis del proyecto

Este manual explica, paso a paso y en el mismo orden en que se construyó, cómo crear el sistema web **LegadoSeguro**: una plataforma donde una persona registra sus activos digitales (cuentas, correos, tarjetas, etc.), designa a sus herederos y define reglas para entregarlos solo cuando corresponde. Al terminar, otro estudiante debe poder instalar y ejecutar el proyecto siguiendo únicamente este documento.

El sistema tiene tres piezas que se construyen en este orden: la base de datos en Supabase (PostgreSQL), el backend con Express y TypeScript, y el frontend con Angular. El frontend nunca se conecta directo a la base de datos: solo el backend guarda las credenciales, de modo que la contraseña de la base no queda expuesta en el navegador.

```
Angular (puerto 4200)  ──HTTP/JSON──►  Express (puerto 5000)  ──SQL──►  Supabase (PostgreSQL)
```

### 1.1 Nombre del sistema y del grupo

- **Sistema:** LegadoSeguro, plataforma web de gestión de legado y testamento digital.
- **Grupo:** Katheryn Pardo Acosta y Fiorella Stefany Cabanillas Rojas.
- **Curso:** JavaScript Avanzado, Universidad Tecnológica del Perú (UTP), ciclo VI, periodo 2026-02.
- **Repositorio:** https://github.com/KatherynPardo/LegadoSeguroWeb (rama `master`).

### 1.2 Problema que resuelve

Cuando una persona fallece o deja de estar disponible, sus cuentas, correos y datos digitales (incluidos los bancarios) quedan inaccesibles para su familia, o se pierden. No existe una forma ordenada, segura y legal de decidir de antemano quién recibe qué y bajo qué condiciones.

### 1.3 Usuarios principales

- **Propietario (benefactor):** la persona que registra su legado digital y define las reglas de entrega.
- **Heredero (beneficiario):** la persona designada para recibir uno o varios activos.
- **Administrador:** quien mantiene la plataforma: usuarios, auditoría y catálogo de documentos.

### 1.4 Objetivos

**Objetivo general.** Permitir que el propietario registre sus activos digitales, designe herederos y defina reglas para entregarlos solo cuando realmente corresponda, con trazabilidad y datos protegidos.

**Objetivos específicos.**

1. Registrar usuarios con su DNI validado en RENIEC y verificar su correo con un código, con sesiones seguras.
2. Gestionar los activos digitales del propietario, cifrando los datos sensibles (descripciones y montos).
3. Designar herederos, con verificación opcional del correo (designación reservada), y asignarlos a cada activo.
4. Definir una regla de liberación y detectar la inactividad para abrir procesos de liberación de forma automática.
5. Permitir al heredero ingresar a un portal con código, ver su lista de documentos y solicitar la liberación.
6. Ofrecer un dashboard, reportes, historial y auditoría que permitan decidir qué falta configurar.
7. Documentar la construcción como un tutorial que otra persona pueda replicar.

### 1.5 Alcance

Tabla: Alcance del sistema
| Incluye | No incluye (por ahora) |
|---|---|
| Registro e ingreso de usuarios con verificación de correo por código | Cobro real de planes con Culqi |
| Activos digitales con tipo, banco, monto cifrado e historial | Despliegue público en Vercel |
| Herederos con verificación opcional por código y checklist de documentos | Subida de archivos (DNI, certificados) |
| Regla de liberación configurable y procesos de liberación automáticos | Comparación facial automática de la selfie |
| Planes con límite de herederos | Notificaciones por SMS o llamada |
| Dashboard, reportes, historial y auditoría | Aplicación móvil |
| Portal del heredero (ingreso por código) | |

### 1.6 Requerimientos funcionales

Tabla: Requerimientos funcionales
| Código | Requerimiento |
|---|---|
| RF-01 | El usuario puede registrarse (con su DNI validado en RENIEC), confirmar su correo con un código e iniciar y cerrar sesión. |
| RF-02 | El usuario puede recuperar su contraseña con un código enviado a su correo. |
| RF-03 | El propietario puede registrar, listar, editar y eliminar activos digitales, indicando tipo, banco y (opcionalmente) el monto. |
| RF-04 | El propietario puede designar, editar y eliminar herederos; la verificación del correo con un código es opcional (designación reservada). |
| RF-05 | El propietario puede asignar uno o varios herederos a cada activo. |
| RF-06 | El propietario define su regla de liberación: días de inactividad, confirmaciones mínimas, espera final y validador externo. |
| RF-07 | El sistema detecta la inactividad y abre automáticamente un proceso de liberación; el propietario puede cancelarlo. |
| RF-08 | El administrador mantiene el catálogo de documentos que se piden a los herederos; el propietario elige cuáles aplican a cada heredero. |
| RF-09 | El heredero ingresa a su portal con un código y marca los documentos que ya reunió. |
| RF-10 | El sistema ofrece un plan Básico gratuito (2 herederos) y avisa cuándo mejorar de plan. |
| RF-11 | El propietario consulta su dashboard, sus reportes y su historial. |
| RF-12 | El administrador consulta los usuarios y la auditoría, y puede activar o desactivar cuentas. |

### 1.7 Requerimientos no funcionales

Tabla: Requerimientos no funcionales
| Código | Requerimiento | Cómo se cumple |
|---|---|---|
| RNF-01 | Seguridad de contraseñas | bcrypt (no se puede descifrar) |
| RNF-02 | Seguridad de datos sensibles | Descripción, montos e historial de montos cifrados con AES-256-GCM |
| RNF-03 | Sesiones seguras | JWT de 8 horas; el heredero usa un token distinto que no sirve en las pantallas del propietario |
| RNF-04 | Protección contra abuso | Límite de consultas por minuto en las rutas públicas |
| RNF-05 | Trazabilidad | Auditoría con usuario, acción, fecha e IP |
| RNF-06 | Integridad de datos | Llaves foráneas y restricciones (`CHECK`, `UNIQUE`) en la propia base |
| RNF-07 | Diseño responsive | Bootstrap y reglas propias para pantallas pequeñas |
| RNF-08 | Usabilidad | Interfaz basada en el diseño de Figma, con mensajes de error claros |

### 1.8 Roles de usuario

Tabla: Roles de usuario
| Rol | Funciones principales | Restricciones |
|---|---|---|
| **ADMINISTRADOR** | Ver y activar o desactivar usuarios; ver la auditoría; mantener el catálogo de documentos | No puede desactivar su propia cuenta |
| **PROPIETARIO** (benefactor) | Gestionar sus activos, herederos, regla, procesos, plan, reportes e historial | Solo ve y modifica **sus** datos; el plan Básico permite hasta 2 herederos |
| **BENEFICIARIO** (heredero) | Entrar al portal y ver y marcar su checklist de documentos | Entra con el código de su correo; hasta validar su DNI no ve quién lo designó |


### 1.9 Cómo leer este manual

Cada actividad se documenta con una tabla de diez filas, la misma para todos los procedimientos. La captura de pantalla va siempre en la fila **Evidencia**.

Tabla: Elementos que tiene cada procedimiento
| Elemento | Qué contiene |
|---|---|
| Paso | Número y nombre de la actividad |
| Objetivo | Qué se desea conseguir |
| Acción | Qué se hizo y en qué orden |
| Comando / código | El comando o el código exacto, listo para copiar |
| Explicación | Qué hace y por qué se usa |
| Evidencia | Captura de pantalla o resultado |
| Resultado esperado | Qué debe ocurrir si todo está correcto |
| Error frecuente | Problema real encontrado, si aplica |
| Solución | Cómo se corrigió |
| Verificación | Cómo se comprobó que funciona |

### 1.10 Convenciones

- **Ubicación.** Todos los comandos se ejecutan desde una terminal (Símbolo del sistema o PowerShell en Windows). Cada procedimiento indica la carpeta desde donde se ejecuta, escrita desde la raíz: `LegadoSeguroWeb/backend`.
- **Secretos.** Las contraseñas, los tokens y las claves aparecen ocultos (`********`) o con valores de ejemplo. Nunca se publican valores reales.
- **Rama principal.** El repositorio usa la rama `master` (no `main`).
- **Usuario de prueba.** Para las demostraciones se usa el usuario ficticio `carlos.ramirez@example.com`.
- **Correspondencia con el esquema del curso.** Las secciones de este manual siguen el orden del esquema: 1 presentación y análisis, 2 diseño, 3 entorno, 4 creación del proyecto, 5 Git y GitHub, 6 base de datos, 7 módulos, 8 integraciones y 9 dashboard y reportes.

## 2. Diseño del sistema

### 2.1 Modelo entidad-relación

El modelo tiene **33 tablas** organizadas en cinco módulos. Cada figura muestra las entidades de un grupo con sus atributos, sus llaves primarias (PK) y foráneas (FK) y las relaciones con su cardinalidad: la línea con una barra doble es el lado «uno» y la pata de gallo es el lado «muchos». Los diagramas se generaron a partir de la base de datos real, de modo que coinciden con las tablas creadas en la sección 6.

Tabla: Módulos del modelo de datos
| Módulo | Tablas |
|---|---|
| Usuarios y seguridad | `rol`, `usuario`, `token_recuperacion`, `actividad_usuario`, `auditoria`, `codigo_verificacion` |
| Activos y herederos | `tipo_activo`, `activo_digital`, `beneficiario`, `activo_beneficiario`, `validador_externo`, `entidad_financiera`, `historial_monto`, `requisito_documental`, `requisito_tipo`, `documento_heredero`, `detalle_tarjeta` |
| Regla y proceso de liberación | `verificacion_beneficiario`, `alerta_inactividad`, `regla_liberacion`, `reporte_fallecimiento`, `proceso_liberacion`, `proceso_activo`, `confirmacion_beneficiario`, `validacion_externa`, `objecion`, `entrega` |
| Orientación legal y notificaciones | `guia_legal`, `orientacion_legal_generada`, `notificacion` |
| Suscripciones y pagos | `plan`, `suscripcion`, `pago` |

Las 24 tablas originales se crearon en la primera migración; las otras 9 se agregaron al construir cada función nueva (`entidad_financiera`, `historial_monto`, `codigo_verificacion`, `requisito_documental`, `documento_heredero`, `verificacion_beneficiario`, `requisito_tipo`, `detalle_tarjeta`, `alerta_inactividad`). Cada cambio quedó como una migración numerada en `supabase/migrations/`.

**Usuarios y seguridad.** El usuario pertenece a un rol. Sus contraseñas se recuperan con tokens y sus códigos de verificación (registro, recuperación) se guardan con hash.

![Usuarios y seguridad: roles, tokens de recuperación y códigos de verificación](docs/capturas/2-1_er_seguridad.png)

![Usuarios y seguridad: actividad de ingreso y auditoría](docs/capturas/2-1_er_actividad.png)

**Activos y herederos.** Cada activo tiene un tipo, puede estar en una entidad financiera y guarda el historial de sus montos; la tarjeta tiene un detalle propio. Los herederos se asignan a los activos por medio de una tabla intermedia.

![Activos digitales y sus tablas de apoyo](docs/capturas/2-1_er_activos.png)

![Herederos y su asignación a los activos](docs/capturas/2-1_er_herederos.png)

![Documentos que se piden a cada heredero](docs/capturas/2-1_er_documentos.png)

**Regla y proceso de liberación.** La regla del propietario genera alertas de inactividad y, si se cumple, un proceso de liberación con sus activos, confirmaciones, verificación de identidad, objeciones y entrega.

![Regla de liberación y alertas de inactividad](docs/capturas/2-1_er_regla.png)

![Proceso de liberación: reporte, activos y confirmaciones](docs/capturas/2-1_er_proceso.png)

![Proceso de liberación: verificación, objeciones y entrega](docs/capturas/2-1_er_proceso2.png)

![Proceso de liberación: validador externo](docs/capturas/2-1_er_validacion.png)

**Orientación legal, notificaciones, planes y pagos.**

![Orientación legal y notificaciones](docs/capturas/2-1_er_legal.png)

![Planes, suscripciones y pagos](docs/capturas/2-1_er_suscripcion.png)

### 2.2 Diccionario de datos

El diccionario describe cada campo de cada tabla: su tipo, si es llave primaria o foránea, sus restricciones y su significado. Se genera desde la base real: si cambia la base de datos, se ejecuta `npm run diccionario` en la carpeta `backend` y esta sección se reescribe.


**Generado automáticamente desde la base de datos el 3/11/2026** · 33 tablas.

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

#### alerta_inactividad



| Campo | Tipo | PK/FK | Restricción | Descripción |
|---|---|---|---|---|
| id_alerta | INT | PK | NOT NULL; Autonumérico | Identificador único del registro. |
| id_usuario | INT | FK → usuario | NOT NULL | Referencia a usuario. |
| id_regla | INT | FK → regla_liberacion | NOT NULL | Referencia a regla_liberacion. |
| fecha_alerta | TIMESTAMPTZ | — | NOT NULL; Por defecto now() | — |
| fecha_limite | TIMESTAMPTZ | — | NOT NULL | — |
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ENVIADA'; CHECK (((estado)= ANY ((ARRAY['ENVIADA', 'RESUELTA', 'VENCIDA'])[]))) | Estado del registro (por ejemplo ACTIVO o INACTIVO). |

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
| estado | VARCHAR(20) | — | NOT NULL; Por defecto 'ACTIVO' | Estado del registro (por ejemplo ACTIVO o INACTIVO). |
| correo_verificado | BOOLEAN | — | NOT NULL; Por defecto false | false = pendiente de validar; pasa a true con el código del propietario o al validar el DNI en un proceso. |

Valores únicos adicionales: (id_usuario_propietario, dni) WHERE ((estado)::text = 'ACTIVO'::text).

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
| dias_gracia | INT | — | NOT NULL; Por defecto 7; CHECK (((dias_gracia >= 1) AND (dias_gracia <= 60))) | — |

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
| regla_liberacion | alerta_inactividad | id_regla | 1 : N |
| usuario | alerta_inactividad | id_usuario | 1 : N |
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

### 2.3 Arquitectura y tecnologías

```
Usuario ──► Frontend (Angular, puerto 4200) ──HTTP/JSON──► Backend / API (Express, puerto 5000) ──SQL──► Base de datos (Supabase PostgreSQL)
                                                                       │
                                                                       └──► Servicios externos: apiperu.dev (DNI), correo SMTP, (Culqi: pendiente)
```

Tabla: Tecnologías utilizadas
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

## 3. Preparación del entorno de desarrollo

Antes de escribir código se instalan las herramientas y se crean las cuentas que usa el proyecto. Node.js es el entorno que ejecuta JavaScript fuera del navegador y trae el administrador de paquetes npm (OpenJS Foundation, s. f.); Git guarda el historial de cambios (Git, s. f.); y Visual Studio Code es el editor de código (Microsoft, s. f.-a).

### 3.1 Herramientas de desarrollo

:::paso 3.1.1 Instalar Visual Studio Code
Objetivo: Contar con un editor de código para abrir y modificar el proyecto.
Acción:
1. Entrar a la página oficial de Visual Studio Code y descargar el instalador para Windows.
2. Ejecutar el instalador y aceptar las opciones por defecto, marcando **Agregar a PATH**.
3. Abrir una terminal nueva y comprobar la instalación.
Comando:
```
code --version
```
Explicación: `code --version` muestra la versión instalada. Si el comando responde, el programa quedó registrado en el PATH y se podrá abrir cualquier carpeta con `code .`.
Evidencia:
resultado: Resultado de code --version en la terminal
```resultado
> code --version
1.145.3
dcd3ad6e368fbe19d03f37054a40dbaf40d676f4
x64
```
Resultado esperado: La terminal muestra tres líneas: el número de versión, el identificador de la compilación y la arquitectura (x64).
Error frecuente: `"code" no se reconoce como un comando interno o externo`.
Solución: Se instaló sin marcar la opción PATH. Reinstalar marcándola, o cerrar y abrir de nuevo la terminal.
Verificación: Ejecutar `code --version` y ver el número de versión.
:::

:::paso 3.1.2 Instalar Node.js y npm
Objetivo: Instalar el entorno que ejecuta el backend y las herramientas de Angular, junto con npm para descargar librerías.
Acción:
1. Descargar desde la página oficial de Node.js la versión LTS para Windows (el proyecto usa la versión 24).
2. Ejecutar el instalador con las opciones por defecto.
3. Abrir una terminal nueva y comprobar las versiones.
Comando:
```
node -v
npm -v
```
Explicación: `node -v` muestra la versión de Node.js y `npm -v` la de npm, que viene incluido con Node.js. El proyecto necesita Node.js 24 o superior.
Evidencia:
resultado: Resultado de node -v y npm -v en la terminal
```resultado
> node -v
v24.18.0

> npm -v
11.16.0
```
Resultado esperado: Se muestran dos números de versión, por ejemplo `v24.18.0` y `11.16.0`.
Error frecuente: `"node" no se reconoce como un comando interno o externo`.
Solución: La terminal se abrió antes de instalar. Cerrarla y abrir una nueva; si persiste, reinstalar Node.js.
Verificación: Ambos comandos responden con una versión.
:::

:::paso 3.1.3 Instalar Git
Objetivo: Tener control de versiones para guardar el historial del proyecto y subirlo a GitHub.
Acción:
1. Descargar Git para Windows desde su página oficial.
2. Ejecutar el instalador con las opciones por defecto.
3. Abrir una terminal nueva y comprobar la versión.
Comando:
```
git --version
```
Explicación: Muestra la versión de Git instalada. Git se usa en la sección 4 para crear el repositorio y subirlo a GitHub.
Evidencia:
resultado: Resultado de git --version en la terminal
```resultado
> git --version
git version 2.55.0.windows.3
```
Resultado esperado: Aparece `git version 2.x.x`.
Error frecuente: `"git" no se reconoce como un comando interno o externo`.
Solución: Cerrar y abrir la terminal para que lea el PATH actualizado.
Verificación: `git --version` muestra la versión.
:::

:::paso 3.1.4 Verificar las versiones instaladas
Objetivo: Confirmar que las tres herramientas están disponibles antes de crear el proyecto.
Acción: Abrir una terminal y ejecutar los tres comandos de verificación seguidos.
Comando:
```
node -v
npm -v
git --version
```
Explicación: Es la comprobación mínima de que el entorno está listo. Si alguno falla, se vuelve al procedimiento de instalación correspondiente.
Evidencia:
![Versiones de Node.js, npm y Git](docs/capturas/03-versiones.png)
Resultado esperado: Tres líneas con las versiones de Node.js, npm y Git.
Verificación: Las tres respuestas son números de versión, sin mensajes de error.
:::

:::paso 3.1.5 Instalar el CLI de Angular
Objetivo: Disponer del comando `ng`, que crea y ejecuta proyectos Angular (Angular, s. f.).
Acción:
1. Abrir una terminal.
2. Instalar el CLI de forma global.
3. Comprobar la instalación con `ng version`.
Comando:
```
npm install -g @angular/cli
ng version
```
Explicación: `npm install` descarga el paquete y la opción `-g` lo instala en todo el equipo, no solo en un proyecto. `ng version` muestra la versión del CLI, de Node.js y de npm.
Evidencia:
![Comando de instalación de Angular CLI](docs/capturas/02_instalar_clic_angular.png)
![Resultado de la instalación de Angular CLI](docs/capturas/02_instalar_clic_angular_b.png)
![Versión de Angular CLI con ng version](docs/capturas/02_instalar_clic_angular_version.png)
Resultado esperado: La instalación termina con `added 5 packages` y `ng version` muestra el logotipo de Angular CLI con su versión.
Error frecuente: PowerShell no deja ejecutar `ng` porque la política de ejecución bloquea los scripts.
Solución: Ejecutar una vez en PowerShell: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. También se puede usar `npx ng ...` o el Símbolo del sistema.
Verificación: `ng version` responde con la versión de Angular CLI.
:::

:::paso 3.1.6 Instalar las extensiones de Visual Studio Code
Objetivo: Facilitar la escritura de código con ayudas del editor.
Acción:
1. Abrir Visual Studio Code y entrar al panel **Extensiones** (Ctrl + Shift + X).
2. Buscar cada extensión y pulsar **Instalar**.
Explicación: Las extensiones agregan funciones al editor. Extensión utilizada: **Angular Language Service** (`angular.ng-template`), la que recomienda el propio `ng new` en `.vscode/extensions.json`; da autocompletado y errores dentro de las plantillas HTML de Angular. ==COMPLETAR con las demás extensiones que usó el grupo==.
Evidencia:
![Extensiones instaladas en Visual Studio Code](docs/capturas/2-1-6_extensiones.png)
Resultado esperado: Las extensiones aparecen en la lista **Instaladas**.
Verificación: Abrir un archivo `.ts` y comprobar que el editor colorea y sugiere código.
:::

### 3.2 Cuentas en servicios externos

:::paso 3.2.1 Crear la cuenta de GitHub
Objetivo: Tener un lugar en la nube donde guardar el código y trabajar en equipo.
Acción:
1. Entrar a la página de registro de GitHub y completar correo, contraseña y nombre de usuario.
2. Confirmar el correo con el código que llega a la bandeja.
Explicación: GitHub aloja los repositorios de Git (GitHub, s. f.). El mismo usuario sirve después para entrar a Supabase y a Vercel.
Evidencia:
![Perfil de la cuenta de GitHub](docs/capturas/2-2-1_github_cuenta.png)
Resultado esperado: El perfil de GitHub abre con el nombre de usuario elegido.
Verificación: Iniciar sesión en GitHub con las credenciales creadas.
:::

:::paso 3.2.2 Crear la cuenta de Supabase
Objetivo: Disponer de la base de datos PostgreSQL en la nube.
Acción:
1. Entrar a la página de Supabase y pulsar **Start your project**.
2. Elegir **Continue with GitHub** y autorizar el acceso.
Explicación: Supabase ofrece una base de datos PostgreSQL gratuita y un panel web para administrarla (Supabase, s. f.). Entrar con GitHub evita crear otra contraseña.
Evidencia:
![Panel principal de Supabase](docs/capturas/2-2-2_supabase_cuenta.png)
Resultado esperado: Se abre el panel de Supabase con la lista de proyectos (vacía al inicio).
Verificación: Cerrar sesión y volver a entrar con GitHub.
:::

:::paso 3.2.3 Crear la cuenta de Vercel
Objetivo: Preparar la cuenta donde se publicará el frontend.
Acción:
1. Entrar a la página de Vercel y pulsar **Sign Up**.
2. Elegir **Continue with GitHub**.
Explicación: Vercel publica aplicaciones web a partir de un repositorio de GitHub (Vercel, s. f.). La cuenta se crea ahora; el despliegue queda como mejora pendiente del proyecto.
Evidencia:
![Panel principal de Vercel](docs/capturas/2-2-3_vercel_cuenta.png)
Resultado esperado: Se abre el panel de Vercel.
Verificación: Iniciar sesión en Vercel con GitHub.
:::

:::paso 3.2.4 Obtener el token para consultar DNI (opcional)
Objetivo: Permitir que el sistema busque los nombres de una persona por su DNI.
Acción:
1. Crear una cuenta en un servicio de consulta de DNI (apis.net.pe o apiperu.dev).
2. Copiar el token que entrega el panel.
3. Guardarlo más adelante en el archivo `.env` (procedimiento 6.6), nunca en el código.
Explicación: El token identifica a la cuenta ante el servicio. Si no se configura, el botón **Buscar** del sistema avisa que no está disponible y los nombres se escriben a mano.
Evidencia:
![Token de la API de DNI (valor oculto)](docs/capturas/2-2-4_token_dni.png)
Resultado esperado: El panel muestra el token, que se tapa en la captura.
Verificación: El token queda copiado en un lugar privado.
:::

:::paso 3.2.5 Crear una contraseña de aplicación de Gmail (opcional)
Objetivo: Poder enviar los correos con los códigos de verificación desde una cuenta de Gmail.
Acción:
1. En la cuenta de Google, activar la verificación en dos pasos.
2. Entrar a **Contraseñas de aplicaciones** y crear una con el nombre `LegadoSeguro`.
3. Copiar la clave de 16 caracteres.
Explicación: Gmail no acepta la contraseña normal desde un programa; exige una contraseña de aplicación, que se puede revocar sin cambiar la contraseña de la cuenta. Sin esta configuración, el sistema muestra los correos en la consola del backend y funciona igual para pruebas.
Evidencia:
![Contraseña de aplicación de Google (valor oculto)](docs/capturas/2-2-5_gmail_clave_app.png)
Resultado esperado: Google muestra la clave de 16 caracteres una sola vez.
Error frecuente: Hotmail y Outlook suelen bloquear el acceso SMTP con contraseña.
Solución: Usar Gmail, que es más fiable para este fin.
Verificación: Se completa más adelante en el procedimiento 8.3 (envío real de un código).
:::

## 4. Creación inicial del proyecto

En esta sección se crea la carpeta del proyecto y los esqueletos del backend y del frontend. Primero se arma el backend (sin ejecutarlo, porque necesita la base de datos) y después el frontend, que sí se puede ejecutar desde el inicio. El backend se enciende por primera vez en la sección 5, cuando ya existe la base de datos.

### 4.1 Carpeta raíz y control de versiones

:::paso 4.1.1 Crear la carpeta del proyecto e iniciar Git
Objetivo: Tener una carpeta raíz que contenga todo el proyecto y que registre sus cambios con Git.
Acción:
1. Abrir una terminal en la ubicación donde se guardará el proyecto.
2. Crear la carpeta, entrar en ella e iniciar el repositorio.
Comando:
```
mkdir LegadoSeguroWeb
cd LegadoSeguroWeb
git init
```
Explicación: `mkdir` crea la carpeta, `cd` entra en ella y `git init` crea el repositorio local (la carpeta oculta `.git`). La ruta de tu equipo puede ser otra; si tiene espacios, escríbela entre comillas.
Evidencia:
![Creación de la carpeta del proyecto e inicio de Git](docs/capturas/crear_carpeta_proyecto.png)
Resultado esperado: Git responde `Initialized empty Git repository`.
Error frecuente: `cd` falla porque la ruta tiene espacios.
Solución: Escribir la ruta entre comillas, por ejemplo `cd "E:\UTP\CICLO 06\LegadoSeguroWeb"`.
Verificación: La terminal queda dentro de `LegadoSeguroWeb` y `git status` responde sin error.
:::

La estructura final de la raíz es la siguiente; cada carpeta se crea en el orden de este manual.

```
LegadoSeguroWeb/
├── supabase/migrations/   scripts SQL de la base de datos
├── backend/               API con Express (puerto 5000)
├── frontend/              pantallas con Angular (puerto 4200)
├── docs/capturas/         capturas de pantalla de la documentación
└── *.md                   README, manual, documentación y avances
```

### 4.2 Backend con Express y TypeScript

:::paso 4.2.1 Crear el proyecto del backend
Objetivo: Crear la carpeta `backend` con su archivo `package.json`.
Acción:
1. Ubicarse en `LegadoSeguroWeb`.
2. Crear la carpeta `backend`, entrar en ella e iniciar el proyecto de Node.js.
Comando:
```
mkdir backend
cd backend
npm init -y
```
Explicación: `npm init -y` genera `package.json`, el archivo que describe el proyecto y guarda la lista de librerías. La opción `-y` acepta todas las respuestas por defecto. Desde aquí, hasta terminar la sección 4.2, los comandos se ejecutan en `LegadoSeguroWeb/backend`.
Evidencia:
resultado: Resultado de npm init -y en la carpeta backend (carpeta limpia de verificación)
```resultado
> npm init -y
Wrote to C:\Users\Katy\corrida_manual\LegadoSeguroWeb\backend\package.json:

{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs"
}
```
Resultado esperado: Se crea `package.json` dentro de `backend`.
Verificación: El archivo `backend/package.json` existe y tiene el nombre y la versión del proyecto.
:::

:::paso 4.2.2 Instalar las librerías del backend
Objetivo: Descargar las librerías que usa el servidor.
Acción: Con la terminal en `LegadoSeguroWeb/backend`, instalar las librerías de ejecución y después las de desarrollo.
Comando:
```
npm install express cors pg dotenv bcryptjs jsonwebtoken nodemailer
npm install -D typescript tsx @types/node @types/express @types/cors @types/pg @types/jsonwebtoken @types/nodemailer
```
Explicación: El primer comando instala las librerías que el servidor necesita para funcionar y el segundo, con `-D`, las que solo se usan al programar.
- `express`: servidor web y rutas (Express, s. f.).
- `cors`: permite que Angular (puerto 4200) llame a la API (puerto 5000).
- `pg`: conexión a PostgreSQL.
- `dotenv`: lee el archivo `.env`.
- `bcryptjs`: cifra las contraseñas.
- `jsonwebtoken`: crea y valida las sesiones (JWT).
- `nodemailer`: envía correos.
- `typescript` y `tsx`: lenguaje TypeScript y ejecutor con recarga automática (Microsoft, s. f.-b).
- `@types/...`: descripciones de tipos para que TypeScript entienda cada librería.
Evidencia:
resultado: Resultado de los dos comandos npm install del backend (carpeta limpia de verificación)
```resultado
> npm install express cors pg dotenv bcryptjs jsonwebtoken nodemailer
added 98 packages, and audited 99 packages in 21s

33 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

> npm install -D typescript tsx @types/node @types/express @types/cors @types/pg @types/jsonwebtoken @types/nodemailer
added 21 packages, and audited 120 packages in 22s

33 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```
Resultado esperado: npm termina con `added N packages` y crea la carpeta `node_modules` y el archivo `package-lock.json`.
Error frecuente: Falla la descarga por falta de internet o por una VPN.
Solución: Revisar la conexión, apagar la VPN y repetir el comando.
Verificación: `package.json` lista las librerías en `dependencies` y `devDependencies`.
:::

:::paso 4.2.3 Configurar TypeScript y los scripts de arranque
Objetivo: Indicar cómo se compila el código y cómo se enciende el servidor.
Acción:
1. Crear el archivo `backend/tsconfig.json` con la configuración siguiente.
2. En `package.json`, reemplazar la sección `scripts`.
Comando:
```
// backend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src"]
}

// backend/package.json (sección scripts)
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js"
}
```
Explicación: `rootDir` y `outDir` separan el código fuente (`src`) del compilado (`dist`); `strict` activa las comprobaciones estrictas de TypeScript. El script `dev` ejecuta el servidor con recarga automática cada vez que se guarda un archivo, `build` compila y `start` ejecuta lo compilado.
Evidencia:
resultado: Resultado de npx tsc --version en la carpeta backend
```resultado
> npx tsc --version
Version 5.9.3
```
Resultado esperado: Los dos archivos quedan guardados con el contenido indicado.
Verificación: Ejecutar `npx tsc --version` y ver la versión de TypeScript.
:::

:::paso 4.2.4 Organizar el código por capas
Objetivo: Separar las responsabilidades del backend para que sea ordenado y fácil de explicar.
Acción: Dentro de `backend`, crear la carpeta `src` con las subcarpetas siguientes.
Comando:
```
backend/src/
├── config/        Variables de entorno y conexión (env, database)
├── models/        Tipos de datos (*.model.ts)
├── services/      Consultas SQL (*.service.ts)
├── controllers/   Reciben el pedido y responden (*.controller.ts)
├── middlewares/   Sesión, rol y límite de pedidos
├── routes/        URLs de la API (*.routes.ts, index.ts)
├── utils/         Funciones de apoyo (cifrado, validaciones)
├── scripts/       Tareas de una sola vez (se usa más adelante)
├── app.ts         Configura Express
└── server.ts      Enciende el servidor
```
Explicación: Cada pedido sigue el camino **ruta → controlador → servicio → base de datos**. La ruta recibe la URL, el controlador valida y responde, y el servicio contiene el SQL. Las consultas usan parámetros (`$1`, `$2`) en lugar de pegar los valores en el texto, para evitar la inyección SQL. Las carpetas se van llenando módulo por módulo; al inicio solo se crean las que se usan.
Evidencia:
resultado: Subcarpetas de backend/src (carpeta real del proyecto)
```resultado
> ls -d backend/src/*/
backend/src/config/
backend/src/controllers/
backend/src/middlewares/
backend/src/models/
backend/src/routes/
backend/src/scripts/
backend/src/services/
backend/src/utils/
```
Resultado esperado: La carpeta `src` muestra las subcarpetas de las capas.
Verificación: Cada subcarpeta existe dentro de `backend/src`.
:::

:::paso 4.2.5 Configurar las variables de entorno y la conexión a la base
Objetivo: Leer la configuración desde el archivo `.env` y preparar la conexión a PostgreSQL sin escribir contraseñas en el código.
Acción: Crear los archivos `config/env.ts` y `config/database.ts`.
Comando:
```
// backend/src/config/env.ts
import dotenv from 'dotenv';

dotenv.config(); // carga el archivo .env

export const PORT = Number(process.env.PORT) || 5000;
export const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en el archivo .env (revisa .env.example)');
}

// backend/src/config/database.ts
import { Pool } from 'pg';
import { DATABASE_URL } from './env';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Supabase exige conexión cifrada (SSL)
});
```
Explicación: `env.ts` es el único archivo que toca `process.env`; el resto del código importa las constantes ya validadas. `Pool` mantiene un grupo de conexiones abiertas y las reutiliza en lugar de abrir una nueva en cada consulta. La contraseña de la base vive solo en el `.env`, que no se sube a GitHub. En los módulos siguientes se agregan a `env.ts` más variables (clave de sesión, cifrado, correo y DNI).
Evidencia:
resultado: Archivos de la carpeta config (git ls-files)
```resultado
> git ls-files backend/src/config
backend/src/config/database.ts
backend/src/config/env.ts
```
Resultado esperado: Los dos archivos existen en `backend/src/config`.
Error frecuente: Al encender el servidor aparece `Falta DATABASE_URL en el archivo .env`.
Solución: Crear el archivo `.env` (procedimiento 6.6).
Verificación: Se comprueba en el procedimiento 6.7, cuando el servidor se conecta a la base.
:::

:::paso 4.2.6 Crear la aplicación y el servidor de Express
Objetivo: Configurar Express y encender el servidor en el puerto 5000.
Acción: Crear los archivos `app.ts` y `server.ts`.
Comando:
```
// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

app.use(cors());          // permite que Angular (puerto 4200) se conecte
app.use(express.json());  // recibe datos en formato JSON

app.get('/', (_req, res) => {
  res.send('Servidor de LegadoSeguroWeb activo');
});

app.use('/api', routes);  // todas las rutas de la API empiezan con /api

export default app;

// backend/src/server.ts
import app from './app';
import { PORT } from './config/env';

app.listen(PORT, () => {
  console.log(`Servidor LegadoSeguroWeb en http://localhost:${PORT}`);
});
```
Explicación: `app.ts` solo configura Express (middlewares y rutas) y `server.ts` solo lo enciende; separarlos permite probar la aplicación sin abrir un puerto. `cors()` autoriza al frontend a llamar a la API y `express.json()` convierte el cuerpo de cada pedido en un objeto.
Evidencia:
resultado: Archivos app.ts y server.ts (git ls-files)
```resultado
> git ls-files backend/src/app.ts backend/src/server.ts
backend/src/app.ts
backend/src/server.ts
```
Resultado esperado: Los dos archivos existen y se guardan sin errores de sintaxis.
Verificación: Se comprueba al encender el servidor en el procedimiento 6.7.
:::

:::paso 4.2.7 Crear la ruta de salud
Objetivo: Tener una ruta que confirme que el servidor y la base de datos responden.
Acción: Crear el servicio, el controlador y la ruta de salud, y registrarla en `routes/index.ts`.
Comando:
```
// backend/src/services/salud.service.ts
import { pool } from '../config/database';

export async function horaDeLaBaseDeDatos(): Promise<string> {
  const resultado = await pool.query('SELECT NOW() AS hora_bd');
  return resultado.rows[0].hora_bd;
}

// backend/src/controllers/salud.controller.ts
import { Request, Response } from 'express';
import { horaDeLaBaseDeDatos } from '../services/salud.service';

export async function comprobarSalud(_req: Request, res: Response) {
  try {
    res.json({ estado: 'ok', horaBaseDeDatos: await horaDeLaBaseDeDatos() });
  } catch (error) {
    console.error('Error al conectar con la BD:', error);
    res.status(500).json({ estado: 'error', mensaje: 'No se pudo conectar a la base de datos' });
  }
}

// backend/src/routes/salud.routes.ts
import { Router } from 'express';
import { comprobarSalud } from '../controllers/salud.controller';

const router = Router();
router.get('/', comprobarSalud); // GET /api/salud
export default router;

// backend/src/routes/index.ts (versión inicial)
import { Router } from 'express';
import saludRoutes from './salud.routes';

const router = Router();
router.use('/salud', saludRoutes);
export default router;
```
Explicación: Es el primer ejemplo completo del camino ruta → controlador → servicio. El servicio le pregunta la hora a la base con `SELECT NOW()`; si la consulta funciona, la conexión es correcta. `routes/index.ts` agrupa todas las rutas bajo `/api`; en cada módulo se le agregará una línea.
Evidencia:
resultado: Archivos de la ruta de salud (git ls-files)
```resultado
> git ls-files backend/src/routes backend/src/controllers/salud.controller.ts backend/src/services/salud.service.ts
backend/src/controllers/salud.controller.ts
backend/src/routes/index.ts
backend/src/routes/salud.routes.ts
backend/src/services/salud.service.ts
```
Resultado esperado: Quedan cuatro archivos nuevos en `services`, `controllers` y `routes`.
Verificación: Se comprueba en el procedimiento 6.7 abriendo `http://localhost:5000/api/salud`.
:::

### 4.3 Frontend con Angular

:::paso 4.3.1 Crear el proyecto de Angular
Objetivo: Generar la aplicación del frontend con la estructura base de Angular.
Acción:
1. Ubicarse en `LegadoSeguroWeb` (la raíz, no dentro de `backend`).
2. Ejecutar el comando de creación y responder las preguntas del asistente.
Comando:
```
cd LegadoSeguroWeb
ng new frontend --style=css --ssr=false --routing --zoneless --ai-config=none --skip-git
```
Explicación: `ng new` crea la carpeta `frontend` al lado de `backend` con el proyecto listo. Las opciones elegidas son: estilos **CSS**, renderizado en el servidor (SSR) **No**, rutas (`--routing`) **Sí**, sin `zone.js` (`--zoneless`) **Sí** y sin archivos de configuración de asistentes de IA. Si se ejecuta solo `ng new frontend`, el asistente hace estas mismas preguntas y se responden igual. `--skip-git` evita que Angular cree otro repositorio dentro de `frontend`.
Evidencia:
resultado: Resultado de ng new frontend (carpeta limpia de verificación)
```resultado
> ng new frontend --style=css --ssr=false --routing --zoneless --ai-config=none --skip-git
CREATE frontend/.prettierrc (173 bytes)
CREATE frontend/angular.json (1982 bytes)
CREATE frontend/package.json (784 bytes)
CREATE frontend/README.md (1520 bytes)
CREATE frontend/tsconfig.json (939 bytes)
CREATE frontend/.editorconfig (331 bytes)
CREATE frontend/.gitignore (666 bytes)
CREATE frontend/tsconfig.app.json (412 bytes)
CREATE frontend/tsconfig.spec.json (423 bytes)
CREATE frontend/.vscode/extensions.json (134 bytes)
CREATE frontend/.vscode/launch.json (490 bytes)
CREATE frontend/.vscode/tasks.json (1020 bytes)
CREATE frontend/src/main.ts (228 bytes)
CREATE frontend/src/index.html (307 bytes)
CREATE frontend/src/styles.css (81 bytes)
CREATE frontend/src/app/app.spec.ts (706 bytes)
CREATE frontend/src/app/app.ts (303 bytes)
CREATE frontend/src/app/app.css (0 bytes)
CREATE frontend/src/app/app.html (20488 bytes)
CREATE frontend/src/app/app.config.ts (322 bytes)
CREATE frontend/src/app/app.routes.ts (80 bytes)
CREATE frontend/public/favicon.ico (15086 bytes)
- Installing packages (npm)...
[OK] Packages installed successfully.
```
![Estructura de carpetas del frontend en el explorador de VS Code](docs/capturas/05-estructura.png)
Resultado esperado: Angular crea los archivos e instala las dependencias; la terminal termina sin errores.
Error frecuente: `This command is not available when running the Angular CLI outside a workspace` al usar otros comandos de `ng`.
Solución: Ese comando se ejecutó fuera de la carpeta del proyecto. Entrar con `cd frontend`.
Verificación: Existe la carpeta `LegadoSeguroWeb/frontend` con su `package.json`.
:::

:::paso 4.3.2 Ejecutar el frontend por primera vez
Objetivo: Comprobar que el proyecto de Angular arranca y se ve en el navegador.
Acción:
1. Entrar a la carpeta `frontend`.
2. Encender el servidor de desarrollo.
3. Abrir `http://localhost:4200` en el navegador.
Comando:
```
cd frontend
ng serve
```
Explicación: `ng serve` compila la aplicación y la sirve en el puerto 4200 con recarga automática. Si la carpeta no tiene `node_modules` (por ejemplo, tras clonar el proyecto), se ejecuta antes `npm install`.
Evidencia:
resultado: Resultado de ng serve en la carpeta frontend
```resultado
> ng serve
❯ Building...
✔ Building...
Initial chunk files | Names         | Raw size
main.js             | main          | 48.77 kB | 
styles.css          | styles        | 95 bytes | 

                    | Initial total | 48.86 kB

Application bundle generation complete. [7.138 seconds] - 2026-11-12T18:04:18.748Z

Watch mode enabled. Watching for file changes...
NOTE: Raw file sizes do not reflect development server per-request transformations.
  ➜  Local:   http://localhost:4200/
```
![Aplicación de Angular en el navegador](docs/capturas/3-3-2_angular_navegador.png)
Resultado esperado: La consola indica que el servidor está disponible en `http://localhost:4200` y el navegador muestra la página inicial de Angular.
Error frecuente: `ng` no se reconoce o la política de PowerShell lo bloquea.
Solución: Ver el procedimiento 3.1.5, o usar `npx ng serve`.
Verificación: El navegador muestra la página inicial de Angular en `localhost:4200`.
:::

:::paso 4.3.3 Agregar Bootstrap y la fuente Inter
Objetivo: Aplicar la tipografía y el sistema de estilos del diseño de la aplicación.
Acción: En `frontend/src/index.html`, dentro de `<head>`, agregar los dos enlaces.
Comando:
```
<!-- frontend/src/index.html, dentro de <head> -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
```
Explicación: El primer enlace descarga la fuente Inter de Google Fonts y el segundo carga Bootstrap 5.3.3, una biblioteca de estilos (Bootstrap, s. f.) que da botones, formularios y una cuadrícula adaptable a celulares.
Evidencia:
resultado: Líneas de index.html con la fuente Inter y Bootstrap (grep)
```resultado
> grep -n "fonts.googleapis\|bootstrap" frontend/src/index.html
9:  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
10:  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
```
Resultado esperado: Al recargar, el texto de la página cambia a la fuente Inter.
Verificación: En el navegador, con F12 → pestaña Network, se ve la carga de `bootstrap.min.css`.
:::

:::paso 4.3.4 Definir los colores del diseño
Objetivo: Centralizar la paleta de colores de LegadoSeguro para usarla en todas las pantallas.
Acción: Reemplazar el inicio de `frontend/src/styles.css` por las variables de color.
Comando:
```
/* frontend/src/styles.css */
:root {
  --bs-primary: #1A4E8A;      /* azul marino */
  --bs-primary-rgb: 26, 78, 138;
  --bs-body-bg: #F2F5FA;      /* fondo */
  --bs-body-color: #1F2937;
  --bs-border-radius: 8px;
  --bs-body-font-family: 'Inter', sans-serif;

  --lg-dorado: #C9962C;       /* acento */
  --lg-exito: #1E6B36;
  --lg-advertencia: #D68A26;
  --lg-error: #B23A3A;
}
```
Explicación: Las variables `--bs-*` sobrescriben los colores de Bootstrap y las `--lg-*` son propias del proyecto. Cambiar un color en un solo lugar lo actualiza en toda la aplicación.
Evidencia:
resultado: Inicio de styles.css con las variables de color (head -14)
```resultado
> head -14 frontend/src/styles.css
/* You can add global styles to this file, and also import other style files */
:root {
  /* Colores de LegadoSeguro (Figma) */
  --bs-primary: #1A4E8A;
  --bs-primary-rgb: 26, 78, 138;
  --bs-body-bg: #F2F5FA;
  --bs-body-color: #1F2937;
  --bs-border-color: #D9D9D9;
  --bs-border-radius: 8px;
  --bs-body-font-family: 'Inter', sans-serif;

  --lg-dorado: #C9962C;
  --lg-exito: #1E6B36;
  --lg-advertencia: #D68A26;
```
Resultado esperado: El fondo de la página pasa a un gris azulado claro.
Verificación: Los botones primarios de Bootstrap se ven en azul marino.
:::

:::paso 4.3.5 Organizar el código del frontend
Objetivo: Separar pantallas, piezas reutilizables, servicios y modelos.
Acción: Dentro de `frontend/src/app`, crear las carpetas siguientes (se van llenando módulo por módulo).
Comando:
```
frontend/src/app/
├── components/   Piezas reutilizables (menú, ventana emergente, logo)
├── core/         Configuración y seguridad (api.config, interceptor, guardias)
├── models/       Interfaces de datos (*.model.ts)
├── pages/        Pantallas con ruta (login, dashboard, activos, herederos...)
└── services/     Conexión con el backend (HttpClient)
```
Explicación: `pages` contiene las pantallas completas, cada una con su ruta; `components` las piezas pequeñas que se reutilizan; `services` hablan con la API del backend; `models` describen la forma de los datos. Este proyecto de Angular funciona sin `zone.js`: la pantalla solo se actualiza cuando cambia un `signal`, por eso los datos que llegan del backend se guardan en signals (por ejemplo, `activos = signal<Activo[]>([])`).
Evidencia:
resultado: Carpetas de frontend/src/app
```resultado
> ls -d frontend/src/app/*/
frontend/src/app/components/
frontend/src/app/core/
frontend/src/app/models/
frontend/src/app/pages/
frontend/src/app/services/
```
Resultado esperado: La carpeta `app` muestra las cinco subcarpetas.
Error frecuente: Los datos llegan del backend, pero la pantalla no se actualiza.
Solución: Guardar los datos en un `signal` en vez de una variable común.
Verificación: Las cinco carpetas existen dentro de `frontend/src/app`.
:::

## 5. Git y GitHub

Git guarda el historial del proyecto en el equipo y GitHub lo respalda en la nube (GitHub, s. f.). En esta sección se prepara el repositorio, se hace el primer commit y se sube a GitHub. A partir de aquí, cada módulo del manual termina con un commit.

:::paso 5.1 Excluir archivos que no deben subirse
Objetivo: Evitar que secretos y archivos pesados lleguen a GitHub.
Acción:
1. Crear el archivo `.gitignore` en la raíz de `LegadoSeguroWeb`.
2. Crear también `backend/.gitignore` con tres líneas (`node_modules/`, `dist/` y `.env`), para que el backend proteja su `.env` aunque se abra como proyecto aparte. El frontend ya trae el suyo, generado por `ng new`.
Comando:
```
# .gitignore (raíz)
# Dependencias y compilados
node_modules/
dist/
.angular/

# Secretos: nunca se suben
.env
*.env.local

# Sistema y editor
.DS_Store
Thumbs.db
```
Explicación: Git ignora todo lo que aparece en este archivo. `.env` guarda contraseñas y claves; `node_modules` se puede volver a descargar con `npm install`; `dist` es código compilado.
Evidencia:
resultado: Regla de .gitignore que protege el archivo .env (git check-ignore)
```resultado
> git check-ignore -v backend/.env backend/node_modules
backend/.gitignore:3:.env	backend/.env
backend/.gitignore:1:node_modules/	backend/node_modules
```
Resultado esperado: `git status` ya no lista `node_modules` ni `.env`.
Verificación: Ejecutar `git status` y comprobar que esos archivos no aparecen.
:::

:::paso 5.2 Hacer el primer commit
Objetivo: Guardar la primera versión del proyecto en el historial local.
Acción: Con la terminal en `LegadoSeguroWeb`, agregar los archivos y confirmar el commit.
Comando:
```
git add .
git commit -m "Primer commit: backend, frontend y base de datos de LegadoSeguro"
```
Explicación: `git add .` selecciona todos los cambios y `git commit -m` los guarda con un mensaje que describe qué se hizo. Los mensajes deben ser claros: cada commit cuenta una parte de la historia del proyecto.
Evidencia:
resultado: Primer commit del repositorio (git show --stat)
```resultado
> git show --stat a2a61ca
commit a2a61ca
Fecha:   2026-10-27
Mensaje: Primer commit: backend, frontend y base de datos de LegadoSeguro

 backend/.env.example                               |    8 +
 backend/.gitignore                                 |    3 +
 backend/package-lock.json                          | 1707 +++++
 backend/package.json                               |   27 +
 backend/src/app.ts                                 |   20 +
 backend/src/config/database.ts                     |   14 +
 backend/src/config/env.ts                          |   14 +
 ...
 60 files changed, 10051 insertions(+)
```
Resultado esperado: Git muestra el resumen de archivos creados en el commit.
Error frecuente: `Author identity unknown` (Git no sabe quién eres).
Solución: Configurar el nombre y el correo una vez: `git config --global user.name "Tu nombre"` y `git config --global user.email "tu@correo.com"`.
Verificación: `git log --oneline` muestra el commit "Primer commit: backend, frontend y base de datos de LegadoSeguro".
:::

:::paso 5.3 Crear el repositorio en GitHub y subir el proyecto
Objetivo: Guardar el proyecto en la nube y compartirlo con el equipo.
Acción:
1. En GitHub, crear un repositorio nuevo llamado `LegadoSeguroWeb`, sin README ni `.gitignore`.
2. Copiar la dirección del repositorio.
3. En la terminal, conectar el repositorio local con el remoto y subir.
Comando:
```
git branch -M master
git remote add origin https://github.com/KatherynPardo/LegadoSeguroWeb.git
git push -u origin master
```
Explicación: `git branch -M master` fija el nombre de la rama principal; `git remote add origin` registra la dirección del repositorio de GitHub con el nombre `origin`; `git push -u origin master` sube la rama y la deja enlazada para los siguientes `git push`. El esquema del curso usa `main`; este proyecto usa `master`.
Evidencia:
![Repositorio del proyecto en GitHub](docs/capturas/06-github.png)
Resultado esperado: GitHub muestra los archivos del proyecto y el primer commit.
Error frecuente: `Authentication failed` al subir.
Solución: Iniciar sesión en GitHub desde la ventana que abre Git, o usar un token personal en lugar de la contraseña.
Verificación: Abrir la dirección del repositorio en el navegador y ver los archivos.
:::

:::paso 5.4 Registrar los cambios durante el desarrollo
Objetivo: Mantener el repositorio actualizado con mensajes descriptivos.
Acción: Después de terminar cada módulo, guardar y subir los cambios.
Comando:
```
git add .
git commit -m "Describe el cambio, por ejemplo: Login con JWT y bcrypt"
git push
```
Explicación: Se hace un commit por cada avance coherente, con un mensaje que diga qué se logró. `git push` envía los commits a GitHub. El `.env` está ignorado, así que las claves no se suben. Enlace final del repositorio: https://github.com/KatherynPardo/LegadoSeguroWeb
Evidencia:
resultado: Últimos commits del proyecto (git log --oneline)
```resultado
> git log --oneline
1b71c8f Capturas del portal, documentacion enlazada y manual en Word actualizado
347f8c6 Correos HTML, limpieza de codigo, migracion 021, manual y capturas
5ed71cb Correos con diseño HTML de LegadoSeguro
060031f Limpieza de codigo sin uso y migracion para quitar la clave del heredero
0d4a942 Alerta previa con plazo de gracia, boton de monitoreo para el administrador y datos de demostracion
b3e36c1 Evita duplicados por doble clic: boton desactivado, pedidos en fila y DNI unico en la base
...
```
Resultado esperado: `git log --oneline` muestra los commits en orden, del más reciente al más antiguo.
Verificación: En GitHub, la pestaña **Commits** lista los mismos mensajes.
:::

## 6. Base de datos en Supabase

La base de datos se crea en Supabase a partir del modelo entidad-relación y de los scripts SQL de la carpeta `supabase/migrations`. Cada script se ejecuta una sola vez y en orden; en este manual cada migración se ejecuta en el módulo que la necesita (Supabase, s. f.).

:::paso 6.1 Crear el proyecto en Supabase
Objetivo: Obtener una base de datos PostgreSQL vacía en la nube.
Acción:
1. En el panel de Supabase, pulsar **New project**.
2. Escribir un nombre (por ejemplo, `LegadoSeguroWeb`), una contraseña para la base de datos y elegir la región más cercana.
3. Esperar a que termine de crearse.
Explicación: La contraseña de la base es un secreto: se guarda en un lugar privado y se usará en el procedimiento 6.5. Un proyecto gratuito se pausa si no tiene actividad.
Evidencia:
![Formulario de nuevo proyecto en Supabase (contraseña oculta)](docs/capturas/5-1_supabase_nuevo_proyecto.png)
Resultado esperado: El proyecto aparece en el panel con estado activo.
Error frecuente: El proyecto aparece pausado por inactividad.
Solución: Entrar al panel y pulsar **Restore project**.
Verificación: El panel del proyecto abre y muestra el menú lateral (Table Editor, SQL Editor).
:::

:::paso 6.2 Revisar el modelo entidad-relación
Objetivo: Tener claro qué tablas y relaciones se van a crear antes de escribir SQL.
Acción: Revisar el diagrama del modelo entidad-relación.
Explicación: El modelo muestra cada tabla con sus llaves primarias (PK), foráneas (FK), relaciones y cardinalidades. Las 24 tablas originales se crean de una vez; las 9 restantes se agregan en los módulos siguientes, hasta completar 33. Las tablas principales son `usuario`, `activo_digital`, `beneficiario`, `regla_liberacion` y `proceso_liberacion`.
Evidencia:
![Modelo entidad-relación (33 tablas)](docs/capturas/02-modelo-er.png)
Resultado esperado: El diagrama coincide con las tablas que se crean en la base.
Verificación: Al terminar la sección 6.3, las tablas del Table Editor coinciden con el modelo.
:::

:::paso 6.3 Crear las tablas y activar la seguridad
Objetivo: Crear las 24 tablas originales y proteger todas con RLS.
Acción:
1. En Supabase, abrir **SQL Editor** y pulsar **New query**.
2. Abrir el archivo `supabase/migrations/001_esquema_inicial.sql`, copiar todo su contenido, pegarlo y pulsar **Run**.
3. Repetir con `002_seguridad_rls.sql`.
Comando:
```
-- Orden de ejecución (carpeta supabase/migrations)
001_esquema_inicial.sql    -- crea las 24 tablas con PK, FK y restricciones
002_seguridad_rls.sql      -- activa Row Level Security en todas las tablas
```
Explicación: La migración 001 define tipos de datos, llaves primarias y foráneas y restricciones. La 002 activa **RLS** (Row Level Security) sin políticas: así nadie puede leer las tablas desde fuera con la llave pública de Supabase y solo el backend, con su cadena de conexión, accede a los datos.
Evidencia:
![Tablas creadas en Supabase (Table Editor)](docs/capturas/07-supabase-tablas.png)
Resultado esperado: El SQL Editor responde `Success. No rows returned` y el Table Editor lista las tablas.
Error frecuente: `relation "..." already exists` al ejecutar de nuevo un script.
Solución: Cada migración se ejecuta una sola vez. Si se repite por error, revisar el Table Editor antes de volver a ejecutar.
Verificación: En **Table Editor** aparecen las 24 tablas del modelo.
:::

:::paso 6.4 Cargar los datos iniciales
Objetivo: Tener datos básicos (roles, tipos de activo, planes y ejemplos) para poder probar el sistema.
Acción: En el **SQL Editor**, ejecutar `supabase/migrations/003_datos_iniciales.sql`.
Comando:
```
003_datos_iniciales.sql   -- roles, un usuario, tipos de activo, activos, beneficiarios y planes (datos ficticios)
```
Explicación: Este script llena las tablas de catálogo (`rol`, `tipo_activo`, `plan`) y agrega datos ficticios de ejemplo. El tipo de activo define la sensibilidad de cada activo, que se usa en los módulos siguientes.
Evidencia:
resultado: Datos cargados en la tabla tipo_activo (consulta a la base)
```resultado
> SELECT id_tipo, nombre, categoria_sensibilidad FROM tipo_activo ORDER BY id_tipo;
 1 | Red social          | BAJA
 2 | Correo electrónico  | BAJA
 3 | Cuenta bancaria     | FINANCIERA
 4 | Billetera de cripto | FINANCIERA
 5 | Tarjeta de crédito  | FINANCIERA
 6 | Tarjeta de débito   | FINANCIERA
```
Resultado esperado: Las tablas de catálogo muestran filas.
Verificación: En **Table Editor**, la tabla `tipo_activo` tiene registros.
:::

:::paso 6.5 Obtener la cadena de conexión
Objetivo: Conseguir la dirección con la que el backend se conecta a la base.
Acción:
1. En el panel de Supabase, pulsar **Connect**.
2. Abrir la pestaña **Connection string** y elegir **Session pooler**.
3. Copiar la dirección y reemplazar `[YOUR-PASSWORD]` por la contraseña de la base.
Explicación: La cadena de conexión contiene el usuario, la contraseña y el servidor. Es un secreto: se guarda solo en el `.env`. Se usa el modo **Session pooler** porque funciona con redes que no admiten conexión directa.
Evidencia:
![Cadena de conexión de Supabase (valores ocultos)](docs/capturas/5-5_cadena_conexion.png)
Resultado esperado: Se obtiene una dirección que empieza con `postgresql://postgres.`.
Verificación: La dirección tiene la contraseña real en lugar de `[YOUR-PASSWORD]`.
:::

:::paso 6.6 Crear el archivo de variables de entorno
Objetivo: Guardar los secretos del backend fuera del código.
Acción:
1. En `LegadoSeguroWeb/backend`, crear el archivo `.env.example` con la plantilla siguiente.
2. Copiarlo con el nombre `.env` y completar los valores reales.
Comando:
```
# backend/.env.example (se sube a GitHub; el .env real NO)
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
PORT=5000
```
Explicación: `.env.example` es la plantilla pública con valores de ejemplo, y `.env` es el archivo real, ignorado por Git. `DATABASE_URL` es la cadena de conexión del procedimiento 6.5. En los módulos siguientes se agregan más variables (clave de sesión, clave de cifrado, token de DNI y datos de correo).
Evidencia:
![Archivo .env con los valores ocultos](docs/capturas/5-6_env_oculto.png)
Resultado esperado: Existe `backend/.env` con `DATABASE_URL` y `PORT`.
Error frecuente: Al encender el servidor aparece `Falta DATABASE_URL en el archivo .env`.
Solución: El archivo `.env` no existe o está en otra carpeta. Debe estar dentro de `backend`.
Verificación: `git status` no lista el archivo `.env`, porque está ignorado.
:::

:::paso 6.7 Encender el backend y probar la conexión
Objetivo: Comprobar que el servidor arranca y se conecta a la base de datos.
Acción:
1. Con la terminal en `LegadoSeguroWeb/backend`, instalar las dependencias (si es una copia nueva) y encender el servidor.
2. Abrir en el navegador `http://localhost:5000/api/salud`.
Comando:
```
cd backend
npm install
npm run dev
```
Explicación: `npm run dev` ejecuta el script definido en el procedimiento 4.2.3: arranca `server.ts` con recarga automática. La ruta `/api/salud` le pide la hora a la base de datos; si responde, la conexión funciona.
Evidencia:
![Consola con el servidor iniciado](docs/capturas/04-backend-iniciado.png)
![Respuesta de /api/salud en el navegador](docs/capturas/5-7_salud_navegador.png)
Resultado esperado: La consola dice `Servidor LegadoSeguroWeb en http://localhost:5000` y el navegador muestra `"estado":"ok"` con la hora de la base.
Error frecuente: `EADDRINUSE ... :::5000` (el puerto ya está ocupado) o `ETIMEDOUT` al conectar con la base.
Solución: Para `EADDRINUSE`, cerrar la terminal anterior donde corre otro backend (Ctrl + C). Para `ETIMEDOUT`, apagar la VPN, probar otra red o pulsar **Restore** si Supabase está pausado.
Verificación: `http://localhost:5000/api/salud` responde `"estado":"ok"`.
:::

## 7. Desarrollo del sistema por módulos

Esta es la sección principal del manual. Los módulos se construyeron en el orden en que aparecen aquí. Cada uno sigue la misma lógica: primero la base de datos (migraciones SQL), después el backend (servicio, controlador y ruta) y por último el frontend (servicio de Angular y pantalla). Al terminar cada módulo se hace un commit (procedimiento 5.4).

Los archivos SQL se encuentran en `supabase/migrations` y se ejecutan en el **SQL Editor** de Supabase, uno por uno y en orden, cada uno una sola vez. Para comprobar el efecto de cada migración se usan consultas de solo lectura; el resultado real de cada una se muestra como evidencia.

### 7.1 Módulo: Activos digitales (primer recorrido de punta a punta)

**Objetivo del módulo:** conectar por primera vez las tres piezas: Angular pide los activos, Express los consulta en Supabase y la pantalla los muestra en una tabla. **Requerimiento que atiende:** RF-01 (registrar y consultar activos digitales). **Archivos creados:** `models/activo.model.ts`, `services/activo.service.ts`, `controllers/activo.controller.ts` y `routes/activo.routes.ts` en el backend; `core/api.config.ts`, `services/activo.service.ts`, `pages/activos` y `app.routes.ts` en el frontend.

:::paso 7.1.1 Crear el servicio, el controlador y la ruta de activos
Objetivo: Exponer en la API la lista de activos digitales con el nombre de su tipo.
Acción:
1. Crear el modelo `Activo`, que describe lo que devuelve la API.
2. Crear el servicio con la consulta SQL.
3. Crear el controlador y la ruta, y registrar la ruta en `routes/index.ts`.
Comando:
```
// backend/src/models/activo.model.ts
export type Activo = {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  sensibilidad: string;
  estado: string;
};

// backend/src/services/activo.service.ts
import { pool } from '../config/database';
import { Activo } from '../models/activo.model';

export async function listarActivos(): Promise<Activo[]> {
  const resultado = await pool.query<Activo>(
    `SELECT a.id_activo AS id, a.nombre, a.descripcion,
            t.nombre AS tipo, t.categoria_sensibilidad AS sensibilidad, a.estado
     FROM activo_digital a
     JOIN tipo_activo t ON t.id_tipo = a.id_tipo
     ORDER BY a.id_activo`
  );
  return resultado.rows;
}

// backend/src/controllers/activo.controller.ts
import { Request, Response } from 'express';
import { listarActivos } from '../services/activo.service';

export async function obtenerActivos(req: Request, res: Response) {
  try {
    res.json(await listarActivos());
  } catch (error) {
    console.error('Error al consultar activos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los activos' });
  }
}

// backend/src/routes/activo.routes.ts
import { Router } from 'express';
import { obtenerActivos } from '../controllers/activo.controller';

const router = Router();
router.get('/', obtenerActivos); // GET /api/activos
export default router;

// backend/src/routes/index.ts: se agregan dos líneas
import activoRoutes from './activo.routes';
router.use('/activos', activoRoutes);
```
Explicación: La consulta une (`JOIN`) `activo_digital` con `tipo_activo` para mostrar el nombre del tipo y su sensibilidad en lugar de un número. `AS` renombra las columnas al formato que usa el frontend (`id`, `tipo`, `sensibilidad`). El controlador captura los errores para responder con un 500 claro en vez de dejar caer el servidor. Al inicio la consulta no filtra por usuario; en el módulo 7.2 se agrega el filtro con la sesión.
Evidencia:
resultado: Respuesta real de GET /api/activos (primeros 2 de 8 activos del usuario de prueba)
```resultado
> curl http://localhost:5000/api/activos  (ruta aún pública en este módulo; hoy exige sesión)
[
  { "id": 1, "nombre": "Facebook personal", "tipo": "Red social",
    "sensibilidad": "BAJA", "estado": "ACTIVO" },
  { "id": 2, "nombre": "Gmail principal", "tipo": "Correo electrónico",
    "sensibilidad": "BAJA", "estado": "ACTIVO" },
  ...
]
```
Resultado esperado: La ruta devuelve una lista JSON de activos con su tipo.
Error frecuente: `Cannot GET /api/activos` (404).
Solución: Faltaba registrar `router.use('/activos', activoRoutes)` en `routes/index.ts`, o no se reinició el servidor.
Verificación: Abrir `http://localhost:5000/api/activos` en el navegador y ver el JSON.
:::

:::paso 7.1.2 Mostrar los activos en una pantalla de Angular
Objetivo: Pedir los activos al backend y mostrarlos en una tabla.
Acción:
1. Generar con Angular CLI las piezas nuevas (comandos al inicio de **Comando / código**).
2. Crear `core/api.config.ts` con la dirección de la API.
3. Crear el servicio `ActivoService`, que hace la petición con `HttpClient`.
4. Crear la pantalla `Activos`, que guarda el resultado en un `signal` y lo dibuja con `@for`.
5. Registrar la ruta `/activos` en `app.routes.ts`.
Comando:
```
# Terminal, dentro de la carpeta frontend
ng generate component pages/activos --skip-tests
ng generate service services/activo --type=service --skip-tests
ng generate interface models/activo --type=model

// frontend/src/app/core/api.config.ts
export const API_URL = 'http://localhost:5000/api';

// frontend/src/app/services/activo.service.ts
@Injectable({ providedIn: 'root' })
export class ActivoService {
    private apiUrl = `${API_URL}/activos`;
    constructor(private http: HttpClient) { }

    getActivos(): Observable<Activo[]> {
        return this.http.get<Activo[]>(this.apiUrl);
    }
}

// frontend/src/app/pages/activos/activos.ts
export class Activos implements OnInit {
  activos = signal<Activo[]>([]);
  constructor(private activoService: ActivoService) {}

  ngOnInit(): void {
    this.activoService.getActivos().subscribe(data => {
      this.activos.set(data);
    });
  }
}

<!-- frontend/src/app/pages/activos/activos.html (fragmento) -->
@for (a of activos(); track a.id) {
<tr>
    <td>{{ a.nombre }}</td>
    <td>{{ a.tipo }}</td>
    <td>{{ a.sensibilidad }}</td>
</tr>
} @empty {
<tr><td colspan="6">No hay activos. ¿Está encendido el backend?</td></tr>
}

// frontend/src/app/app.routes.ts (fragmento)
{ path: 'activos', component: Activos }
```
Explicación: `API_URL` está en un solo archivo: si cambia el puerto o el servidor, solo se modifica ahí. El servicio devuelve un `Observable` y la pantalla se suscribe a él; cuando llegan los datos se guardan en un `signal` y Angular redibuja la tabla. `@for` recorre la lista y `@empty` muestra un mensaje si no hay datos. Como el proyecto no usa `zone.js`, guardar en un `signal` es obligatorio para que la pantalla se actualice.
Evidencia:
resultado: Piezas creadas con Angular CLI en el procedimiento 7.1.2 (carpeta limpia de verificación)
```resultado
> ng generate component pages/activos --skip-tests
CREATE src/app/pages/activos/activos.ts (199 bytes)
CREATE src/app/pages/activos/activos.css (0 bytes)
CREATE src/app/pages/activos/activos.html (23 bytes)
> ng generate service services/activo --type=service --skip-tests
CREATE src/app/services/activo.service.ts (89 bytes)
> ng generate interface models/activo --type=model
CREATE src/app/models/activo.model.ts (30 bytes)
```
![Pantalla Mis Activos con los datos de la base](docs/capturas/14-activos.png)
Resultado esperado: La pantalla `/activos` muestra una fila por cada activo de la base de datos.
Error frecuente: La tabla aparece vacía aunque el backend responde.
Solución: Los datos se guardaron en una variable común en lugar de un `signal`. Usar `activos = signal<Activo[]>([])` y `this.activos.set(data)`.
Verificación: Con backend y frontend encendidos, abrir `http://localhost:4200/activos` y comparar con la tabla `activo_digital` de Supabase.
:::

### 7.2 Módulo: Login y sesión

**Objetivo del módulo:** que solo entren usuarios con cuenta, que sus contraseñas no se guarden en claro y que cada pantalla sepa quién es el usuario. **Requerimiento que atiende:** RF-02 (inicio de sesión) y RNF-01 (seguridad). **Archivos creados:** `services/auth.service.ts`, `controllers/auth.controller.ts`, `routes/auth.routes.ts` y `middlewares/auth.middleware.ts` en el backend; `services/auth.service.ts`, `core/auth.interceptor.ts`, `core/auth.guard.ts` y `pages/login` en el frontend.

:::paso 7.2.1 Dar contraseña al usuario de prueba
Objetivo: Tener un usuario que pueda iniciar sesión con una contraseña cifrada.
Acción: En el **SQL Editor** de Supabase, ejecutar `supabase/migrations/004_usuario_demo.sql`.
Comando:
```
004_usuario_demo.sql   -- guarda el hash bcrypt de la contraseña del usuario de prueba
```
Explicación: Nunca se guarda la contraseña real: se guarda un **hash** de **bcrypt** (un resumen irreversible). El script deja la contraseña `Legado2026!` cifrada para el usuario `carlos.ramirez@example.com`, datos ficticios solo para desarrollo.
Evidencia:
resultado: Usuario de prueba con la contraseña cifrada (consulta a la base)
```resultado
> SELECT correo, estado, LEFT(password_hash, 7) AS formato_hash FROM usuario WHERE correo = 'carlos.ramirez@example.com';
 correo                       | estado | formato_hash
 carlos.ramirez@example.com   | ACTIVO | $2b$10$
```
Resultado esperado: El usuario existe, está `ACTIVO` y su hash empieza con `$2b$10$` (formato bcrypt).
Verificación: La consulta anterior devuelve una fila.
:::

:::paso 7.2.2 Validar la contraseña y proteger las rutas en el backend
Objetivo: Iniciar sesión comparando la contraseña con el hash y entregar un token JWT; exigir ese token en las rutas protegidas.
Acción:
1. Agregar `JWT_SECRET` al `.env` (una cadena larga y secreta) y exportarlo desde `config/env.ts`.
2. Crear `iniciarSesion` en `services/auth.service.ts`.
3. Crear el middleware `verificarToken`.
4. Registrar `POST /api/auth/login` y aplicar `verificarToken` a las rutas protegidas.
Comando:
```
// backend/src/services/auth.service.ts (fragmento)
const token = jwt.sign({ id: u.id_usuario }, JWT_SECRET, { expiresIn: '8h' });
...
const coincide = await bcrypt.compare(password, usuario.password_hash);
if (!coincide) return null;

// backend/src/middlewares/auth.middleware.ts
export function verificarToken(req: Request, res: Response, next: NextFunction) {
  const cabecera = req.headers.authorization;
  if (!cabecera || !cabecera.startsWith('Bearer ')) {
    res.status(401).json({ mensaje: 'No has iniciado sesión' });
    return;
  }
  try {
    const datos = jwt.verify(cabecera.slice(7), JWT_SECRET) as { id: number };
    res.locals.usuarioId = datos.id;   // el resto del backend sabe quién es
    next();
  } catch {
    res.status(401).json({ mensaje: 'Tu sesión expiró, inicia sesión de nuevo' });
  }
}

// backend/src/routes/index.ts (fragmento)
router.use('/auth', authRoutes);                          // pública
router.use('/activos', verificarToken, activoRoutes);     // protegida
```
Explicación: `bcrypt.compare` compara la contraseña escrita con el hash guardado sin descifrarlo. Si coincide, `jwt.sign` crea un **token** firmado con `JWT_SECRET` que vence en 8 horas. El middleware exige ese token en la cabecera `Authorization: Bearer ...`; si es válido deja el id del usuario en `res.locals.usuarioId` y las consultas se filtran por él (`WHERE a.id_usuario = $1`). Cada inicio de sesión también se guarda en `actividad_usuario`: es lo que mira el monitoreo de inactividad (módulo 7.5).
Evidencia:
resultado: Respuestas reales del backend: ruta protegida sin sesión y login con contraseña incorrecta
```resultado
> curl -i http://localhost:5000/api/activos
HTTP/1.1 401 Unauthorized
{"mensaje":"No has iniciado sesión"}

> curl -i -X POST http://localhost:5000/api/auth/login  (con una contraseña incorrecta)
HTTP/1.1 401 Unauthorized
{"mensaje":"Correo o contraseña incorrectos"}
```
Resultado esperado: Sin token, `/api/activos` responde 401; con un token válido responde la lista del usuario.
Error frecuente: `401` aunque el usuario inició sesión.
Solución: El token venció (8 horas) o cambió `JWT_SECRET` después de iniciar sesión. Iniciar sesión de nuevo.
Verificación: `POST /api/auth/login` con el usuario de prueba devuelve un `token` y los datos del usuario.
:::

:::paso 7.2.3 Crear la pantalla de login, el interceptor y la guardia
Objetivo: Pedir las credenciales, guardar la sesión y enviar el token en cada petición.
Acción:
1. Generar con Angular CLI las piezas nuevas (comandos al inicio de **Comando / código**).
2. Crear `AuthService` (inicia y cierra sesión y guarda el token en `localStorage`).
3. Crear el interceptor que agrega el token a cada petición.
4. Crear la guardia que manda a `/login` si no hay sesión.
5. Aplicar la guardia a las rutas protegidas en `app.routes.ts` y registrar el interceptor en `app.config.ts`.
Comando:
```
# Terminal, dentro de la carpeta frontend
ng generate component pages/login --skip-tests
ng generate service services/auth --type=service --skip-tests
ng generate interface models/auth --type=model

// frontend/src/app/core/auth.interceptor.ts (fragmento)
const token = esPortal ? portal.getToken() : auth.getToken();
const pedido = token
  ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
  : req;

// frontend/src/app/core/auth.guard.ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.logueado() ? true : router.createUrlTree(['/login']);
};

// frontend/src/app/app.routes.ts (fragmento)
{ path: 'dashboard', component: Dashboard, canActivate: [authGuard] }

// frontend/src/app/app.config.ts (fragmento)
provideHttpClient(withInterceptors([authInterceptor]))
```
Explicación: El interceptor se ejecuta en cada petición HTTP: agrega la cabecera con el token y, si el backend responde 401, cierra la sesión. La guardia protege las rutas del navegador, pero la seguridad real está en el backend, porque cualquiera puede alterar el frontend. Las peticiones a `/portal/` usan la sesión del heredero (módulo 7.13).
Evidencia:
resultado: Piezas creadas con Angular CLI en el procedimiento 7.2.3 (carpeta limpia de verificación)
```resultado
> ng generate component pages/login --skip-tests
CREATE src/app/pages/login/login.ts (191 bytes)
CREATE src/app/pages/login/login.css (0 bytes)
CREATE src/app/pages/login/login.html (21 bytes)
> ng generate service services/auth --type=service --skip-tests
CREATE src/app/services/auth.service.ts (87 bytes)
> ng generate interface models/auth --type=model
CREATE src/app/models/auth.model.ts (28 bytes)
```
![Pantalla de inicio de sesión](docs/capturas/10-login.png)
Resultado esperado: Con el usuario de prueba se entra al Dashboard; sin sesión, cualquier ruta protegida redirige a `/login`.
Error frecuente: Después de iniciar sesión el navegador queda en la pantalla de login.
Solución: El backend no está encendido o `API_URL` apunta a otro puerto. Revisar la pestaña **Network** (F12).
Verificación: Iniciar sesión con `carlos.ramirez@example.com` y la contraseña de prueba, y comprobar que existe `lg_token` en el almacenamiento local del navegador.
:::

### 7.3 Módulo: Dashboard (centro de mando)

**Objetivo del módulo:** mostrar al propietario el estado de su legado: cifras, salud, próximos pasos y actividad. **Requerimiento que atiende:** RF-03. **Archivos creados:** `services/dashboard.service.ts`, `controllers/dashboard.controller.ts`, `routes/dashboard.routes.ts` y `models/dashboard.model.ts` en el backend; `services/dashboard.service.ts` y `pages/dashboard` en el frontend.

:::paso 7.3.1 Calcular las cifras y la salud del legado en el backend
Objetivo: Devolver en una sola petición los conteos, el puntaje de salud y la actividad reciente.
Acción:
1. Crear `obtenerResumen(idUsuario)` en `services/dashboard.service.ts`.
2. Lanzar las consultas a la vez con `Promise.all`.
3. Calcular el puntaje con cinco pasos de 20 puntos.
4. Crear el controlador y la ruta protegida `GET /api/dashboard`.
Comando:
```
// backend/src/services/dashboard.service.ts (fragmento)
const [activos, herederos, regla, procesos, ingresos, recientes] = await Promise.all([ ... ]);

const pasos: PasoSalud[] = [
  { texto: 'Registra tu primer activo digital', hecho: totalActivos > 0, ruta: '/activos' },
  { texto: 'Todos tus activos tienen heredero', hecho: totalActivos > 0 && sinHeredero === 0, ruta: '/activos' },
  { texto: 'Designa a tus herederos', hecho: totalHerederos > 0, ruta: '/beneficiarios' },
  { texto: 'Tus herederos están validados', hecho: totalHerederos > 0 && pendientes === 0, ruta: '/beneficiarios' },
  { texto: 'Activa tu regla de liberación', hecho: reglaActiva, ruta: '/reglas' }
];
const puntaje = pasos.filter(p => p.hecho).length * 20;
```
Explicación: `Promise.all` lanza todas las consultas juntas para que la respuesta llegue más rápido. La **salud del legado** vale 20 puntos por cada paso cumplido (de 0 a 100): tener un activo, que todos tengan heredero, haber designado herederos, que ninguno esté pendiente de validar y tener una regla activa. Cada paso lleva la ruta de la pantalla donde se resuelve.
Evidencia:
resultado: Respuesta real de GET /api/dashboard del usuario de prueba (sin la actividad reciente)
```resultado
> curl http://localhost:5000/api/dashboard  (con sesión)
{
  "activos": 8,
  "beneficiarios": 2,
  "herederosPendientes": 1,
  "reglasActivas": 1,
  "procesosEnCurso": 0,
  "salud": {
    "puntaje": 60,
    "pasos": [
      { "texto": "Registra tu primer activo digital",   "hecho": true  },
      { "texto": "Asigna herederos a 5 activos",        "hecho": false },
      { "texto": "Designa a tus herederos",             "hecho": true  },
      { "texto": "1 heredero pendiente de validar",     "hecho": false },
      { "texto": "Activa tu regla de liberación",       "hecho": true  }
    ]
  },
  "inactividad": { "limiteDias": 30, "diasDesdeIngresoAnterior": 1 }
}
```
Resultado esperado: La respuesta incluye las cifras, el puntaje y los cinco pasos.
Verificación: El puntaje es 20 veces la cantidad de pasos con `"hecho": true`.
:::

:::paso 7.3.2 Mostrar el dashboard en Angular
Objetivo: Dibujar la portada con el círculo de salud animado, las cifras y los próximos pasos.
Acción:
1. Generar con Angular CLI las piezas nuevas (comandos al inicio de **Comando / código**).
2. Crear `DashboardService` y la pantalla `Dashboard` (ruta `/dashboard` con `authGuard`).
3. Guardar la respuesta en un `signal`.
4. Animar el contador y el círculo de 0 al valor final en un segundo.
Comando:
```
# Terminal, dentro de la carpeta frontend
ng generate component pages/dashboard --skip-tests
ng generate service services/dashboard --type=service --skip-tests
ng generate interface models/dashboard --type=model
ng generate component components/sidebar --skip-tests
ng generate component components/logo --skip-tests

// frontend/src/app/pages/dashboard/dashboard.ts (fragmento)
resumen = signal<ResumenDashboard | null>(null);
progreso = signal(0);   // va de 0 a 1 en un segundo

ngOnInit(): void {
  this.dashboardService.getResumen().subscribe(data => {
    this.resumen.set(data);
    this.animar();
  });
}

private animar(): void {
  const inicio = performance.now();
  const paso = (ahora: number) => {
    const t = Math.min(1, (ahora - inicio) / 1000);
    this.progreso.set(1 - Math.pow(1 - t, 3));   // empieza rápido y termina suave
    if (t < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}
```
Explicación: `progreso` es un `signal`; cada vez que cambia, Angular redibuja los números y el círculo. `requestAnimationFrame` actualiza el valor en cada cuadro de la pantalla. Si el propietario tiene herederos pendientes de validar, se muestra además una alerta roja con un botón a **Mis Herederos** (módulo 7.16).
Evidencia:
resultado: Piezas creadas con Angular CLI en el procedimiento 7.3.2 (carpeta limpia de verificación)
```resultado
> ng generate component pages/dashboard --skip-tests
CREATE src/app/pages/dashboard/dashboard.ts (207 bytes)
CREATE src/app/pages/dashboard/dashboard.css (0 bytes)
CREATE src/app/pages/dashboard/dashboard.html (25 bytes)
> ng generate service services/dashboard --type=service --skip-tests
CREATE src/app/services/dashboard.service.ts (92 bytes)
> ng generate interface models/dashboard --type=model
CREATE src/app/models/dashboard.model.ts (33 bytes)
> ng generate component components/sidebar --skip-tests
CREATE src/app/components/sidebar/sidebar.ts (199 bytes)
CREATE src/app/components/sidebar/sidebar.css (0 bytes)
CREATE src/app/components/sidebar/sidebar.html (23 bytes)
> ng generate component components/logo --skip-tests
CREATE src/app/components/logo/logo.ts (187 bytes)
CREATE src/app/components/logo/logo.css (0 bytes)
CREATE src/app/components/logo/logo.html (20 bytes)
```
![Dashboard con las cifras y la salud del legado](docs/capturas/30-dashboard.png)
Resultado esperado: El dashboard muestra la salud, las cuatro cifras, los próximos pasos y la actividad reciente.
Verificación: El puntaje de la pantalla coincide con el de la respuesta de `/api/dashboard`.
:::

### 7.4 Módulo: Reglas de liberación

**Objetivo del módulo:** que cada propietario defina cuándo y cómo se libera su legado. **Requerimiento que atiende:** RF-05. **Archivos creados:** `services/regla.service.ts`, `controllers/regla.controller.ts`, `routes/regla.routes.ts` y `models/regla.model.ts` en el backend; `services/regla.service.ts` y `pages/reglas` en el frontend.

:::paso 7.4.1 Preparar la tabla de reglas
Objetivo: Permitir que los días de inactividad sean libres, pero acotados por la base de datos.
Acción: En el **SQL Editor**, ejecutar `013_dias_inactividad_libres.sql`.
Comando:
```
013_dias_inactividad_libres.sql   -- los días de inactividad pueden ser cualquiera entre 7 y 3650
```
Explicación: La tabla `regla_liberacion` ya existe desde la migración 001. Esta migración agrega una restricción `CHECK` para que, aunque alguien salte las validaciones del backend, la base nunca acepte menos de 7 ni más de 3650 días.
Evidencia:
resultado: Restricciones de la tabla regla_liberacion (consulta a la base)
```resultado
> SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'regla_liberacion'::regclass AND contype = 'c';
CHECK (((dias_gracia >= 1) AND (dias_gracia <= 60)))
CHECK (((dias_inactividad >= 7) AND (dias_inactividad <= 3650)))
```
Resultado esperado: Aparece la restricción de 7 a 3650 días (la de `dias_gracia` se agrega en el módulo 7.5).
Verificación: Intentar guardar `dias_inactividad = 5` desde SQL da un error de restricción.
:::

:::paso 7.4.2 Guardar y leer la regla del usuario
Objetivo: Tener una sola regla activa por usuario: si existe se actualiza y si no se crea.
Acción: Generar con Angular CLI las piezas nuevas (comandos al inicio de **Comando / código**); luego crear `obtenerRegla` y `guardarRegla` en `services/regla.service.ts`, con su controlador y las rutas `GET` y `PUT /api/reglas`.
Comando:
```
# Terminal, dentro de la carpeta frontend
ng generate component pages/reglas --skip-tests
ng generate service services/regla --type=service --skip-tests
ng generate interface models/regla --type=model

// backend/src/services/regla.service.ts (fragmento)
export async function guardarRegla(datos: DatosRegla, idUsuario: number): Promise<Regla> {
  const valores = [datos.diasInactividad, datos.minConfirmaciones, datos.diasPeriodoEspera,
                   datos.requiereValidador, datos.diasGracia];
  const actual = await obtenerRegla(idUsuario);

  if (actual.regla) {
    // ya tiene una regla activa: se actualiza
    const r = await pool.query<Regla>(`UPDATE regla_liberacion SET ... WHERE id_regla = $6 RETURNING ${COLUMNAS}`,
      [...valores, actual.regla.id]);
    return r.rows[0];
  }
  // si no, se crea
  const r = await pool.query<Regla>(`INSERT INTO regla_liberacion (...) VALUES ($6, $1, $2, $3, $4, $5) RETURNING ${COLUMNAS}`,
    [...valores, idUsuario]);
  return r.rows[0];
}
```
Explicación: La regla tiene cuatro parámetros: días de inactividad antes de actuar, confirmaciones mínimas de herederos, período de espera final y si exige un validador externo (más los días de gracia del módulo 7.5). `obtenerRegla` también devuelve cuántos herederos tiene el usuario y el límite de su plan, para que la pantalla no permita pedir más confirmaciones de las posibles.
Evidencia:
resultado: Piezas creadas con Angular CLI en el procedimiento 7.4.2 (carpeta limpia de verificación)
```resultado
> ng generate component pages/reglas --skip-tests
CREATE src/app/pages/reglas/reglas.ts (195 bytes)
CREATE src/app/pages/reglas/reglas.css (0 bytes)
CREATE src/app/pages/reglas/reglas.html (22 bytes)
> ng generate service services/regla --type=service --skip-tests
CREATE src/app/services/regla.service.ts (88 bytes)
> ng generate interface models/regla --type=model
CREATE src/app/models/regla.model.ts (29 bytes)
```
![Pantalla de Reglas de Liberación](docs/capturas/18-reglas.png)
Resultado esperado: Al guardar, la regla queda activa; al volver a entrar a la pantalla se muestran los valores guardados.
Verificación: `GET /api/reglas` devuelve la regla con los mismos valores y el panel **Así funcionará tu regla** se actualiza al cambiarlos.
:::

### 7.5 Módulo: Procesos de liberación y monitoreo de inactividad

**Objetivo del módulo:** detectar cuándo el propietario dejó de entrar, avisarle con un plazo de gracia y, si no vuelve, abrir el proceso de liberación y avisar a los herederos. **Requerimiento que atiende:** RF-06. **Archivos creados:** `services/monitoreo.service.ts`, `services/proceso.service.ts`, `controllers/proceso.controller.ts`, `routes/proceso.routes.ts` y `services/notificacion.service.ts` en el backend; `pages/procesos` en el frontend.

:::paso 7.5.1 Preparar las tablas de procesos y alertas
Objetivo: Contar con datos de proceso para ver la pantalla y con la tabla de alertas previas.
Acción: En el **SQL Editor**, ejecutar `005_proceso_demo.sql`, `015_confirmacion_heredero.sql`, `019_alerta_inactividad.sql` y `020_usuario_inactivo_demo.sql`.
Comando:
```
005_proceso_demo.sql              -- un proceso de liberación de ejemplo
015_confirmacion_heredero.sql     -- verificación del heredero (DNI y selfie) y fecha de espera
019_alerta_inactividad.sql        -- alerta previa con plazo de gracia
020_usuario_inactivo_demo.sql     -- un propietario inactivo hace 200 días, para probar el monitoreo
```
Explicación: La 019 crea la tabla `alerta_inactividad` y la columna `regla_liberacion.dias_gracia`. La 020 crea datos ficticios (usuario `demo.inactivo@example.com`) para ver el monitoreo en acción sin esperar meses.
Evidencia:
resultado: Columnas de la tabla alerta_inactividad (consulta a la base)
```resultado
> SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'alerta_inactividad';
 id_alerta     integer
 id_usuario    integer
 id_regla      integer
 fecha_alerta  timestamp with time zone
 fecha_limite  timestamp with time zone
 estado        character varying
```
Resultado esperado: La tabla `alerta_inactividad` existe con esas columnas.
Verificación: La consulta devuelve las seis columnas.
:::

:::paso 7.5.2 Programar el monitoreo en dos etapas
Objetivo: Revisar las reglas cada hora: primero alertar al propietario y, si el plazo de gracia vence, abrir el proceso.
Acción:
1. Crear `ejecutarMonitoreo` en `services/monitoreo.service.ts`.
2. Encender el monitoreo desde `server.ts`: una vez al arrancar y luego cada hora.
Comando:
```
// backend/src/services/monitoreo.service.ts (fragmento)
for (const c of inactivos) {
  const pendiente = await pool.query(
    "SELECT id_alerta, fecha_limite <= NOW() AS vencida FROM alerta_inactividad WHERE id_usuario = $1 AND estado = 'ENVIADA' ...", [c.id_usuario]);

  if (pendiente.rows.length === 0) {
    await enviarAlerta(c);            // etapa 1: avisar al propietario y darle plazo
    alertas++;
  } else if (pendiente.rows[0].vencida) {
    await iniciarProceso(c);          // etapa 2: el plazo terminó, se abre el proceso
    await pool.query("UPDATE alerta_inactividad SET estado = 'VENCIDA' WHERE id_alerta = $1", [pendiente.rows[0].id_alerta]);
    iniciados++;
  }
}

// backend/src/server.ts
const CADA_HORA = 60 * 60 * 1000;
app.listen(PORT, () => {
  console.log(`Servidor LegadoSeguroWeb en http://localhost:${PORT}`);
  monitorear();                        // una revisión al encender
  setInterval(monitorear, CADA_HORA);  // y luego cada hora
});
```
Explicación: Un usuario está inactivo si su última actividad (la última vez que inició sesión, o su fecha de registro si nunca entró) es más antigua que los `dias_inactividad` de su regla y no tiene un proceso abierto. En la primera revisión se le envía una alerta con un plazo de gracia; si inicia sesión en ese plazo, la alerta queda `RESUELTA` y no pasa nada más. Si el plazo vence, `iniciarProceso` crea el proceso, copia los activos y crea una confirmación pendiente por cada heredero asignado a cada activo; todo dentro de una transacción (`BEGIN`/`COMMIT`) para que se guarde completo o nada.
Evidencia:
resultado: Procesos y alertas generados por el monitoreo con el usuario inactivo de prueba (consulta a la base)
```resultado
> SELECT id_proceso, estado, motivo FROM proceso_liberacion ORDER BY id_proceso;
 3 | CANCELADO       | Inactividad superior a 180 días (datos de prueba)
 6 | EN_CONFIRMACION | Inactividad superior a 90 días

> SELECT id_alerta, estado FROM alerta_inactividad;
 4 | RESUELTA
```
Resultado esperado: El monitoreo deja una alerta y, al vencer el plazo de gracia, un proceso en `EN_CONFIRMACION` (el proceso 6 se abrió por inactividad superior a 90 días, la regla del usuario de prueba).
Error frecuente: El proceso se abre aunque el propietario volvió a entrar.
Solución: La alerta debe resolverse al iniciar sesión: en `iniciarSesion` se actualiza `alerta_inactividad` a `RESUELTA` para ese usuario.
Verificación: Con el usuario inactivo de la migración 020, ejecutar el monitoreo desde la pantalla de administración (módulo 7.7) crea una alerta; al adelantar el vencimiento y volver a ejecutarlo, se abre el proceso.
:::

:::paso 7.5.3 Mostrar los procesos y permitir cancelarlos
Objetivo: Que el propietario vea sus procesos con su detalle y pueda cancelarlos si sigue activo.
Acción: Generar con Angular CLI las piezas nuevas (comandos al inicio de **Comando / código**); luego crear `proceso.service.ts`, el controlador y las rutas `GET /api/procesos`, `GET /api/procesos/:id` y `POST /api/procesos/:id/cancelar`, y la pantalla `/procesos`.
Explicación: El detalle de un proceso reúne los activos, las confirmaciones de cada heredero, las objeciones y las entregas. Cancelar un proceso lo marca `CANCELADO` y deja el registro en la tabla `auditoria`; es la salida del propietario que recibió el aviso y está bien.
Evidencia:
resultado: Piezas creadas con Angular CLI en el procedimiento 7.5.3 (carpeta limpia de verificación)
```resultado
> ng generate component pages/procesos --skip-tests
CREATE src/app/pages/procesos/procesos.ts (203 bytes)
CREATE src/app/pages/procesos/procesos.css (0 bytes)
CREATE src/app/pages/procesos/procesos.html (24 bytes)
> ng generate service services/proceso --type=service --skip-tests
CREATE src/app/services/proceso.service.ts (90 bytes)
> ng generate interface models/proceso --type=model
CREATE src/app/models/proceso.model.ts (31 bytes)
```
![Lista de procesos de liberación](docs/capturas/19-procesos.png)
Resultado esperado: La pantalla lista los procesos con su estado y permite ver el detalle y cancelar.
Verificación: Al cancelar un proceso aparece con estado `CANCELADO` y la acción queda en el historial.
:::

### 7.6 Módulo: Registro de usuarios con código por correo

**Objetivo del módulo:** que cualquier persona cree su cuenta de propietario con su DNI, y que el correo quede comprobado con un código de 6 dígitos. **Requerimiento que atiende:** RF-01 y RNF-01. **Archivos creados:** `services/verificacion.service.ts`, `services/correo.service.ts`, `services/reniec.service.ts`, `controllers/auth.controller.ts` y `routes/auth.routes.ts` en el backend; `pages/registro` en el frontend.

:::paso 7.6.1 Crear la tabla de códigos de verificación
Objetivo: Guardar los códigos de 6 dígitos de forma segura.
Acción: En el **SQL Editor**, ejecutar `009_cifrado_y_codigos.sql`.
Comando:
```
009_cifrado_y_codigos.sql   -- columnas cifradas (monto) y la tabla codigo_verificacion
```
Explicación: La tabla `codigo_verificacion` guarda el propósito del código (registro, heredero, portal, recuperación), el correo de destino, el **hash** del código (no el código), la fecha de expiración, los intentos y si ya se usó. Esta misma migración agrega las columnas cifradas que se usan en el módulo 7.9.
Evidencia:
resultado: Columnas de la tabla codigo_verificacion (consulta a la base)
```resultado
> SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'codigo_verificacion';
 id_codigo          integer
 proposito          character varying
 destino            character varying
 id_usuario         integer
 codigo_hash        character varying
 fecha_creacion     timestamp with time zone
 fecha_expiracion   timestamp with time zone
 intentos           integer
 usado              boolean
```
Resultado esperado: La tabla existe con esas nueve columnas.
Verificación: La consulta devuelve nueve filas.
:::

:::paso 7.6.2 Generar, enviar y validar el código
Objetivo: Enviar al correo un código de 6 dígitos que dura 10 minutos, tiene 5 intentos y sirve una sola vez.
Acción:
1. Agregar al `.env` y a `config/env.ts` las variables `SMTP_*` (ver procedimiento 8.3). Sin ellas el correo sale por la consola.
2. Crear `correo.service.ts` con `enviarCorreo`.
3. Crear `verificacion.service.ts` con `enviarCodigo` y `validarCodigo`.
Comando:
```
// backend/src/services/verificacion.service.ts (fragmento)
const codigo = String(crypto.randomInt(100000, 1000000));   // 6 dígitos
const hash = await bcrypt.hash(codigo, 10);                 // se guarda el hash, no el código

// ...
const coincide = await bcrypt.compare(codigo, fila.codigo_hash);
if (!coincide) return false;

// Se marca como usado solo si nadie lo usó antes: si dos pedidos llegan juntos, solo uno gana
const marcado = await pool.query(
  'UPDATE codigo_verificacion SET usado = TRUE WHERE id_codigo = $1 AND usado = FALSE RETURNING id_codigo',
  [fila.id_codigo]
);
return marcado.rows.length > 0;
```
Explicación: `crypto.randomInt` genera un número aleatorio seguro. Se guarda solo el hash con bcrypt, así que ni quien lea la base conoce el código. Al pedir un código nuevo, los anteriores sin usar dejan de servir. Cada intento se cuenta, acierte o no, y a los 5 el código deja de funcionar. El `UPDATE ... WHERE usado = FALSE` evita que dos peticiones simultáneas usen el mismo código.
Evidencia:
resultado: Correo de prueba que el backend muestra en la consola cuando no hay SMTP configurado
```resultado
--- CORREO (modo prueba, no se envió) ---
Para: reserva.prueba@example.com
Asunto: Tu código de verificación de LegadoSeguro
Hola,

Usa este código para entrar a tu espacio de heredero en LegadoSeguro.

Tu código es: 633082

Vence en 10 minutos. Si no fuiste tú, ignora este mensaje.

LegadoSeguro
-----------------------------------------
```
Resultado esperado: Al pedir un código, la consola del backend (o la bandeja de entrada, si hay SMTP) muestra el mensaje con los 6 dígitos.
Error frecuente: `El código es incorrecto o ya venció`.
Solución: Pasaron 10 minutos, se usó 5 veces o ya se usó. Pedir uno nuevo.
Verificación: Un código correcto se acepta una vez; el mismo código usado otra vez se rechaza.
:::

:::paso 7.6.3 Registrar la cuenta en dos pasos
Objetivo: Crear la cuenta como `PENDIENTE` y activarla solo cuando el correo se confirma.
Acción:
1. Generar con Angular CLI las piezas nuevas (comandos al inicio de **Comando / código**).
2. Crear `registrarUsuario`, `confirmarCorreo` y `reenviarCodigoRegistro` en `auth.service.ts`.
3. Crear las rutas `POST /api/auth/registro`, `/verificar-correo` y `/reenviar-codigo`.
4. Crear la pantalla `/registro` con el botón **Buscar** del DNI (módulo 8.2) y el campo del código.
Comando:
```
# Terminal, dentro de la carpeta frontend
ng generate component pages/registro --skip-tests

// backend/src/services/auth.service.ts (fragmento)
const hash = await bcrypt.hash(datos.password, 10);
await pool.query(
  `INSERT INTO usuario (id_rol, nombres, apellidos, dni, correo, password_hash, telefono, ip_registro, estado)
   VALUES ((SELECT id_rol FROM rol WHERE nombre = 'PROPIETARIO'), $1, $2, $3, $4, $5, $6, $7, 'PENDIENTE')`,
  [...]
);
await enviarCodigo('REGISTRO', datos.correo, idUsuario, 'Usa este código para confirmar tu correo y activar tu cuenta.');

// al confirmar: la cuenta pasa a ACTIVO y se inicia la sesión
UPDATE usuario SET estado = 'ACTIVO' WHERE correo = $1 AND estado = 'PENDIENTE'
```
Explicación: La cuenta nace `PENDIENTE` y no puede iniciar sesión hasta escribir el código. Si alguien empezó el registro y nunca lo confirmó, esa cuenta pendiente se descarta y se crea de nuevo. La contraseña se guarda con bcrypt y el rol `PROPIETARIO` se obtiene de la tabla `rol`. Al confirmar, queda un registro en `auditoria` con la IP de origen.
Evidencia:
resultado: Piezas creadas con Angular CLI en el procedimiento 7.6.3 (carpeta limpia de verificación)
```resultado
> ng generate component pages/registro --skip-tests
CREATE src/app/pages/registro/registro.ts (203 bytes)
CREATE src/app/pages/registro/registro.css (0 bytes)
CREATE src/app/pages/registro/registro.html (24 bytes)
```
![Registro: el DNI se busca y valida en RENIEC](docs/capturas/11-registro-1.png)
![Registro, paso 2: confirmar el correo con el código](docs/capturas/12-registro-2.png)
Resultado esperado: Después de escribir el código correcto, el usuario entra al Dashboard con su cuenta `ACTIVO`.
Error frecuente: Al registrarse con el mismo correo dos veces, la base rechaza el segundo (el correo es único).
Solución: Para pruebas con Gmail usar el truco `tucorreo+prueba1@gmail.com`: el sistema lo ve distinto y llega a la misma bandeja.
Verificación: Registrar un usuario de prueba y comprobar que su `estado` cambia de `PENDIENTE` a `ACTIVO`.
:::

### 7.7 Módulo: Administración y auditoría

**Objetivo del módulo:** que el administrador vea las cuentas y la auditoría, y que se registre quién hizo qué y desde qué IP. **Requerimiento que atiende:** RF-09. **Archivos creados:** `middlewares/admin.middleware.ts`, `services/admin.service.ts`, `controllers/admin.controller.ts` y `routes/admin.routes.ts` en el backend; `core/admin.guard.ts`, `services/admin.service.ts` y `pages/admin` en el frontend.

:::paso 7.7.1 Crear el administrador y registrar la IP
Objetivo: Contar con un usuario con rol `ADMINISTRADOR` y guardar la IP de cada acción importante.
Acción: En el **SQL Editor**, ejecutar `006_usuario_admin.sql` y `007_auditoria_ip.sql`.
Comando:
```
006_usuario_admin.sql    -- crea el usuario administrador de prueba (rol ADMINISTRADOR)
007_auditoria_ip.sql     -- agrega la columna ip_origen a usuario, actividad_usuario y auditoria
```
Explicación: La tabla `auditoria` guarda cada acción con su fecha, el usuario, la entidad afectada y la IP de origen. El rol de administrador vive en la tabla `rol` y se valida en la base, no en el navegador.
Evidencia:
resultado: Rol del administrador y columnas de la tabla auditoria (consulta a la base)
```resultado
> SELECT u.correo, r.nombre AS rol FROM usuario u JOIN rol r ON r.id_rol = u.id_rol WHERE r.nombre = 'ADMINISTRADOR';
 admin@legadoseguro.pe | ADMINISTRADOR

> SELECT column_name FROM information_schema.columns WHERE table_name = 'auditoria';
 id_auditoria, id_usuario, fecha, accion, entidad, id_entidad, descripcion, ip_origen
```
Resultado esperado: Existe un usuario administrador y la tabla `auditoria` tiene la columna `ip_origen`.
Verificación: Las dos consultas devuelven los resultados indicados.
:::

:::paso 7.7.2 Proteger las rutas de administración
Objetivo: Que solo un administrador entre a `/api/admin/*` y a la pantalla de usuarios.
Acción:
1. Generar con Angular CLI las piezas nuevas (comandos al inicio de **Comando / código**).
2. Crear el middleware `soloAdmin`, que consulta el rol en la base.
3. Aplicarlo después de `verificarToken` en `routes/index.ts`.
4. En el frontend, crear `adminGuard` y aplicarlo a la ruta `/usuarios`.
Comando:
```
# Terminal, dentro de la carpeta frontend
ng generate component pages/admin --skip-tests
ng generate service services/admin --type=service --skip-tests

// backend/src/middlewares/admin.middleware.ts (fragmento)
const resultado = await pool.query(
  `SELECT 1 FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
   WHERE u.id_usuario = $1 AND r.nombre = 'ADMINISTRADOR' AND u.estado = 'ACTIVO'`,
  [res.locals.usuarioId]
);
if (resultado.rows.length === 0) {
  res.status(403).json({ mensaje: 'No tienes permiso para esta sección' });
  return;
}

// backend/src/routes/index.ts
router.use('/admin', verificarToken, soloAdmin, adminRoutes);   // solo administradores
```
Explicación: El rol se consulta en la base en cada petición y no se confía en lo que diga el navegador. La guardia del frontend solo esconde la pantalla; el middleware del backend es la protección real. Un usuario desactivado por el administrador ya no puede iniciar sesión.
Evidencia:
resultado: Piezas creadas con Angular CLI en el procedimiento 7.7.2 (carpeta limpia de verificación)
```resultado
> ng generate component pages/admin --skip-tests
CREATE src/app/pages/admin/admin.ts (191 bytes)
CREATE src/app/pages/admin/admin.css (0 bytes)
CREATE src/app/pages/admin/admin.html (21 bytes)
> ng generate service services/admin --type=service --skip-tests
CREATE src/app/services/admin.service.ts (88 bytes)
```
![Pantalla de administración: usuarios y auditoría](docs/capturas/26-administracion.png)
Resultado esperado: El administrador ve la lista de cuentas y la auditoría; un propietario recibe 403 en `/api/admin/usuarios`.
Verificación: Con el token de un propietario, `GET /api/admin/usuarios` responde `403`.
:::

### 7.8 Módulo: Herederos

**Objetivo del módulo:** que el propietario designe, edite y elimine a sus herederos, con su verificación opcional. **Requerimiento que atiende:** RF-04 y RF-10. **Archivos creados:** `services/beneficiario.service.ts`, `controllers/beneficiario.controller.ts` y `routes/beneficiario.routes.ts` en el backend; `services/beneficiario.service.ts` y `pages/beneficiarios` en el frontend.

:::paso 7.8.1 Preparar la tabla de herederos
Objetivo: Marcar si el correo del heredero fue comprobado y exigir un DNI único por propietario.
Acción: En el **SQL Editor**, ejecutar `010_sin_clave_heredero.sql`, `011_heredero_verificado.sql`, `018_dni_unico_por_propietario.sql` y `021_quitar_clave_heredero.sql`.
Comando:
```
010_sin_clave_heredero.sql          -- el heredero ya no guarda clave: entra con códigos por correo
011_heredero_verificado.sql         -- agrega beneficiario.correo_verificado
018_dni_unico_por_propietario.sql   -- un propietario no repite el DNI de un heredero vigente
021_quitar_clave_heredero.sql       -- elimina la columna clave_acceso_hash, que ya no se usa
```
Explicación: `correo_verificado` es `FALSE` por defecto: significa "pendiente de validar". Un índice único (`ux_beneficiario_dni_propietario`) hace que la propia base rechace dos herederos vigentes con el mismo DNI para un propietario, aunque se salten las validaciones del backend.
Evidencia:
resultado: Columnas de la tabla beneficiario e índice del DNI (consulta a la base)
```resultado
> SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'beneficiario';
 id_beneficiario, id_usuario_propietario, nombres, apellidos, dni, correo,
 telefono, parentesco, estado, correo_verificado (boolean)

> SELECT indexname FROM pg_indexes WHERE tablename = 'beneficiario' AND indexname LIKE '%dni%';
 ux_beneficiario_dni_propietario
```
Resultado esperado: La tabla no tiene `clave_acceso_hash` y sí `correo_verificado` y el índice único.
Verificación: Las dos consultas devuelven lo indicado.
:::

:::paso 7.8.2 Crear, editar y eliminar herederos en el backend
Objetivo: Guardar herederos con sus activos, evitar duplicados y conservar el historial al eliminar.
Acción: Crear `beneficiario.service.ts`, el controlador y las rutas `GET`, `POST`, `PUT` y `DELETE /api/beneficiarios`, más `POST /api/beneficiarios/codigo`.
Comando:
```
// backend/src/services/beneficiario.service.ts (fragmento)
export function crearBeneficiario(datos: NuevoBeneficiario, idUsuario: number): Promise<number> {
  return enFila(idUsuario, () => crearBeneficiarioSeguro(datos, idUsuario));   // un pedido a la vez por usuario
}

// El código es opcional: sin él, la designación queda reservada (pendiente de validar)
if (datos.codigo) await exigirCodigo(datos.correo, datos.codigo);
const verificado = datos.codigo !== null;
// ... INSERT INTO beneficiario (..., correo_verificado) VALUES (..., $8)

// "Eliminar" lo marca INACTIVO para no romper el historial de los procesos
UPDATE beneficiario SET estado = 'INACTIVO' WHERE id_beneficiario = $1 AND id_usuario_propietario = $2
```
Explicación: Las reglas de negocio están en el servicio: no se repite el DNI, los activos elegidos deben ser del propietario y se respeta el límite del plan (módulo 7.10). Si el propietario envía el código que llegó al correo del heredero, el heredero queda verificado; si no, queda **reservado** y no recibe ningún aviso hasta que se abra un proceso. Eliminar marca `INACTIVO` y quita sus activos; no se puede eliminar a un heredero con una confirmación pendiente en un proceso abierto.
Evidencia:
resultado: Reglas del heredero comprobadas con datos temporales (resultado de la prueba)
```resultado
OK   sin código queda pendiente de validar
OK   el dashboard cuenta un pendiente más
OK   editar sin código sigue pendiente
OK   un código falso se rechaza
```
Resultado esperado: Un heredero sin código queda `correo_verificado = false`; un código falso se rechaza con 400.
Error frecuente: Doble clic en **Guardar** crea dos herederos.
Solución: El pedido pasa por `enFila` (una cola por usuario), el botón se desactiva mientras envía y el DNI es único en la base.
Verificación: Crear un heredero con el DNI de otro ya registrado responde 409.
:::

:::paso 7.8.3 Crear la pantalla de herederos con la casilla de verificación
Objetivo: Listar los herederos en tarjetas y registrar uno nuevo con verificación opcional.
Acción: Generar con Angular CLI las piezas nuevas (comandos al inicio de **Comando / código**); luego crear `BeneficiarioService` y la pantalla `/beneficiarios` con el formulario en una ventana modal.
Comando:
```
# Terminal, dentro de la carpeta frontend
ng generate component pages/beneficiarios --skip-tests
ng generate service services/beneficiario --type=service --skip-tests
ng generate interface models/beneficiario --type=model
ng generate component components/modal --skip-tests

// frontend/src/app/pages/beneficiarios/beneficiarios.ts (fragmento)
verificarAhora = false;   // casilla desmarcada por defecto

guardar(): void {
  if (!this.verificarAhora) this.nuevo.codigo = '';   // sin verificar, no se envía código
  ...
}

<!-- beneficiarios.html (fragmento) -->
<input type="checkbox" id="verificarAhora" [(ngModel)]="verificarAhora" />
<label for="verificarAhora">Avisar ahora al heredero y verificar su correo</label>
```
Explicación: La casilla permite que la designación sea **reservada** (idea sugerida por el docente): nadie se entera hasta que llegue el momento. Si se marca, aparece el botón para enviar el código al correo del heredero y el campo para escribirlo. La tarjeta muestra "Identidad verificada" o "Pendiente de validar".
Evidencia:
resultado: Piezas creadas con Angular CLI en el procedimiento 7.8.3 (carpeta limpia de verificación)
```resultado
> ng generate component pages/beneficiarios --skip-tests
CREATE src/app/pages/beneficiarios/beneficiarios.ts (223 bytes)
CREATE src/app/pages/beneficiarios/beneficiarios.css (0 bytes)
CREATE src/app/pages/beneficiarios/beneficiarios.html (29 bytes)
> ng generate service services/beneficiario --type=service --skip-tests
CREATE src/app/services/beneficiario.service.ts (95 bytes)
> ng generate interface models/beneficiario --type=model
CREATE src/app/models/beneficiario.model.ts (36 bytes)
> ng generate component components/modal --skip-tests
CREATE src/app/components/modal/modal.ts (191 bytes)
CREATE src/app/components/modal/modal.css (0 bytes)
CREATE src/app/components/modal/modal.html (21 bytes)
```
![Mis Herederos: tarjetas con el estado de validación](docs/capturas/16-herederos.png)
![Formulario de nuevo heredero con la casilla de verificación](docs/capturas/17b-heredero-formulario.png)
Resultado esperado: Se puede designar un heredero con o sin verificar y ambas tarjetas se muestran con su estado.
Verificación: Un heredero designado sin marcar la casilla aparece como "Pendiente de validar".
:::

### 7.9 Módulo: Activos completos (cifrado, bancos, montos y tarjetas)

**Objetivo del módulo:** registrar, editar y eliminar activos con sus datos sensibles cifrados. **Requerimiento que atiende:** RF-01 y RNF-02 (protección de datos). **Archivos creados o modificados:** `utils/cifrado.ts`, `services/activo.service.ts`, `controllers/activo.controller.ts`, `services/entidad.service.ts` y `utils/validar.ts` en el backend; `pages/activos` en el frontend.

:::paso 7.9.1 Preparar bancos, montos y tarjetas en la base
Objetivo: Agregar los catálogos y columnas que necesita un activo completo.
Acción: En el **SQL Editor**, ejecutar `008_bancos_y_montos.sql`, `016_documentos_por_tipo_y_tarjetas.sql` y `017_linea_credito_es_el_monto.sql`.
Comando:
```
008_bancos_y_montos.sql                     -- entidad_financiera (bancos), historial_monto, moneda y monto
016_documentos_por_tipo_y_tarjetas.sql      -- tarjetas (solo últimos 4 dígitos) e indicaciones cifradas
017_linea_credito_es_el_monto.sql           -- la línea de crédito se registra como el monto del activo
```
Explicación: Un activo puede tener banco, moneda, monto (opcional, con historial) e indicaciones para el heredero. De las tarjetas solo se guardan los **4 últimos dígitos**, el día de pago y el de cierre: nunca el número completo.
Evidencia:
resultado: Columnas de datos sensibles de activo_digital y primeros bancos del catálogo (consulta a la base)
```resultado
> SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'activo_digital' AND (column_name LIKE '%cifrad%' OR column_name IN ('monto','moneda','id_entidad'));
 id_entidad              integer
 indicaciones_cifradas   text
 moneda                  character varying
 monto                   numeric
 monto_cifrado           text

> SELECT nombre FROM entidad_financiera ORDER BY nombre LIMIT 5;
 American Express, BanBif, Banco de la Nación, Banco Pichincha, Banco Ripley
```
Resultado esperado: `activo_digital` tiene las columnas cifradas y el catálogo de bancos tiene registros.
Verificación: Las dos consultas devuelven lo indicado.
:::

:::paso 7.9.2 Cifrar los datos sensibles con AES-256-GCM
Objetivo: Que descripciones, montos e indicaciones se guarden ilegibles en la base de datos.
Acción:
1. Agregar `ENCRYPTION_KEY` al `.env` y exportarla desde `config/env.ts`.
2. Crear `utils/cifrado.ts` con `cifrar` y `descifrar`.
3. Usarlas en `activo.service.ts` al guardar y al leer.
Comando:
```
// backend/src/utils/cifrado.ts
const clave = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();   // clave de 32 bytes

export function cifrar(texto: string): string {
  const iv = crypto.randomBytes(12);
  const cifrador = crypto.createCipheriv('aes-256-gcm', clave, iv);
  const cifrado = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()]);
  const etiqueta = cifrador.getAuthTag();
  return `enc:${iv.toString('base64')}:${etiqueta.toString('base64')}:${cifrado.toString('base64')}`;
}

// backend/src/services/activo.service.ts (fragmento)
function cifrarMonto(datos: DatosActivo): string | null {
  return datos.registrar_monto && datos.monto !== null ? cifrar(String(datos.monto)) : null;
}
```
Explicación: **AES-256-GCM** es un cifrado fuerte incluido en Node.js (no hace falta instalar nada). Cada valor usa un `iv` aleatorio y una etiqueta de autenticación que detecta si alguien lo alteró. Lo que se guarda tiene la forma `enc:<iv>:<etiqueta>:<texto>`. La llave `ENCRYPTION_KEY` vive solo en el `.env` y **no debe cambiarse** después de guardar datos: lo cifrado con una llave solo se lee con esa misma llave. Las contraseñas de usuario no se cifran con esto: usan bcrypt, que no se puede descifrar.
Evidencia:
resultado: Los datos sensibles se guardan ilegibles (consulta a la base)
```resultado
> SELECT LEFT(monto_cifrado, 26) AS monto_en_la_base FROM activo_digital WHERE monto_cifrado IS NOT NULL LIMIT 1;
 enc:z8Fp40BFeEnqMxgd:vXZZD
```
Resultado esperado: En la base se ve `enc:` seguido de texto ilegible; en la pantalla, el monto original.
Error frecuente: Los montos se ven como `enc:...` en la pantalla.
Solución: Se cambió `ENCRYPTION_KEY` después de guardar datos. Volver a poner la llave original.
Verificación: Crear un activo con monto y comprobar que en Supabase aparece cifrado y en la pantalla en claro.
:::

:::paso 7.9.3 Validar y guardar el activo completo
Objetivo: Aplicar las reglas del activo contra la base y guardar todo en una transacción.
Acción: Completar `crearActivo`, `actualizarActivo`, `eliminarActivo` y `asignarHerederos` en `activo.service.ts`, con sus rutas.
Comando:
```
// backend/src/services/activo.service.ts (fragmento)
const tipo = await db.query('SELECT requiere_entidad, es_tarjeta, es_credito FROM tipo_activo WHERE id_tipo = $1', [datos.id_tipo]);
if (t.es_tarjeta && !datos.tarjeta) throw new ReglaActivo('Indica los datos de la tarjeta', 400);
if (tipo.rows[0].requiere_entidad && datos.id_entidad === null) throw new ReglaActivo('Elige el banco de la cuenta', 400);

// El orden de la lista de herederos marca la prioridad
await db.query('INSERT INTO activo_beneficiario (id_activo, id_beneficiario, prioridad) VALUES ($1, $2, $3)', [idActivo, ids[i], i + 1]);
```
Explicación: Las reglas dependen del tipo: una tarjeta exige sus datos, una cuenta bancaria exige el banco, un monto va con su moneda. Todo se guarda dentro de una transacción (`BEGIN`/`COMMIT`): si algo falla, se deshace completo. "Eliminar" un activo lo marca `INACTIVO` para conservar el historial de los procesos. Cada cambio de monto se anota cifrado en `historial_monto`.
Evidencia:
![Formulario de nuevo activo](docs/capturas/15-activo-formulario.png)
![Formulario de una tarjeta de crédito (últimos 4 dígitos, día de pago y cierre)](docs/capturas/33-activo-tarjeta.png)
Resultado esperado: Se puede crear, editar y eliminar activos; el backend rechaza datos incompletos con un mensaje claro.
Verificación: Crear una cuenta bancaria sin banco devuelve 400 con "Elige el banco de la cuenta".
:::

### 7.10 Módulo: Suscripción y plan Básico

**Objetivo del módulo:** limitar los herederos del plan gratuito e invitar a mejorar el plan. **Requerimiento que atiende:** RF-11. **Archivos creados:** `services/suscripcion.service.ts`, `controllers/suscripcion.controller.ts` y `routes/suscripcion.routes.ts` en el backend; `pages/suscripcion` en el frontend.

:::paso 7.10.1 Crear el plan Básico gratuito
Objetivo: Tener un plan gratuito con límite de 2 herederos y uno Premium sin límite.
Acción: En el **SQL Editor**, ejecutar `012_plan_basico.sql`.
Comando:
```
012_plan_basico.sql   -- plan Básico gratuito (2 herederos) y Premium sin límite
```
Explicación: La columna `plan.limite_herederos` vale `NULL` cuando no hay límite. Un usuario sin suscripción registrada se considera del plan gratuito.
Evidencia:
resultado: Planes disponibles (consulta a la base)
```resultado
> SELECT nombre, tipo, precio, limite_herederos FROM plan ORDER BY precio;
 Básico  | FREE    |  0.00 | 2
 Premium | PREMIUM | 29.90 | (sin límite)
```
Resultado esperado: Existen los dos planes con esos valores.
Verificación: La consulta devuelve las dos filas.
:::

:::paso 7.10.2 Aplicar el límite en el backend y mostrar la pantalla
Objetivo: Impedir que se superen los herederos del plan y ofrecer mejorarlo.
Acción: Generar con Angular CLI las piezas nuevas (comandos al inicio de **Comando / código**); luego crear `limiteDeHerederos` y `cambiarPlan`; usar el límite en `revisarLimite` del servicio de herederos y mostrar la pantalla `/suscripcion`.
Comando:
```
# Terminal, dentro de la carpeta frontend
ng generate component pages/suscripcion --skip-tests
ng generate service services/suscripcion --type=service --skip-tests
ng generate interface models/suscripcion --type=model

// backend/src/services/beneficiario.service.ts
async function revisarLimite(idUsuario: number): Promise<void> {
  const limite = await limiteDeHerederos(idUsuario);
  if (limite === null) return;
  const cuenta = await pool.query("SELECT COUNT(*)::int AS n FROM beneficiario WHERE id_usuario_propietario = $1 AND estado = 'ACTIVO'", [idUsuario]);
  if (cuenta.rows[0].n >= limite) {
    throw new ReglaHeredero(`Tu plan permite hasta ${limite} herederos`, 403, 'LIMITE_PLAN', limite);
  }
}
```
Explicación: El backend responde `403` con el código `LIMITE_PLAN`; el frontend lo reconoce y, en lugar de un error, muestra una ventana invitando a mejorar el plan. El cobro del plan Premium todavía no está conectado (Culqi, procedimiento 8.4), por eso `cambiarPlan` solo permite volver al plan gratuito.
Evidencia:
resultado: Piezas creadas con Angular CLI en el procedimiento 7.10.2 (carpeta limpia de verificación)
```resultado
> ng generate component pages/suscripcion --skip-tests
CREATE src/app/pages/suscripcion/suscripcion.ts (215 bytes)
CREATE src/app/pages/suscripcion/suscripcion.css (0 bytes)
CREATE src/app/pages/suscripcion/suscripcion.html (27 bytes)
> ng generate service services/suscripcion --type=service --skip-tests
CREATE src/app/services/suscripcion.service.ts (94 bytes)
> ng generate interface models/suscripcion --type=model
CREATE src/app/models/suscripcion.model.ts (35 bytes)
```
![Pantalla de Suscripción](docs/capturas/25-suscripcion.png)
![Ventana que invita a mejorar el plan](docs/capturas/17-aviso-plan.png)
Resultado esperado: Al intentar designar un tercer heredero con el plan Básico, aparece la ventana "Llegaste al límite de tu plan".
Verificación: `POST /api/beneficiarios` con el límite alcanzado responde 403 con `codigo: "LIMITE_PLAN"`.
:::

### 7.11 Módulo: Reportes e historial

**Objetivo del módulo:** que el propietario consulte su resumen y sus propias acciones. **Requerimiento que atiende:** RF-08. **Archivos creados:** `services/reporte.service.ts`, `services/historial.service.ts`, sus controladores y rutas en el backend; `pages/reportes` y `pages/historial` en el frontend.

:::paso 7.11.1 Calcular el reporte y el historial
Objetivo: Reunir en el backend los datos que muestran el reporte y el historial.
Acción: Generar con Angular CLI las piezas nuevas (comandos al inicio de **Comando / código**); luego crear `obtenerReporte` y `listarHistorial`, con las rutas `GET /api/reportes` y `GET /api/historial`.
Comando:
```
# Terminal, dentro de la carpeta frontend
ng generate component pages/reportes --skip-tests
ng generate component pages/historial --skip-tests
ng generate service services/historial --type=service --skip-tests
ng generate interface models/historial --type=model

// backend/src/services/reporte.service.ts (fragmento)
for (const a of activos.rows) {
  porTipo[a.tipo] = porTipo[a.tipo] ?? { tipo: a.tipo, sensibilidad: a.sensibilidad, cantidad: 0 };
  porTipo[a.tipo].cantidad++;
  const monto = a.monto_cifrado ? Number(descifrar(a.monto_cifrado)) : a.monto_plano;   // el monto se descifra aquí
  if (monto !== null && a.moneda) dinero[a.moneda] = (dinero[a.moneda] ?? 0) + monto;
}

// backend/src/services/historial.service.ts (fragmento)
SELECT fecha, accion, descripcion, ip_origen FROM auditoria WHERE id_usuario = $1
UNION ALL
SELECT fecha_actividad, tipo_evento, NULL, ip_origen FROM actividad_usuario WHERE id_usuario = $1
```
Explicación: Los montos están cifrados en la base, por eso el backend los descifra y los suma por moneda antes de enviarlos. El historial une (`UNION ALL`) las acciones de `auditoria` con los ingresos de `actividad_usuario` y muestra los 100 más recientes, con fecha e IP. Cada usuario solo ve lo suyo.
Evidencia:
resultado: Piezas creadas con Angular CLI en el procedimiento 7.11.1 (carpeta limpia de verificación)
```resultado
> ng generate component pages/reportes --skip-tests
CREATE src/app/pages/reportes/reportes.ts (203 bytes)
CREATE src/app/pages/reportes/reportes.css (0 bytes)
CREATE src/app/pages/reportes/reportes.html (24 bytes)
> ng generate component pages/historial --skip-tests
CREATE src/app/pages/historial/historial.ts (207 bytes)
CREATE src/app/pages/historial/historial.css (0 bytes)
CREATE src/app/pages/historial/historial.html (25 bytes)
> ng generate service services/historial --type=service --skip-tests
CREATE src/app/services/historial.service.ts (92 bytes)
> ng generate interface models/historial --type=model
CREATE src/app/models/historial.model.ts (33 bytes)
```
![Pantalla de Reportes](docs/capturas/31-reportes.png)
![Pantalla Mi Historial](docs/capturas/27-historial.png)
Resultado esperado: El reporte muestra activos por tipo, activos sin heredero, herederos pendientes de validar, dinero registrado por moneda (con un ojito para ocultarlo) y procesos por estado.
Verificación: La suma de dinero del reporte coincide con los montos de los activos del usuario.
:::

### 7.12 Módulo: Recuperar contraseña

**Objetivo del módulo:** que un usuario que olvidó su contraseña la cambie con un código enviado a su correo. **Requerimiento que atiende:** RF-02. **Archivos modificados o creados:** `services/auth.service.ts`, `controllers/auth.controller.ts` y `routes/auth.routes.ts` en el backend; `pages/recuperar` en el frontend.

:::paso 7.12.1 Enviar el código y guardar la contraseña nueva
Objetivo: Cambiar la contraseña sin revelar qué correos están registrados.
Acción:
1. Generar con Angular CLI las piezas nuevas (comandos al inicio de **Comando / código**).
2. Crear `solicitarRecuperacion` y `restablecerPassword` en `auth.service.ts`.
3. Crear las rutas `POST /api/auth/olvide-password` y `POST /api/auth/restablecer-password`.
4. Crear la pantalla `/recuperar` y el enlace "¿Olvidaste tu contraseña?" en el login.
Comando:
```
# Terminal, dentro de la carpeta frontend
ng generate component pages/recuperar --skip-tests

// backend/src/services/auth.service.ts (fragmento)
export async function solicitarRecuperacion(correo: string): Promise<void> {
  const usuario = await pool.query("SELECT id_usuario FROM usuario WHERE correo = $1 AND estado = 'ACTIVO'", [correo]);
  if (usuario.rows.length === 0) return;       // no se avisa si el correo no existe
  await enviarCodigo('RECUPERACION', correo, usuario.rows[0].id_usuario, 'Alguien pidió restablecer la contraseña ...');
}

export async function restablecerPassword(correo: string, codigo: string, password: string, ip: string | null): Promise<boolean> {
  const codigoCorrecto = await validarCodigo('RECUPERACION', correo, codigo);
  if (!codigoCorrecto) return false;
  const hash = await bcrypt.hash(password, 10);
  // UPDATE usuario SET password_hash = $1 ... y se anota RESTABLECER_PASSWORD en la auditoría con la IP
}
```
Explicación: La respuesta es siempre la misma, exista o no el correo, para que nadie pueda averiguar qué correos están registrados. Usa la misma tabla y las mismas reglas del código del módulo 7.6 (10 minutos, 5 intentos, un solo uso). La contraseña nueva se guarda cifrada con bcrypt y el cambio queda en la auditoría.
Evidencia:
resultado: Piezas creadas con Angular CLI en el procedimiento 7.12.1 (carpeta limpia de verificación)
```resultado
> ng generate component pages/recuperar --skip-tests
CREATE src/app/pages/recuperar/recuperar.ts (207 bytes)
CREATE src/app/pages/recuperar/recuperar.css (0 bytes)
CREATE src/app/pages/recuperar/recuperar.html (25 bytes)
```
![Recuperar contraseña con código por correo](docs/capturas/13-recuperar.png)
Resultado esperado: Con el código correcto se elige una contraseña nueva y se puede iniciar sesión con ella.
Verificación: Pedir el código (se ve en la consola del backend), usarlo y entrar con la contraseña nueva; el código usado ya no funciona.
:::

### 7.13 Módulo: Portal del heredero y checklist de documentos

**Objetivo del módulo:** que el heredero entre sin contraseña, con un código enviado a su correo, y vea qué documentos debe reunir. **Requerimiento que atiende:** RF-07. **Archivos creados:** `services/portal.service.ts`, `middlewares/portal.middleware.ts`, `services/documento.service.ts`, `controllers/portal.controller.ts`, `controllers/documento.controller.ts` y `routes/portal.routes.ts` en el backend; `services/portal.service.ts`, `services/documento.service.ts` y `pages/portal` en el frontend.

:::paso 7.13.1 Crear el catálogo de documentos y el checklist
Objetivo: Tener un catálogo de documentos y asignarlos a cada heredero según el tipo de activo que recibe.
Acción: En el **SQL Editor**, ejecutar `014_checklist_documentos.sql` y volver a ejecutar `016_documentos_por_tipo_y_tarjetas.sql` si aún no se hizo.
Comando:
```
014_checklist_documentos.sql   -- requisito_documental (catálogo) y documento_heredero (checklist)
```
Explicación: El administrador mantiene el catálogo (`requisito_documental`); el propietario elige dónde está cada documento original; y los documentos que le tocan a cada heredero se calculan según los tipos de activo que recibe: un activo financiero pide más documentos que un correo o una red social.
Evidencia:
resultado: Catálogo de documentos cargado (consulta a la base)
```resultado
> SELECT nombre, obligatorio FROM requisito_documental ORDER BY id_requisito LIMIT 8;
 Copia del DNI del heredero                  | t
 Certificado de defunción del titular        | t
 Partida de nacimiento o de matrimonio       | f
 Carta poder notarial                        | f
 Declaratoria de herederos o testamento      | f
 Estado de cuenta reciente                   | f
```
Resultado esperado: El catálogo tiene los requisitos iniciales, con los obligatorios marcados.
Verificación: La consulta devuelve las seis filas.
:::

:::paso 7.13.2 Dar ingreso al heredero con un código y una sesión propia
Objetivo: Que el heredero entre con su correo y un código, con una sesión que no sirve en las pantallas del propietario.
Acción:
1. Crear `enviarCodigoPortal` y `entrarAlPortal` en `portal.service.ts`.
2. Crear el middleware `verificarHeredero`.
3. Crear las rutas `POST /api/portal/codigo` y `POST /api/portal/entrar` (públicas) y las demás protegidas con `verificarHeredero`.
Comando:
```
// backend/src/services/portal.service.ts (fragmento)
const heredero = await pool.query("SELECT nombres FROM beneficiario WHERE LOWER(correo) = $1 AND estado = 'ACTIVO' LIMIT 1", [correo]);
// El token dice que es un HEREDERO: así no sirve en las pantallas del propietario
const token = jwt.sign({ tipo: 'HEREDERO', correo }, JWT_SECRET, { expiresIn: '4h' });

// backend/src/middlewares/portal.middleware.ts (fragmento)
if (datos.tipo !== 'HEREDERO' || !datos.correo) {
  res.status(401).json({ mensaje: 'Esta sesión no es de un heredero' });
  return;
}
res.locals.correoHeredero = datos.correo;
```
Explicación: El heredero no tiene contraseña guardada: cada vez que entra recibe un código en su correo. El token lleva `tipo: 'HEREDERO'`: el middleware `verificarToken` del propietario lo rechaza, y `verificarHeredero` rechaza el del propietario. Si el correo no es de un heredero, la respuesta es la misma y no se envía código, para no revelar qué correos son herederos. Los pedidos a `/portal/` están limitados por minuto (`limitarPorMinuto`).
Evidencia:
![Portal del heredero: ingreso con correo y código](docs/capturas/21-portal-ingreso.png)
Resultado esperado: El heredero escribe su correo, recibe el código y entra a su espacio.
Verificación: El token del heredero usado en `/api/activos` responde 401 "Esta sesión es de un heredero".
:::

:::paso 7.13.3 Mostrar el checklist del heredero
Objetivo: Que el heredero vea y marque los documentos que va reuniendo.
Acción: Generar con Angular CLI las piezas nuevas (comandos al inicio de **Comando / código**); luego crear `checklistDelHeredero` y la pantalla `/portal` con la lista de documentos, su avance y el botón para avisar al propietario.
Explicación: Cada heredero solo puede marcar **sus** documentos. Al reunir todos los obligatorios puede pulsar **Avisar que ya tengo todo**: el sistema notifica al propietario y registra la acción en la auditoría. El propietario, por su parte, define en la ventana **Documentos** de cada heredero dónde está cada original.
Evidencia:
resultado: Piezas creadas con Angular CLI en el procedimiento 7.13.3 (carpeta limpia de verificación)
```resultado
> ng generate component pages/portal --skip-tests
CREATE src/app/pages/portal/portal.ts (195 bytes)
CREATE src/app/pages/portal/portal.css (0 bytes)
CREATE src/app/pages/portal/portal.html (22 bytes)
> ng generate service services/portal --type=service --skip-tests
CREATE src/app/services/portal.service.ts (89 bytes)
> ng generate service services/documento --type=service --skip-tests
CREATE src/app/services/documento.service.ts (92 bytes)
> ng generate interface models/documento --type=model
CREATE src/app/models/documento.model.ts (33 bytes)
```
![Portal del heredero con su checklist y avance](docs/capturas/22-portal-checklist.png)
![Ventana Documentos del heredero, vista del propietario](docs/capturas/23-documentos-propietario.png)
Resultado esperado: La pantalla muestra los documentos del heredero con una barra de avance.
Verificación: Marcar un documento en el portal actualiza el avance que ve el propietario.
:::

### 7.14 Módulo: Solicitud de liberación del heredero

**Objetivo del módulo:** que el heredero verifique su identidad en tres pasos, confirme su participación o presente una objeción. **Requerimiento que atiende:** RF-06. **Archivos modificados:** `services/liberacion.service.ts`, `controllers/portal.controller.ts` y `routes/portal.routes.ts` en el backend; `components/solicitud` y `pages/portal` en el frontend.

:::paso 7.14.1 Registrar las verificaciones del heredero
Objetivo: Guardar el DNI validado y la selfie cifrada de cada heredero en cada proceso.
Acción: Ejecutar `015_confirmacion_heredero.sql` si aún no se hizo (módulo 7.5).
Explicación: La tabla `verificacion_beneficiario` guarda, por proceso y heredero, si el DNI fue validado y la selfie (cifrada). La selfie se guarda como evidencia; no se compara automáticamente con el DNI.
Evidencia:
resultado: Columnas de la tabla verificacion_beneficiario (consulta a la base)
```resultado
> SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'verificacion_beneficiario';
 id_proceso       integer
 id_beneficiario  integer
 dni_validado     boolean
 fecha_dni        timestamp with time zone
 selfie_cifrada   text
 fecha_selfie     timestamp with time zone
```
Resultado esperado: La tabla existe con esas seis columnas.
Verificación: La consulta devuelve las seis filas.
:::

:::paso 7.14.2 Validar el DNI, tomar la selfie y confirmar
Objetivo: Que el heredero complete tres verificaciones (código de acceso, DNI y selfie) antes de confirmar.
Acción: Generar con Angular CLI las piezas nuevas (comandos al inicio de **Comando / código**); luego crear `validarDni`, `guardarSelfie`, `confirmarParticipacion` y `presentarObjecion` en `liberacion.service.ts`, con sus rutas bajo `/api/portal/solicitudes/:idProceso/:idBeneficiario/`.
Comando:
```
# Terminal, dentro de la carpeta frontend
ng generate component components/solicitud --skip-tests

// backend/src/services/liberacion.service.ts (fragmentos)
// Paso 2: el DNI escrito se compara con el que registró el propietario
if (h.dni !== dni) throw new ReglaLiberacion('El DNI no coincide con el registrado', 400);

// Paso 3: la selfie se guarda cifrada como evidencia
await pool.query('UPDATE verificacion_beneficiario SET selfie_cifrada = $3, fecha_selfie = NOW() WHERE ...', [..., cifrar(imagen)]);

// Confirmar exige haber pasado las tres verificaciones
if (!v.rows[0]?.dni_validado || !v.rows[0]?.selfie) throw new ReglaLiberacion('Completa las tres verificaciones primero', 409);
```
Explicación: El paso 1 (código de acceso) ya se cumplió al entrar. El paso 2 compara el DNI escrito con el registrado por el propietario; al validarlo, el heredero queda **validado** (`correo_verificado = true`). El paso 3 guarda una foto cifrada. Al confirmar, el sistema reevalúa el proceso: cuando confirman las personas que pide la regla, empieza la espera final. Una objeción deja sin efecto la confirmación del heredero y obliga al propietario a resolverla.
Evidencia:
resultado: Piezas creadas con Angular CLI en el procedimiento 7.14.2 (carpeta limpia de verificación)
```resultado
> ng generate component components/solicitud --skip-tests
CREATE src/app/components/solicitud/solicitud.ts (207 bytes)
CREATE src/app/components/solicitud/solicitud.css (0 bytes)
CREATE src/app/components/solicitud/solicitud.html (25 bytes)
```
![Solicitud de liberación con las tres verificaciones](docs/capturas/29-solicitud-liberacion.png)
![Detalle de un proceso, vista del propietario](docs/capturas/20-proceso-detalle.png)
Resultado esperado: El heredero completa los tres pasos y puede confirmar; el proceso avanza de `EN_CONFIRMACION` a `EN_ESPERA` cuando se alcanzan las confirmaciones mínimas.
Error frecuente: Se intenta confirmar sin completar la selfie.
Solución: El backend responde 409 "Completa las tres verificaciones primero". Completar los tres pasos.
Verificación: Con el heredero de prueba (`heredero.demo@example.com`, DNI `12345670`) se puede recorrer el flujo completo.
:::

:::paso 7.14.3 Liberar el legado al terminar la espera
Objetivo: Entregar los activos a los herederos que confirmaron cuando termina la espera final.
Acción: Crear `liberarProcesosListos` (se ejecuta dentro del monitoreo, módulo 7.5) y `liberar`, que crea las entregas.
Explicación: Cuando el período de espera termina y no hay objeciones abiertas, el proceso pasa a `LIBERADO` y se crea una entrega por cada activo y heredero que confirmó. Los activos financieros quedan en `PENDIENTE_VALIDADOR` si la regla exige un validador externo (pendiente de construir); el resto pasa a `AUTORIZADA`. Todo ocurre en una transacción y después se avisa por correo a cada heredero.
Evidencia:
resultado: Estructura de la tabla entrega, donde se guarda lo que recibe cada heredero (consulta a la base)
```resultado
> SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'entrega';
 id_entrega          integer
 id_proceso          integer
 id_activo           integer
 id_beneficiario     integer
 token_acceso_hash   character varying
 estado              character varying
 fecha_autorizacion  timestamp with time zone
 fecha_acceso        timestamp with time zone
```
Resultado esperado: Los herederos ven en su portal lo que reciben; el propietario ve el proceso `LIBERADO`.
Verificación: Un proceso en espera con el plazo vencido pasa a `LIBERADO` en la siguiente ejecución del monitoreo.
:::

### 7.15 Módulo: Protección contra doble clic y abuso

**Objetivo del módulo:** evitar registros duplicados por doble clic y limitar el abuso de las rutas públicas. **Requerimiento que atiende:** RNF-01. **Archivos creados:** `utils/bloqueo.ts` y `middlewares/limite.middleware.ts`.

:::paso 7.15.1 Atender en fila los pedidos de cada usuario
Objetivo: Que dos pedidos del mismo usuario no se ejecuten a la vez.
Acción: Crear `utils/bloqueo.ts` y envolver con `enFila` las operaciones de creación (activos, herederos).
Comando:
```
// backend/src/utils/bloqueo.ts
const colas = new Map<number, Promise<unknown>>();

export function enFila<T>(idUsuario: number, tarea: () => Promise<T>): Promise<T> {
  const anterior = colas.get(idUsuario) ?? Promise.resolve();
  const actual = anterior.then(tarea, tarea);   // empieza cuando termina el pedido anterior
  colas.set(idUsuario, actual.then(() => undefined, () => undefined));
  return actual;
}
```
Explicación: Cada usuario tiene una cola: un pedido empieza cuando termina el anterior, haya salido bien o mal. Así un doble clic en **Guardar** no crea dos herederos. Además, el botón se desactiva mientras se envía el formulario y la base exige un DNI único por propietario (migración 018): tres capas de protección.
Evidencia:
resultado: Índice único que protege al heredero duplicado (consulta a la base)
```resultado
> SELECT indexname FROM pg_indexes WHERE tablename = 'beneficiario' AND indexname LIKE '%dni%';
 ux_beneficiario_dni_propietario
```
Resultado esperado: Dos pedidos simultáneos con el mismo DNI crean un solo heredero.
Verificación: Enviar dos pedidos iguales a la vez y comprobar que uno responde 409.
:::

:::paso 7.15.2 Limitar las consultas por minuto
Objetivo: Evitar que una misma IP gaste el token del servicio de DNI o pruebe códigos sin límite.
Acción: Crear `middlewares/limite.middleware.ts` y aplicarlo a las rutas públicas.
Comando:
```
// backend/src/middlewares/limite.middleware.ts (fragmento)
registro.cantidad++;
if (registro.cantidad > maximo) {
  res.status(429).json({ mensaje: 'Demasiadas consultas, espera un minuto' });
  return;
}

// backend/src/routes/portal.routes.ts (fragmento)
router.post('/codigo', limitarPorMinuto(5), pedirCodigoPortal);
router.post('/entrar', limitarPorMinuto(10), entrarPortal);
```
Explicación: El middleware cuenta las peticiones de cada IP durante un minuto; al pasar el máximo responde `429`. Se aplica a la consulta de DNI (10 por minuto) y al ingreso del portal.
Evidencia:
resultado: Respuesta real del backend al pedir 7 veces seguidas un código de ingreso al portal (límite: 5 por minuto)
```resultado
> POST /api/portal/codigo  (7 pedidos seguidos)
200 200 200 200 200 429 429

> curl -i -X POST http://localhost:5000/api/portal/codigo  (pedido número 8)
HTTP/1.1 429 Too Many Requests
{"mensaje":"Demasiadas consultas, espera un minuto"}
```
Resultado esperado: Después de los 5 pedidos permitidos en un minuto, el backend responde 429.
Verificación: Después de un minuto, la IP vuelve a poder consultar.
:::

### 7.16 Módulo: Designación reservada y validación del heredero

**Objetivo del módulo:** permitir que la designación de un heredero sea reservada (sugerencia del docente) y validar al heredero cuando se abre un proceso. **Requerimiento que atiende:** RF-04. **Archivos modificados:** `beneficiario.service.ts`, `beneficiario.controller.ts`, `portal.service.ts`, `liberacion.service.ts` y `dashboard.service.ts` en el backend; `pages/beneficiarios`, `pages/dashboard`, `pages/reportes` y `components/solicitud` en el frontend. No requiere migración: se usa `correo_verificado = false` como "pendiente de validar".

:::paso 7.16.1 Dejar la designación reservada
Objetivo: Poder designar a un heredero sin avisarle, hasta que llegue el momento.
Acción:
1. En el controlador, aceptar un código opcional (`leerCodigo`).
2. En el servicio, guardar `correo_verificado = false` si no llega código.
3. En el formulario, agregar la casilla "Avisar ahora al heredero y verificar su correo", desmarcada por defecto.
Explicación: Sin código, el heredero queda **pendiente de validar** y no recibe ningún correo. Si se edita el correo de un heredero verificado sin código, vuelve a quedar pendiente. El límite del plan y las confirmaciones mínimas cuentan a los pendientes igual que a los verificados.
Evidencia:
![Formulario de heredero con la casilla desmarcada](docs/capturas/17b-heredero-formulario.png)
Resultado esperado: El heredero se guarda y su tarjeta muestra "Pendiente de validar" en rojo.
Verificación: `GET /api/beneficiarios` devuelve `verificado: false` para ese heredero.
:::

:::paso 7.16.2 Recordar al propietario los herederos pendientes
Objetivo: Que el propietario no olvide que tiene herederos sin validar.
Acción: En `dashboard.service.ts`, devolver `herederosPendientes`; en el dashboard, mostrar una alerta roja con un botón a **Mis Herederos**; en los reportes, mostrar la tarjeta **Herederos pendientes de validar**.
Comando:
```
// backend/src/services/dashboard.service.ts (fragmento)
const pendientes: number = totalHerederos - herederos.rows[0].verificados;
// ...
herederosPendientes: pendientes,
```
Explicación: La alerta es permanente mientras haya pendientes y no se puede ocultar: cubre al propietario que entra al sistema con frecuencia. El paso de salud del legado también se muestra incompleto hasta que no haya herederos pendientes.
Evidencia:
![Dashboard con la alerta de herederos pendientes de validar](docs/capturas/30-dashboard.png)
Resultado esperado: Con un heredero pendiente aparece la alerta roja en el dashboard.
Verificación: Al verificar al heredero, la alerta desaparece.
:::

:::paso 7.16.3 Validar al heredero cuando se abre un proceso
Objetivo: Permitir que un heredero pendiente entre al portal y se valide con su DNI, sin revelarle datos antes.
Acción:
1. En `portal.service.ts`, quitar la exigencia de `correo_verificado` para recibir el código de ingreso.
2. En `avisarInicioProceso`, enviar un aviso mínimo (sin el nombre del propietario) a los pendientes.
3. En `solicitudesDelHeredero`, mostrar el nombre del propietario solo si el heredero está validado.
4. En `validarDni`, marcar `correo_verificado = true` al validar el DNI.
Comando:
```
// backend/src/services/liberacion.service.ts (fragmentos)
// Mientras no valide su DNI, el heredero no ve quién lo designó
CASE WHEN b.correo_verificado OR COALESCE(v.dni_validado, FALSE)
     THEN u.nombres || ' ' || u.apellidos END AS benefactor,

// Al validar el DNI, queda validado
await pool.query('UPDATE beneficiario SET correo_verificado = TRUE WHERE id_beneficiario = $1', [idBeneficiario]);
```
Explicación: Si el correo fuera de otra persona, esa persona no puede avanzar: sin el DNI correcto no pasa de "Solicitud pendiente" y no ve el nombre del propietario. El aviso por correo es mínimo para los pendientes: "tienes una solicitud pendiente, entra con este correo y valida tu identidad".
Evidencia:
![Solicitud pendiente: el heredero aún no ve quién lo designó](docs/capturas/29b-solicitud-pendiente.png)
resultado: Pruebas de la validación del heredero pendiente (resultado de la prueba con datos temporales)
```resultado
OK   el aviso al pendiente no nombra al propietario
OK   el pendiente recibe código para entrar al portal
OK   antes del DNI no ve quién lo designó
OK   tras validar el DNI ve al propietario
OK   validar el DNI lo deja validado
```
Resultado esperado: El heredero pendiente entra, ve "Solicitud pendiente", valida su DNI y recién entonces aparece el nombre del propietario.
Verificación: Con `heredero.demo@example.com` (DNI `12345670`), dejado como pendiente, recorrer el flujo.
:::

## 8. Integraciones externas

Las integraciones son servicios de terceros que el sistema usa a través del backend. Las claves y tokens de cada uno viven solo en el archivo `.env`.

:::paso 8.1 Conexión con Supabase (PostgreSQL)
Objetivo: Conectar el backend con la base de datos en la nube y comprobar que responde.
Acción: Usar la cadena de conexión del procedimiento 6.5 como `DATABASE_URL` y consultar la ruta de salud.
Comando:
```
// backend/src/config/database.ts
export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }   // Supabase exige conexión cifrada (SSL)
});
```
Explicación: `pg` abre un `Pool` de conexiones y todas las consultas del sistema pasan por él, con parámetros (`$1`, `$2`) para evitar la inyección SQL. El frontend nunca habla con Supabase: solo el backend conoce la contraseña. RLS está activo sin políticas, así que la base solo responde a la cadena de conexión del backend.
Evidencia:
resultado: Respuesta real de /api/salud con la hora de la base de datos
```resultado
> curl http://localhost:5000/api/salud
{"estado":"ok","horaBaseDeDatos":"2026-11-12T18:05:33.489Z"}
```
Resultado esperado: La ruta responde `"estado":"ok"` con la hora de la base.
Error frecuente: `ETIMEDOUT` al conectar.
Solución: Apagar la VPN o usar otra red; si Supabase está pausado, pulsar **Restore**.
Verificación: `/api/salud` responde `ok`.
:::

:::paso 8.2 Consulta de DNI (RENIEC)
Objetivo: Rellenar los nombres de una persona a partir de su DNI al registrarse o designar un heredero.
Acción:
1. Crear una cuenta en el proveedor y copiar el token (procedimiento 3.2.4).
2. Agregar `DNI_PROVIDER` y `DNI_API_TOKEN` al `.env`.
3. Crear `reniec.service.ts` y la ruta de consulta.
Comando:
```
# backend/.env
DNI_PROVIDER=apisnetpe        # o apiperu
DNI_API_TOKEN=********

// backend/src/services/reniec.service.ts (fragmento)
const limite = AbortSignal.timeout(8000);   // no esperar más de 8 segundos
return fetch(`${DNI_API_URL}?numero=${dni}`, { headers: cabeceras, signal: limite });
```
Explicación: El backend hace la consulta con su token; el navegador nunca lo ve. Se aceptan dos proveedores (`apis.net.pe` y `apiperu.dev`), cada uno con sus campos, y agregar otro solo requiere un caso nuevo. La ruta pública está limitada a 10 consultas por minuto por IP. Al registrarse, el backend **vuelve a consultar** el DNI y usa esos nombres, no los que mande el navegador. Si no hay token, el botón avisa y los datos se escriben a mano.
Evidencia:
![Registro: el DNI se busca y valida en RENIEC](docs/capturas/11-registro-1.png)
Resultado esperado: Al pulsar **Buscar** se rellenan los nombres.
Error frecuente: `El token del servicio de DNI no es válido`.
Solución: Revisar `DNI_API_TOKEN` en el `.env` y reiniciar el backend.
Verificación: Un DNI conocido devuelve sus nombres; un DNI inexistente responde "No se encontró ese DNI".
:::

:::paso 8.3 Envío de correos (nodemailer con Gmail)
Objetivo: Enviar los códigos de verificación y los avisos por correo, con el diseño de LegadoSeguro.
Acción:
1. Crear la contraseña de aplicación de Gmail (procedimiento 3.2.5).
2. Completar las variables `SMTP_*` en el `.env`.
3. Reiniciar el backend y provocar un correo (por ejemplo, pedir un código).
Comando:
```
# backend/.env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=********
SMTP_FROM=LegadoSeguro <tucorreo@gmail.com>
```
Explicación: `correo.service.ts` usa `nodemailer`. Si no hay `SMTP_HOST`, el correo **no se envía**: aparece en la consola del backend (modo prueba, útil para exponer). Con SMTP configurado, envía un correo HTML con la cabecera azul y dorada, el código de 6 dígitos en una caja grande y un pie de aviso automático, más el texto plano de respaldo. Aplica a todos los correos del sistema.
Evidencia:
![Correo con el código de verificación recibido en la bandeja](docs/capturas/7-3_correo_recibido.png)
Resultado esperado: El correo llega a la bandeja con el diseño de LegadoSeguro.
Error frecuente: Hotmail y Outlook bloquean el acceso SMTP con contraseña.
Solución: Usar Gmail con una contraseña de aplicación.
Verificación: Pedir un código con un correo real y recibirlo en la bandeja.
:::

### 8.4 Culqi (pagos): pendiente

El cobro de los planes de pago con **Culqi** no se integró en esta versión. Hoy el cambio a un plan de pago responde "El pago de este plan estará disponible cuando se conecte Culqi", y solo se puede volver al plan gratuito. Los pasos previstos son: crear la cuenta de pruebas de Culqi, obtener las llaves de prueba, generar el token de la tarjeta en el navegador con la librería de Culqi (la tarjeta nunca pasa por el backend), enviar ese token al backend y crear el cargo con la llave privada. Se incluye en las limitaciones del proyecto.

## 9. Dashboard y reportes

El **dashboard** dice *cómo estoy y qué hago ahora*; los **reportes** analizan *lo que tengo*. Ambos leen los datos del propio usuario y no modifican nada.

### 9.1 Dashboard (centro de mando)

El dashboard se construyó en el módulo 7.3 y se amplió con la designación reservada en el módulo 7.16. Cada indicador sale de una consulta del backend (`services/dashboard.service.ts`).

![Dashboard del propietario de prueba](docs/capturas/30-dashboard.png)

Tabla: Indicadores del dashboard
| Indicador | Qué muestra | De dónde salen los datos | Qué decisión permite |
|---|---|---|---|
| **Salud del legado (0 a 100)** | Qué tan completo está el legado | `activo_digital`, `activo_beneficiario`, `beneficiario`, `regla_liberacion` | Saber si falta algo por configurar |
| **Próximos pasos** | Lo que falta, con enlace para resolverlo | Los mismos datos | Qué hacer primero |
| **Tu regla en acción** | Días desde el ingreso anterior frente al límite de la regla | `actividad_usuario`, `regla_liberacion` | Cuánto margen queda antes de que se inicie un proceso |
| **Cifras** | Activos, herederos, regla activa y procesos en curso | Conteos de cada tabla | Panorama rápido |
| **Alerta de proceso** | Aviso si hay un proceso en curso | `proceso_liberacion` | Decidir si cancelarlo |
| **Herederos pendientes de validar** | Recordatorio fijo si hay designaciones reservadas | `beneficiario.correo_verificado` | Verificar su correo cuando convenga |
| **Actividad reciente** | Últimas acciones | `auditoria`, `actividad_usuario`, `activo_digital` | Revisar qué pasó últimamente |

**Fórmula de la salud del legado.** Son cinco pasos de 20 puntos cada uno: puntaje = 20 × (pasos cumplidos).

1. Tiene al menos un activo digital.
2. Todos sus activos tienen heredero asignado.
3. Tiene al menos un heredero designado.
4. Ninguno de sus herederos está pendiente de validar.
5. Tiene una regla de liberación activa.

**Consulta principal.** Cuenta los activos sin heredero con `COUNT(*) FILTER (WHERE NOT EXISTS (...))`, los herederos verificados con `COUNT(*) FILTER (WHERE correo_verificado)` y busca la regla activa. Un resultado real del usuario de prueba se muestra en el procedimiento 7.3.2.

### 9.2 Reportes

![Pantalla de reportes](docs/capturas/31-reportes.png)

Tabla: Reportes del propietario
| Reporte | Qué muestra | De dónde sale | Decisión que permite |
|---|---|---|---|
| Activos registrados / sin heredero | Cuántos activos hay y cuántos no tienen heredero | `activo_digital`, `activo_beneficiario` | Asignar herederos pendientes |
| Herederos pendientes de validar | Cantidad (en rojo si es mayor que 0) | `beneficiario.correo_verificado` | Verificar a quienes faltan |
| Dinero registrado | Suma por moneda, con ojito para ocultarlo | `activo_digital.monto_cifrado` (se descifra y suma en el backend) | Ver el patrimonio declarado |
| Activos por tipo | Barras por tipo (los financieros en rojo) | `activo_digital`, `tipo_activo` | Ver cómo se reparte el legado |
| Procesos por estado | Conteo por estado | `proceso_liberacion` | Seguimiento de procesos |


## Referencias

ref: Angular. (s. f.). *Angular CLI*. https://angular.dev/tools/cli
ref: Bootstrap. (s. f.). *Bootstrap 5.3 documentation*. https://getbootstrap.com/docs/5.3/
ref: Express. (s. f.). *Express: Node.js web application framework*. https://expressjs.com/
ref: Git. (s. f.). *Git documentation*. https://git-scm.com/doc
ref: GitHub. (s. f.). *GitHub Docs*. https://docs.github.com/
ref: Microsoft. (s. f.-a). *Visual Studio Code documentation*. https://code.visualstudio.com/docs
ref: Microsoft. (s. f.-b). *TypeScript documentation*. https://www.typescriptlang.org/docs/
ref: Nodemailer. (s. f.). *Nodemailer documentation*. https://nodemailer.com/
ref: OpenJS Foundation. (s. f.). *Node.js documentation*. https://nodejs.org/docs/latest/api/
ref: Supabase. (s. f.). *Supabase documentation*. https://supabase.com/docs
ref: Vercel. (s. f.). *Vercel documentation*. https://vercel.com/docs
