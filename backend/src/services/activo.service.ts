// Servicio: activos digitales con su tipo, banco, monto (opcional) y herederos asignados.
// Todo se filtra por el usuario con sesión. "Eliminar" un activo lo marca INACTIVO para no romper
// el historial de los procesos de liberación.

import { PoolClient } from 'pg';
import { pool } from '../config/database';
import { Activo, DatosActivo, MontoHistorico, NuevoActivo } from '../models/activo.model';
import { cifrar, descifrar } from '../utils/cifrado';

type Db = Pick<PoolClient, 'query'>;

// Errores de regla de negocio: el controlador los convierte en respuestas 400, 404 o 409
export class ReglaActivo extends Error {
  constructor(mensaje: string, public estado: number) {
    super(mensaje);
  }
}

// Lo que se guarda en la base va cifrado. Si el activo no lleva monto (o ahorro), no se guarda nada.
function cifrarMonto(datos: DatosActivo): string | null {
  return datos.registrar_monto && datos.monto !== null ? cifrar(String(datos.monto)) : null;
}

function cifrarAhorro(datos: DatosActivo): string | null {
  return datos.registrar_monto && datos.ahorro ? cifrar(JSON.stringify(datos.ahorro)) : null;
}

export async function listarActivos(idUsuario: number): Promise<Activo[]> {
  const resultado = await pool.query(
    `SELECT a.id_activo AS id, a.nombre, a.descripcion,
            a.id_tipo AS "idTipo", t.nombre AS tipo, t.categoria_sensibilidad AS sensibilidad, a.estado,
            a.id_entidad AS "idEntidad", e.nombre AS entidad,
            a.registrar_monto AS "registrarMonto", a.moneda, a.monto::float8 AS monto_plano, a.monto_cifrado, a.ahorro_cifrado,
            COALESCE((
              SELECT json_agg(json_build_object('id', b.id_beneficiario, 'nombre', b.nombres || ' ' || b.apellidos)
                              ORDER BY ab.prioridad)
              FROM activo_beneficiario ab
              JOIN beneficiario b ON b.id_beneficiario = ab.id_beneficiario
              WHERE ab.id_activo = a.id_activo AND ab.estado = 'ACTIVO' AND b.estado = 'ACTIVO'
            ), '[]') AS herederos
     FROM activo_digital a
     JOIN tipo_activo t ON t.id_tipo = a.id_tipo
     LEFT JOIN entidad_financiera e ON e.id_entidad = a.id_entidad
     WHERE a.id_usuario = $1 AND a.estado = 'ACTIVO'
     ORDER BY a.id_activo`,
    [idUsuario]
  );

  // Descripción, monto y datos de ahorro están cifrados en la base: aquí se leen en claro
  return resultado.rows.map(fila => {
    const { monto_plano, monto_cifrado, ahorro_cifrado, ...resto } = fila;
    const montoTexto = monto_cifrado ? descifrar(monto_cifrado) : null;
    const ahorroTexto = ahorro_cifrado ? descifrar(ahorro_cifrado) : null;
    return {
      ...resto,
      descripcion: descifrar(fila.descripcion),
      monto: montoTexto !== null ? Number(montoTexto) : monto_plano,
      ahorro: ahorroTexto ? JSON.parse(ahorroTexto) : null
    } as Activo;
  });
}

// Reglas que dependen de la base: el tipo existe, el banco es válido si se pide, el monto va con moneda
async function validarContraBase(db: Db, datos: DatosActivo, idUsuario: number): Promise<void> {
  const tipo = await db.query('SELECT requiere_entidad FROM tipo_activo WHERE id_tipo = $1', [datos.id_tipo]);
  if (tipo.rows.length === 0) throw new ReglaActivo('El tipo de activo no existe', 400);

  if (tipo.rows[0].requiere_entidad && datos.id_entidad === null) {
    throw new ReglaActivo('Elige el banco de la cuenta', 400);
  }
  if (datos.id_entidad !== null) {
    const banco = await db.query(
      `SELECT 1 FROM entidad_financiera
       WHERE id_entidad = $1 AND estado = 'ACTIVO' AND (id_usuario_creador IS NULL OR id_usuario_creador = $2)`,
      [datos.id_entidad, idUsuario]
    );
    if (banco.rows.length === 0) throw new ReglaActivo('El banco elegido no existe', 400);
  }
}

