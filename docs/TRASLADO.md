# LegadoSeguro: documento de traslado

Todo lo necesario para continuar el proyecto en otro equipo o en otra sesión de trabajo: qué es, cómo se ejecuta, en qué estado está, cómo se trabaja y qué falta. Estado a **16/11/2026**.

## 1. Qué es

**LegadoSeguro** es una plataforma web de gestión de legado y testamento digital. El **propietario** registra sus activos digitales (cuentas, correos, tarjetas…), designa **herederos** y define una **regla de liberación**; si deja de entrar durante cierto tiempo, el sistema abre un proceso y entrega los activos a los herederos que lo confirman. Un **administrador** supervisa usuarios, auditoría y catálogo de documentos.

- **Autoras:** Katheryn Pardo Acosta y Fiorella Stefany Cabanillas Rojas.
- **Curso:** JavaScript Avanzado, UTP, ciclo VI, 2026-02.
- **Repositorio:** https://github.com/KatherynPardo/LegadoSeguroWeb (rama `master`).
- **Proyectos distintos (no mezclar):** SkillBank (Spring Boot) e Integrador I.

## 2. Tecnología

| Capa | Tecnología |
|---|---|
| Frontend | Angular 22 (sin `zone.js`: componentes independientes y *signals*), Bootstrap 5.3, fuente Inter |
| Backend | Node.js 24 + Express 4 + TypeScript, `tsx` para desarrollo |
| Base de datos | Supabase (PostgreSQL), 33 tablas, migraciones `001` a `022` en `supabase/migrations/` |
| Seguridad | bcryptjs (contraseñas), JWT (sesiones), AES-256-GCM con `ENCRYPTION_KEY` (datos sensibles, valores `enc:`) |
| Correo | nodemailer con Gmail (contraseña de aplicación); sin `SMTP_HOST` los códigos salen en la consola del backend |
| DNI | apiperu.dev (RENIEC) a través del backend |
| Visión por computador | MediaPipe Face Detector (`@mediapipe/tasks-vision`), corre en el navegador |

Estructura por capas del backend: `routes → controllers → services → base de datos` (`models` = tipos, `middlewares` = sesión, rol y límites, `utils` = cifrado, IP, validaciones). Frontend: `pages` (una por pantalla), `components` (modal, menú, logo, solicitud), `services` (hablan con la API), `models`, `core` (guardias, interceptor, `api.config.ts`).

## 3. Cómo ejecutarlo en otro equipo

Requisitos: Node.js 24 y npm 11, Git, Google Chrome (para las herramientas), una base de Supabase.

```bash
git clone https://github.com/KatherynPardo/LegadoSeguroWeb.git
cd LegadoSeguroWeb/backend
npm install
copy .env.example .env
```

Completa `backend/.env` (el archivo real **no está en GitHub**; cópialo desde el equipo original por un medio privado o créalo de nuevo):

| Variable | Qué poner |
|---|---|
| `DATABASE_URL` | Cadena de conexión de Supabase (Connect → Session pooler) con la contraseña real |
| `PORT` | `5000` |
| `JWT_SECRET` | Cadena larga al azar: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ENCRYPTION_KEY` | Frase larga. **No cambiarla después** de guardar datos: no se podrían leer |
| `TRUST_PROXY` | `0` en local; `1` al desplegar detrás de un proxy (Render, Railway, Vercel) |
| `DNI_PROVIDER` / `DNI_API_TOKEN` | `apiperu` y el token (opcional; sin token los nombres se escriben a mano) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Gmail con contraseña de aplicación (opcional; sin `SMTP_HOST` los códigos salen en la consola) |

Base de datos: si se usa un proyecto de Supabase nuevo, ejecutar en el **SQL Editor** las migraciones `001` a `022` en orden. Si se usa el proyecto existente, ya están aplicadas.

```bash
npm run dev
```

En otra terminal:

```bash
cd frontend
npm install
npx ng serve
```

Comprobar: `http://localhost:5000/api/salud` responde `"estado":"ok"` y `http://localhost:4200` muestra el login. Si `npm run dev` da `EADDRINUSE :::5000`, ya hay un backend encendido: no repetirlo.

Otros comandos: `npm run diccionario` (backend: regenera el diccionario de datos en `DOCUMENTACION_SISTEMA.md`), `npx tsc --noEmit` (backend) y `npx ng build` (frontend) para comprobar que compilan.

