// Portal del heredero: entra con su correo y un código (sin contraseña).
// Puede entrar cualquier correo registrado como heredero, incluso si el propietario lo dejó pendiente de validar:
// el código que llega al correo prueba que el buzón es suyo, y el DNI se pide después, dentro de cada solicitud.

import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { JWT_SECRET } from '../config/env';
import { enviarCodigo, validarCodigo } from './verificacion.service';

// Envía el código si el correo es de un heredero. Si no lo es, no hace nada
// (el controlador responde igual en los dos casos, para no revelar qué correos son herederos).
export async function enviarCodigoPortal(correo: string): Promise<void> {
  const heredero = await pool.query(
    "SELECT 1 FROM beneficiario WHERE LOWER(correo) = $1 AND estado = 'ACTIVO' LIMIT 1",
    [correo]
  );
  if (heredero.rows.length === 0) return;

  await enviarCodigo('PORTAL', correo, null, 'Usa este código para entrar a tu espacio de heredero en LegadoSeguro.');
}

export async function entrarAlPortal(correo: string, codigo: string) {
  if (!(await validarCodigo('PORTAL', correo, codigo))) return null;

  const heredero = await pool.query(
    "SELECT nombres FROM beneficiario WHERE LOWER(correo) = $1 AND estado = 'ACTIVO' LIMIT 1",
    [correo]
  );
  if (heredero.rows.length === 0) return null;

  // El token dice que es un HEREDERO: así no sirve en las pantallas del propietario
  const token = jwt.sign({ tipo: 'HEREDERO', correo }, JWT_SECRET, { expiresIn: '4h' });
  return { token, heredero: { correo, nombres: heredero.rows[0].nombres } };
}
