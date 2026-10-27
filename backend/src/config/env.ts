// env.ts
// Lee las variables de entorno del archivo .env y las expone ya validadas.
// Así el resto del código no toca process.env directamente.

import dotenv from 'dotenv';

dotenv.config(); // carga el archivo .env

export const PORT = Number(process.env.PORT) || 5000;
export const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en el archivo .env (revisa .env.example)');
}
