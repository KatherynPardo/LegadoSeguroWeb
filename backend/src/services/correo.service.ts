// Envía correos. Si no hay SMTP configurado en el .env, el mensaje se muestra en la consola
// del backend: así se puede probar y exponer sin necesitar una cuenta de correo.

import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } from '../config/env';

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Convierte el texto plano en un correo con el estilo de LegadoSeguro.
// Los códigos de 6 dígitos se destacan en una caja grande.
function plantillaHtml(asunto: string, texto: string): string {
  const parrafos = texto.split('\n').map(linea => {
    const limpia = escapar(linea.trim());
    if (!limpia) return '';
    const conCodigo = limpia.replace(/\b([0-9]{6})\b/g,
      '</p><div style="margin:18px 0;padding:14px;background:#EEF4FB;border-radius:8px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#1A4E8A">$1</div><p style="margin:0 0 12px">');
    return `<p style="margin:0 0 12px">${conCodigo}</p>`;
  }).join('');

  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px 12px;background:#F2F4F7;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden">
      <tr><td style="background:#1A4E8A;border-bottom:4px solid #C9962C;padding:20px 28px;color:#ffffff;font-size:20px;font-weight:700">LegadoSeguro</td></tr>
      <tr><td style="padding:28px;color:#333333;font-size:15px;line-height:1.5">
        <h2 style="margin:0 0 16px;font-size:18px;color:#1A4E8A">${escapar(asunto)}</h2>
        ${parrafos}
      </td></tr>
      <tr><td style="padding:16px 28px;background:#F8F9FB;color:#8A94A3;font-size:12px">
        Este es un mensaje automático de LegadoSeguro. Si no esperabas este correo, puedes ignorarlo.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

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

  // Se envía el HTML y, de respaldo, el texto plano
  await transporte.sendMail({ from: SMTP_FROM, to: para, subject: asunto, text: texto, html: plantillaHtml(asunto, texto) });
}
