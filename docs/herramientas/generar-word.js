// Genera el Word del manual de construcción a partir de MANUAL_CONSTRUCCION.md, con el formato obligatorio del esquema del curso:
//  - una tabla de 10 filas por procedimiento (Paso ... Verificación) con la captura en la fila "Evidencia"
//  - Times New Roman, párrafos de 10 pt justificados, interlineado 1,15, tablas y código de 9 pt
//  - Título 1 de 12 pt y Título 2 de 11 pt (estilo APA 7: negrita; centrado el nivel 1 y a la izquierda el nivel 2)
// Uso (desde docs/herramientas):  node generar-word.js NOMBRE.docx [ORIGEN.md] ["TÍTULO DE LA CARÁTULA"]
//   Sin los dos últimos datos genera el manual. Con ellos genera otro documento (por ejemplo la propuesta de mejoras).
//   El archivo se crea en la raíz del proyecto (o en la ruta absoluta que indiques). Usa siempre un nombre nuevo: no pises un Word que estés editando.
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const RAIZ = path.resolve(__dirname, '..', '..') + '/';
const PLANTILLA = path.join(__dirname, 'PLANTILLA CARATULA.docx');
const nombre = process.argv[2] || 'MANUAL_CONSTRUCCION_nuevo.docx';
const FUENTE_MD = process.argv[3] || 'MANUAL_CONSTRUCCION.md'; // documento de origen (por defecto, el manual)
const TITULO_PORTADA = process.argv[4];                         // título de la carátula (por defecto, el de la plantilla)
const SALIDA = path.isAbsolute(nombre) ? nombre : RAIZ + nombre;
const FUENTE = 'Times New Roman';
const ANCHO_ETIQUETA = 1700, ANCHO_VALOR = 7650; // twips: suman el ancho útil de la página (9350)

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); // las comillas también: los títulos de figuras van dentro de atributos
const rpr = o => {
  let x = `<w:rFonts w:ascii="${o.font || FUENTE}" w:hAnsi="${o.font || FUENTE}" w:cs="${o.font || FUENTE}"/>`;
  if (o.b) x += '<w:b/>'; else if (o.b === false) x += '<w:b w:val="0"/>';
  if (o.i) x += '<w:i/>';
  x += `<w:color w:val="${o.color || '000000'}"/>`;
  const sz = o.sz || 20;
  x += `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`;
  if (o.hl) x += `<w:highlight w:val="${o.hl}"/>`;
  if (o.fill) x += `<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>`;
  return `<w:rPr>${x}</w:rPr>`;
};
const run = (t, o = {}) => `<w:r>${rpr(o)}<w:t xml:space="preserve">${esc(t)}</w:t></w:r>`;

// Texto con **negrita**, `código`, *cursiva*, ==resaltado== y [enlaces](url)
function inline(t, base = {}) {
  let out = '', i = 0, m;
  const re = /(\*\*[^*]+\*\*|`[^`]+`|==[^=]+==|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)]+\))/g;
  while ((m = re.exec(t))) {
    if (m.index > i) out += run(t.slice(i, m.index), base);
    const s = m[0];
    if (s.startsWith('==')) out += run(s.slice(2, -2), { ...base, b: true, hl: 'yellow' }); // texto que falta completar
    else if (s.startsWith('**')) out += run(s.slice(2, -2), { ...base, b: true });
    else if (s.startsWith('`')) out += run(s.slice(1, -1), { ...base, font: 'Consolas', fill: 'EEF1F5', sz: base.sz || 20 });
    else if (s.startsWith('[')) out += run(s.slice(1, s.indexOf(']')) + ' (' + s.slice(s.indexOf('](') + 2, -1) + ')', base);
    else out += run(s.slice(1, -1), { ...base, i: true });
    i = m.index + s.length;
  }
  if (i < t.length) out += run(t.slice(i), base);
  return out;
}

// ---- Párrafos ----
const LINEA = '<w:spacing w:before="0" w:after="120" w:line="276" w:lineRule="auto"/><w:ind w:left="0" w:firstLine="0"/>';
const para = (inner, jc = 'both', extra = '') => `<w:p><w:pPr>${extra}${LINEA}<w:jc w:val="${jc}"/></w:pPr>${inner}</w:p>`;
const cpara = (inner, jc = 'both', extra = '') => `<w:p><w:pPr>${extra}<w:spacing w:before="0" w:after="40" w:line="240" w:lineRule="auto"/><w:ind w:left="0" w:firstLine="0"/><w:jc w:val="${jc}"/></w:pPr>${inner}</w:p>`;

