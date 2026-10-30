// Servicio de reglas de liberación. Cada usuario tiene UNA regla activa:
// si ya existe se actualiza y si no, se crea.

import { pool } from '../config/database';
import { DatosRegla, Regla, ReglaConContexto } from '../models/regla.model';

const COLUMNAS = `id_regla AS id,
                  dias_inactividad AS "diasInactividad",
                  min_confirmaciones AS "minConfirmaciones",
                  dias_periodo_espera AS "diasPeriodoEspera",
                  requiere_validador AS "requiereValidador"`;

export async function contarBeneficiarios(idUsuario: number): Promise<number> {
  const r = await pool.query(
    'SELECT COUNT(*)::int AS n FROM beneficiario WHERE id_usuario_propietario = $1',
    [idUsuario]
  );
  return r.rows[0].n;
}

export async function obtenerRegla(idUsuario: number): Promise<ReglaConContexto> {
  const r = await pool.query<Regla>(
    `SELECT ${COLUMNAS}
     FROM regla_liberacion
     WHERE id_usuario = $1 AND estado = 'ACTIVA'
     ORDER BY id_regla DESC
     LIMIT 1`,
    [idUsuario]
  );

  return {
    regla: r.rows[0] ?? null,
    totalBeneficiarios: await contarBeneficiarios(idUsuario)
  };
}

export async function guardarRegla(datos: DatosRegla, idUsuario: number): Promise<Regla> {
  const valores = [datos.diasInactividad, datos.minConfirmaciones, datos.diasPeriodoEspera, datos.requiereValidador];
  const actual = await obtenerRegla(idUsuario);

  if (actual.regla) {
    const r = await pool.query<Regla>(
      `UPDATE regla_liberacion
       SET dias_inactividad = $1, min_confirmaciones = $2, dias_periodo_espera = $3, requiere_validador = $4
       WHERE id_regla = $5
       RETURNING ${COLUMNAS}`,
      [...valores, actual.regla.id]
    );
    return r.rows[0];
  }

  const r = await pool.query<Regla>(
    `INSERT INTO regla_liberacion
       (id_usuario, dias_inactividad, min_confirmaciones, dias_periodo_espera, requiere_validador)
     VALUES ($5, $1, $2, $3, $4)
     RETURNING ${COLUMNAS}`,
    [...valores, idUsuario]
  );
  return r.rows[0];
}
