// env.ts
// Lee las variables de entorno del archivo .env y las expone ya validadas.
// Así el resto del código no toca process.env directamente.

import dotenv from 'dotenv';

dotenv.config(); // carga el archivo .env

export const PORT = Number(process.env.PORT) || 5000;
export const DATABASE_URL = process.env.DATABASE_URL;

// Clave con la que se firman las sesiones (JWT). En producción debe venir del .env.
export const JWT_SECRET = process.env.JWT_SECRET || 'clave-solo-para-desarrollo-cambiala';

// Consulta de DNI (servicio de terceros). Si falta el token, la búsqueda queda desactivada.
// DNI_PROVIDER puede ser 'apisnetpe' (por defecto) o 'apiperu'.
export const DNI_PROVIDER = process.env.DNI_PROVIDER || 'apisnetpe';
const URL_POR_PROVEEDOR: Record<string, string> = {
  apisnetpe: 'https://api.apis.net.pe/v2/reniec/dni',
  apiperu: 'https://apiperu.dev/api/dni'
};
export const DNI_API_URL = process.env.DNI_API_URL || URL_POR_PROVEEDOR[DNI_PROVIDER] || URL_POR_PROVEEDOR['apisnetpe'];
export const DNI_API_TOKEN = process.env.DNI_API_TOKEN;

if (!DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en el archivo .env (revisa .env.example)');
}

if (!process.env.JWT_SECRET) {
  console.warn('Aviso: falta JWT_SECRET en el .env, se usa una clave de desarrollo.');
}