// Devuelve los ids que NO son herederos activos del usuario (para rechazar asignaciones ajenas)
async function idsNoPropios(db: Db, ids: number[], idUsuario: number): Promise<number[]> {
  if (ids.length === 0) return [];
  const propios = await db.query(
    `SELECT id_beneficiario FROM beneficiario
     WHERE id_usuario_propietario = $1 AND estado = 'ACTIVO' AND id_beneficiario = ANY($2::int[])`,
    [idUsuario, ids]
  );
  const validos = new Set(propios.rows.map(r => r.id_beneficiario));
  return ids.filter(id => !validos.has(id));
}

// Reemplaza los herederos de un activo por la lista recibida (el orden marca la prioridad)
async function guardarAsignacion(db: Db, idActivo: number, ids: number[]): Promise<void> {
  await db.query('DELETE FROM activo_beneficiario WHERE id_activo = $1', [idActivo]);
  for (let i = 0; i < ids.length; i++) {
    await db.query(
      'INSERT INTO activo_beneficiario (id_activo, id_beneficiario, prioridad) VALUES ($1, $2, $3)',
      [idActivo, ids[i], i + 1]
    );
  }
}

async function anotarMonto(db: Db, idActivo: number, monto: number, moneda: string, idUsuario: number, ip: string | null) {
  await db.query(
    `INSERT INTO historial_monto (id_activo, monto_cifrado, moneda, id_usuario, ip_origen) VALUES ($1, $2, $3, $4, $5)`,
    [idActivo, cifrar(String(monto)), moneda, idUsuario, ip]
  );
}