## 4. Usuarios de prueba (datos ficticios, están en las migraciones)

| Rol | Usuario | Contraseña / acceso | Para qué sirve |
|---|---|---|---|
| Propietario | `carlos.ramirez@example.com` | `Legado2026!` | Demo principal: 8 activos, 2 herederos (1 pendiente de validar), 1 regla activa, salud del legado 60 |
| Propietario | `demo.inactivo@example.com` | `Legado2026!` | Tiene un proceso de liberación abierto; Hugo es su heredero |
| Administrador | `admin@legadoseguro.pe` | `Admin2026!` | Usuarios, auditoría, catálogo de documentos y monitoreo a pedido |
| Heredero (Hugo) | `katy.s.9210+heredero@gmail.com` | Entra en `/portal` con un **código de 6 dígitos** que llega a ese Gmail; DNI `12345670` | Recorrido del portal: DNI, consentimiento, selfie y confirmación |

El correo original de Hugo era `heredero.demo@example.com` (dominio de ejemplo: no recibe correos). Para volver a él o reiniciar la demo: ver `docs/herramientas/README.md` (`reset-demo.ts`). Cambiar estas contraseñas antes de desplegar.

## 5. Qué hace el sistema (módulos terminados)

- **Registro y sesión:** DNI validado en RENIEC, código de 6 dígitos por correo (hash, 10 min, 5 intentos, un solo uso), recuperación de contraseña, JWT de 8 h (4 h para el heredero, con un token distinto que no sirve en pantallas del propietario).
- **Activos:** tipo, banco, monto opcional con historial, tarjetas (solo últimos 4 dígitos), descripción e indicaciones cifradas.
- **Herederos:** verificación del correo con código **opcional**; sin código queda **pendiente de validar** (`beneficiario.correo_verificado = false`, "designación reservada") con etiqueta roja, recordatorio fijo en el Dashboard y tarjeta en Reportes. Límite de herederos según el plan (Básico: 2). El pendiente cuenta para el límite.
- **Reglas y procesos:** días de inactividad, confirmaciones mínimas, espera final y validador; el monitoreo (al arrancar y cada hora) envía una alerta con plazo de gracia y abre el proceso; el propietario puede cancelarlo.
- **Portal del heredero** (`/portal`): ingreso por código; checklist de documentos según el tipo de activo; solicitud de liberación con tres verificaciones: (1) código, (2) DNI (al validarlo, el heredero deja de estar pendiente y recién ve quién lo designó), (3) selfie. Luego confirma u objeta, espera y se libera con entregas.
- **Selfie (Ley 29733):** texto de consentimiento con casilla antes de poder tomarla (el backend también lo exige: 400 si falta); se guarda cifrada con fecha e IP del consentimiento (`verificacion_beneficiario.fecha_consentimiento`, `ip_consentimiento`); el heredero puede **eliminar la foto** (borra también el consentimiento) hasta que confirma; el navegador revisa con MediaPipe que haya **un solo rostro, centrado y de buen tamaño** (rechaza animales y varias personas). Esa revisión depende de descargar el modelo por internet y no la valida el backend.
- **Suscripción, dashboard, reportes, historial, administración, perfil.**
- **Protecciones:** pedidos de un mismo usuario atendidos en fila, botón desactivado contra el doble clic, índice único de DNI por propietario, límite de pedidos por minuto (429) en rutas públicas, auditoría con IP, `trust proxy` configurable (`TRUST_PROXY`).

## 6. Documentación del proyecto

| Archivo | Contenido |
|---|---|
| `MANUAL_CONSTRUCCION.md` | **Fuente única del manual** (tutorial replicable con el formato obligatorio del curso). Secciones 1 a 17 del esquema; procedimientos `:::paso`. |
| `MANUAL_CONSTRUCCION_v7.docx` | Word generado (último). Nunca se edita a mano: se regenera con un nombre nuevo |
| `DOCUMENTACION_SISTEMA.md` | Documento técnico dinámico (requisitos, diccionario de datos generado desde la base, pruebas P-01 a P-67, errores, cierre) |
| `AVANCES.md` | Bitácora cronológica y próximos pasos |
| `docs/capturas/` | Capturas y diagramas del manual (`LEEME.md` lista el patrón de nombres) |
| `docs/herramientas/` | Generadores del Word, de los diagramas y de las capturas (ver su `README.md`) |

