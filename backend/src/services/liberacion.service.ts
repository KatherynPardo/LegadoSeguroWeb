// Etapas del proceso de liberación que cumple el HEREDERO (pantalla del Figma 06) y el motor que las hace avanzar.
//
//   DETECTADO ──aviso──► EN_CONFIRMACION ──(confirman las personas que pide la regla)──► EN_ESPERA
//   EN_ESPERA ──(pasa el período de espera y no hay objeciones abiertas)──► LIBERADO
//   En cualquier momento, el propietario puede CANCELAR el proceso.

import crypto from 'crypto';
import { PoolClient } from 'pg';
import { pool } from '../config/database';
import { cifrar, descifrar } from '../utils/cifrado';
import { notificar } from './notificacion.service';

type Db = Pick<PoolClient, 'query'>;

// Errores de regla de negocio: el controlador los convierte en 400, 404 o 409
export class ReglaLiberacion extends Error {
  constructor(mensaje: string, public estado: number) {
    super(mensaje);
  }
}

const TAMANO_MAXIMO_SELFIE = 400000; // caracteres del texto base64 (unos 300 KB)

// ---------------------------------------------------------------
// Aviso inicial: cuando el sistema abre un proceso, se avisa a todos
// ---------------------------------------------------------------

export async function avisarInicioProceso(idProceso: number): Promise<void> {
  const propietario = await pool.query(
    `SELECT u.id_usuario, u.nombres, u.correo, r.dias_inactividad
     FROM proceso_liberacion p
     JOIN usuario u ON u.id_usuario = p.id_usuario_propietario
     JOIN regla_liberacion r ON r.id_regla = p.id_regla
     WHERE p.id_proceso = $1`,
    [idProceso]
  );
  const dueno = propietario.rows[0];
  if (!dueno) return;

  // El propietario recibe una alerta: si está bien, todavía puede cancelar el proceso
  await notificar(
    { idUsuario: dueno.id_usuario, correo: dueno.correo },
    idProceso,
    'LegadoSeguro: detectamos que llevas mucho tiempo sin entrar',
    `Hola ${dueno.nombres}, pasaron más de ${dueno.dias_inactividad} días sin actividad en tu cuenta, así que se inició un proceso ` +
      'de liberación de tu legado. Si estás bien, inicia sesión y cancela el proceso desde la sección Procesos.'
  );

  // Cada heredero verificado que participa recibe el aviso para entrar a su espacio
  const herederos = await pool.query(
    `SELECT DISTINCT b.id_beneficiario, b.nombres, b.correo
     FROM confirmacion_beneficiario c
     JOIN beneficiario b ON b.id_beneficiario = c.id_beneficiario
     WHERE c.id_proceso = $1 AND b.estado = 'ACTIVO' AND b.correo_verificado = TRUE`,
    [idProceso]
  );
  for (const h of herederos.rows) {
    await notificar(
      { idBeneficiario: h.id_beneficiario, correo: h.correo },
      idProceso,
      'LegadoSeguro: tienes una solicitud de liberación de legado',
      `Hola ${h.nombres}, ${dueno.nombres} te designó como heredero. Entra a tu espacio de heredero en LegadoSeguro ` +
        'para completar tus verificaciones y confirmar tu participación.'
    );
  }

  await pool.query("UPDATE proceso_liberacion SET estado = 'EN_CONFIRMACION' WHERE id_proceso = $1 AND estado = 'DETECTADO'", [idProceso]);
}

// ---------------------------------------------------------------
// Estado del proceso según las confirmaciones
// ---------------------------------------------------------------

// Si ya confirmaron las personas que pide la regla, empieza la espera final; si dejan de ser suficientes, vuelve atrás.
// Devuelve el estado en que queda el proceso.
async function reevaluarProceso(db: Db, idProceso: number): Promise<string | null> {
  const r = await db.query(
    `SELECT p.estado, rl.min_confirmaciones,
            (SELECT COUNT(DISTINCT c.id_beneficiario)::int FROM confirmacion_beneficiario c
              WHERE c.id_proceso = p.id_proceso AND c.resultado = 'CONFIRMADA') AS confirmaron
     FROM proceso_liberacion p JOIN regla_liberacion rl ON rl.id_regla = p.id_regla
     WHERE p.id_proceso = $1 AND p.fecha_fin IS NULL`,
    [idProceso]
  );
  const p = r.rows[0];
  if (!p) return null;

  const suficientes = p.confirmaron >= p.min_confirmaciones;

  if (suficientes && p.estado !== 'EN_ESPERA') {
    await db.query("UPDATE proceso_liberacion SET estado = 'EN_ESPERA', fecha_espera = NOW() WHERE id_proceso = $1", [idProceso]);
    return 'EN_ESPERA';
  }
  if (!suficientes && p.estado !== 'EN_CONFIRMACION') {
    await db.query("UPDATE proceso_liberacion SET estado = 'EN_CONFIRMACION', fecha_espera = NULL WHERE id_proceso = $1", [idProceso]);
    return 'EN_CONFIRMACION';
  }
  return p.estado;
}

