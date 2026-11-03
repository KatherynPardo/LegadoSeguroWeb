// Códigos de verificación de 6 dígitos que se envían por correo.
// Se usan para confirmar el correo al registrarse y el correo de cada heredero.
// El código se guarda cifrado (bcrypt), dura 10 minutos y se puede intentar 5 veces.

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../config/database';
import { enviarCorreo } from './correo.service';

const MINUTOS_VALIDEZ = 10;
const MAX_INTENTOS = 5;

// proposito: 'REGISTRO' o 'HEREDERO'. destino: el correo al que se envía.
export async function enviarCodigo(proposito: string, destino: string, idUsuario: number | null, motivo: string) {
  const codigo = String(crypto.randomInt(100000, 1000000)); // 6 dígitos
  const hash = await bcrypt.hash(codigo, 10);

  // Los códigos anteriores sin usar de este mismo correo dejan de servir
  await pool.query(
    'UPDATE codigo_verificacion SET usado = TRUE WHERE proposito = $1 AND destino = $2 AND usado = FALSE',
    [proposito, destino]
  );

  await pool.query(
    `INSERT INTO codigo_verificacion (proposito, destino, id_usuario, codigo_hash, fecha_expiracion)
     VALUES ($1, $2, $3, $4, NOW() + make_interval(mins => $5))`,
    [proposito, destino, idUsuario, hash, MINUTOS_VALIDEZ]
  );

  await enviarCorreo(
    destino,
    'Tu código de verificación de LegadoSeguro',
    `Hola,\n\n${motivo}\n\nTu código es: ${codigo}\n\nVence en ${MINUTOS_VALIDEZ} minutos. ` +
      `Si no fuiste tú, ignora este mensaje.\n\nLegadoSeguro`
  );
}

// Devuelve true si el código es correcto. Si lo es, queda marcado como usado.
export async function validarCodigo(proposito: string, destino: string, codigo: string): Promise<boolean> {
  const resultado = await pool.query(
    `SELECT id_codigo, codigo_hash, intentos FROM codigo_verificacion
     WHERE proposito = $1 AND destino = $2 AND usado = FALSE AND fecha_expiracion > NOW()
     ORDER BY id_codigo DESC LIMIT 1`,
    [proposito, destino]
  );

  const fila = resultado.rows[0];
  if (!fila || fila.intentos >= MAX_INTENTOS) return false;

  // Cada intento se cuenta, acierte o no
  await pool.query('UPDATE codigo_verificacion SET intentos = intentos + 1 WHERE id_codigo = $1', [fila.id_codigo]);

  const coincide = await bcrypt.compare(codigo, fila.codigo_hash);
  if (!coincide) return false;

  // Se marca como usado solo si nadie lo usó antes: si dos pedidos llegan juntos, solo uno gana
  const marcado = await pool.query(
    'UPDATE codigo_verificacion SET usado = TRUE WHERE id_codigo = $1 AND usado = FALSE RETURNING id_codigo',
    [fila.id_codigo]
  );
  return marcado.rows.length > 0;
}