**Reglas del manual (obligatorias):** cada procedimiento es una tabla de 10 filas (Paso, Objetivo, Acción, Comando/código, Explicación, Evidencia, Resultado esperado, Error frecuente, Solución, Verificación); Times New Roman, párrafos de 10 pt justificados, interlineado 1,15, tablas y código a 9 pt, Título 1 de 12 pt y Título 2 de 11 pt (estilo APA 7); figuras y tablas numeradas; **referencias APA con año, nunca "s. f."** (2026, y 2026a/2026b si hay dos del mismo autor). Los resultados de terminal y de base de datos deben ser **reales**; no se simulan capturas que parezcan tomadas por la autora. Cuando cambia el sistema, el cambio se refleja **de forma retroactiva** en el procedimiento original del manual (no solo al final), y se actualizan pruebas, requisitos, `AVANCES.md` y `DOCUMENTACION_SISTEMA.md`.

## 7. Estado de Git

- Remoto `origin` = el repositorio de GitHub. En el equipo original, `master` estaba **5 commits por delante** de `origin/master`, más cambios sin confirmar (selfie con consentimiento y eliminación, revisión de rostro, `TRUST_PROXY`, manual v7, herramientas). **Falta hacer `git push`.**
- Si se lleva el proyecto en un zip (con la carpeta `.git`), el historial va incluido; el `.env` y `node_modules` no.

## 8. Pendientes y mejoras (por prioridad)

1. **Despliegue** (frontend en Vercel; backend en Render/Railway): cambiar `API_URL` en `frontend/src/app/core/api.config.ts`, `TRUST_PROXY=1`, variables de entorno en el servicio (nunca en el repositorio), revisar CORS. Completar la sección 12 del manual y la URL pública.
2. **Rotar claves** al desplegar: la contraseña de aplicación de Gmail y la contraseña de la base de Supabase se compartieron en el chat; poner un `JWT_SECRET` y `ENCRYPTION_KEY` propios de producción (cambiar `ENCRYPTION_KEY` invalida los datos ya cifrados: hay que descifrar y volver a cifrar).
3. **Algo novedoso pedido por el docente:** ya hay visión por computador (revisión de la selfie). Quedó propuesto además un **asistente virtual** de orientación legal apoyado en la tabla `guia_legal` (sin enviar datos personales) y/o una **sugerencia inteligente de días de inactividad** a partir de `actividad_usuario`. Sin decidir.
4. Cobro del plan Premium con **Culqi** (hoy responde 409) y portal del **validador externo**.
5. Permitir **retirar el consentimiento** de la selfie también después de confirmar; comparar la selfie con la foto del DNI y prueba de vida (requiere proveedor externo).
6. Sugerir el dominio correcto si el correo del heredero está mal escrito; línea de recordatorio en los correos; herramienta del administrador para corregir correos.
7. Pruebas automáticas (`npm test`): hoy las 67 pruebas del manual se corrieron a mano con `curl`.
8. Menú superior que se corta a 768 px (tablet) en la sección "Suscripción"; el bundle inicial de Angular pasa por 8 kB el presupuesto de 500 kB (advertencia de `ng build`, no es un error).
9. Pantalla "Mi Perfil" sin procedimiento propio en el manual.

## 9. Cómo se trabaja con la autora (preferencias)

- Idioma **español**, respuestas breves; "haz" o "procede" = implementar **y verificar**, luego informar al final.
- Código simple, limpio y **seguro**, alineado con la base de datos, **sin código muerto** ni basura; reutilizar lo existente.
- No ocultar problemas ni inventar resultados: si algo no se probó, decirlo.
- Los secretos (contraseñas, tokens, claves) se ocultan en capturas y no se repiten en respuestas.
- Los Word generados llevan un nombre nuevo cada vez; ella los abre y revisa. Pulsar F9 en el índice al abrirlos.
- Las decisiones se le plantean con una recomendación clara; los cambios de datos de la demo se avisan.

## 10. Prompt para continuar en otra sesión de Claude

> Estoy continuando el proyecto LegadoSeguro (Angular + Express + Supabase). Lee `docs/TRASLADO.md`, `AVANCES.md` y `docs/herramientas/README.md` antes de empezar. Trabaja en español, con respuestas breves, código simple y seguro, sin código muerto, y refleja cada cambio de forma retroactiva en `MANUAL_CONSTRUCCION.md`. El Word se genera con `docs/herramientas/generar-word.js` con un nombre nuevo. Lo siguiente por hacer es: (aquí tu pedido).
