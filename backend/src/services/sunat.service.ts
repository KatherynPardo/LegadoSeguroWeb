// Consulta de RUC: razón social, dirección y estado del contribuyente (datos de la SUNAT).
// Usa el mismo proveedor y token que la consulta de DNI (DNI_PROVIDER y DNI_API_TOKEN en el .env).

import { DNI_API_TOKEN, DNI_PROVIDER, RUC_API_URL } from '../config/env';
import { ErrorConsultaDni } from './reniec.service';

export type EmpresaSunat = {
  ruc: string;
  razonSocial: string;
  direccion: string;
  estado: string;     // por ejemplo ACTIVO
  condicion: string;  // por ejemplo HABIDO
};

async function consultarProveedor(ruc: string): Promise<Response> {
  const cabeceras = { Authorization: `Bearer ${DNI_API_TOKEN}`, Accept: 'application/json' };
  const limite = AbortSignal.timeout(8000);

  if (DNI_PROVIDER === 'apiperu') {
    return fetch(RUC_API_URL, { method: 'POST', headers: { ...cabeceras, 'Content-Type': 'application/json' }, body: JSON.stringify({ ruc }), signal: limite });
  }
  return fetch(`${RUC_API_URL}?numero=${ruc}`, { headers: cabeceras, signal: limite });
}

// Cada proveedor nombra distinto los campos de su respuesta
function leerEmpresa(ruc: string, datos: any): EmpresaSunat | null {
  const d = DNI_PROVIDER === 'apiperu' ? (datos?.success ? datos.data : null) : datos;
  if (!d) return null;
  const razonSocial = String(d.nombre_o_razon_social ?? d.razonSocial ?? '').trim();
  if (!razonSocial) return null;
  return {
    ruc,
    razonSocial,
    direccion: String(d.direccion_completa ?? d.direccion ?? '').trim(),
    estado: String(d.estado ?? '').trim().toUpperCase(),
    condicion: String(d.condicion ?? '').trim().toUpperCase()
  };
}

export async function consultarRuc(ruc: string): Promise<EmpresaSunat> {
  if (!DNI_API_TOKEN) throw new ErrorConsultaDni(503, 'La consulta de RUC no está configurada');

  let respuesta: Response;
  try {
    respuesta = await consultarProveedor(ruc);
  } catch {
    throw new ErrorConsultaDni(502, 'No se pudo contactar al servicio de consulta de RUC');
  }

  if (respuesta.status === 400 || respuesta.status === 404 || respuesta.status === 422) throw new ErrorConsultaDni(404, 'No se encontró ese RUC');
  if (respuesta.status === 401 || respuesta.status === 403) throw new ErrorConsultaDni(502, 'El token del servicio de consulta no es válido');
  if (!respuesta.ok) throw new ErrorConsultaDni(502, 'El servicio de consulta de RUC no respondió correctamente');

  const empresa = leerEmpresa(ruc, await respuesta.json());
  if (!empresa) throw new ErrorConsultaDni(404, 'No se encontró ese RUC');
  return empresa;
}