// ---- Imágenes ----
const imagenes = [];
const faltan = [];
let nFig = 0, nTab = 0, docPr = 2000;
function pngSize(f) { const b = fs.readFileSync(f); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; }
function drawing(rid, w, h, nombre) {
  const cx = Math.round(w * 9525), cy = Math.round(h * 9525), id = ++docPr;
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${esc(nombre)}" descr="${esc(nombre)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${esc(nombre)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}

// Leyenda de figura estilo APA (número en negrita y título en cursiva)
function leyenda(titulo) {
  const n = ++nFig, keep = '<w:keepNext/>';
  return cpara(run('Figura ' + n, { b: true, sz: 18 }), 'left', keep) + cpara(run(titulo, { i: true, sz: 18 }), 'left', keep);
}

// ---- Resultados reales de comandos y consultas, con el aspecto de la herramienta donde se ejecutan ----
// (el texto es la salida real; solo cambia la presentación: Git Bash, terminal de VS Code o SQL Editor de Supabase)
const C = (t, color, o = {}) => run(t, { font: 'Consolas', sz: 18, color, ...o });
const lineaOscura = (fill, runs, ultima, extra = '') => `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>${extra}<w:spacing w:before="0" w:after="${ultima ? 80 : 0}" w:line="240" w:lineRule="auto"/><w:ind w:left="0" w:firstLine="0"/><w:jc w:val="left"/></w:pPr>${runs}</w:p>`;
const franja = (fill, runs) => lineaOscura(fill, runs, false);

const RUTA_GIT = '/e/UTP/CICLO 06/JAVA SCRIPT AVANZADO/LegadoSeguroWeb';
const RUTA_WIN = 'E:\\UTP\\CICLO 06\\JAVA SCRIPT AVANZADO\\LegadoSeguroWeb';

// Salida de comandos: cada línea "> comando" lleva su prompt; el resto es la salida tal cual
function terminal(lineas, estilo) {
  const git = estilo === 'git';
  const fondo = git ? '0C0C0C' : '1E1E1E', texto = 'CCCCCC';
  let x = git
    ? franja('E8E8E8', run(' MINGW64:' + RUTA_GIT, { font: 'Segoe UI', sz: 16, color: '202020' }))
    : franja('252526', run('  PROBLEMS    OUTPUT    DEBUG CONSOLE    ', { font: 'Segoe UI', sz: 16, color: '969696' }) + run('TERMINAL', { font: 'Segoe UI', sz: 16, color: 'FFFFFF', b: true }) + run('    PORTS', { font: 'Segoe UI', sz: 16, color: '969696' }));
  lineas.forEach((l, k) => {
    const ultima = k === lineas.length - 1;
    const m = l.match(/^> (.*)/);
    if (m && git) {
      if (k > 0) x += lineaOscura(fondo, C(' ', texto), false); // línea en blanco antes de cada prompt, como en Git Bash
      x += lineaOscura(fondo, C('Katy@ERPEDUCA', '16C60C') + C(' MINGW64 ', 'B146C2') + C(RUTA_GIT, 'C19C00') + C(' (master)', '3A96DD'), false);
      x += lineaOscura(fondo, C('$ ' + m[1], 'F2F2F2'), ultima);
    } else if (m) {
      const cmd = m[1];
      const sub = /^(npm|npx)\b/.test(cmd) ? '\\backend' : /^ng (serve|generate)/.test(cmd) ? '\\frontend' : '';
      x += lineaOscura(fondo, C('PS ' + RUTA_WIN + sub + '> ', texto) + C(cmd, 'DCDCAA'), ultima);
    } else {
      x += lineaOscura(fondo, C(l || ' ', texto), ultima);
    }
  });
  return x;
}

// Columnas de un SELECT: alias (AS) o último nombre, sin el prefijo de tabla
function columnasSelect(sql) {
  const lista = sql.replace(/^SELECT\s+/i, '').split(/\s+FROM\s+/i)[0];
  const cols = []; let nivel = 0, cur = '';
  for (const ch of lista) { if (ch === '(') nivel++; if (ch === ')') nivel--; if (ch === ',' && !nivel) { cols.push(cur); cur = ''; } else cur += ch; }
  cols.push(cur);
  return cols.map(c => { c = c.trim(); const a = c.match(/\s+AS\s+(\w+)$/i); if (a) return a[1]; const f = c.match(/^(\w+)\(/); if (f) return f[1]; return c.split('.').pop(); });
}

function sqlColor(sql) {
  let out = '', i = 0, m;
  const re = /('[^']*')|(\b(?:SELECT|FROM|WHERE|ORDER BY|LIMIT|JOIN|ON|AND|OR|IN|LIKE|AS|LEFT|NOT|NULL|IS)\b)|(::\w+)/gi;
  while ((m = re.exec(sql))) {
    if (m.index > i) out += C(sql.slice(i, m.index), 'D4D4D4');
    out += C(m[0], m[1] ? 'CE9178' : m[2] ? '569CD6' : '4EC9B0');
    i = m.index + m[0].length;
  }
  return out + C(sql.slice(i), 'D4D4D4');
}

// Consulta ejecutada en el SQL Editor de Supabase: editor con la consulta y cuadrícula de resultados
function supabase(sql, filas) {
  const cols = columnasSelect(sql);
  const datos = filas.filter(f => f.trim()).map(f => { const p = (f.includes('|') ? f.split('|') : f.trim().split(/\s{2,}/)).map(s => s.trim()); return p.length === cols.length ? p : [f.trim()]; });
  const nc = datos.every(d => d.length === cols.length) ? cols.length : 1;
  const head = nc === cols.length ? cols : [cols[0]];
  const rows = nc === cols.length ? datos : datos.map(d => [d.join(' | ')]);
  const anch = head.map((h, j) => Math.max(h.length, ...rows.map(r => (r[j] || '').length)));
  const pos = []; let acc = 120; anch.forEach(a => { pos.push(acc); acc += (a + 4) * 90; });
  const tabs = `<w:tabs>${pos.map(p => `<w:tab w:val="left" w:pos="${p}"/>`).join('')}</w:tabs>`;
  const S = (txt, color, o = {}) => run(txt, { font: 'Segoe UI', sz: 17, color, ...o });
  const celdas = (r, color, b) => r.map((v, j) => (j ? '<w:r><w:tab/></w:r>' : '') + S(v, color, { b })).join('');
  const barra = (izq, der) => `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="1C1C1C"/><w:tabs><w:tab w:val="right" w:pos="7450"/></w:tabs><w:spacing w:before="40" w:after="40" w:line="240" w:lineRule="auto"/><w:ind w:left="120" w:firstLine="0"/><w:jc w:val="left"/></w:pPr>${izq}<w:r><w:tab/></w:r>${der}</w:p>`;
  const f = (fill, runs, borde) => `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>${borde ? '<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="4" w:color="3A3A3A"/></w:pBdr>' : ''}${tabs}<w:spacing w:before="50" w:after="50" w:line="240" w:lineRule="auto"/><w:ind w:left="120" w:firstLine="0"/><w:jc w:val="left"/></w:pPr>${runs}</w:p>`;
  // Barra superior del SQL Editor, consulta con números de línea, barra de resultados y cuadrícula
  let x = barra(S('Unsaved edits', '9A9A9A'), S('⋮    Database    Save  Ctrl S   ', 'EDEDED') + S(' Run  Ctrl ↵ ', 'FFFFFF', { b: true, fill: '2E7D5B' }));
  sql.split(/\s+(?=FROM\b|WHERE\b|ORDER BY\b|GROUP BY\b|LIMIT\b|LEFT JOIN\b|JOIN\b)/i).forEach((linea, k) => {
    x += `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="1C1C1C"/><w:spacing w:before="20" w:after="20" w:line="240" w:lineRule="auto"/><w:ind w:left="500" w:hanging="380"/><w:jc w:val="left"/></w:pPr>${C((k + 1) + '  ', '6B6B6B')}${sqlColor(linea)}</w:p>`;
  });
  x += barra(S('Results', 'FFFFFF', { b: true }) + S('     Chart', '9A9A9A'), S(rows.length + (rows.length === 1 ? ' row' : ' rows'), 'EDEDED', { b: true }) + S(' (Limited to only 100 rows)    Export ▾', '9A9A9A'));
  x += f('1C1C1C', celdas(head, 'FFFFFF', true), true);
  rows.forEach(r => { x += f('1C1C1C', celdas(r, 'EDEDED', false), true); });
  return x;
}

function bloqueResultado(lineas) {
  const m = (lineas[0] || '').match(/^> (.*)/);
  if (m && /^SELECT\b/i.test(m[1])) return supabase(m[1].replace(/;$/, ''), lineas.slice(1));
  const git = lineas.some(l => /^> (git|grep|head|ls)\b/.test(l));
  return terminal(lineas, git ? 'git' : 'vscode');
}

// Figura estilo APA: "Figura n" en negrita, título en cursiva y la imagen debajo.
// maxW y maxH son el tamaño máximo en píxeles: dentro de una tabla caben 495 de ancho; fuera de ella, 600.
function figura(titulo, ruta, maxH = 470, maxW = 495) {
  const n = ++nFig, f = RAIZ + ruta;
  const keep = '<w:keepNext/>';
  let x = cpara(run('Figura ' + n, { b: true, sz: 18 }), 'left', keep) + cpara(run(titulo, { i: true, sz: 18 }), 'left', keep);
  if (fs.existsSync(f)) {
    let { w, h } = pngSize(f);
    if (/2-1_er_/.test(ruta)) { w /= 2; h /= 2; } // diagramas generados al doble de resolución
    const s = Math.min(maxW / w, maxH / h, 1);
    const rid = 'rIdImg' + (imagenes.length + 1);
    imagenes.push({ rid, f, nombre: 'media/manual_img' + (imagenes.length + 1) + '.png' });
    x += cpara(drawing(rid, Math.round(w * s), Math.round(h * s), titulo), 'center');
  } else {
    faltan.push({ n, ruta, titulo });
    x += cpara(run('[CAPTURA PENDIENTE: ' + ruta + ']', { b: true, sz: 18, hl: 'yellow' }), 'left');
  }
  return x;
}

// ---- Contenido de una celda de tabla ----
function celda(lines) {
  let out = '', i = 0, m;
  while (i < lines.length) {
    const l = lines[i];
    if ((m = l.match(/^resultado: (.*)/))) {
      out += leyenda(m[1]);
    } else if (/^```resultado/.test(l)) {
      const code = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
      out += bloqueResultado(code);
    } else if (/^```/.test(l)) {
      const code = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
      code.forEach((c, k) => { out += `<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F3F5F8"/><w:spacing w:before="0" w:after="${k === code.length - 1 ? 60 : 0}" w:line="240" w:lineRule="auto"/><w:ind w:left="0" w:firstLine="0"/></w:pPr>${run(c || ' ', { font: 'Consolas', sz: 18 })}</w:p>`; });
    } else if ((m = l.match(/^!\[([^\]]*)\]\(([^)]+)\)/))) {
      out += figura(m[1], m[2]);
    } else if ((m = l.match(/^\s*[-*] (.*)/))) {
      out += `<w:p><w:pPr><w:spacing w:before="0" w:after="30" w:line="240" w:lineRule="auto"/><w:ind w:left="284" w:hanging="284"/><w:jc w:val="both"/></w:pPr>${run('•\t', { sz: 18 })}${inline(m[1], { sz: 18 })}</w:p>`;
    } else if ((m = l.match(/^\s*(\d+)\. (.*)/))) {
      out += `<w:p><w:pPr><w:spacing w:before="0" w:after="30" w:line="240" w:lineRule="auto"/><w:ind w:left="284" w:hanging="284"/><w:jc w:val="both"/></w:pPr>${run(m[1] + '.\t', { sz: 18 })}${inline(m[2], { sz: 18 })}</w:p>`;
    } else if (l.trim()) {
      out += cpara(inline(l, { sz: 18 }));
    }
    i++;
  }
  return out || cpara('', 'left');
}

const BORDES = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(b => `<w:${b} w:val="single" w:sz="4" w:space="0" w:color="7F8A99"/>`).join('');
const MARGENES = '<w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar>';

// Encabezado de tabla estilo APA: "Tabla n" en negrita y el título en cursiva
function tituloTabla(titulo) {
  const n = ++nTab, keep = '<w:keepNext/>';
  return cpara(run('Tabla ' + n, { b: true, sz: 20 }), 'left', keep) + cpara(run(titulo, { i: true, sz: 20 }), 'left', keep);
}

const encabezados = [];
let bid = 9000;
const body = [];

// ---- Procedimiento con el formato obligatorio ----
const CLAVES = ['Objetivo', 'Acción', 'Comando', 'Explicación', 'Evidencia', 'Resultado esperado', 'Error frecuente', 'Solución', 'Verificación'];
const ROTULOS = { Comando: 'Comando / código' };
const VACIOS = { Comando: 'No aplica.', Evidencia: 'No aplica.', 'Error frecuente': 'No se presentó en este procedimiento.', Solución: 'No aplica.' };

function tablaPaso(codigo, titulo, campos) {
  // El título de la tabla es también una entrada (nivel 3) del índice
  const marca = '_Toc' + (++bid);
  encabezados.push({ nivel: 3, texto: `${codigo} ${titulo}`, marca });
  const n = ++nTab, keep = '<w:keepNext/>';
  let t = cpara(run('Tabla ' + n, { b: true, sz: 20 }), 'left', keep) +
    `<w:p><w:pPr><w:keepNext/><w:spacing w:before="0" w:after="40" w:line="240" w:lineRule="auto"/><w:ind w:left="0" w:firstLine="0"/><w:jc w:val="left"/><w:outlineLvl w:val="2"/></w:pPr><w:bookmarkStart w:id="${bid}" w:name="${marca}"/>${run(`Procedimiento ${codigo}: ${titulo}`, { i: true, sz: 20 })}<w:bookmarkEnd w:id="${bid}"/></w:p>`;
  t += `<w:tbl><w:tblPr><w:tblW w:w="${ANCHO_ETIQUETA + ANCHO_VALOR}" w:type="dxa"/><w:tblBorders>${BORDES}</w:tblBorders><w:tblLayout w:type="fixed"/>${MARGENES}</w:tblPr><w:tblGrid><w:gridCol w:w="${ANCHO_ETIQUETA}"/><w:gridCol w:w="${ANCHO_VALOR}"/></w:tblGrid>`;
  const fila = (rot, contenido, cab) =>
    `<w:tr><w:trPr><w:cantSplit/>${cab ? '<w:tblHeader/>' : ''}</w:trPr>` +
    `<w:tc><w:tcPr><w:tcW w:w="${ANCHO_ETIQUETA}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${cab ? 'D9E2F3' : 'EEF3FA'}"/></w:tcPr>${cpara(run(rot, { b: true, sz: 18 }), 'left')}</w:tc>` +
    `<w:tc><w:tcPr><w:tcW w:w="${ANCHO_VALOR}" w:type="dxa"/>${cab ? '<w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/>' : ''}</w:tcPr>${cab ? cpara(run('Descripción', { b: true, sz: 18 }), 'left') : contenido}</w:tc></w:tr>`;
  t += fila('Elemento', '', true);
  t += fila('Paso', cpara(run(`${codigo} ${titulo}`, { b: true, sz: 18 }), 'left'));
  for (const k of CLAVES) {
    const lineas = campos[k] && campos[k].some(l => l.trim()) ? campos[k] : [VACIOS[k] || 'Completar.'];
    t += fila(ROTULOS[k] || k, celda(lineas));
  }
  return t + '</w:tbl>' + para('', 'left');
}

// ---- Lectura del markdown (desde la primera "## ") ----
let lines = fs.readFileSync(RAIZ + FUENTE_MD, 'utf8').split(/\r?\n/);
lines = lines.slice(lines.findIndex(l => /^## /.test(l)));

const RE_CLAVE = new RegExp('^(' + CLAVES.join('|') + '):\\s*(.*)$');

let i = 0, m;
while (i < lines.length) {
  const l = lines[i];

  // Procedimiento: :::paso 2.1.1 Título ... :::
  if ((m = l.match(/^:::paso (\S+) (.*)/))) {
    const campos = {}; let clave = null, enCodigo = false;
    i++;
    while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
      const x = lines[i];
      if (/^```/.test(x)) enCodigo = !enCodigo;
      const k = !enCodigo && x.match(RE_CLAVE);
      if (k) { clave = k[1]; campos[clave] = k[2] ? [k[2]] : []; }
      else if (clave) campos[clave].push(x);
      i++;
    }
    i++;
    body.push(tablaPaso(m[1], m[2].trim(), campos));
    continue;
  }

  // Bloque de código fuera de tablas
  if (/^```/.test(l)) {
    const code = []; i++;
    while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++; }
    i++;
    code.forEach((c, k) => body.push(`<w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="F3F5F8"/><w:spacing w:before="0" w:after="${k === code.length - 1 ? 160 : 0}" w:line="240" w:lineRule="auto"/><w:ind w:left="284" w:firstLine="0"/></w:pPr>${run(c || ' ', { font: 'Consolas', sz: 18 })}</w:p>`));
    continue;
  }

  // Figura fuera de tablas
  if ((m = l.match(/^!\[([^\]]*)\]\(([^)]+)\)/))) {
    body.push(figura(m[1], m[2], 640, 600), para('', 'left'));
    i++; continue;
  }

  // Título de tercer nivel (APA 7: negrita cursiva, a la izquierda); no entra en el índice
  if ((m = l.match(/^#### (.*)/))) {
    body.push(`<w:p><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="60"/><w:ind w:left="0" w:firstLine="0"/><w:jc w:val="left"/></w:pPr>${run(m[1].replace(/`/g, ''), { b: true, i: true, sz: 20 })}</w:p>`);
    i++; continue;
  }

  // Títulos: ## nivel 1 (12 pt, centrado), ### nivel 2 (11 pt, a la izquierda)
  if ((m = l.match(/^(#{2,3}) (.*)/))) {
    const nivel = m[1].length - 1;
    const texto = m[2].replace(/`/g, '');
    const marca = '_Toc' + (++bid);
    encabezados.push({ nivel, texto, marca });
    const p = nivel === 1
      ? `<w:pStyle w:val="Ttulo1"/><w:pageBreakBefore/><w:spacing w:before="0" w:after="200"/><w:ind w:left="0" w:firstLine="0"/><w:jc w:val="center"/>`
      : `<w:pStyle w:val="Ttulo2"/><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:ind w:left="0" w:firstLine="0"/><w:jc w:val="left"/>`;
    body.push(`<w:p><w:pPr>${p}</w:pPr><w:bookmarkStart w:id="${bid}" w:name="${marca}"/>${run(texto, { b: true, sz: nivel === 1 ? 24 : 22 })}<w:bookmarkEnd w:id="${bid}"/></w:p>`);
    i++; continue;
  }

  // Tabla común, con título si la línea anterior es "Tabla: Título"
  if (/^\|/.test(l)) {
    const rows = [];
    while (i < lines.length && /^\|/.test(lines[i])) {
      if (!/^\|[\s|:-]+\|?\s*$/.test(lines[i])) rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map(s => s.trim()));
      i++;
    }
    const cols = Math.max(...rows.map(r => r.length));
    let t = `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${BORDES}</w:tblBorders><w:tblLayout w:type="autofit"/>${MARGENES}</w:tblPr>`;
    rows.forEach((r, ri) => {
      t += `<w:tr><w:trPr><w:cantSplit/>${ri === 0 ? '<w:tblHeader/>' : ''}</w:trPr>`;
      for (let c = 0; c < cols; c++) {
        t += `<w:tc><w:tcPr>${ri === 0 ? '<w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/>' : ''}</w:tcPr>${cpara(inline(r[c] || '', { sz: 18, b: ri === 0 }), 'left')}</w:tc>`;
      }
      t += '</w:tr>';
    });
    body.push(t + '</w:tbl>', para('', 'left'));
    continue;
  }

  if ((m = l.match(/^Tabla: (.*)/))) { body.push(tituloTabla(m[1])); i++; continue; }

  // Referencia APA con sangría francesa
  if ((m = l.match(/^ref: (.*)/))) {
    body.push(`<w:p><w:pPr><w:spacing w:before="0" w:after="120" w:line="276" w:lineRule="auto"/><w:ind w:left="720" w:hanging="720"/><w:jc w:val="left"/></w:pPr>${inline(m[1])}</w:p>`);
    i++; continue;
  }

  if ((m = l.match(/^(\s*)[-*] (.*)/))) {
    body.push(`<w:p><w:pPr><w:spacing w:before="0" w:after="60" w:line="276" w:lineRule="auto"/><w:ind w:left="567" w:hanging="283"/><w:jc w:val="both"/></w:pPr>${run('•\t')}${inline(m[2])}</w:p>`);
    i++; continue;
  }
  if ((m = l.match(/^\s*(\d+)\. (.*)/))) {
    body.push(`<w:p><w:pPr><w:spacing w:before="0" w:after="60" w:line="276" w:lineRule="auto"/><w:ind w:left="567" w:hanging="283"/><w:jc w:val="both"/></w:pPr>${run(m[1] + '.\t')}${inline(m[2])}</w:p>`);
    i++; continue;
  }
  if (/^> /.test(l)) {
    body.push(`<w:p><w:pPr><w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="C9962C"/></w:pBdr><w:spacing w:before="0" w:after="120" w:line="276" w:lineRule="auto"/><w:ind w:left="360" w:firstLine="0"/><w:jc w:val="both"/></w:pPr>${inline(l.slice(2), { i: true })}</w:p>`);
    i++; continue;
  }
  if (/^---+$/.test(l) || !l.trim()) { i++; continue; }
  body.push(para(inline(l)));
  i++;
}

