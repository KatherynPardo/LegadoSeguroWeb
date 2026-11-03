// Cifrado de datos sensibles con AES-256-GCM (viene con Node, no hace falta instalar nada).
// Se guarda así:  enc:<iv>:<etiqueta>:<texto cifrado>   (todo en base64)

import crypto from 'crypto';
import { ENCRYPTION_KEY } from '../config/env';

// Convertimos la frase del .env en una clave de 32 bytes
const clave = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

export function cifrar(texto: string): string {
  const iv = crypto.randomBytes(12);
  const cifrador = crypto.createCipheriv('aes-256-gcm', clave, iv);
  const cifrado = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()]);
  const etiqueta = cifrador.getAuthTag();
  return `enc:${iv.toString('base64')}:${etiqueta.toString('base64')}:${cifrado.toString('base64')}`;
}

export function descifrar(valor: string | null): string | null {
  if (valor === null) return null;
  // Los datos viejos (guardados antes de cifrar) no tienen el prefijo: se devuelven tal cual
  if (!valor.startsWith('enc:')) return valor;

  const [, iv, etiqueta, cifrado] = valor.split(':');
  const descifrador = crypto.createDecipheriv('aes-256-gcm', clave, Buffer.from(iv, 'base64'));
  descifrador.setAuthTag(Buffer.from(etiqueta, 'base64'));
  const texto = Buffer.concat([descifrador.update(Buffer.from(cifrado, 'base64')), descifrador.final()]);
  return texto.toString('utf8');
}
