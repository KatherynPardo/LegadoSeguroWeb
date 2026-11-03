# Manual de construcción de LegadoSeguro

Guía paso a paso para construir y poner en marcha el sistema, **desde el paso 0** hasta tenerlo funcionando.

**Autora:** Katheryn Pardo Acosta · **Curso:** JavaScript Avanzado (UTP) · **Ciclo:** VI, 2026-02

---

## Qué vamos a construir

Una plataforma web donde una persona registra sus **activos digitales** (cuentas, correos, etc.) y designa a sus **beneficiarios** (herederos).

```
Angular (4200)  ──HTTP/JSON──►  Express (5000)  ──SQL──►  Supabase (PostgreSQL)
```

**Regla de seguridad:** Angular nunca se conecta directo a la base de datos. Si lo hiciera, la contraseña de la base quedaría en el navegador y cualquiera la vería con F12. Solo el backend tiene las credenciales.

| Fase | Contenido |
|---|---|
| 0 | Herramientas y cuentas |
| 1 | Base de datos en Supabase |
| 2 | Backend con Express |
| 3 | Frontend con Angular |
| 4 | Seguridad: login y sesión |
| 5 | Funcionalidades del sistema |
| 6 | Puesta en marcha |
| 7 | Solución de problemas |

---

## Fase 0 · Herramientas y cuentas

### Paso 0.1: Instalar las herramientas

| Herramienta | Para qué sirve | Verificar |
|---|---|---|
| **Node.js** (versión 24 o superior) | Ejecuta el backend y las herramientas de Angular | `node -v` |
| **npm** (viene con Node.js) | Instala las librerías | `npm -v` |
| **VS Code** | Editor de código | |
| **Git** | Guarda el historial de cambios | `git --version` |

### Paso 0.2: Instalar el CLI de Angular

```powershell
npm install -g @angular/cli
```

Comprueba con `ng version`. Si PowerShell no deja ejecutar `ng`, abre PowerShell y ejecuta una vez:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Paso 0.3: Crear las cuentas

| Cuenta | Para qué | Costo |
|---|---|---|
| **GitHub** | Guardar el código en la nube y trabajar en equipo | Gratis |
| **Supabase** | Base de datos PostgreSQL en la nube | Gratis |
| **apiperu.dev** (opcional) | Consultar nombres por DNI | Plan gratuito |

### Paso 0.4: Crear la carpeta del proyecto

```powershell
mkdir LegadoSeguroWeb
cd LegadoSeguroWeb
git init
```

Las comillas son obligatorias si la ruta tiene espacios: `cd "E:\UTP\CICLO 06\..."`.

---

## Fase 1 · Base de datos en Supabase

### Paso 1.1: Crear el proyecto