// ---------------------------------------------------------------
// HEREDERO: sus solicitudes
// ---------------------------------------------------------------

// Busca al heredero (por su correo) dentro de un proceso. Falla si no es él o el proceso no lo incluye.
async function buscarHeredero(db: Db, correo: string, idProceso: number, idBeneficiario: number) {
  const r = await db.query(
    `SELECT b.id_beneficiario, b.nombres, b.apellidos, b.dni, b.id_usuario_propietario,
            p.estado AS estado_proceso, p.fecha_fin
     FROM beneficiario b
     JOIN proceso_liberacion p ON p.id_usuario_propietario = b.id_usuario_propietario
     WHERE b.id_beneficiario = $1 AND p.id_proceso = $2 AND LOWER(b.correo) = $3
       AND b.estado = 'ACTIVO' AND b.correo_verificado = TRUE
       AND EXISTS (SELECT 1 FROM confirmacion_beneficiario c WHERE c.id_proceso = p.id_proceso AND c.id_beneficiario = b.id_beneficiario)`,
    [idBeneficiario, idProceso, correo]
  );
  if (r.rows.length === 0) throw new ReglaLiberacion('Solicitud no encontrada', 404);
  return r.rows[0];
}

// El heredero solo puede actuar mientras el proceso sigue abierto y antes de que pase a la espera final
function exigirProcesoAbierto(heredero: any) {
  if (heredero.fecha_fin !== null || !['DETECTADO', 'EN_CONFIRMACION', 'EN_ESPERA'].includes(heredero.estado_proceso)) {
    throw new ReglaLiberacion('Esta solicitud ya terminó', 409);
  }
}

