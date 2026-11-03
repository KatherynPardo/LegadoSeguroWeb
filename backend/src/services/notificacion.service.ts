// Avisos por correo durante un proceso de liberación. Cada aviso queda guardado en la tabla notificacion.

import { pool } from '../config/database';
import { enviarCorreo } from './correo.service';

type Destino = { idUsuario?: number; idBeneficiario?: number; correo: string };

export async function notificar(destino: Destino, idProceso: number, asunto: string, mensaje: string): Promise<void> {
  let estado = 'ENVIADA';
  try {
    await enviarCorreo(destino.correo, asunto, mensaje);
  } catch (error) {
    // Si el correo falla, el proceso sigue: solo se anota que el aviso no salió
    console.error('No se pudo enviar el aviso:', error);
    estado = 'FALLIDA';
  }

  await pool.query(
    `INSERT INTO notificacion (id_proceso, id_usuario_destinatario, id_beneficiario_destinatario, canal, asunto, mensaje, estado)
     VALUES ($1, $2, $3, 'CORREO', $4, $5, $6)`,
    [idProceso, destino.idUsuario ?? null, destino.idBeneficiario ?? null, asunto.slice(0, 150), mensaje.slice(0, 500), estado]
  );
}
