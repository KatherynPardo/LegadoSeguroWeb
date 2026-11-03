# Supabase: base de datos de LegadoSeguro

Esta carpeta contiene **toda la información de la base de datos**: el esquema, la seguridad y los datos de prueba, como migraciones numeradas.

| Archivo | Qué hace |
|---|---|
| `migrations/001_esquema_inicial.sql` | Crea las **24 tablas** del modelo entidad-relación, con llaves primarias y foráneas |
| `migrations/002_seguridad_rls.sql` | Activa **RLS** (Row Level Security) en todas las tablas |
| `migrations/003_datos_iniciales.sql` | Carga roles, un usuario, tipos de activo, activos, beneficiarios y planes (datos ficticios) |
| `migrations/004_usuario_demo.sql` | Deja una contraseña (cifrada) al usuario de prueba para poder iniciar sesión |
| `migrations/005_proceso_demo.sql` | Carga un proceso de liberación de prueba (con activos y confirmaciones) para ver la pantalla Procesos |
| `migrations/006_usuario_admin.sql` | Crea el usuario administrador de prueba (rol ADMINISTRADOR) |
| `migrations/007_auditoria_ip.sql` | Agrega la columna de IP a `usuario`, `actividad_usuario` y `auditoria` |
| `migrations/008_bancos_y_montos.sql` | Crea `entidad_financiera` (bancos) e `historial_monto`, y agrega banco, moneda y monto a `activo_digital` |
| `migrations/009_cifrado_y_codigos.sql` | Agrega las columnas cifradas (monto) y la tabla `codigo_verificacion` |
| `migrations/010_sin_clave_heredero.sql` | El heredero ya no guarda clave (usa códigos por correo) y se quita la columna del rango de ahorro |
| `migrations/011_heredero_verificado.sql` | Marca si el heredero confirmó su correo (`beneficiario.correo_verificado`) |
| `migrations/012_plan_basico.sql` | Plan Básico gratuito con límite de 2 herederos (`plan.limite_herederos`); el Premium no tiene límite |
| `migrations/013_dias_inactividad_libres.sql` | Los días de inactividad son libres; la base exige que estén entre 7 y 3650 (`regla_liberacion`) |
| `migrations/014_checklist_documentos.sql` | Crea `requisito_documental` (catálogo) y `documento_heredero` (checklist de cada heredero) con 5 requisitos iniciales |
| `migrations/015_confirmacion_heredero.sql` | Crea `verificacion_beneficiario` (DNI y selfie del heredero en un proceso) y `proceso_liberacion.fecha_espera` |
| `migrations/016_documentos_por_tipo_y_tarjetas.sql` | Documentos según el tipo de activo (`requisito_tipo`), tarjetas (`detalle_tarjeta`, solo los 4 últimos dígitos), indicaciones cifradas por activo y bancos emisores de tarjetas |
| `migrations/017_linea_credito_es_el_monto.sql` | Quita la columna de línea de crédito de `detalle_tarjeta`: la línea se registra como el monto del activo |
| `migrations/018_dni_unico_por_propietario.sql` | Un propietario no puede tener dos herederos vigentes con el mismo DNI (lo exige la base) |

## Cómo ejecutarlas

1. Entra a tu proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor** y pulsa **New query**.
3. Pega el contenido de `001_esquema_inicial.sql` y pulsa **Run**.
4. Repite con `002` a `018`, **en ese orden**: cada una depende de la anterior.
5. En **Table Editor** debes ver 32 tablas: las 24 del modelo original más `entidad_financiera`, `historial_monto`, `codigo_verificacion`, `requisito_documental`, `documento_heredero`, `verificacion_beneficiario`, `requisito_tipo` y `detalle_tarjeta`.

> Cada archivo se ejecuta **una sola vez**. Si lo corres de nuevo dará error de "ya existe".

## Las tablas, por módulo (24 originales + 8 nuevas)

| Módulo | Tablas |
|---|---|
| Usuarios y seguridad | `rol`, `usuario`, `token_recuperacion`, `actividad_usuario`, `auditoria`, `codigo_verificacion` *(009)* |
| Activos y beneficiarios | `tipo_activo`, `activo_digital`, `beneficiario`, `activo_beneficiario`, `validador_externo`, `entidad_financiera` *(008)*, `historial_monto` *(008)*, `requisito_documental` *(014)*, `documento_heredero` *(014)*, `requisito_tipo` *(016)*, `detalle_tarjeta` *(016)* |
| Reglas y proceso de liberación | `regla_liberacion`, `reporte_fallecimiento`, `proceso_liberacion`, `proceso_activo`, `confirmacion_beneficiario`, `validacion_externa`, `objecion`, `entrega` |
| Orientación legal y notificaciones | `guia_legal`, `orientacion_legal_generada`, `notificacion` |
| Suscripciones y pagos | `plan`, `suscripcion`, `pago` |

## Seguridad

Con RLS activado y **sin políticas**, la API pública de Supabase no puede leer ni escribir ninguna tabla. El backend (Express) se conecta con el usuario `postgres`, que es dueño de las tablas y sí tiene acceso. Así, solo el backend, con credenciales privadas, toca los datos.

## Conexión del backend

La dirección de conexión **no** está en el código: va en `backend/.env` como `DATABASE_URL`
(Supabase → **Connect** → **Session pooler**). El archivo `.env` nunca se sube a GitHub.
