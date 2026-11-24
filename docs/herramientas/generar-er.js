// Diagramas entidad-relación por módulo, generados desde el diccionario de datos de DOCUMENTACION_SISTEMA.md
// (que a su vez sale de la base real con `npm run diccionario` en la carpeta backend).
// Crea docs/capturas/2-1_er_*.png. Necesita internet (carga Mermaid desde jsDelivr) y Google Chrome.
// Uso (desde docs/herramientas):  node generar-er.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const RAIZ = path.resolve(__dirname, '..', '..') + '/';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const md = fs.readFileSync(RAIZ + 'DOCUMENTACION_SISTEMA.md', 'utf8');
const dic = md.slice(md.indexOf('<!-- DICCIONARIO:INICIO -->'), md.indexOf('<!-- DICCIONARIO:FIN -->'));

const tablas = {};
for (const b of dic.split(/^#### /m).slice(1)) {
  const nombre = b.split('\n')[0].trim();
  if (nombre === 'Relaciones entre tablas') continue;
  tablas[nombre] = b.split('\n').filter(l => /^\| /.test(l) && !/^\| Campo/.test(l)).map(l => l.split('|').slice(1, -1).map(s => s.trim()));
}
const rels = dic.slice(dic.indexOf('#### Relaciones entre tablas')).split('\n').filter(l => /^\| \w/.test(l) && !/Tabla padre/.test(l)).map(l => l.split('|').slice(1, -1).map(s => s.trim()));

// Cada grupo es una figura; se mantienen pequeños (3 a 5 tablas) para que se lean bien dentro del Word
const grupos = {
  seguridad: ['rol', 'usuario', 'token_recuperacion', 'codigo_verificacion'],
  actividad: ['usuario', 'actividad_usuario', 'auditoria'],
  activos: ['tipo_activo', 'activo_digital', 'entidad_financiera', 'detalle_tarjeta', 'historial_monto'],
  herederos: ['activo_digital', 'beneficiario', 'activo_beneficiario'],
  documentos: ['requisito_documental', 'requisito_tipo', 'documento_heredero', 'beneficiario', 'tipo_activo'],
  regla: ['regla_liberacion', 'alerta_inactividad', 'proceso_liberacion'],
  proceso: ['proceso_liberacion', 'reporte_fallecimiento', 'proceso_activo', 'confirmacion_beneficiario'],
  proceso2: ['proceso_liberacion', 'verificacion_beneficiario', 'objecion', 'entrega'],
  validacion: ['proceso_liberacion', 'validacion_externa', 'validador_externo'],
  legal: ['guia_legal', 'orientacion_legal_generada', 'notificacion'],
  suscripcion: ['plan', 'suscripcion', 'pago']
};

function mermaid(lista) {
  const set = new Set(lista);
  const rr = rels.filter(r => set.has(r[0]) && set.has(r[1]));
  let s = 'erDiagram\n';
  for (const [p, h, col, card] of rr) s += `  ${p} ${card === '1 : 1' ? '||--o|' : '||--o{'} ${h} : "${col}"\n`;
  for (const t of lista) {
    s += `  ${t} {\n`;
    for (const [campo, tipo, llave] of tablas[t]) {
      const k = llave.includes('PK') && llave.includes('FK') ? 'PK, FK' : llave.includes('PK') ? 'PK' : llave.includes('FK') ? 'FK' : '';
      s += `    ${tipo.replace(/\(.*\)/, '').toLowerCase()} ${campo}${k ? ' ' + k : ''}\n`;
    }
    s += '  }\n';
  }
  return s;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const p = await browser.newPage();
  await p.setViewport({ width: 1500, height: 1000, deviceScaleFactor: 2 });
  let n = 0;
  for (const [g, lista] of Object.entries(grupos)) {
    n++;
    const faltan = lista.filter(t => !tablas[t]);
    if (faltan.length) throw new Error('tabla no encontrada en el diccionario: ' + faltan);
    const codigo = mermaid(lista);
    if (n === 1) await p.setContent('<html><body style="margin:0;background:#fff"><div id="g"></div><script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script></body></html>', { waitUntil: 'networkidle0', timeout: 90000 });
    await p.evaluate(async (c, k) => {
      mermaid.initialize({ startOnLoad: false, theme: 'neutral', er: { useMaxWidth: false, fontSize: 13 }, themeVariables: { fontFamily: 'Arial' } });
      const { svg } = await mermaid.render('x' + k, c);
      document.getElementById('g').innerHTML = svg;
    }, codigo, n);
    const el = await p.$('#g svg');
    await el.screenshot({ path: RAIZ + `docs/capturas/2-1_er_${g}.png` });
    console.log('OK', g, lista.length, 'tablas');
  }
  await browser.close();
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
