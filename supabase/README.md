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

## Cómo ejecutarlas

1. Entra a tu proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor** y pulsa **New query**.
3. Pega el contenido de `001_esquema_inicial.sql` y pulsa **Run**.
4. Repite con `002` a `006`, **en ese orden**: cada una depende de la anterior.
5. En **Table Editor** debes ver las 24 tablas.

> Cada archivo se ejecuta **una sola vez**. Si lo corres de nuevo dará error de "ya existe".

## Las 24 tablas, por módulo

| Módulo | Tablas |
|---|---|
| Usuarios y seguridad | `rol`, `usuario`, `token_recuperacion`, `actividad_usuario`, `auditoria` |
| Activos y beneficiarios | `tipo_activo`, `activo_digital`, `beneficiario`, `activo_beneficiario`, `validador_externo` |
| Reglas y proceso de liberación | `regla_liberacion`, `reporte_fallecimiento`, `proceso_liberacion`, `proceso_activo`, `confirmacion_beneficiario`, `validacion_externa`, `objecion`, `entrega` |
| Orientación legal y notificaciones | `guia_legal`, `orientacion_legal_generada`, `notificacion` |
| Suscripciones y pagos | `plan`, `suscripcion`, `pago` |

## Seguridad

Con RLS activado y **sin políticas**, la API pública de Supabase no puede leer ni escribir ninguna tabla. El backend (Express) se conecta con el usuario `postgres`, que es dueño de las tablas y sí tiene acceso. Así, solo el backend, con credenciales privadas, toca los datos.

## Conexión del backend

La dirección de conexión **no** está en el código: va en `backend/.env` como `DATABASE_URL`
(Supabase → **Connect** → **Session pooler**). El archivo `.env` nunca se sube a GitHub.