export async function solicitudesDelHeredero(correo: string) {
  const r = await pool.query(
    `SELECT p.id_proceso AS "idProceso", b.id_beneficiario AS "idBeneficiario", p.estado, p.fecha_fin AS "fechaFin",
            u.nombres || ' ' || u.apellidos AS benefactor,
            rl.min_confirmaciones AS "minConfirmaciones", rl.dias_periodo_espera AS "diasEspera", p.fecha_espera AS "fechaEspera",
            COALESCE(v.dni_validado, FALSE) AS "dniValidado",
            (v.selfie_cifrada IS NOT NULL) AS "selfieTomada",
            EXISTS (SELECT 1 FROM confirmacion_beneficiario c
                    WHERE c.id_proceso = p.id_proceso AND c.id_beneficiario = b.id_beneficiario AND c.resultado = 'CONFIRMADA') AS confirmado,
            EXISTS (SELECT 1 FROM objecion o
                    WHERE o.id_proceso = p.id_proceso AND o.id_beneficiario = b.id_beneficiario AND o.estado = 'ABIERTA') AS objetado,
            (SELECT COUNT(DISTINCT c4.id_beneficiario)::int FROM confirmacion_beneficiario c4
              WHERE c4.id_proceso = p.id_proceso AND c4.resultado = 'CONFIRMADA') AS confirmaron,
            (SELECT COUNT(DISTINCT c2.id_activo)::int FROM confirmacion_beneficiario c2
              WHERE c2.id_proceso = p.id_proceso AND c2.id_beneficiario = b.id_beneficiario) AS activos
     FROM beneficiario b
     JOIN usuario u ON u.id_usuario = b.id_usuario_propietario
     JOIN proceso_liberacion p ON p.id_usuario_propietario = b.id_usuario_propietario
     JOIN regla_liberacion rl ON rl.id_regla = p.id_regla
     LEFT JOIN verificacion_beneficiario v ON v.id_proceso = p.id_proceso AND v.id_beneficiario = b.id_beneficiario
     WHERE LOWER(b.correo) = $1 AND b.estado = 'ACTIVO' AND b.correo_verificado = TRUE
       AND p.estado <> 'CANCELADO'
       AND EXISTS (SELECT 1 FROM confirmacion_beneficiario c3 WHERE c3.id_proceso = p.id_proceso AND c3.id_beneficiario = b.id_beneficiario)
     ORDER BY p.fecha_inicio DESC`,
    [correo]
  );

  // Si el legado ya se liberó, el heredero ve qué recibe
  const solicitudes = [];
  for (const s of r.rows) {
    let entregas: any[] = [];
    if (s.estado === 'LIBERADO') {
      const e = await pool.query(
        `SELECT a.nombre AS activo, t.nombre AS tipo, a.indicaciones_cifradas, en.estado, ef.nombre AS banco, dt.ultimos4
         FROM entrega en
         JOIN activo_digital a ON a.id_activo = en.id_activo
         JOIN tipo_activo t ON t.id_tipo = a.id_tipo
         LEFT JOIN entidad_financiera ef ON ef.id_entidad = a.id_entidad
         LEFT JOIN detalle_tarjeta dt ON dt.id_activo = a.id_activo
         WHERE en.id_proceso = $1 AND en.id_beneficiario = $2 ORDER BY a.nombre`,
        [s.idProceso, s.idBeneficiario]
      );
      // Solo se muestran las indicaciones de los activos ya autorizados; están cifradas en la base
      entregas = e.rows.map(x => ({
        activo: x.activo, tipo: x.tipo, estado: x.estado,
        detalle: x.estado === 'AUTORIZADA'
          ? [x.banco, x.ultimos4 ? `tarjeta terminada en ${x.ultimos4}` : null].filter(Boolean).join(' · ') || null
          : null,
        indicaciones: x.estado === 'AUTORIZADA' && x.indicaciones_cifradas ? descifrar(x.indicaciones_cifradas) : null
      }));
      await pool.query(
        "UPDATE entrega SET fecha_acceso = NOW() WHERE id_proceso = $1 AND id_beneficiario = $2 AND estado = 'AUTORIZADA' AND fecha_acceso IS NULL",
        [s.idProceso, s.idBeneficiario]
      );
    }
    solicitudes.push({ ...s, entregas });
  }
  return solicitudes;
}

// Paso 2: el heredero escribe su DNI y se compara con el que registró el propietario
export async function validarDni(correo: string, idProceso: number, idBeneficiario: number, dni: string) {
  const h = await buscarHeredero(pool, correo, idProceso, idBeneficiario);
  exigirProcesoAbierto(h);

  if (h.dni !== dni) throw new ReglaLiberacion('El DNI no coincide con el registrado', 400);

  await pool.query(
    `INSERT INTO verificacion_beneficiario (id_proceso, id_beneficiario, dni_validado, fecha_dni) VALUES ($1, $2, TRUE, NOW())
     ON CONFLICT (id_proceso, id_beneficiario) DO UPDATE SET dni_validado = TRUE, fecha_dni = NOW()`,
    [idProceso, idBeneficiario]
  );
  return { nombre: `${h.nombres} ${h.apellidos}`, dni: `****${h.dni.slice(-4)}` };
}

// Paso 3: la selfie se guarda cifrada como evidencia. No se compara automáticamente con el DNI.
export async function guardarSelfie(correo: string, idProceso: number, idBeneficiario: number, imagen: string) {
  const h = await buscarHeredero(pool, correo, idProceso, idBeneficiario);
  exigirProcesoAbierto(h);

  if (!imagen.startsWith('data:image/jpeg;base64,') || imagen.length > TAMANO_MAXIMO_SELFIE) {
    throw new ReglaLiberacion('La foto debe ser una imagen JPEG pequeña', 400);
  }

  const v = await pool.query('SELECT dni_validado FROM verificacion_beneficiario WHERE id_proceso = $1 AND id_beneficiario = $2', [idProceso, idBeneficiario]);
  if (!v.rows[0]?.dni_validado) throw new ReglaLiberacion('Primero valida tu DNI', 409);

  await pool.query(
    'UPDATE verificacion_beneficiario SET selfie_cifrada = $3, fecha_selfie = NOW() WHERE id_proceso = $1 AND id_beneficiario = $2',
    [idProceso, idBeneficiario, cifrar(imagen)]
  );
}

