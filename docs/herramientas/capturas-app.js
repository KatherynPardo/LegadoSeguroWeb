// Capturas reales de la aplicación para el manual. Necesita el backend (5000), el frontend (4200) y Google Chrome.
// Uso (desde docs/herramientas):  node capturas-app.js ESCENARIO [nombre] [recorte]
//   carlos     dashboard, herederos y aviso de plan del propietario Carlos
//   recortes   primera pantalla de dashboard, historial y administración
//   tablet     dashboard a 768 px (prueba responsive)
//   detalle    detalle de un proceso (propietario Rosa)
//   registro   paso 2 del registro (crea un usuario de prueba pendiente: bórralo después)
//   hugo       portal del heredero Hugo: node capturas-app.js hugo NOMBRE [recorte]
// Los usuarios y contraseñas son los de prueba del proyecto (ver docs/TRASLADO.md).
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const RAIZ = path.resolve(__dirname, '..', '..') + '/';
const OUT = RAIZ + 'docs/capturas/';
const WEB = 'http://localhost:4200/', API = 'http://localhost:5000/api';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const CORREO_HUGO = 'katy.s.9210+heredero@gmail.com';
const esperar = ms => new Promise(r => setTimeout(r, ms));

async function sesion(correo, password) {
  const r = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correo, password }) });
  const j = await r.json();
  if (!j.token) throw new Error('el login falló para ' + correo);
  return j;
}

(async () => {
  const quien = process.argv[2];
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 1366, height: 800 });
  await p.goto(WEB + 'login', { waitUntil: 'networkidle0' });

  const foto = async (nombre, completa = true) => { await esperar(900); await p.screenshot({ path: OUT + nombre + '.png', fullPage: completa }); console.log('OK', nombre); };
  const clic = async texto => {
    const ok = await p.evaluate(t => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim().includes(t) && !x.disabled); if (b) { b.click(); return true; } return false; }, texto);
    if (!ok) throw new Error('no hay botón ' + texto);
    await esperar(700);
  };
  const entrar = async s => { await p.evaluate((t, u) => { localStorage.setItem('lg_token', t); localStorage.setItem('lg_usuario', u); }, s.token, JSON.stringify(s.usuario)); };

  if (quien === 'carlos') {
    await entrar(await sesion('carlos.ramirez@example.com', 'Legado2026!'));
    await p.goto(WEB + 'dashboard', { waitUntil: 'networkidle0' }); await foto('30-dashboard');
    await p.goto(WEB + 'beneficiarios', { waitUntil: 'networkidle0' }); await foto('16-herederos');
    await clic('Designar Beneficiario'); await foto('17-aviso-plan', false);
  }
  if (quien === 'recortes') {
    // Pantallas altas: solo la primera pantalla, para que se lean bien dentro del Word
    await entrar(await sesion('carlos.ramirez@example.com', 'Legado2026!'));
    await p.goto(WEB + 'dashboard', { waitUntil: 'networkidle0' }); await foto('30-dashboard', false);
    await p.goto(WEB + 'historial', { waitUntil: 'networkidle0' }); await foto('27-historial', false);
    await entrar(await sesion('admin@legadoseguro.pe', 'Admin2026!'));
    await p.goto(WEB + 'usuarios', { waitUntil: 'networkidle0' }); await foto('26-administracion', false);
  }
  if (quien === 'tablet') {
    await entrar(await sesion('carlos.ramirez@example.com', 'Legado2026!'));
    await p.setViewport({ width: 768, height: 1024 });
    await p.goto(WEB + 'dashboard', { waitUntil: 'networkidle0' }); await foto('10-4_responsive_tablet', false);
  }
  if (quien === 'detalle') {
    await entrar(await sesion('demo.inactivo@example.com', 'Legado2026!'));
    await p.goto(WEB + 'procesos', { waitUntil: 'networkidle0' });
    await clic('Ver detalle'); await foto('20-proceso-detalle');
  }
  if (quien === 'registro') {
    await p.goto(WEB + 'registro', { waitUntil: 'networkidle0' });
    const campos = { dni: '00000099', nombres: 'Persona', apellidos: 'De Prueba', correo: 'registro.prueba@example.com', telefono: '999999999', password: 'Prueba2026!', confirmar: 'Prueba2026!' };
    for (const [id, v] of Object.entries(campos)) { await p.click('#' + id); await p.type('#' + id, v); }
    await p.click('button[type=submit]'); await esperar(1500);
    await foto('12-registro-2', false);
  }
  if (quien === 'hugo') {
    // La sesión del heredero se firma con el JWT_SECRET del backend/.env (el mismo que usa el servidor)
    const dotenv = require(RAIZ + 'backend/node_modules/dotenv');
    const jwt = require(RAIZ + 'backend/node_modules/jsonwebtoken');
    dotenv.config({ path: RAIZ + 'backend/.env' });
    const token = jwt.sign({ tipo: 'HEREDERO', correo: CORREO_HUGO }, process.env.JWT_SECRET || 'clave-solo-para-desarrollo-cambiala', { expiresIn: '1h' });
    await p.evaluate(t => { localStorage.setItem('lg_portal_token', t); localStorage.setItem('lg_portal_heredero', JSON.stringify({ correo: 'x', nombres: 'Hugo' })); }, token);
    await p.setViewport({ width: 1366, height: 1000 }); await p.goto(WEB + 'portal', { waitUntil: 'networkidle0' });
    const nombre = process.argv[3] || 'portal_hugo';
    if (process.argv[4] === 'recorte') { await esperar(900); await p.screenshot({ path: OUT + nombre + '.png', clip: { x: 290, y: 465, width: 780, height: 345 } }); console.log('OK recorte', nombre); }
    else await foto(nombre);
  }
  await browser.close();
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });
