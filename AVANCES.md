# Registro de avances: LegadoSeguro

Bitácora de lo construido, en orden cronológico.

| Fecha | Avance |
|---|---|
| 09/10/2026 | Se define el alcance y la arquitectura: Angular, Express y base de datos. Se instalan Node.js y Angular CLI. |
| 19/10/2026 | Primer recorrido de punta a punta: Angular muestra una tabla de beneficiarios que viene de Express y de Supabase. |
| 20/10/2026 | Se adapta el modelo de **24 tablas** a PostgreSQL y se crea en Supabase, con RLS activado. Se elaboran el modelo entidad-relación (por módulos), el modelo lógico y la presentación. Se agrega la pantalla de **Activos** (con JOIN a `tipo_activo`). |
| 20/10/2026 | Reorganización del código por capas: backend (routes, controllers, services, models, config) y frontend (pages, components, services, models, core). Primer commit a GitHub. |
| 30/10/2026 | Se aplica el diseño de Figma: fuente Inter, paleta de colores y menú lateral. |
| 30/10/2026 | **Dashboard** con cifras reales y actividad reciente. |
| 30/10/2026 | **Login real**: contraseñas cifradas con bcrypt, sesión con JWT, interceptor, guardia de rutas y middleware en el backend. |
| 30/10/2026 | Formularios en **modales** reutilizables; diseño responsivo; alta de herederos con validaciones. |
| 30/10/2026 | La **sensibilidad** de un activo se deduce de su tipo (los tipos ahora vienen de la base). |
| 30/10/2026 | **Mi Perfil**: edición de datos personales y cambio de contraseña con confirmación. |
| 30/10/2026 | **Búsqueda de nombres por DNI** con apiperu.dev, a través del backend. |
| 30/10/2026 | La base de datos se organiza en `supabase/migrations/` (4 migraciones numeradas). Se redacta el manual de construcción. |

| 30/10/2026 | **Reglas de Liberación**: pantalla con el diseño de Figma (días de inactividad, confirmaciones mínimas, período de espera y validador externo) y panel "Así funcionará tu regla" que se actualiza al cambiar los valores. Cada usuario tiene una regla activa; el Dashboard ya cuenta la regla activa. |

| 30/10/2026 | **Procesos de liberación**: el sistema registra cada inicio de sesión en `actividad_usuario`, un monitoreo (al arrancar y cada hora) detecta la inactividad contra la regla y crea el proceso con sus activos y confirmaciones pendientes. Pantalla de Procesos con detalle y cancelación (queda en `auditoria`). |

| 30/10/2026 | **Registro de usuarios** (`/registro`, rol PROPIETARIO, contraseña cifrada, sesión iniciada al crear la cuenta) y **usuario administrador** con rol validado en la base: pantalla Usuarios para ver cuentas y activarlas o desactivarlas. |
| 30/10/2026 | **Auditoría con IP**: se guarda la IP de registro e inicio de sesión; la pantalla Usuarios muestra fecha de creación, IP de registro y último acceso, y una tabla de auditoría con las acciones del administrador. |
| 02/11/2026 | **Herederos por activo**: en Mis Activos se elige qué herederos recibe cada activo (tabla `activo_beneficiario`, el orden marca la prioridad). Al iniciarse un proceso, las confirmaciones se generan a partir de esa asignación. |
| 03/11/2026 | **Validaciones obligatorias** en activos, herederos, registro y perfil (teléfono de 9 dígitos, correo válido, textos con máximo). **Editar y eliminar** activos y herederos (eliminar = marcar INACTIVO para conservar el historial). **Bancos** (catálogo con botón "Nuevo banco"), **monto opcional** en cualquier activo con moneda soles o dólares e **historial de montos**. |

## Próximos pasos

1. Recuperación de contraseña por correo.
2. Planes, suscripciones y pagos (Culqi).
3. Portal del heredero (React) y despliegue.
