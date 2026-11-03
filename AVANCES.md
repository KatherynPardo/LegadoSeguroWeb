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
| 03/11/2026 | **Seguridad**: código de verificación por correo al registrarse y al registrar un heredero (contra suplantación), cifrado AES-256 de descripciones y montos, y pantalla **Mi Historial**. El heredero ya no tiene clave guardada (se verifica con códigos por correo) y se quitó el rango de ahorro, porque el monto exacto con historial ya cubre esa necesidad. El manual se reordena paso a paso (Fase 8). |
| 03/11/2026 | **Diseño según Figma**: escudo y menú lateral, saludo y actividad real en el Dashboard, columna Estado en Activos, tarjetas de herederos con insignia de identidad verificada. Nuevas pantallas **Suscripción** y **Reportes**, y menú en el orden del diseño (Dashboard, Activos, Herederos, Reglas, Procesos, Suscripción, Reportes, Administración). |
| 03/11/2026 | **Plan Básico gratuito con 2 herederos**: al llegar al límite, una ventana invita a mejorar el plan (backend y pantalla lo validan). El dinero registrado en Reportes se puede ocultar o mostrar con un ojito. |
| 03/11/2026 | **Dashboard renovado**: portada con "Salud del legado" (círculo animado de 0 a 100), próximos pasos accionables, "Tu regla en acción" con barra de inactividad, alerta de proceso en curso y actividad con colores. |
| 03/11/2026 | **Días de inactividad libres**: el usuario escribe los días que quiera (entre 7 y 3650) con atajos de 15, 30, 90, 180 y 365; el backend lo valida y la base lo controla con una restricción. |
| 03/11/2026 | **Recuperar contraseña**: pantalla `/recuperar` con código por correo y contraseña nueva; queda en la auditoría. |

## Próximos pasos

1. Portal del heredero (React) con código por correo en cada confirmación.
2. Cobro del plan Premium con Culqi.
3. Despliegue.
