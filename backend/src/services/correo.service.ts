// Envía correos. Si no hay SMTP configurado en el .env, el mensaje se muestra en la consola
// del backend: así se puede probar y exponer sin necesitar una cuenta de correo.

import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } from '../config/env';

export async function enviarCorreo(para: string, asunto: string, texto: string): Promise<void> {
  if (!SMTP_HOST) {
    console.log('--- CORREO (modo prueba, no se envió) ---');
    console.log('Para:', para);
    console.log('Asunto:', asunto);
    console.log(texto);
    console.log('-----------------------------------------');
    return;
  }

  const transporte = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
  });

  await transporte.sendMail({ from: SMTP_FROM, to: para, subject: asunto, text: texto });
}
