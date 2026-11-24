// Comprobante de pago en PDF (formato ticket de 80 mm): boleta de venta electrónica o factura electrónica.
// En el ambiente de pruebas de Niubiz el documento es una DEMOSTRACIÓN y lo dice en su pie: una boleta o factura
// con validez tributaria solo la emite el comercio con su RUC a través de un operador autorizado por la SUNAT.

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { COMERCIO_DIRECCION, COMERCIO_RAZON_SOCIAL, COMERCIO_RUC, FRONTEND_URL } from '../config/env';
import { modoPruebas } from './niubiz.service';
import { datosDelPago, ReglaPago } from './suscripcion.service';

const IGV = 0.18; // el precio del plan ya incluye el IGV

const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE',
  'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
const DECENAS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function menorDeMil(n: number): string {
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  let texto = CENTENAS[c];
  if (resto === 0) return texto;
  if (resto < 30) return (texto + ' ' + UNIDADES[resto]).trim();
  const d = Math.floor(resto / 10);
  const u = resto % 10;
  return (texto + ' ' + DECENAS[d] + (u ? ' Y ' + UNIDADES[u] : '')).trim();
}

// 25.00 -> "VEINTICINCO CON 00/100 SOLES"
export function importeEnLetras(monto: number): string {
  const enteros = Math.floor(monto + 1e-9);
  const centimos = Math.round((monto - enteros) * 100);
  let texto: string;
  if (enteros === 0) texto = 'CERO';
  else if (enteros < 1000) texto = menorDeMil(enteros);
  else {
    const miles = Math.floor(enteros / 1000);
    texto = (miles === 1 ? 'MIL' : menorDeMil(miles) + ' MIL') + (enteros % 1000 ? ' ' + menorDeMil(enteros % 1000) : '');
  }
  return `${texto} CON ${String(centimos).padStart(2, '0')}/100 SOLES`;
}

const dosDigitos = (n: number) => String(n).padStart(2, '0');
// Fecha y hora de Perú (UTC-5), sin depender de la zona del servidor
function fechaPeru(fecha: Date): string {
  const l = new Date(fecha.getTime() - 5 * 3600 * 1000);
  return `${dosDigitos(l.getUTCDate())}/${dosDigitos(l.getUTCMonth() + 1)}/${l.getUTCFullYear()} ${dosDigitos(l.getUTCHours())}:${dosDigitos(l.getUTCMinutes())}:${dosDigitos(l.getUTCSeconds())}`;
}

