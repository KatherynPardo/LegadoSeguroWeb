// Planes y suscripción del usuario. Si no tiene ninguna suscripción activa, está en el plan Gratuito.

import { pool } from '../config/database';
import { API_PUBLIC_URL, FRONTEND_URL } from '../config/env';
import { autorizar, buscarCodigo, crearSesion, merchantId, modoPruebas, niubizActivo, urlScriptNiubiz } from './niubiz.service';

// Cuántos herederos permite el plan actual del usuario (null = sin límite)
export async function limiteDeHerederos(idUsuario: number): Promise<number | null> {
  const plan = await pool.query(
    `SELECT p.limite_herederos AS limite
     FROM suscripcion s JOIN plan p ON p.id_plan = s.id_plan
     WHERE s.id_usuario = $1 AND s.estado = 'ACTIVA'
     ORDER BY s.fecha_inicio DESC LIMIT 1`,
    [idUsuario]
  );
  if (plan.rows.length > 0) return plan.rows[0].limite;

  // Sin suscripción registrada = plan gratuito
  const gratuito = await pool.query("SELECT limite_herederos AS limite FROM plan WHERE tipo = 'FREE' AND estado = 'ACTIVO' LIMIT 1");
  return gratuito.rows[0]?.limite ?? null;
}

// Planes disponibles (los ve cualquiera, también en la página de inicio)
export async function listarPlanes() {
  const planes = await pool.query(
    `SELECT id_plan AS id, nombre, tipo, precio::float8 AS precio, descripcion,
            limite_herederos AS "limiteHerederos"
     FROM plan WHERE estado = 'ACTIVO' ORDER BY precio`
  );
  return planes.rows;
}

export async function obtenerSuscripcion(idUsuario: number) {
  const planes = await listarPlanes();

  const actual = await pool.query(
    `SELECT s.id_suscripcion AS id, s.id_plan AS "idPlan", s.fecha_inicio AS desde
     FROM suscripcion s
     WHERE s.id_usuario = $1 AND s.estado = 'ACTIVA'
     ORDER BY s.fecha_inicio DESC LIMIT 1`,
    [idUsuario]
  );

  // Sin suscripción registrada = plan gratuito
  const gratuito = planes.find(p => p.tipo === 'FREE');
  const idPlanActual = actual.rows[0]?.idPlan ?? gratuito?.id ?? null;

  const uso = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM activo_digital WHERE id_usuario = $1 AND estado = 'ACTIVO') AS activos,
       (SELECT COUNT(*)::int FROM beneficiario WHERE id_usuario_propietario = $1 AND estado = 'ACTIVO') AS beneficiarios`,
    [idUsuario]
  );

  const pagos = await pool.query(
    `SELECT p.fecha_pago AS fecha, p.monto::float8 AS monto, p.estado, pl.nombre AS plan, p.numero_pedido AS "numeroPedido",
            CASE WHEN p.serie IS NULL THEN NULL ELSE p.serie || '-' || LPAD(p.numero_comprobante::text, 8, '0') END AS comprobante
     FROM pago p
     JOIN suscripcion s ON s.id_suscripcion = p.id_suscripcion
     JOIN plan pl ON pl.id_plan = s.id_plan
     WHERE s.id_usuario = $1 AND p.estado NOT IN ('PENDIENTE', 'PROCESANDO')
     ORDER BY p.fecha_pago DESC`,
    [idUsuario]
  );

  return {
    idPlanActual,
    desde: actual.rows[0]?.desde ?? null,
    limiteHerederos: await limiteDeHerederos(idUsuario),
    planes,
    uso: uso.rows[0],
    pagos: pagos.rows
  };
}

// Cambia al plan indicado. Solo sirve para volver al gratuito: los planes de pago se activan al cobrar (iniciarPago).
export async function cambiarPlan(idPlan: number, idUsuario: number, ip: string | null): Promise<string | null> {
  const plan = await pool.query(
    "SELECT id_plan, nombre, precio::float8 AS precio FROM plan WHERE id_plan = $1 AND estado = 'ACTIVO'",
    [idPlan]
  );
  if (plan.rows.length === 0) return 'El plan no existe';
  if (plan.rows[0].precio > 0) return 'Este plan se activa pagando con tarjeta';

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query(
      "UPDATE suscripcion SET estado = 'CANCELADA', fecha_fin = NOW() WHERE id_usuario = $1 AND estado = 'ACTIVA'",
      [idUsuario]
    );
    const nueva = await cliente.query(
      'INSERT INTO suscripcion (id_usuario, id_plan) VALUES ($1, $2) RETURNING id_suscripcion',
      [idUsuario, idPlan]
    );
    await cliente.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion, ip_origen)
       VALUES ($1, 'CAMBIAR_PLAN', 'suscripcion', $2, $3, $4)`,
      [idUsuario, nueva.rows[0].id_suscripcion, `Plan cambiado a ${plan.rows[0].nombre}`, ip]
    );
    await cliente.query('COMMIT');
    return null;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