export async function crearActivo(datos: NuevoActivo, idUsuario: number, ip: string | null): Promise<number> {
  const ids = [...new Set(datos.beneficiarios)];
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    await validarContraBase(cliente, datos, idUsuario);
    if ((await idsNoPropios(cliente, ids, idUsuario)).length > 0) {
      throw new ReglaActivo('Alguno de los herederos no existe', 400);
    }

    const resultado = await cliente.query(
      `INSERT INTO activo_digital (id_usuario, id_tipo, nombre, descripcion, id_entidad, registrar_monto, moneda, monto_cifrado, ahorro_cifrado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id_activo AS id`,
      [idUsuario, datos.id_tipo, datos.nombre, cifrar(datos.descripcion), datos.id_entidad,
       datos.registrar_monto, datos.moneda, cifrarMonto(datos), cifrarAhorro(datos)]
    );
    const id = resultado.rows[0].id;
    await guardarAsignacion(cliente, id, ids);

    if (datos.registrar_monto) {
      await anotarMonto(cliente, id, datos.monto!, datos.moneda!, idUsuario, ip);
    }

    await cliente.query('COMMIT');
    return id;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

// Edita un activo. Si el monto o la moneda cambian, queda una fila nueva en el historial.
// Si se apaga "registrar monto", se borra el monto y su historial (la persona decidió no dejar evidencia).
export async function actualizarActivo(id: number, datos: DatosActivo, idUsuario: number, ip: string | null): Promise<void> {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const actual = await cliente.query(
      `SELECT registrar_monto, moneda, monto::float8 AS monto_plano, monto_cifrado FROM activo_digital
       WHERE id_activo = $1 AND id_usuario = $2 AND estado = 'ACTIVO' FOR UPDATE`,
      [id, idUsuario]
    );
    if (actual.rows.length === 0) throw new ReglaActivo('Activo no encontrado', 404);

    await validarContraBase(cliente, datos, idUsuario);

    await cliente.query(
      `UPDATE activo_digital
       SET id_tipo = $1, nombre = $2, descripcion = $3, id_entidad = $4,
           registrar_monto = $5, moneda = $6, monto = NULL, monto_cifrado = $7, ahorro_cifrado = $8
       WHERE id_activo = $9`,
      [datos.id_tipo, datos.nombre, cifrar(datos.descripcion), datos.id_entidad,
       datos.registrar_monto, datos.moneda, cifrarMonto(datos), cifrarAhorro(datos), id]
    );

    if (datos.registrar_monto) {
      const previo = actual.rows[0];
      const montoPrevio = previo.monto_cifrado ? Number(descifrar(previo.monto_cifrado)) : previo.monto_plano;
      const cambio = !previo.registrar_monto || montoPrevio !== datos.monto || previo.moneda !== datos.moneda;
      if (cambio) await anotarMonto(cliente, id, datos.monto!, datos.moneda!, idUsuario, ip);
    } else {
      await cliente.query('DELETE FROM historial_monto WHERE id_activo = $1', [id]);
    }

    await cliente.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion, ip_origen)
       VALUES ($1, 'EDITAR_ACTIVO', 'activo_digital', $2, $3, $4)`,
      [idUsuario, id, `Activo editado: ${datos.nombre}`, ip]
    );

    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

// "Elimina" el activo (queda INACTIVO). No se puede si forma parte de un proceso de liberación abierto.
export async function eliminarActivo(id: number, idUsuario: number, ip: string | null): Promise<void> {
  const enProceso = await pool.query(
    `SELECT 1 FROM proceso_activo pa
     JOIN proceso_liberacion p ON p.id_proceso = pa.id_proceso
     WHERE pa.id_activo = $1 AND p.fecha_fin IS NULL`,
    [id]
  );
  if (enProceso.rows.length > 0) {
    throw new ReglaActivo('El activo está en un proceso de liberación abierto. Cancela el proceso primero.', 409);
  }

  const resultado = await pool.query(
    `UPDATE activo_digital SET estado = 'INACTIVO'
     WHERE id_activo = $1 AND id_usuario = $2 AND estado = 'ACTIVO'
     RETURNING nombre`,
    [id, idUsuario]
  );
  if (resultado.rows.length === 0) throw new ReglaActivo('Activo no encontrado', 404);

  await pool.query(
    `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion, ip_origen)
     VALUES ($1, 'ELIMINAR_ACTIVO', 'activo_digital', $2, $3, $4)`,
    [idUsuario, id, `Activo eliminado: ${resultado.rows[0].nombre}`, ip]
  );
}

// Cambia los herederos de un activo. Devuelve false si el activo no existe o no es del usuario.
export async function asignarHerederos(idActivo: number, beneficiarios: number[], idUsuario: number): Promise<boolean> {
  const ids = [...new Set(beneficiarios)];
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const activo = await cliente.query(
      "SELECT 1 FROM activo_digital WHERE id_activo = $1 AND id_usuario = $2 AND estado = 'ACTIVO'",
      [idActivo, idUsuario]
    );
    if (activo.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return false;
    }

    if ((await idsNoPropios(cliente, ids, idUsuario)).length > 0) {
      throw new ReglaActivo('Alguno de los herederos no existe', 400);
    }

    await guardarAsignacion(cliente, idActivo, ids);

    await cliente.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion)
       VALUES ($1, 'ASIGNAR_HEREDEROS', 'activo_digital', $2, $3)`,
      [idUsuario, idActivo, `Herederos asignados al activo: ${ids.length}`]
    );

    await cliente.query('COMMIT');
    return true;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

// Historial de montos de un activo (del más reciente al más antiguo). null si el activo no es del usuario.
export async function historialDeMontos(idActivo: number, idUsuario: number): Promise<MontoHistorico[] | null> {
  const activo = await pool.query(
    'SELECT 1 FROM activo_digital WHERE id_activo = $1 AND id_usuario = $2',
    [idActivo, idUsuario]
  );
  if (activo.rows.length === 0) return null;

  const resultado = await pool.query(
    `SELECT h.fecha, h.monto::float8 AS monto_plano, h.monto_cifrado, h.moneda,
            COALESCE(u.nombres || ' ' || u.apellidos, 'Sistema') AS usuario
     FROM historial_monto h
     LEFT JOIN usuario u ON u.id_usuario = h.id_usuario
     WHERE h.id_activo = $1
     ORDER BY h.fecha DESC, h.id_historial DESC`,
    [idActivo]
  );
  return resultado.rows.map(fila => ({
    fecha: fila.fecha,
    monto: fila.monto_cifrado ? Number(descifrar(fila.monto_cifrado)) : fila.monto_plano,
    moneda: fila.moneda,
    usuario: fila.usuario
  })) as MontoHistorico[];
}
