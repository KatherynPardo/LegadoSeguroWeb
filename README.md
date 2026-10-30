# LegadoSeguro

Plataforma web de gestión de legado y testamento digital. Proyecto del curso **JavaScript Avanzado** (UTP, 2026-02).

**Autora:** Katheryn Pardo Acosta.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Interfaz | Angular + Bootstrap (TypeScript) |
| API REST | Node.js + Express (TypeScript) |
| Base de datos | Supabase (PostgreSQL) |
| Seguridad | Contraseñas cifradas con bcrypt y sesiones con JWT |
| Consulta de DNI | apiperu.dev (opcional, desde el backend) |

```
Angular (puerto 4200)  ──HTTP/JSON──►  Express (puerto 5000)  ──SQL──►  Supabase (PostgreSQL)
```

Angular **nunca** se conecta directo a la base de datos: solo el backend tiene las credenciales.

## Estructura

```
LegadoSeguroWeb/
├── supabase/migrations/   Base de datos: esquema, seguridad y datos (ver supabase/README.md)
├── backend/               API Express por capas: routes, controllers, services, models, config
├── frontend/              Aplicación Angular: pages, components, services, models, core
├── MANUAL_CONSTRUCCION.md Manual paso a paso, del paso 0 a la puesta en marcha
└── AVANCES.md             Registro de avances
```

## Cómo levantarlo (resumen)

1. Ejecutar las migraciones de `supabase/migrations/` en Supabase.
2. Crear `backend/.env` a partir de `backend/.env.example`.
3. `cd backend`, `npm install`, `npm run dev`.
4. `cd frontend`, `npm install`, `ng serve`.
5. Abrir `http://localhost:4200` e iniciar sesión.

El detalle completo está en [MANUAL_CONSTRUCCION.md](MANUAL_CONSTRUCCION.md).
