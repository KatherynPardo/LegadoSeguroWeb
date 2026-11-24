// env.ts
// Lee las variables de entorno del archivo .env y las expone ya validadas.
// Así el resto del código no toca process.env directamente.

import dotenv from 'dotenv';

dotenv.config(); // carga el archivo .env

export const PORT = Number(process.env.PORT) || 5000;
export const DATABASE_URL = process.env.DATABASE_URL;

// Cuántos proxies hay delante del backend (0 en local; 1 en Render, Railway o Vercel). Con proxies, la IP real
// llega en el encabezado X-Forwarded-For; con 0, ese encabezado se ignora para que nadie pueda falsearlo.
export const TRUST_PROXY = Number(process.env.TRUST_PROXY) || 0;

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
// Consulta de RUC (SUNAT) con el mismo proveedor y el mismo token que el DNI. RUC_API_URL permite cambiar la dirección.
const RUC_POR_PROVEEDOR: Record<string, string> = {
  apisnetpe: 'https://api.apis.net.pe/v2/sunat/ruc',
  apiperu: 'https://apiperu.dev/api/ruc'
};
export const RUC_API_URL = process.env.RUC_API_URL || RUC_POR_PROVEEDOR[DNI_PROVIDER] || RUC_POR_PROVEEDOR['apisnetpe'];

if (!DATABASE_URL) {
  throw new Error('Falta DATABASE_URL en el archivo .env (revisa .env.example)');
}

if (!process.env.JWT_SECRET) {
  console.warn('Aviso: falta JWT_SECRET en el .env, se usa una clave de desarrollo.');
}

// Clave para cifrar datos sensibles (montos, descripciones). Debe venir del .env y NO cambiarse después,
// porque lo que se guardó con una clave solo se puede leer con esa misma clave.
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'clave-de-cifrado-solo-para-desarrollo';
if (!process.env.ENCRYPTION_KEY) {
  console.warn('Aviso: falta ENCRYPTION_KEY en el .env, se usa una clave de desarrollo.');
}

// Cobro con tarjeta (Niubiz, formulario Pago Web). Sin las tres primeras variables el pago queda desactivado.
// NIUBIZ_ENV: 'test' (sandbox, por defecto) o 'prod'. Las credenciales las entrega Niubiz al afiliar el comercio.
export const NIUBIZ_MERCHANT_ID = process.env.NIUBIZ_MERCHANT_ID;
export const NIUBIZ_USER = process.env.NIUBIZ_USER;
export const NIUBIZ_PASSWORD = process.env.NIUBIZ_PASSWORD;
export const NIUBIZ_ENV = process.env.NIUBIZ_ENV === 'prod' ? 'prod' : 'test';
// Direcciones públicas: el formulario de Niubiz envía el resultado al backend, y el backend devuelve al usuario al frontend.
export const API_PUBLIC_URL = process.env.API_PUBLIC_URL || `http://localhost:${PORT}`;
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

// Envío de correos (códigos de verificación). Si falta SMTP_HOST, el código se muestra en la consola.
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const SMTP_FROM = process.env.SMTP_FROM || 'LegadoSeguro <no-reply@legadoseguro.pe>';

// Datos del comercio que salen en el comprobante de pago. Mientras no haya razón social y RUC reales, es una demostración.
export const COMERCIO_RAZON_SOCIAL = process.env.COMERCIO_RAZON_SOCIAL || 'PROYECTO ACADÉMICO UTP';
export const COMERCIO_RUC = process.env.COMERCIO_RUC || '';
export const COMERCIO_DIRECCION = process.env.COMERCIO_DIRECCION || 'Lima - Perú';
