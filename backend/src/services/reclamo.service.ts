// Libro de reclamaciones virtual: registra la hoja de reclamación y le entrega una copia al consumidor por correo.

import { pool } from '../config/database';
import { SMTP_HOST } from '../config/env';
import { enviarCorreo } from './correo.service';

export type DatosReclamo = {
  tipo: 'RECLAMO' | 'QUEJA';
  nombres: string;
  apellidos: string;
  tipoDocumento: 'DNI' | 'CE' | 'PASAPORTE';
  documento: string;
  correo: string;
  telefono: string | null;
  direccion: string;
  monto: number | null;
  detalle: string;
  pedido: string;
};

export async function registrarReclamo(d: DatosReclamo, ip: string | null): Promise<{ codigo: string; correoEnviado: boolean }> {
  const r = await pool.query(
    `INSERT INTO reclamo (codigo, tipo, nombres, apellidos, tipo_documento, documento, correo, telefono, direccion, monto, detalle, pedido, ip_origen)
     VALUES ('LR-' || EXTRACT(YEAR FROM NOW())::int || '-' || lpad(nextval('seq_codigo_reclamo')::text, 6, '0'),
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING codigo`,
    [d.tipo, d.nombres, d.apellidos, d.tipoDocumento, d.documento, d.correo, d.telefono, d.direccion, d.monto, d.detalle, d.pedido, ip]
  );
  const codigo: string = r.rows[0].codigo;

  // La hoja ya quedó registrada: si el correo falla, el consumidor igual recibe su código en pantalla
  let correoEnviado = false;
  try {
    await enviarCorreo(
      d.correo,
      `Copia de tu hoja de reclamación ${codigo}`,
      `Hola ${d.nombres},\n\nRecibimos tu ${d.tipo === 'RECLAMO' ? 'reclamo' : 'queja'} y quedó registrado con el código ${codigo}.\n\n` +
      `Lo que nos contaste: ${d.detalle}\n\nLo que pides: ${d.pedido}\n\n` +
      'Te responderemos a este correo dentro del plazo que establece la ley. Guarda este código para cualquier consulta.'
    );
    correoEnviado = Boolean(SMTP_HOST);
  } catch (error) {
    console.error('No se pudo enviar la copia de la hoja de reclamación', codigo, error);
  }

  return { codigo, correoEnviado };
}