1. Entra a [supabase.com](https://supabase.com) y pulsa **New project**.
2. Elige un nombre, una contraseña para la base de datos (**guárdala**) y una región.
3. Espera a que termine de crearse.

> Si el proyecto se pausa por inactividad, entra al panel y pulsa **Restore**.

### Paso 1.2: Crear las tablas

En **SQL Editor → New query**, pega y ejecuta **en este orden** los archivos de `supabase/migrations/`:

| Orden | Archivo | Resultado |
|---|---|---|
| 1 | `001_esquema_inicial.sql` | Las 24 tablas |
| 2 | `002_seguridad_rls.sql` | RLS activado en todas |
| 3 | `003_datos_iniciales.sql` | Roles, tipos de activo, planes y datos de prueba |
| 4 | `004_usuario_demo.sql` | Contraseña de prueba para poder entrar |

Verifica en **Table Editor**: deben aparecer las 24 tablas.

### Paso 1.3: Obtener la dirección de conexión

1. Pulsa **Connect** en el panel de Supabase.
2. Pestaña **Connection string** → **Session pooler**.
3. Copia la dirección y reemplaza `[YOUR-PASSWORD]` por la contraseña de tu base.

Esa dirección es la `DATABASE_URL` del siguiente paso. **Es un secreto.**

---

## Fase 2 · Backend con Express

### Paso 2.1: Crear el proyecto

```powershell
mkdir backend
cd backend
npm init -y
```

### Paso 2.2: Instalar las librerías

```powershell
npm install express cors pg dotenv bcryptjs jsonwebtoken
npm install -D typescript tsx @types/node @types/express @types/cors @types/pg @types/jsonwebtoken
```

| Librería | Para qué |
|---|---|
| `express` | Servidor web y rutas |
| `cors` | Permite que Angular (puerto 4200) llame a la API |
| `pg` | Conexión a PostgreSQL |
| `dotenv` | Lee el archivo `.env` |
| `bcryptjs` | Cifra las contraseñas |
| `jsonwebtoken` | Crea y valida las sesiones (JWT) |
| `tsx` | Ejecuta TypeScript con recarga automática |

### Paso 2.3: Configurar TypeScript

Crea `backend/tsconfig.json`:

```json
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
```

En `package.json`, los scripts:

```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js"
}
```

### Paso 2.4: Crear el archivo `.env`

Copia `.env.example` a `.env` y completa los valores:

```
DATABASE_URL=postgresql://postgres.xxxx:[TU-CONTRASEÑA]@aws-0-...pooler.supabase.com:5432/postgres
PORT=5000
JWT_SECRET=una-cadena-larga-y-secreta
DNI_PROVIDER=apiperu
DNI_API_TOKEN=
ENCRYPTION_KEY=otra-frase-larga-que-no-cambiaras
# Opcional, para enviar correos de verdad (ver Paso 8.3):
# SMTP_HOST=smtp.gmail.com
# SMTP_USER=tucorreo@gmail.com
# SMTP_PASS=
```

> El `.env` **nunca** se sube a GitHub: está en `backend/.gitignore`.

### Paso 2.5: Organizar el código por capas

```
backend/src/
├── config/        env.ts, database.ts        Variables de entorno y conexión
├── models/        *.model.ts                 Tipos de datos
├── services/      *.service.ts               Consultas SQL (no saben de HTTP)
├── controllers/   *.controller.ts            Reciben el pedido y responden en JSON
├── middlewares/   auth.middleware.ts         Exige sesión iniciada
├── routes/        *.routes.ts, index.ts      URLs de la API
├── app.ts                                    Configura Express
└── server.ts                                 Enciende el servidor
```

El flujo de cada pedido es: **ruta → controlador → servicio → base de datos**, igual que controlador, servicio y repositorio en Spring Boot.

Las consultas SQL usan **parámetros** (`$1`, `$2`) en vez de pegar los valores dentro del texto, para evitar la inyección SQL.

### Paso 2.6: Probar el backend

```powershell
npm run dev
```

Debe decir `Servidor LegadoSeguroWeb en http://localhost:5000`. Abre `http://localhost:5000/api/salud`: debe mostrar `"estado":"ok"`.

---

## Fase 3 · Frontend con Angular

### Paso 3.1: Crear el proyecto

Desde la carpeta raíz del proyecto:

```powershell
ng new frontend
```

Respuestas: estilos **CSS**, SSR **No**, telemetría **No**.

### Paso 3.2: Bootstrap y la fuente Inter

En `frontend/src/index.html`, dentro de `<head>`:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
```

### Paso 3.3: Colores del diseño

En `frontend/src/styles.css` se definen los colores de Figma como variables de Bootstrap:

| Uso | Color |
|---|---|
| Primario (azul marino) | `#1A4E8A` |
| Acento (dorado) | `#C9962C` |
| Éxito | `#1E6B36` |
| Advertencia | `#D68A26` |
| Error | `#B23A3A` |
| Fondo | `#F2F5FA` |

### Paso 3.4: Organizar el código

```
frontend/src/app/
├── components/   sidebar, modal            Piezas reutilizables
├── core/         api.config, interceptor, guard   Configuración y seguridad
├── models/       *.model.ts                Interfaces de datos
├── pages/        login, dashboard, activos, beneficiarios, perfil   Pantallas con ruta
└── services/     *.service.ts              Conexión con el backend (HttpClient)
```

- **`pages/`** son las pantallas completas, cada una con su ruta.
- **`components/`** son piezas pequeñas que se reutilizan (el menú y la ventana emergente).

### Paso 3.5: Detalle técnico importante

Este proyecto de Angular funciona **sin zone.js**. La pantalla solo se actualiza cuando cambia un **signal**. Por eso los datos que llegan del backend se guardan en signals (por ejemplo, `activos = signal<Activo[]>([])`).

### Paso 3.6: Probar el frontend

```powershell
cd frontend
npm install
ng serve
```

Abre `http://localhost:4200`.

---

## Fase 4 · Seguridad: login y sesión

### Paso 4.1: Cómo funciona

1. El usuario escribe su correo y contraseña en la pantalla de login.
2. El backend busca al usuario y compara la contraseña con el **hash** guardado (`bcrypt`). La contraseña real nunca se guarda.
3. Si coincide, el backend responde con un **token (JWT)** que vence en 8 horas.
4. Angular guarda el token y lo envía en **cada pedido** (interceptor).
5. El backend revisa el token en las rutas protegidas (middleware) y sabe quién es el usuario.

### Paso 4.2: Piezas del sistema

| Pieza | Archivo | Función |
|---|---|---|
| Servicio de sesión | `services/auth.service.ts` | Inicia y cierra sesión, guarda el token |
| Interceptor | `core/auth.interceptor.ts` | Agrega el token a cada pedido |
| Guardia | `core/auth.guard.ts` | Si no hay sesión, manda al login |
| Middleware | `backend/src/middlewares/auth.middleware.ts` | Exige un token válido |

### Paso 4.3: Usuario de prueba

| Campo | Valor |
|---|---|
| Correo | `carlos.ramirez@example.com` |
| Contraseña | `Legado2026!` |

Son datos ficticios, solo para desarrollo.

---

## Fase 5 · Funcionalidades del sistema

### Pantallas

| Pantalla | Ruta | Qué permite |
|---|---|---|
| Login | `/login` | Iniciar sesión |
| Dashboard | `/dashboard` | Cifras (activos, beneficiarios, reglas, procesos) y actividad reciente |
| Mis Activos | `/activos` | Listar activos y crear uno nuevo; muestra su **sensibilidad** |
| Mis Herederos | `/beneficiarios` | Listar y registrar herederos, con búsqueda de nombres por DNI |
| Reglas de Liberación | `/reglas` | Configurar cuándo y cómo se libera el legado (inactividad, confirmaciones, espera, validador) |
| Procesos | `/procesos` | Ver los procesos de liberación, su detalle (activos, confirmaciones, objeciones, entregas) y cancelarlos |
| Registro | `/registro` | Crear una cuenta nueva |
| Usuarios | `/usuarios` | Solo administrador: ver cuentas y activarlas o desactivarlas |
| Suscripción | `/suscripcion` | Ver el plan actual, comparar planes, volver al gratuito e historial de pagos |
| Reportes | `/reportes` | Resumen propio: activos por tipo, sin heredero, herederos verificados, dinero registrado y procesos |
| Mi Historial | `/historial` | Ver sus propias acciones e ingresos, con fecha e IP (se llega desde Reportes) |
| Mi Perfil | `/perfil` | Editar datos personales y cambiar la contraseña |

### Endpoints de la API

| Método | Ruta | Protegida | Qué hace |
|---|---|---|---|
| GET | `/api/salud` | No | Comprueba el servidor y la base |
| POST | `/api/auth/login` | No | Inicia sesión |
| GET | `/api/dashboard` | Sí | Resumen del usuario |
| GET / POST | `/api/activos` | Sí | Listar y crear activos |
| GET | `/api/tipos-activo` | Sí | Tipos de activo con su sensibilidad |
| GET / POST | `/api/beneficiarios` | Sí | Listar y crear herederos |
| GET / PUT | `/api/reglas` | Sí | Ver y guardar la regla de liberación del usuario |
| GET | `/api/procesos` y `/api/procesos/:id` | Sí | Listar procesos y ver el detalle de uno |
| GET | `/api/auth/dni/:dni` | No | Nombres desde RENIEC para el registro (máx. 10 por minuto por IP) |
| PUT / DELETE | `/api/activos/:id` | Sí | Editar un activo / eliminarlo (queda INACTIVO) |
| GET | `/api/activos/:id/historial` | Sí | Historial de montos del activo |
| GET / POST | `/api/entidades` | Sí | Catálogo de bancos y alta de uno nuevo |
| PUT / DELETE | `/api/beneficiarios/:id` | Sí | Editar un heredero / eliminarlo (queda INACTIVO) |
| PUT | `/api/activos/:id/beneficiarios` | Sí | Reemplaza los herederos de un activo (lista de ids) |
| POST | `/api/auth/verificar-correo` | No | Confirma el correo con el código de 6 dígitos y activa la cuenta |
| POST | `/api/auth/olvide-password` | No | Envía un código al correo para recuperar la contraseña |
| POST | `/api/auth/restablecer-password` | No | Con el código correcto, guarda la contraseña nueva |
| POST | `/api/auth/reenviar-codigo` | No | Reenvía el código a una cuenta pendiente |
| POST | `/api/beneficiarios/codigo` | Sí | Envía el código al correo de un heredero |
| GET | `/api/suscripcion` | Sí | Plan actual, planes disponibles, uso y pagos |
| POST | `/api/suscripcion/plan` | Sí | Cambiar de plan (por ahora solo al gratuito) |
| GET | `/api/reportes` | Sí | Datos del reporte del usuario |
| POST | `/api/portal/codigo` | No | El heredero pide su código de ingreso |
| POST | `/api/portal/entrar` | No | Con el código correcto, abre la sesión del heredero |
| GET | `/api/portal/checklist` | Heredero | Su checklist de documentos |
| PATCH | `/api/portal/documentos/:id` | Heredero | Marca un documento como entregado o pendiente |
| GET / PUT | `/api/beneficiarios/:id/documentos` | Propietario | Documentos de un heredero |
| GET / POST / PUT | `/api/admin/requisitos` | Admin | Catálogo de documentos |
| GET | `/api/portal/solicitudes` | Heredero | Sus solicitudes de liberación (y las entregas si ya se liberó) |
| POST | `/api/portal/solicitudes/:idProceso/:idBeneficiario/dni` | Heredero | Paso 2: valida el DNI |
| POST | `/api/portal/solicitudes/:idProceso/:idBeneficiario/selfie` | Heredero | Paso 3: envía la selfie |
| POST | `/api/portal/solicitudes/:idProceso/:idBeneficiario/confirmar` | Heredero | Confirma su participación |
| POST | `/api/portal/solicitudes/:idProceso/:idBeneficiario/objecion` | Heredero | Presenta una objeción |
| POST | `/api/procesos/:id/objeciones/:idObjecion/resolver` | Propietario | Marca una objeción como resuelta |
| GET | `/api/historial` | Sí | Acciones e ingresos del propio usuario |
| POST | `/api/auth/registro` | No | Paso 1 del registro: crea la cuenta pendiente y envía el código |
| GET | `/api/admin/usuarios` | Admin | Listar todos los usuarios |
| GET | `/api/admin/auditoria` | Admin | Últimas 100 acciones con usuario e IP |
| PATCH | `/api/admin/usuarios/:id/estado` | Admin | Activar o desactivar una cuenta |
| POST | `/api/procesos/:id/cancelar` | Sí | Cancelar un proceso abierto |
| GET / PUT | `/api/perfil` | Sí | Ver y editar el perfil |
| PUT | `/api/perfil/password` | Sí | Cambiar la contraseña |
| GET | `/api/reniec/dni/:dni` | Sí | Buscar nombres por DNI (servicio externo) |

### Regla de negocio: la sensibilidad

La sensibilidad (`BAJA` o `FINANCIERA`) **no se elige a mano**: la define el **tipo de activo**. Así una cuenta bancaria siempre es financiera.

### Regla de liberación

Cada usuario tiene **una regla activa** (tabla `regla_liberacion`). Define:

| Campo | Significado | Opciones |
|---|---|---|
| Días de inactividad | Tiempo sin actividad antes de iniciar el proceso | 90, 180, 270 o 365 |
| Confirmaciones mínimas | Beneficiarios que deben confirmar | De 1 hasta el total de beneficiarios designados |
| Período de espera final | Margen antes de liberar los activos | 7, 15, 30 o 60 días |
| Validador externo | Si los activos financieros requieren aprobación de una persona de confianza | Sí o no |

Si el usuario ya tiene regla, al guardar se **actualiza** la misma; si no, se crea. Para guardarla hace falta tener al menos un beneficiario, y las confirmaciones mínimas no pueden superar el total.

### Proceso de liberación

Es la entrega del legado cuando el dueño deja de dar señales. **No lo crea el dueño**: lo detecta el sistema.

1. **Actividad:** cada inicio de sesión se registra en `actividad_usuario`.
2. **Monitoreo:** al encender el backend y luego cada hora, se compara la última actividad con los días de inactividad de la regla activa.
3. **Inicio:** si se superan y no hay un proceso abierto, se crea un `proceso_liberacion` (estado `DETECTADO`), con sus activos (`proceso_activo`) y las confirmaciones pendientes de los beneficiarios asignados (`confirmacion_beneficiario`).
4. **Cancelación:** el dueño puede cancelar un proceso abierto (estado `CANCELADO`); queda registrado en `auditoria`.

Estados: `DETECTADO`, `EN_CONFIRMACION`, `EN_ESPERA`, `LIBERADO`, `CANCELADO`. Las etapas de confirmación, objeción, espera y entrega se implementan después (portal del heredero).

### Búsqueda por DNI

El backend consulta un servicio externo (apiperu.dev). El token vive en el `.env` y nunca llega al navegador. Sin token, el botón **Buscar** avisa que no está configurado y los datos se escriben a mano.

---

## Fase 6 · Puesta en marcha

Se necesitan **dos terminales abiertas a la vez**.

### Antes de empezar: la base de datos

En Supabase → **SQL Editor**, ejecuta **en orden** los archivos de `supabase/migrations/` del `001` al `009` (ver `supabase/README.md`). Hay 26 tablas más `codigo_verificacion` (27 en total).

### Terminal 1: backend

```powershell
cd "ruta\del\proyecto\backend"
npm install
npm run dev
```

### Terminal 2: frontend

```powershell
cd "ruta\del\proyecto\frontend"
npm install
ng serve
```

### Comprobación

1. `http://localhost:5000/api/salud` muestra `"estado":"ok"`.
2. `http://localhost:4200` muestra el login.
3. Iniciar sesión con el usuario de prueba lleva al Dashboard.

### Subir el trabajo a GitHub

```powershell
git add .
git commit -m "Describe el cambio"
git push origin master
```

El `.env` está ignorado por Git, así que las claves no se suben.

---

## Fase 7 · Solución de problemas

| Mensaje o síntoma | Causa | Solución |
|---|---|---|
| `EADDRINUSE ... :::5000` | Ya hay un backend encendido en ese puerto | `Ctrl+C` en la terminal vieja, o cierra todas las terminales y vuelve a empezar |
| `ETIMEDOUT` al conectar con la base | Red o VPN que bloquea el puerto 5432, o Supabase pausado | Apaga la VPN, usa otra red, o pulsa **Restore** en Supabase |
| `Falta DATABASE_URL en el archivo .env` | No existe `backend/.env` | Copia `.env.example` a `.env` y complétalo |
| `Cannot find module` | Faltan dependencias | `npm install` dentro de esa carpeta |
| `ng` no se reconoce | Falta el CLI o la política de PowerShell | `npx ng serve`, o ejecuta el Paso 0.2 |
| `This command is not available when running the Angular CLI outside a workspace` | Estás en la carpeta equivocada | `cd frontend` |
| La pantalla no muestra los datos | Los datos no están en un signal (Angular sin zone.js) | Guardar los datos en un `signal` |
| El navegador muestra algo viejo | Caché | `Ctrl+F5` |
| `tsx` no se reconoce | No se instalaron las dependencias del backend | `npm install` dentro de `backend` |
| No llega el código al correo | No hay SMTP en el `.env` | El código aparece en la consola del backend (Paso 8.3) |
| `El código es incorrecto o ya venció` | Pasaron 10 minutos, se usó 5 veces o ya se usó | Pedir un código nuevo |
| Los montos se ven como `enc:...` | Se cambió `ENCRYPTION_KEY` después de guardar datos | Volver a poner la llave original |
| `401` al llamar a la API | No hay sesión o expiró | Iniciar sesión de nuevo |

---

## Fase 8 · Seguridad y control (paso a paso)

Esta fase explica, una por una, las piezas que protegen el sistema. Cada paso dice **qué es**, **para qué sirve**, **dónde está el código** y **cómo comprobarlo**.

### Paso 8.1: Registro con el DNI verificado en RENIEC

- **Qué es:** en `/registro` se escribe el DNI y se pulsa **Buscar**. Los nombres salen de RENIEC (servicio apiperu.dev) y no se pueden cambiar.
- **Para qué sirve:** que nadie se registre con nombres inventados.
- **Dónde está:** `backend/src/services/reniec.service.ts` y `controllers/auth.controller.ts`. Al crear la cuenta, el backend **vuelve a consultar** RENIEC y usa esos nombres, no los que mande el navegador.
- **Si no hay token** en el `.env`, se aceptan los datos escritos a mano (la pantalla lo avisa).
- **Protección:** la consulta pública está limitada a 10 por minuto por IP (`middlewares/limite.middleware.ts`) para no gastar el token.
- **Cómo comprobarlo:** escribe un DNI real, pulsa **Buscar** y mira que se llenen los nombres.

### Paso 8.2: Confirmar el correo con un código

- **Qué es:** al crear la cuenta, el sistema envía un código de **6 dígitos** al correo. La cuenta queda `PENDIENTE` y no puede iniciar sesión hasta escribir el código.
- **Para qué sirve:** comprobar que el correo es de verdad de la persona.
- **Cómo funciona:**
  1. `POST /api/auth/registro` guarda la cuenta como `PENDIENTE` y envía el código.
  2. `POST /api/auth/verificar-correo` recibe el código; si es correcto, la cuenta pasa a `ACTIVO` y se inicia la sesión.
  3. `POST /api/auth/reenviar-codigo` manda uno nuevo si no llegó.
- **Reglas del código** (`services/verificacion.service.ts`): vale **10 minutos**, se puede intentar **5 veces**, solo sirve **una vez** y se guarda cifrado (bcrypt) en la tabla `codigo_verificacion`.
- **Cómo comprobarlo:** regístrate y mira la consola del backend (ver Paso 8.3).

### Paso 8.2b: Recuperar la contraseña

- **Qué es:** en el login, el enlace "¿Olvidaste tu contraseña?" lleva a `/recuperar`. Se escribe el correo, llega un código de 6 dígitos y con él se elige una contraseña nueva.
- **Cómo funciona:** `POST /api/auth/olvide-password` envía el código y `POST /api/auth/restablecer-password` lo valida y guarda la contraseña nueva cifrada con bcrypt. Usa la misma tabla `codigo_verificacion` (propósito `RECUPERACION`), con las mismas reglas: 10 minutos, 5 intentos y un solo uso.
- **Seguridad:** la respuesta es siempre la misma exista o no el correo, para que nadie pueda averiguar qué correos están registrados. El cambio queda en la auditoría con la IP.
- **Cómo comprobarlo:** pide el código y copia los 6 dígitos de la consola del backend (modo prueba, Paso 8.3).

### Paso 8.3: Enviar correos (o verlos en la consola)

- **Qué es:** `services/correo.service.ts` envía los correos con la librería `nodemailer`.
- **Modo prueba (sin configurar nada):** si en el `.env` no está `SMTP_HOST`, el correo **no se envía**: aparece escrito en la consola del backend, con el código. Es lo ideal para probar y exponer.
- **Modo real (Gmail):** activa la verificación en 2 pasos de tu cuenta, crea una "contraseña de aplicación" y completa en el `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucorreo@gmail.com
SMTP_PASS=la-contraseña-de-aplicación
SMTP_FROM=LegadoSeguro <tucorreo@gmail.com>
```

### Paso 8.4: Código para registrar a un heredero

- **Qué es:** al registrar un heredero, el sistema envía un código al **correo del heredero**. El dueño tiene que pedírselo al heredero y escribirlo para poder guardar.
- **Para qué sirve:** evitar la **suplantación de identidad**. Si alguien pone un correo ajeno, no recibirá el código y no podrá registrarlo.
- **Sin clave guardada:** el heredero no tiene contraseña en el sistema. Cuando exista el portal del heredero, entrará con códigos que le lleguen a su correo, igual que en este paso.
- **Dónde está:** `POST /api/beneficiarios/codigo` envía el código, y `POST /api/beneficiarios` lo exige (`services/beneficiario.service.ts`). Al **editar** un heredero, el código solo se pide si cambia su correo.
- **Cómo comprobarlo:** en **Mis Herederos → Nuevo Heredero**, pulsa "Enviar código al correo del heredero", copia el código de la consola del backend y pégalo.

### Paso 8.5: Cifrado de datos sensibles

- **Qué es:** la descripción, el monto y el historial de montos se guardan **cifrados** con **AES-256-GCM** (viene incluido en Node, archivo `utils/cifrado.ts`).
- **Para qué sirve:** si alguien lograra copiar la base de datos, vería texto ilegible como `enc:D8yf...`, no tus montos.
- **La llave:** `ENCRYPTION_KEY` en el `.env`. **No la cambies después de guardar datos**, porque lo cifrado con una llave solo se lee con esa misma llave.
- **Contraseñas:** siguen guardándose con **bcrypt**, que no se puede descifrar (solo comparar).
- **Datos anteriores:** si ya había datos sin cifrar, primero pon `ENCRYPTION_KEY` en el `.env` y luego ejecuta una sola vez:

```powershell
cd backend
npm run cifrar
```

- **Cómo comprobarlo:** en Supabase → Table Editor → `activo_digital`, las columnas `descripcion` y `monto_cifrado` empiezan con `enc:`; en la aplicación se ven normales.

### Paso 8.6: Bancos y montos

- **Bancos:** catálogo `entidad_financiera` (BCP, BBVA, Interbank, Scotiabank, Caja Cusco...). El botón **Nuevo banco** agrega uno; los que crea un usuario solo los ve él. El banco es obligatorio solo si el tipo lo pide (`tipo_activo.requiere_entidad`, hoy "Cuenta bancaria").
- **Monto:** el check "Registrar el monto de este activo" sirve en **cualquier** activo (por ejemplo, una cuenta monetizada). En los financieros viene marcado. Se elige moneda (soles o dólares) y monto exacto.
- **Historial de montos:** cada cambio de monto o moneda guarda una fila en `historial_monto` con fecha, usuario e IP (botón del reloj en la tabla). Si se desmarca el check, se borran el monto y su historial.
- **Monto exacto:** el monto se puede editar cuando se quiera (por ejemplo de 2000 a 2500); cada cambio queda en el historial. No se usa un rango, porque el monto exacto y su historial ya muestran cómo cambia el ahorro.

### Paso 8.7: Validaciones y eliminación

- **Validaciones:** todos los campos obligatorios se revisan en el backend (`utils/validar.ts` y los controladores): textos con máximo de largo, correo válido, teléfono de 9 dígitos, DNI de 8. El frontend además desactiva el botón **Guardar** mientras falte algo.
- **Eliminar:** un activo o un heredero no se borra de la base: queda `INACTIVO`, para no romper los procesos pasados. No se puede eliminar si participa en un proceso de liberación abierto.

### Paso 8.8: Auditoría, IP e historial

- **IP:** se guarda en `usuario.ip_registro`, `actividad_usuario.ip_origen` y `auditoria.ip_origen`. En local aparece `::1` (la propia computadora).
- **Mi Historial** (`/historial`): cada usuario ve sus propias acciones e ingresos con fecha e IP.
- **Auditoría del administrador** (`/usuarios`): el administrador ve todas las acciones del sistema.

### Paso 8.9: Usuario administrador

La migración `006_usuario_admin.sql` crea `admin@legadoseguro.pe` (contraseña de prueba `Admin2026!`) con rol `ADMINISTRADOR`. El backend revisa el rol en la base en cada petición a `/api/admin` (`middlewares/admin.middleware.ts`) y el frontend oculta el menú y bloquea la ruta (`core/admin.guard.ts`). Un usuario desactivado ya no puede iniciar sesión.

### Paso 8.10: Suscripción

- **Qué es:** la pantalla muestra el plan actual, compara los planes (tabla `plan`) y lista los pagos (tabla `pago`). Si el usuario no tiene una suscripción activa, está en el plan **Gratuito**.
- **Qué falta:** pagar el plan Premium. Hasta conectar **Culqi**, el botón está desactivado y el backend responde que el pago aún no está disponible. Solo se puede volver al plan gratuito, y el cambio queda en `suscripcion` y en la auditoría.
- **Plan Básico (gratis):** permite hasta **2 herederos**. El límite está en la columna `plan.limite_herederos` (vacío = ilimitado, como el Premium).
- **Aviso para mejorar el plan:** en **Mis Herederos** una barra muestra cuántos herederos se usaron ("2 de 2"). Si el límite ya se alcanzó, al pulsar **+ Designar Beneficiario** aparece una ventana invitando a mejorar el plan, con el botón **Ver planes**. El backend también lo exige: responde 403 con el código `LIMITE_PLAN` (`services/beneficiario.service.ts`), por si alguien salta la pantalla.
- **Herederos que ya existían:** si alguien tenía más herederos que el límite, se conservan; solo se bloquea designar nuevos.

### Paso 8.10a: Días de inactividad libres

En **Reglas de Liberación** el usuario escribe cuántos días de inactividad esperar (por ejemplo 15, 25 o 180), con atajos de un clic. El valor se valida en tres lugares: la pantalla, el controlador (`regla.controller.ts`) y la base de datos (restricción `ck_regla_dias_inactividad` de la migración 013, entre 7 y 3650 días). El monitoreo usa ese número tal cual para decidir cuándo iniciar el proceso.

### Paso 8.10b: Dashboard (el centro de mando)

El Dashboard no repite los Reportes: muestra **cómo está tu legado hoy y qué hacer a continuación**.

- **Salud del legado (0 a 100):** cinco pasos de 20 puntos cada uno: tener un activo, que todos tengan heredero, tener herederos, que estén verificados y tener la regla activa. Se calcula en `services/dashboard.service.ts` con datos reales.
- **Próximos pasos:** la lista de esos cinco pasos, con los pendientes primero y un enlace "Ir" a la pantalla donde se resuelven.
- **Tu regla en acción:** una barra que compara los días desde el ingreso anterior con los días de inactividad de la regla (verde, naranja o rojo según qué tan cerca esté del límite).
- **Alerta:** si hay un proceso de liberación en curso, aparece un aviso arriba con un botón para verlo.
- **Animación:** el círculo se dibuja y los números suben al abrir la pantalla.

### Paso 8.10c: Checklist de documentos y portal del heredero (tres roles)

El sistema maneja tres roles, guardados en la tabla `rol`: **ADMINISTRADOR**, **PROPIETARIO** (el benefactor) y **BENEFICIARIO** (el heredero).

| Rol | Qué hace con el checklist |
|---|---|
| Administrador | Mantiene el catálogo de documentos (`requisito_documental`) desde **Administración**: crea, edita, activa o desactiva. Los marcados como obligatorios se asignan solos a todos los herederos. |
| Propietario | En **Mis Herederos → Documentos** elige qué documentos debe reunir cada heredero y anota dónde está cada original. Los obligatorios (DNI y certificado de defunción) no se pueden quitar. |
| Heredero | Entra al **portal** (`/portal`) con su correo y un código de 6 dígitos (sin contraseña), ve su checklist con una barra de avance y marca cada documento cuando ya lo tiene. |

- **Datos:** la tabla `documento_heredero` guarda, por cada heredero, cada documento con su estado (`PENDIENTE` o `ENTREGADO`) y la nota de ubicación.
- **Sesiones separadas:** el heredero tiene su propia sesión. Su token lleva `tipo: HEREDERO` y el backend lo rechaza en las pantallas del propietario (`middlewares/auth.middleware.ts`); y el token del propietario se rechaza en el portal (`middlewares/portal.middleware.ts`).
- **Quién puede entrar al portal:** solo herederos con el correo verificado. Si el correo no es de un heredero, la respuesta es igual de neutra y no se envía ningún código.
- **Qué no hace:** no se adjuntan archivos; es una lista de control.

### Paso 8.10d: Confirmación del heredero y liberación del legado

El proceso de liberación avanza por etapas. Las cumple el **heredero** desde su portal (pantalla del Figma 06) y el **motor** del backend.

```
DETECTADO ─aviso por correo─► EN_CONFIRMACION ─(confirman las personas que pide la regla)─► EN_ESPERA
EN_ESPERA ─(pasa el período de espera y no hay objeciones abiertas)─► LIBERADO
En cualquier momento el propietario puede CANCELAR el proceso.
```

1. **Aviso.** Al abrir un proceso, el sistema envía un correo al propietario ("si estás bien, cancela") y a cada heredero verificado ("entra a tu espacio"). Cada aviso queda en la tabla `notificacion`.
2. **Las tres verificaciones del heredero** (Figma 06):
   - **1. Código de acceso:** ya la hizo al entrar al portal con el código del correo.
   - **2. Validación de DNI:** escribe su DNI y el backend lo compara con el que registró el propietario.
   - **3. Verificación facial:** se toma una selfie, se reduce a un tamaño pequeño y se guarda **cifrada** (AES-256) en `verificacion_beneficiario`. *La foto se guarda como evidencia; el sistema no la compara automáticamente con el DNI.*
3. **Decisión.** Con los tres pasos hechos puede **Confirmar participación** (sus filas de `confirmacion_beneficiario` pasan a `CONFIRMADA`) o **Presentar objeción** (queda en `objecion` y su confirmación pasa a `OBJETADA`).
4. **Espera final.** Cuando confirman tantos herederos como pide la regla (`min_confirmaciones`), el proceso pasa a `EN_ESPERA` y se avisa al propietario, que todavía puede cancelar.
5. **Liberación.** El motor (que corre cada hora) libera los procesos cuya espera terminó y que **no tienen objeciones abiertas**: crea una `entrega` por cada activo y heredero que confirmó, y avisa a los herederos. Si la regla exige validador externo, las entregas de activos financieros quedan en `PENDIENTE_VALIDADOR`.
6. **Objeciones.** El propietario las ve en **Procesos → Ver detalle** y puede marcarlas como resueltas; mientras haya una abierta, no se libera.

- **Qué ve el heredero al liberarse:** el nombre y tipo de cada activo y la descripción que dejó el propietario (que está cifrada en la base y se descifra solo para las entregas autorizadas). El sistema **no guarda contraseñas de las cuentas**, así que la descripción es donde el propietario deja las indicaciones.
- **Pendiente:** el portal del validador externo, que aprobaría las entregas financieras.

### Paso 8.10e: Documentos según el tipo de activo, indicaciones y tarjetas

**Los documentos que debe reunir un heredero dependen de los activos que recibe.** No se eligen a mano:

- Un requisito **sin tipos** aplica a todos los activos (el DNI y el certificado de defunción).
- Un requisito **con tipos** (por ejemplo la declaratoria de herederos o la carta poder) solo se le pide al heredero que recibe un activo de esos tipos. Así, una cuenta bancaria o una tarjeta piden más documentos que un correo o una red social.
- El **administrador** decide a qué tipos aplica cada requisito (tabla `requisito_tipo`). El **propietario** solo ve la lista de cada heredero y anota dónde está cada original. El **heredero** marca lo que ya tiene.
- Al **designar o editar a un heredero** se eligen los activos que recibirá (la misma asignación de `activo_beneficiario` que se hace desde Mis Activos).

**Indicaciones por activo.** Cada activo tiene un cuadro de indicaciones para el heredero (por ejemplo: correo, contraseña y celular de recuperación). Cada tipo de activo muestra una guía de qué conviene escribir (`tipo_activo.guia_indicaciones`). El texto se guarda **cifrado** (AES-256) y **solo se entrega al heredero cuando el proceso se libera**, nunca antes.

**Tarjetas de crédito y de débito.** Son tipos de activo propios (`es_tarjeta`, `es_credito`). Se registra el banco o emisor, los **4 últimos dígitos** y, en crédito, el día de pago y el día de cierre de facturación (tabla `detalle_tarjeta`, con restricciones de 1 a 31). **La línea de crédito se registra como el monto del activo**: es opcional, tiene moneda e historial, como en cualquier otro activo (el formulario la llama "Línea de crédito" en las tarjetas de crédito). En pantalla se muestra enmascarada: `•••• •••• •••• 1234`.

> **Decisión de seguridad:** el sistema **no guarda** el número completo, el **CVV** ni la **clave** de la tarjeta. Son justo los datos que usa un fraude, y las normas de las tarjetas (PCI DSS) prohíben guardar el CVV. La tabla `detalle_tarjeta` ni siquiera tiene columnas para ellos. Si el propietario quiere dejarle una clave a su heredero, puede escribirla en las indicaciones del activo (cifradas y entregadas solo al liberar).

**Reglas alineadas al plan.** Las confirmaciones mínimas no pueden superar los herederos que tiene el propietario ni el límite de su plan (con el Básico, 2). La lista de la pantalla de Reglas ya solo ofrece esos valores y el backend también lo exige.

### Paso 8.11: Reportes

- **Qué es:** un resumen del propio usuario (`services/reporte.service.ts`): activos por tipo, activos sin heredero, herederos verificados, dinero registrado por moneda y procesos por estado.
- **Ojito:** la tarjeta de dinero registrado empieza oculta (•••••••) y se muestra u oculta con el ícono del ojo.
- **Detalle importante:** los montos están cifrados en la base, así que el backend los descifra y los suma antes de enviarlos.

---

## Fase 9 · Pendientes del proyecto

- Pantalla de solicitud de liberación del beneficiario (Figma 06) y portal del heredero (React): aquí se usará el mismo código por correo para que cada heredero confirme su identidad dentro del proceso de liberación.
- Cobro del plan Premium con Culqi (modo de pruebas) y límites reales por plan.
- Despliegue.
