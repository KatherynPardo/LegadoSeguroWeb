// Servicio de consulta de DNI.
// Soporta dos proveedores externos, elegidos con DNI_PROVIDER en el .env:
//   - apisnetpe : apis.net.pe  (GET, el DNI va en la URL)
//   - apiperu   : apiperu.dev  (POST, el DNI va en el cuerpo)
// Si se agrega otro proveedor, solo hay que sumar un caso en consultarProveedor().

import { DNI_API_TOKEN, DNI_API_URL, DNI_PROVIDER } from '../config/env';

export type PersonaReniec = {
  dni: string;
  nombres: string;
  apellidos: string;
};

// Error con el código HTTP que debe devolver el controlador
export class ErrorConsultaDni extends Error {
  constructor(public estado: number, mensaje: string) {
    super(mensaje);
  }
}

async function consultarProveedor(dni: string): Promise<Response> {
  const cabeceras = { Authorization: `Bearer ${DNI_API_TOKEN}`, Accept: 'application/json' };
  const limite = AbortSignal.timeout(8000); // no esperar más de 8 segundos

  if (DNI_PROVIDER === 'apiperu') {
    return fetch(DNI_API_URL, {
      method: 'POST',
      headers: { ...cabeceras, 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni }),
      signal: limite
    });
  }

  // apisnetpe (por defecto)
  return fetch(`${DNI_API_URL}?numero=${dni}`, { headers: cabeceras, signal: limite });
}

// Cada proveedor nombra distinto los campos de su respuesta
function leerPersona(dni: string, datos: any): PersonaReniec | null {
  if (DNI_PROVIDER === 'apiperu') {
    if (!datos?.success || !datos.data) return null;
    const d = datos.data;
    return {
      dni,
      nombres: d.nombres ?? '',
      apellidos: `${d.apellido_paterno ?? ''} ${d.apellido_materno ?? ''}`.trim()
    };
  }

  return {
    dni,
    nombres: datos.nombres ?? '',
    apellidos: `${datos.apellidoPaterno ?? ''} ${datos.apellidoMaterno ?? ''}`.trim()
  };
}

export async function consultarDni(dni: string): Promise<PersonaReniec> {
  if (!DNI_API_TOKEN) {
    throw new ErrorConsultaDni(503, 'La consulta de DNI no está configurada');
  }

  let respuesta: Response;
  try {
    respuesta = await consultarProveedor(dni);
  } catch {
    throw new ErrorConsultaDni(502, 'No se pudo contactar al servicio de consulta de DNI');
  }

  if (respuesta.status === 404 || respuesta.status === 422) {
    throw new ErrorConsultaDni(404, 'No se encontró ese DNI');
  }
  if (respuesta.status === 401 || respuesta.status === 403) {
    throw new ErrorConsultaDni(502, 'El token del servicio de DNI no es válido');
  }
  if (!respuesta.ok) {
    throw new ErrorConsultaDni(502, 'El servicio de consulta de DNI no respondió correctamente');
  }

  const persona = leerPersona(dni, await respuesta.json());
  if (!persona || (!persona.nombres && !persona.apellidos)) {
    throw new ErrorConsultaDni(404, 'No se encontró ese DNI');
  }
  return persona;
}
