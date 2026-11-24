// Deja los datos de la demo como al inicio. Se ejecuta desde la carpeta backend (lee su .env):
//   cd backend
//   npx tsx ../docs/herramientas/reset-demo.ts hugo          Hugo vuelve a "pendiente de validar": sin DNI ni selfie, sin confirmar, sin códigos
//   npx tsx ../docs/herramientas/reset-demo.ts correo real   el correo de Hugo pasa a katy.s.9210+heredero@gmail.com (llegan los códigos a tu Gmail)
//   npx tsx ../docs/herramientas/reset-demo.ts correo demo   vuelve a heredero.demo@example.com (los códigos salen en la consola del backend si no hay SMTP)
process.env.SMTP_HOST = '';

const REAL = 'katy.s.9210+heredero@gmail.com';
const DEMO = 'heredero.demo@example.com';

(async () => {
  const { pool } = await import('../../backend/src/config/database');
  const accion = process.argv[2];

  if (accion === 'correo') {
    const [de, a] = process.argv[3] === 'real' ? [DEMO, REAL] : [REAL, DEMO];
    const r = await pool.query('UPDATE beneficiario SET correo = $2 WHERE LOWER(correo) = $1 RETURNING id_beneficiario, nombres, correo', [de, a]);
    await pool.query('DELETE FROM codigo_verificacion WHERE destino IN ($1, $2)', [DEMO, REAL]);
    console.log('correo', process.argv[3], JSON.stringify(r.rows));
  } else if (accion === 'hugo') {
    const b = await pool.query('SELECT id_beneficiario, correo FROM beneficiario WHERE LOWER(correo) IN ($1, $2)', [REAL, DEMO]);
    if (b.rows.length === 0) throw new Error('No se encontró al heredero de prueba');
    const { id_beneficiario: id, correo } = b.rows[0];
    await pool.query('DELETE FROM verificacion_beneficiario WHERE id_beneficiario = $1', [id]);
    await pool.query('UPDATE beneficiario SET correo_verificado = FALSE WHERE id_beneficiario = $1', [id]);
    await pool.query("UPDATE confirmacion_beneficiario SET resultado = 'PENDIENTE', fecha = NULL WHERE id_beneficiario = $1 AND resultado <> 'PENDIENTE'", [id]);
    await pool.query('DELETE FROM codigo_verificacion WHERE LOWER(destino) = $1', [correo.toLowerCase()]);
    console.log('Hugo reiniciado:', correo);
  } else {
    console.log('Uso: reset-demo.ts hugo | correo real | correo demo');
  }
  await pool.end();
})();
