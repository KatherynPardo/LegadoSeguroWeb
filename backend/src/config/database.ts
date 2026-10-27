// database.ts
// Conexión a la base de datos de Supabase (que por dentro es PostgreSQL).
// La dirección de conexión NO se escribe aquí: viene del .env a través de env.ts,
// para que la contraseña nunca quede dentro del código ni se suba a GitHub.

import { Pool } from 'pg';
import { DATABASE_URL } from './env';

// Un "pool" es un grupo de conexiones abiertas que se reutilizan,
// en vez de abrir y cerrar una conexión nueva en cada consulta.
export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Supabase exige conexión cifrada (SSL)
});
