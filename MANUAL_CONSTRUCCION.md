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
| GET / PUT | `/api/perfil` | Sí | Ver y editar el perfil |
| PUT | `/api/perfil/password` | Sí | Cambiar la contraseña |
| GET | `/api/reniec/dni/:dni` | Sí | Buscar nombres por DNI (servicio externo) |

### Regla de negocio: la sensibilidad

La sensibilidad (`BAJA` o `FINANCIERA`) **no se elige a mano**: la define el **tipo de activo**. Así una cuenta bancaria siempre es financiera.

### Búsqueda por DNI

El backend consulta un servicio externo (apiperu.dev). El token vive en el `.env` y nunca llega al navegador. Sin token, el botón **Buscar** avisa que no está configurado y los datos se escriben a mano.

---

## Fase 6 · Puesta en marcha

Se necesitan **dos terminales abiertas a la vez**.

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
| `401` al llamar a la API | No hay sesión o expiró | Iniciar sesión de nuevo |

---

## Pendientes del proyecto

- Editar y eliminar activos y beneficiarios.
- Asignar beneficiarios a cada activo (`activo_beneficiario`).
- Registro de usuarios y recuperación de contraseña por correo.
- Planes, suscripciones y pagos con Culqi (modo de pruebas).
- Portal del heredero en React.
- Despliegue.