// Confirmar participación: exige haber pasado los 3 pasos
export async function confirmarParticipacion(correo: string, idProceso: number, idBeneficiario: number) {
  const h = await buscarHeredero(pool, correo, idProceso, idBeneficiario);
  exigirProcesoAbierto(h);

  const v = await pool.query(
    'SELECT dni_validado, selfie_cifrada IS NOT NULL AS selfie FROM verificacion_beneficiario WHERE id_proceso = $1 AND id_beneficiario = $2',
    [idProceso, idBeneficiario]
  );
  if (!v.rows[0]?.dni_validado || !v.rows[0]?.selfie) throw new ReglaLiberacion('Completa las tres verificaciones primero', 409);

  const abierta = await pool.query("SELECT 1 FROM objecion WHERE id_proceso = $1 AND id_beneficiario = $2 AND estado = 'ABIERTA'", [idProceso, idBeneficiario]);
  if (abierta.rows.length > 0) throw new ReglaLiberacion('Tienes una objeción abierta en este proceso', 409);

  const cliente = await pool.connect();
  let estado: string | null = null;
  try {
    await cliente.query('BEGIN');
    await cliente.query(
      `UPDATE confirmacion_beneficiario SET resultado = 'CONFIRMADA', fecha = NOW()
       WHERE id_proceso = $1 AND id_beneficiario = $2`,
      [idProceso, idBeneficiario]
    );
    await cliente.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion)
       VALUES (NULL, 'CONFIRMAR_PARTICIPACION', 'proceso_liberacion', $1, $2)`,
      [idProceso, `${h.nombres} ${h.apellidos} confirmó su participación`]
    );
    estado = await reevaluarProceso(cliente, idProceso);
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  // Si con esta confirmación empezó la espera final, se avisa al propietario
  if (estado === 'EN_ESPERA') {
    const dueno = await pool.query('SELECT id_usuario, nombres, correo FROM usuario WHERE id_usuario = $1', [h.id_usuario_propietario]);
    const d = dueno.rows[0];
    if (d) {
      await notificar(
        { idUsuario: d.id_usuario, correo: d.correo },
        idProceso,
        'LegadoSeguro: comenzó la espera final de tu legado',
        `Hola ${d.nombres}, tus herederos confirmaron y empezó el período de espera final. ` +
          'Si estás bien, inicia sesión y cancela el proceso antes de que termine.'
      );
    }
  }
  return { estadoProceso: estado };
}

export async function presentarObjecion(correo: string, idProceso: number, idBeneficiario: number, motivo: string) {
  const h = await buscarHeredero(pool, correo, idProceso, idBeneficiario);
  exigirProcesoAbierto(h);

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query(
      "INSERT INTO objecion (id_proceso, id_beneficiario, motivo, estado) VALUES ($1, $2, $3, 'ABIERTA')",
      [idProceso, idBeneficiario, motivo]
    );
    // Una objeción le quita valor a su confirmación
    await cliente.query(
      "UPDATE confirmacion_beneficiario SET resultado = 'OBJETADA', fecha = NOW() WHERE id_proceso = $1 AND id_beneficiario = $2",
      [idProceso, idBeneficiario]
    );
    await cliente.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion)
       VALUES (NULL, 'PRESENTAR_OBJECION', 'proceso_liberacion', $1, $2)`,
      [idProceso, `${h.nombres} ${h.apellidos} presentó una objeción`]
    );
    await reevaluarProceso(cliente, idProceso);
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  const dueno = await pool.query('SELECT id_usuario, nombres, correo FROM usuario WHERE id_usuario = $1', [h.id_usuario_propietario]);
  const d = dueno.rows[0];
  if (d) {
    await notificar(
      { idUsuario: d.id_usuario, correo: d.correo },
      idProceso,
      'LegadoSeguro: un heredero presentó una objeción',
      `Hola ${d.nombres}, ${h.nombres} ${h.apellidos} presentó una objeción en el proceso de liberación de tu legado. Revísala en Procesos.`
    );
  }
}

// ---------------------------------------------------------------
// PROPIETARIO: resolver una objeción
// ---------------------------------------------------------------