// ---------- Cobro de un plan de pago con Niubiz ----------

// Versión de los términos y condiciones que se muestran antes de pagar (la misma que muestra el frontend)
export const VERSION_TERMINOS = '1.0';

// Errores de regla de negocio: el controlador los convierte en 400, 404, 409 o 502
export class ReglaPago extends Error {
  constructor(mensaje: string, public estado: number) {
    super(mensaje);
  }
}

// Si Niubiz devuelve un código que no está en su tabla (anexo b), se usa este mensaje
const MENSAJE_DENEGADO = 'Operación denegada. Contacta con la entidad emisora de tu tarjeta.';

// Prepara el pago: crea la sesión en Niubiz y deja anotado un pago pendiente con su número de pedido.
// El monto sale siempre de la tabla plan, nunca del navegador.
export type DatosComprobante = { tipo: 'BOLETA' | 'FACTURA'; ruc?: string; razonSocial?: string };

// Valida lo que el usuario indica para su comprobante: boleta (con su DNI) o factura (con RUC y razón social)
export function validarComprobante(entrada: unknown): DatosComprobante {
  const c = (entrada ?? {}) as Record<string, unknown>;
  if (c.tipo !== 'FACTURA') return { tipo: 'BOLETA' };
  const ruc = String(c.ruc ?? '').trim();
  const razonSocial = String(c.razonSocial ?? '').trim().replace(/\s+/g, ' ');
  if (!/^(10|15|17|20)\d{9}$/.test(ruc)) throw new ReglaPago('El RUC debe tener 11 dígitos y empezar con 10 o 20', 400);
  if (razonSocial.length < 3 || razonSocial.length > 150) throw new ReglaPago('Escribe la razón social (entre 3 y 150 caracteres)', 400);
  return { tipo: 'FACTURA', ruc, razonSocial };
}