export async function generarComprobante(numeroPedido: number, idUsuario: number): Promise<{ pdf: Buffer; nombre: string }> {
  const d = await datosDelPago(numeroPedido, idUsuario);
  if (d.estado !== 'COMPLETADO' || !d.serie) throw new ReglaPago('Solo los pagos aprobados tienen comprobante', 409);

  const esFactura = d.tipoComprobante === 'FACTURA';
  const titulo = esFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';
  const numero = `${d.serie}-${String(d.numeroComprobante).padStart(8, '0')}`;
  const total: number = d.monto;
  const subtotal = Math.round((total / (1 + IGV)) * 100) / 100;
  const igv = Math.round((total - subtotal) * 100) / 100;
  const fecha = fechaPeru(new Date(d.fechaTransaccion ?? d.fecha));
  const cliente = esFactura ? d.razonSocial : `${d.apellidos} ${d.nombres}`.toUpperCase();
  const documento = esFactura ? `RUC: ${d.ruc}` : `DNI: ${d.dni}`;
  const descripcion = `SUSCRIPCIÓN PLAN ${String(d.plan).toUpperCase()} (1 MES)`;

  // Texto del QR siguiendo el orden usado en los comprobantes peruanos: RUC | tipo | serie | número | IGV | total | fecha | tipo y número de documento del cliente
  const qr = await QRCode.toBuffer(
    [COMERCIO_RUC || '00000000000', esFactura ? '01' : '03', d.serie, d.numeroComprobante, igv.toFixed(2), total.toFixed(2), fecha.slice(0, 10), esFactura ? '6' : '1', esFactura ? d.ruc : d.dni].join('|'),
    { margin: 1, width: 150 }
  );

  const ANCHO = 226.77; // 80 mm
  const M = 14;
  const util = ANCHO - M * 2;

  const dibujar = (doc: PDFKit.PDFDocument): number => {
    const centro = (texto: string, fuente = 'Times-Roman', tam = 9) => doc.font(fuente).fontSize(tam).text(texto, M, doc.y, { width: util, align: 'center' });
    const linea = (texto: string, fuente = 'Times-Roman', tam = 8.5) => doc.font(fuente).fontSize(tam).text(texto, M, doc.y + 2, { width: util });
    const separador = () => { doc.font('Times-Roman').fontSize(8).text('='.repeat(44), M, doc.y + 2, { width: util, align: 'center' }); };
    const fila = (izq: string, der: string, fuente = 'Times-Roman', tam = 9) => {
      const y = doc.y + 2;
      doc.font(fuente).fontSize(tam).text(izq, M, y, { width: util * 0.6 });
      doc.font(fuente).fontSize(tam).text(der, M + util * 0.6, y, { width: util * 0.4, align: 'right' });
    };

    doc.y = 18;
    centro('LEGADOSEGURO', 'Times-Bold', 15);
    centro(COMERCIO_RAZON_SOCIAL, 'Times-Bold', 9.5);
    centro(COMERCIO_DIRECCION, 'Times-Roman', 8);
    centro(COMERCIO_RUC ? `R.U.C.: N° ${COMERCIO_RUC}` : 'R.U.C.: por definir', 'Times-Bold', 11);
    doc.moveDown(0.8);
    centro(titulo, 'Times-Bold', 11);
    centro(numero, 'Times-Bold', 11);
    doc.moveDown(0.6);

    linea('Tipo de Transacción: AL CONTADO (TARJETA)');
    linea(`Fecha Emisión: ${fecha}`);
    linea(`Cliente: ${cliente}`);
    linea(documento);
    linea(`Pedido: ${numeroPedido}`);
    if (d.codigoAutorizacion) linea(`Cód. autorización: ${d.codigoAutorizacion}`);
    if (d.tarjeta) linea(`Tarjeta: ${d.marca ? d.marca + ' ' : ''}${d.tarjeta}`);
    doc.moveDown(0.3);
    separador();
    fila('CANT.   DESCRIPCIÓN', 'IMPORTE', 'Times-Bold', 8.5);
    const y0 = doc.y + 2;
    doc.font('Times-Roman').fontSize(8.5).text(`1   ${descripcion}`, M, y0, { width: util * 0.68 });
    const yFin = doc.y;
    doc.font('Times-Roman').fontSize(8.5).text(`S/ ${total.toFixed(2)}`, M + util * 0.68, y0, { width: util * 0.32, align: 'right' });
    doc.y = yFin;
    doc.moveDown(0.4);
    fila('SUB TOTAL', subtotal.toFixed(2));
    fila('IGV (18.00)%', igv.toFixed(2));
    fila('TOTAL S/', total.toFixed(2), 'Times-Bold');
    doc.moveDown(0.4);
    separador();
    linea('IMPORTE EN LETRAS:');
    linea(importeEnLetras(total), 'Times-Bold');
    separador();
    doc.moveDown(0.4);
    centro('Pago procesado por Niubiz', 'Times-Roman', 8);
    centro(FRONTEND_URL, 'Times-Roman', 8);
    centro('LIMA - Perú', 'Times-Roman', 8);
    doc.moveDown(0.6);
    doc.image(qr, (ANCHO - 100) / 2, doc.y, { width: 100 });
    doc.y += 106;
    if (modoPruebas || !COMERCIO_RUC) {
      doc.moveDown(0.3);
      centro('DOCUMENTO DE DEMOSTRACIÓN', 'Times-Bold', 8);
      centro('Ambiente de pruebas: no se cobró dinero real y este documento no tiene validez tributaria.', 'Times-Italic', 7.5);
    }
    return doc.y + 18;
  };

  // Primera pasada para medir la altura; la segunda genera el PDF con la altura exacta
  const medida = new PDFDocument({ size: [ANCHO, 2000], margin: 0 });
  medida.on('data', () => undefined);
  const alto = dibujar(medida);
  medida.end();

  const doc = new PDFDocument({ size: [ANCHO, Math.ceil(alto)], margin: 0, info: { Title: `${titulo} ${numero}`, Author: 'LegadoSeguro' } });
  const trozos: Buffer[] = [];
  doc.on('data', t => trozos.push(t));
  const terminado = new Promise<void>(ok => doc.on('end', () => ok()));
  dibujar(doc);
  doc.end();
  await terminado;

  return { pdf: Buffer.concat(trozos), nombre: `${esFactura ? 'Factura' : 'Boleta'}_${numero}.pdf` };
}