export async function resolverObjecion(idProceso: number, idObjecion: number, idUsuario: number): Promise<boolean> {
  const r = await pool.query(
    `UPDATE objecion o SET estado = 'RESUELTA', fecha_resolucion = NOW()
     FROM proceso_liberacion p
     WHERE o.id_objecion = $1 AND o.id_proceso = $2 AND p.id_proceso = o.id_proceso
       AND p.id_usuario_propietario = $3 AND o.estado = 'ABIERTA'
     RETURNING o.id_objecion`,
    [idObjecion, idProceso, idUsuario]
  );
  if (r.rows.length === 0) return false;

  await pool.query(
    `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion)
     VALUES ($1, 'RESOLVER_OBJECION', 'objecion', $2, 'El propietario marcó la objeción como resuelta')`,
    [idUsuario, idObjecion]
  );
  return true;
}

// ---------------------------------------------------------------
// MOTOR: libera los procesos cuya espera final ya terminó
// ---------------------------------------------------------------

export async function liberarProcesosListos(): Promise<number> {
  const listos = await pool.query(
    `SELECT p.id_proceso FROM proceso_liberacion p
     JOIN regla_liberacion r ON r.id_regla = p.id_regla
     WHERE p.estado = 'EN_ESPERA' AND p.fecha_fin IS NULL
       AND p.fecha_espera + make_interval(days => r.dias_periodo_espera) <= NOW()
       AND NOT EXISTS (SELECT 1 FROM objecion o WHERE o.id_proceso = p.id_proceso AND o.estado = 'ABIERTA')`
  );

  for (const fila of listos.rows) {
    await liberar(fila.id_proceso);
  }
  return listos.rows.length;
}

async function liberar(idProceso: number): Promise<void> {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const proceso = await cliente.query(
      `UPDATE proceso_liberacion SET estado = 'LIBERADO', fecha_fin = NOW()
       WHERE id_proceso = $1 AND estado = 'EN_ESPERA' RETURNING id_usuario_propietario, id_regla`,
      [idProceso]
    );
    if (proceso.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return;
    }

    const regla = await cliente.query('SELECT requiere_validador FROM regla_liberacion WHERE id_regla = $1', [proceso.rows[0].id_regla]);
    const requiereValidador = regla.rows[0]?.requiere_validador === true;

    // Cada activo se entrega a los herederos que lo confirmaron
    const confirmadas = await cliente.query(
      `SELECT DISTINCT c.id_activo, c.id_beneficiario, t.categoria_sensibilidad AS sensibilidad
       FROM confirmacion_beneficiario c
       JOIN activo_digital a ON a.id_activo = c.id_activo
       JOIN tipo_activo t ON t.id_tipo = a.id_tipo
       WHERE c.id_proceso = $1 AND c.resultado = 'CONFIRMADA'`,
      [idProceso]
    );

    for (const c of confirmadas.rows) {
      // Los activos financieros esperan al validador externo si la regla lo exige
      const estado = requiereValidador && c.sensibilidad === 'FINANCIERA' ? 'PENDIENTE_VALIDADOR' : 'AUTORIZADA';
      const token = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(token).digest('hex');

      await cliente.query(
        'INSERT INTO entrega (id_proceso, id_activo, id_beneficiario, token_acceso_hash, estado) VALUES ($1, $2, $3, $4, $5)',
        [idProceso, c.id_activo, c.id_beneficiario, hash, estado]
      );
      await cliente.query("UPDATE proceso_activo SET estado = 'LIBERADO' WHERE id_proceso = $1 AND id_activo = $2", [idProceso, c.id_activo]);
    }

    await cliente.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion)
       VALUES ($1, 'LIBERAR_PROCESO', 'proceso_liberacion', $2, $3)`,
      [proceso.rows[0].id_usuario_propietario, idProceso, `Terminó la espera final: ${confirmadas.rows.length} entrega(s) autorizadas`]
    );

    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  // Después de guardar todo, se avisa a los herederos que recibieron algo
  const herederos = await pool.query(
    `SELECT DISTINCT b.id_beneficiario, b.nombres, b.correo
     FROM entrega e JOIN beneficiario b ON b.id_beneficiario = e.id_beneficiario
     WHERE e.id_proceso = $1`,
    [idProceso]
  );
  for (const h of herederos.rows) {
    await notificar(
      { idBeneficiario: h.id_beneficiario, correo: h.correo },
      idProceso,
      'LegadoSeguro: el legado fue liberado',
      `Hola ${h.nombres}, terminó el período de espera y se liberó el legado. Entra a tu espacio de heredero para ver lo que recibes.`
    );
  }
}