export async function iniciarPago(idPlan: number, idUsuario: number, ip: string | null, comprobante: DatosComprobante = { tipo: 'BOLETA' }) {
  if (!niubizActivo()) throw new ReglaPago('El pago con tarjeta todavía no está configurado', 409);

  const plan = await pool.query(
    "SELECT precio::float8 AS precio FROM plan WHERE id_plan = $1 AND estado = 'ACTIVO'",
    [idPlan]
  );
  if (plan.rows.length === 0) throw new ReglaPago('El plan no existe', 404);
  const monto: number = plan.rows[0].precio;
  if (monto <= 0) throw new ReglaPago('Este plan no requiere pago', 400);

  const yaLoTiene = await pool.query(
    "SELECT 1 FROM suscripcion WHERE id_usuario = $1 AND id_plan = $2 AND estado = 'ACTIVA'",
    [idUsuario, idPlan]
  );
  if (yaLoTiene.rows.length > 0) throw new ReglaPago('Ya tienes este plan', 409);

  let sessionKey: string;
  try {
    sessionKey = await crearSesion(monto, ip);
  } catch (error) {
    console.error('Niubiz: no se pudo crear la sesión de pago:', error);
    throw new ReglaPago('No se pudo iniciar el pago. Inténtalo más tarde', 502);
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    // Un intento anterior que no terminó ya no sirve
    await cliente.query(
      `UPDATE pago SET estado = 'EXPIRADO'
       WHERE estado = 'PENDIENTE' AND id_suscripcion IN
         (SELECT id_suscripcion FROM suscripcion WHERE id_usuario = $1 AND estado = 'PENDIENTE')`,
      [idUsuario]
    );
    await cliente.query(
      "UPDATE suscripcion SET estado = 'CANCELADA', fecha_fin = NOW() WHERE id_usuario = $1 AND estado = 'PENDIENTE'",
      [idUsuario]
    );
    const suscripcion = await cliente.query(
      "INSERT INTO suscripcion (id_usuario, id_plan, estado) VALUES ($1, $2, 'PENDIENTE') RETURNING id_suscripcion",
      [idUsuario, idPlan]
    );
    const pago = await cliente.query(
      `INSERT INTO pago (id_suscripcion, monto, estado, numero_pedido, tipo_comprobante, ruc_cliente, razon_social)
       VALUES ($1, $2, 'PENDIENTE', nextval('seq_numero_pedido'), $3, $4, $5) RETURNING id_pago, numero_pedido`,
      [suscripcion.rows[0].id_suscripcion, monto, comprobante.tipo, comprobante.ruc ?? null, comprobante.razonSocial ?? null]
    );
    // Queda constancia de que aceptó los términos y condiciones antes de pagar, con su versión y su IP
    await cliente.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion, ip_origen)
       VALUES ($1, 'ACEPTAR_TERMINOS', 'pago', $2, $3, $4)`,
      [idUsuario, pago.rows[0].id_pago, `Aceptó los términos y condiciones (versión ${VERSION_TERMINOS}) antes de pagar el pedido ${pago.rows[0].numero_pedido}`, ip]
    );
    const usuario = await cliente.query('SELECT correo FROM usuario WHERE id_usuario = $1', [idUsuario]);
    await cliente.query('COMMIT');

    const numeroPedido: number = pago.rows[0].numero_pedido;
    return {
      sessionKey,
      merchantId,
      numeroPedido,
      monto,
      // En el ambiente de pruebas no se envía el correo: así el formulario lo pide y el tester elige el escenario
      correo: modoPruebas ? null : usuario.rows[0].correo as string,
      pruebas: modoPruebas,
      urlScript: urlScriptNiubiz,
      urlRespuesta: `${API_PUBLIC_URL}/api/pago/respuesta?pedido=${numeroPedido}`,
      urlVencido: `${FRONTEND_URL}/suscripcion`
    };
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

// Recibe el resultado del formulario de Niubiz: pide la autorización y, solo si fue aprobada (código 000) y por el
// monto esperado, activa el plan. Cada pedido se procesa una sola vez; si no se puede confirmar queda en REVISAR.
export async function confirmarPago(numeroPedido: number, tokenTransaccion: string, ip: string | null): Promise<void> {
  // Toma el pedido: un reintento o un doble envío ya no lo encuentra pendiente y no cobra dos veces
  const tomado = await pool.query(
    `UPDATE pago SET estado = 'PROCESANDO'
     WHERE numero_pedido = $1 AND estado = 'PENDIENTE'
     RETURNING id_pago, id_suscripcion, monto::float8 AS monto`,
    [numeroPedido]
  );
  if (tomado.rows.length === 0) return;
  const { id_pago: idPago, id_suscripcion: idSuscripcion, monto } = tomado.rows[0];

  const revisar = (motivo: string, resultado?: { codigoAccion: string; idTransaccion: string | null }) =>
    pool.query(
      "UPDATE pago SET estado = 'REVISAR', descripcion_accion = $2, codigo_accion = $3, id_transaccion = $4 WHERE id_pago = $1",
      [idPago, motivo, resultado?.codigoAccion ?? null, resultado?.idTransaccion ?? null]
    );

  let r;
  try {
    r = await autorizar(tokenTransaccion, numeroPedido, monto);
  } catch (error) {
    console.error(`Niubiz: no se pudo confirmar el pedido ${numeroPedido}:`, error);
    await revisar('No se pudo confirmar el resultado con Niubiz');
    return;
  }

  if (!r.aprobado) {
    // Observado = frenado por el antifraude o por la autenticación; denegado = rechazado por el banco u otro motivo
    const estadoFinal = buscarCodigo(r.codigoAccion)?.observada ? 'OBSERVADO' : 'DENEGADO';
    await pool.query(
      `UPDATE pago SET estado = $5, codigo_accion = $2, descripcion_accion = $3, tarjeta_enmascarada = $4,
              marca = $6, id_transaccion = $7, fecha_transaccion = COALESCE($8, NOW())
       WHERE id_pago = $1`,
      [idPago, r.codigoAccion, r.descripcion.slice(0, 200), r.tarjeta, estadoFinal, r.marca, r.idTransaccion, r.fechaTransaccion]
    );
    await pool.query("UPDATE suscripcion SET estado = 'CANCELADA', fecha_fin = NOW() WHERE id_suscripcion = $1", [idSuscripcion]);
    return;
  }

  if (r.montoAutorizado !== null && Math.abs(r.montoAutorizado - monto) > 0.001) {
    await revisar('El monto autorizado no coincide con el precio del plan', r);
    return;
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const datos = await cliente.query(
      `SELECT s.id_usuario, p.nombre FROM suscripcion s JOIN plan p ON p.id_plan = s.id_plan
       WHERE s.id_suscripcion = $1`,
      [idSuscripcion]
    );
    const { id_usuario: idUsuario, nombre } = datos.rows[0];
    await cliente.query(
      "UPDATE suscripcion SET estado = 'CANCELADA', fecha_fin = NOW() WHERE id_usuario = $1 AND estado = 'ACTIVA'",
      [idUsuario]
    );
    await cliente.query(
      "UPDATE suscripcion SET estado = 'ACTIVA', fecha_inicio = NOW() WHERE id_suscripcion = $1",
      [idSuscripcion]
    );
    // Correlativo del comprobante sin saltos: se toma dentro de esta misma transacción; si se revierte, el número no se pierde
    const tipo = await cliente.query('SELECT tipo_comprobante FROM pago WHERE id_pago = $1', [idPago]);
    const serie = tipo.rows[0].tipo_comprobante === 'FACTURA' ? 'F001' : 'B001';
    const correlativo = await cliente.query('UPDATE comprobante_serie SET ultimo = ultimo + 1 WHERE serie = $1 RETURNING ultimo', [serie]);
    await cliente.query(
      `UPDATE pago SET estado = 'COMPLETADO', fecha_pago = NOW(), id_transaccion = $2, tarjeta_enmascarada = $3,
              codigo_accion = $4, descripcion_accion = $5, referencia_pago_externa = $2,
              codigo_autorizacion = $6, eci = $7, marca = $8, fecha_transaccion = COALESCE($9, NOW()),
              serie = $10, numero_comprobante = $11
       WHERE id_pago = $1`,
      [idPago, r.idTransaccion, r.tarjeta, r.codigoAccion, r.descripcion.slice(0, 200), r.codigoAutorizacion, r.eci, r.marca, r.fechaTransaccion, serie, correlativo.rows[0].ultimo]
    );
    await cliente.query(
      `INSERT INTO auditoria (id_usuario, accion, entidad, id_entidad, descripcion, ip_origen)
       VALUES ($1, 'PAGO_PLAN', 'pago', $2, $3, $4)`,
      [idUsuario, idPago, `Pago del plan ${nombre} (pedido ${numeroPedido})`, ip]
    );
    await cliente.query('COMMIT');
  } catch (error) {
    // Niubiz ya cobró pero no se pudo activar el plan: queda marcado para revisarlo a mano
    await cliente.query('ROLLBACK');
    console.error(`Pedido ${numeroPedido} cobrado en Niubiz pero no activado:`, error);
    await revisar('Cobrado en Niubiz pero no se activó el plan', r);
  } finally {
    cliente.release();
  }
}

// Todo lo que se sabe de un pago del usuario (sirve para el detalle en pantalla y para el comprobante)
export async function datosDelPago(numeroPedido: number, idUsuario: number) {
  const r = await pool.query(
    `SELECT p.estado, p.codigo_accion AS codigo, p.descripcion_accion AS "descripcionNiubiz", p.monto::float8 AS monto,
            p.fecha_pago AS fecha, p.fecha_transaccion AS "fechaTransaccion", p.tarjeta_enmascarada AS tarjeta, p.marca,
            p.codigo_autorizacion AS "codigoAutorizacion", p.eci, p.id_transaccion AS "idTransaccion",
            p.tipo_comprobante AS "tipoComprobante", p.serie, p.numero_comprobante AS "numeroComprobante",
            p.ruc_cliente AS ruc, p.razon_social AS "razonSocial",
            pl.nombre AS plan, u.nombres, u.apellidos, u.dni, u.correo
     FROM pago p
     JOIN suscripcion s ON s.id_suscripcion = p.id_suscripcion
     JOIN plan pl ON pl.id_plan = s.id_plan
     JOIN usuario u ON u.id_usuario = s.id_usuario
     WHERE p.numero_pedido = $1 AND s.id_usuario = $2`,
    [numeroPedido, idUsuario]
  );
  if (r.rows.length === 0) throw new ReglaPago('No encontramos ese pago', 404);
  return r.rows[0];
}

// Resultado de un pago para mostrárselo a su dueño al volver de Niubiz
export async function verPago(numeroPedido: number, idUsuario: number) {
  const d = await datosDelPago(numeroPedido, idUsuario);
  const { estado, codigo, plan } = d;
  const mensajes: Record<string, string> = {
    COMPLETADO: `Pago aprobado. Ya tienes el plan ${plan}.`,
    DENEGADO: buscarCodigo(codigo)?.mensajeCliente ?? MENSAJE_DENEGADO,
    OBSERVADO: `Tu pago fue observado por el sistema de seguridad y no se cobró. Comunícate con soporte indicando el pedido ${numeroPedido}.`,
    PENDIENTE: 'No se completó el pago. Puedes intentarlo de nuevo.',
    PROCESANDO: 'Tu pago se está procesando. Actualiza esta página en unos segundos.',
    EXPIRADO: 'Este intento de pago venció. Puedes intentarlo de nuevo.',
    REVISAR: `No pudimos confirmar tu pago. Si te cobraron, comunícate con nosotros indicando el pedido ${numeroPedido}.`
  };
  const info = buscarCodigo(codigo);
  return {
    estado: estado as string,
    numeroPedido,
    mensaje: mensajes[estado] ?? mensajes['REVISAR'],
    plan: plan as string,
    monto: d.monto as number,
    // Lo que se registró en Niubiz: código y texto de la respuesta, para soporte y para el comprobante
    respuestaNiubiz: codigo ? { codigo: codigo as string, descripcion: (info?.apoyoComercio ?? d.descripcionNiubiz ?? '') as string, categoria: (info?.categoria ?? null) as string | null } : null,
    fecha: (d.fechaTransaccion ?? d.fecha) as Date,
    tarjeta: d.tarjeta as string | null,
    marca: d.marca as string | null,
    codigoAutorizacion: d.codigoAutorizacion as string | null,
    comprobante: d.serie ? { tipo: d.tipoComprobante as string, numero: `${d.serie}-${String(d.numeroComprobante).padStart(8, '0')}` } : null
  };
}
