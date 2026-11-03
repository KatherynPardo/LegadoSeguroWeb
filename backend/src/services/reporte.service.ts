// Reportes del propio usuario: cuántos activos tiene, cuánto dinero registró, herederos y procesos.

import { pool } from '../config/database';
import { descifrar } from '../utils/cifrado';

export async function obtenerReporte(idUsuario: number) {
  const id = [idUsuario];

  const activos = await pool.query(
    `SELECT a.id_activo, t.nombre AS tipo, t.categoria_sensibilidad AS sensibilidad,
            a.moneda, a.monto::float8 AS monto_plano, a.monto_cifrado,
            (SELECT COUNT(*)::int FROM activo_beneficiario ab
              JOIN beneficiario b ON b.id_beneficiario = ab.id_beneficiario
              WHERE ab.id_activo = a.id_activo AND b.estado = 'ACTIVO') AS herederos
     FROM activo_digital a
     JOIN tipo_activo t ON t.id_tipo = a.id_tipo
     WHERE a.id_usuario = $1 AND a.estado = 'ACTIVO'`,
    id
  );

  // Activos por tipo, y dinero registrado por moneda (los montos están cifrados: se descifran aquí)
  const porTipo: Record<string, { tipo: string; sensibilidad: string; cantidad: number }> = {};
  const dinero: Record<string, number> = {};
  let sinHeredero = 0;

  for (const a of activos.rows) {
    porTipo[a.tipo] = porTipo[a.tipo] ?? { tipo: a.tipo, sensibilidad: a.sensibilidad, cantidad: 0 };
    porTipo[a.tipo].cantidad++;

    if (a.herederos === 0) sinHeredero++;

    const monto = a.monto_cifrado ? Number(descifrar(a.monto_cifrado)) : a.monto_plano;
    if (monto !== null && a.moneda) dinero[a.moneda] = (dinero[a.moneda] ?? 0) + monto;
  }

  const herederos = await pool.query(
    `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE correo_verificado)::int AS verificados
     FROM beneficiario WHERE id_usuario_propietario = $1 AND estado = 'ACTIVO'`,
    id
  );

  const procesos = await pool.query(
    `SELECT estado, COUNT(*)::int AS cantidad FROM proceso_liberacion
     WHERE id_usuario_propietario = $1 GROUP BY estado ORDER BY estado`,
    id
  );

  return {
    totalActivos: activos.rows.length,
    sinHeredero,
    porTipo: Object.values(porTipo),
    dinero: Object.entries(dinero).map(([moneda, total]) => ({ moneda, total })),
    herederos: herederos.rows[0],
    procesos: procesos.rows
  };
}