// ---- Índice (campo TOC con las entradas ya escritas; Word calcula las páginas al actualizar) ----
const toc = encabezados.map((e, k) => {
  const ini = k === 0
    ? '<w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \\o "1-3" \\h \\z \\u </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>'
    : '';
  const fin = k === encabezados.length - 1 ? '<w:r><w:fldChar w:fldCharType="end"/></w:r>' : '';
  return `<w:p><w:pPr><w:pStyle w:val="TDC${e.nivel}"/><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9350"/></w:tabs><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:firstLine="0"/></w:pPr>${ini}<w:hyperlink w:anchor="${e.marca}" w:history="1">${run(e.texto, { sz: 20, b: e.nivel === 1 ? true : false })}</w:hyperlink>${fin}</w:p>`;
}).join('');

(async () => {
  const zip = await JSZip.loadAsync(fs.readFileSync(PLANTILLA));
  let doc = await zip.file('word/document.xml').async('string');
  if (TITULO_PORTADA) doc = doc.replace('MANUAL DE CONSTRUCCIÓN', esc(TITULO_PORTADA));

  const a = doc.indexOf('<w:sdt>');
  const b = doc.indexOf('</w:sdt>') + '</w:sdt>'.length;
  const sdt = doc.slice(a, b);
  const iniContenido = sdt.indexOf('<w:sdtContent>') + '<w:sdtContent>'.length;
  const titulo = sdt.slice(iniContenido, sdt.indexOf('</w:p>', iniContenido) + 6);
  const nuevoSdt = sdt.slice(0, iniContenido) + titulo + toc + '</w:sdtContent></w:sdt>';

  const salto = '<w:p><w:pPr><w:spacing w:after="0"/><w:ind w:firstLine="0"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>';
  doc = doc.slice(0, a) + nuevoSdt + salto + body.join('') + doc.slice(b);
  if (!/xmlns:pic=/.test(doc)) doc = doc.replace('<w:document ', '<w:document xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" ');
  zip.file('word/document.xml', doc);

  let rels = await zip.file('word/_rels/document.xml.rels').async('string');
  for (const im of imagenes) {
    zip.file('word/' + im.nombre, fs.readFileSync(im.f));
    rels = rels.replace('</Relationships>', `<Relationship Id="${im.rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${im.nombre}"/></Relationships>`);
  }
  zip.file('word/_rels/document.xml.rels', rels);

  // Índice con interlineado sencillo y sin espacios entre entradas (también cuando Word lo actualiza)
  let estilos = await zip.file('word/styles.xml').async('string');
  estilos = estilos.replace(/(<w:style [^>]*w:styleId="TDC([123])".*?<w:pPr>)(.*?)(<\/w:pPr>)/gs, (m, a, n, medio, c) =>
    a + '<w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>' + `<w:ind w:left="${(n - 1) * 240}" w:firstLine="0"/>` + c);
  zip.file('word/styles.xml', estilos);

  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(SALIDA, buf);
  console.log('ok', SALIDA, buf.length, 'bytes |', nTab, 'tablas |', nFig, 'figuras (', faltan.length, 'pendientes ) |', encabezados.length, 'entradas de índice');
  if (faltan.length) console.log('Capturas pendientes:\n' + faltan.map(f => `  Figura ${f.n}: ${f.ruta}  (${f.titulo})`).join('\n'));
})();
