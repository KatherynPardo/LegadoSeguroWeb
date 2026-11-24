// Conexión con Niubiz (formulario Pago Web, documento de integración v6.0): token de seguridad, sesión de pago y
// autorización. Es el único archivo que habla con Niubiz; la lógica de planes y pagos está en suscripcion.service.ts.

import { NIUBIZ_ENV, NIUBIZ_MERCHANT_ID, NIUBIZ_PASSWORD, NIUBIZ_USER } from '../config/env';
// Direcciones, escenarios de prueba y los 97 códigos de acción de la documentación de Niubiz (ver ese archivo)
import datos from '../data/niubiz.json';

const ambiente = datos.ambientes[NIUBIZ_ENV];

export const MONEDA = datos.moneda.codigo;

export function niubizActivo(): boolean {
  return Boolean(NIUBIZ_MERCHANT_ID && NIUBIZ_USER && NIUBIZ_PASSWORD);
}

// En el ambiente de pruebas el resultado de cada pago lo decide la tarjeta y el correo que se escriben en el formulario
export const modoPruebas = NIUBIZ_ENV === 'test';

// Qué significa un código de acción: mensaje para el cliente, categoría y si fue una venta observada por el antifraude
export function buscarCodigo(codigo: string) {
  return datos.codigosAccion.find(c => c.codigo === codigo);
}

export const merchantId = NIUBIZ_MERCHANT_ID ?? '';
export const urlScriptNiubiz = ambiente.script;

export type ResultadoAutorizacion = {
  aprobado: boolean;
  codigoAccion: string;
  descripcion: string;
  tarjeta: string | null;
  idTransaccion: string | null;
  montoAutorizado: number | null;
  codigoAutorizacion: string | null;
  eci: string | null;
  marca: string | null;
  fechaTransaccion: Date | null;
};

// Paso 1: token de seguridad (usuario y contraseña del comercio, solo desde el servidor)
async function tokenSeguridad(): Promise<string> {
  const credenciales = Buffer.from(`${NIUBIZ_USER}:${NIUBIZ_PASSWORD}`).toString('base64');
  const r = await fetch(`${ambiente.api}/api.security/v1/security`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credenciales}` }
  });
  if (!r.ok) throw new Error(`Niubiz rechazó las credenciales (HTTP ${r.status})`);
  return (await r.text()).trim();
}

// Paso 2: sesión de pago de 30 minutos para ese monto
export async function crearSesion(monto: number, ipCliente: string | null): Promise<string> {
  const token = await tokenSeguridad();
  const r = await fetch(`${ambiente.api}/api.ecommerce/v2/ecommerce/token/session/${NIUBIZ_MERCHANT_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({
      channel: 'web',
      amount: monto,
      antifraud: { clientIp: ipCliente ?? '', merchantDefineData: {} },
      recurrenceMaxAmount: null
    })
  });
  if (!r.ok) throw new Error(`Niubiz no creó la sesión de pago (HTTP ${r.status})`);
  const datos = await r.json() as { sessionKey?: string };
  if (!datos.sessionKey) throw new Error('Niubiz no devolvió el sessionKey');
  return datos.sessionKey;
}

// Niubiz informa la fecha como aammddhhmmss en hora de Perú (UTC-5). Si no llega o no se entiende, se usa la hora actual.
function leerFecha(texto: unknown): Date | null {
  const m = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(String(texto ?? ''));
  if (!m) return null;
  const fecha = new Date(`20${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}-05:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

// Paso 4: solicita la autorización con el token que devolvió el formulario. Aprobado = código de acción "000".
// Si Niubiz deniega responde HTTP 400 y los datos vienen en "data"; si aprueba, en "dataMap" y "order".
export async function autorizar(tokenTransaccion: string, numeroPedido: number, monto: number): Promise<ResultadoAutorizacion> {
  const token = await tokenSeguridad();
  const r = await fetch(`${ambiente.api}/api.authorization/v3/authorization/ecommerce/${NIUBIZ_MERCHANT_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({
      antifraud: null,
      captureType: 'manual',
      channel: 'web',
      countable: true, // liquidación automática
      order: {
        amount: monto,
        currency: MONEDA,
        purchaseNumber: String(numeroPedido),
        tokenId: tokenTransaccion
      },
      sponsored: null
    })
  });

  const json = await r.json().catch(() => null) as Record<string, any> | null;
  const datos = json?.dataMap ?? json?.data;
  if (!datos) throw new Error(`Niubiz respondió sin datos de la operación (HTTP ${r.status})`);

  const codigoAccion = String(datos.ACTION_CODE ?? '');
  return {
    aprobado: r.ok && codigoAccion === '000',
    codigoAccion,
    descripcion: String(datos.ACTION_DESCRIPTION ?? ''),
    tarjeta: datos.CARD ?? null,
    idTransaccion: datos.TRANSACTION_ID ?? null,
    montoAutorizado: json?.order?.authorizedAmount ?? (datos.AMOUNT ? Number(datos.AMOUNT) : null),
    codigoAutorizacion: datos.AUTHORIZATION_CODE ? String(datos.AUTHORIZATION_CODE) : null,
    eci: datos.ECI ? String(datos.ECI) : null,
    marca: datos.BRAND ? String(datos.BRAND).toUpperCase() : null,
    fechaTransaccion: leerFecha(datos.TRANSACTION_DATE)
  };
}
