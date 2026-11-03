// Script de una sola vez: cifra las descripciones y montos que se guardaron antes de existir el cifrado.
// Se ejecuta con:  npm run cifrar
// IMPORTANTE: antes de correrlo, pon ENCRYPTION_KEY en el .env y no la cambies después.

import { pool } from '../config/database';
import { cifrar } from '../utils/cifrado';

async function main() {
  // Descripciones de activos que todavía están en texto normal
  const activos = await pool.query(
    "SELECT id_activo, descripcion, monto FROM activo_digital WHERE descripcion IS NOT NULL AND descripcion NOT LIKE 'enc:%'"
  );
  for (const a of activos.rows) {
    await pool.query('UPDATE activo_digital SET descripcion = $1 WHERE id_activo = $2', [cifrar(a.descripcion), a.id_activo]);
  }

  // Montos que todavía están en la columna normal
  const montos = await pool.query('SELECT id_activo, monto FROM activo_digital WHERE monto IS NOT NULL');
  for (const m of montos.rows) {
    await pool.query('UPDATE activo_digital SET monto_cifrado = $1, monto = NULL WHERE id_activo = $2', [cifrar(String(m.monto)), m.id_activo]);
  }

  const historial = await pool.query('SELECT id_historial, monto FROM historial_monto WHERE monto IS NOT NULL');
  for (const h of historial.rows) {
    await pool.query('UPDATE historial_monto SET monto_cifrado = $1, monto = NULL WHERE id_historial = $2', [cifrar(String(h.monto)), h.id_historial]);
  }

  console.log(`Cifrado listo: ${activos.rows.length} descripciones, ${montos.rows.length} montos, ${historial.rows.length} historiales.`);
  await pool.end();
}

main();
