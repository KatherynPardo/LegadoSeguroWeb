// Genera el diccionario de datos y la lista de relaciones LEYENDO LA BASE DE DATOS REAL.
// Así la documentación nunca se desactualiza: si cambia una tabla, se vuelve a ejecutar y listo.
//
//   npm run diccionario
//
// Escribe el resultado en DOCUMENTACION_SISTEMA.md, entre las marcas
//   <!-- DICCIONARIO:INICIO -->  y  <!-- DICCIONARIO:FIN -->

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { pool } from '../config/database';

const ARCHIVO = path.resolve(__dirname, '../../../DOCUMENTACION_SISTEMA.md');

// Qué guarda cada tabla (el texto no sale de la base: lo escribimos nosotros)
const TABLAS: Record<string, string> = {
  rol: 'Perfiles del sistema: administrador, propietario y beneficiario.',
  usuario: 'Cuentas de quienes ingresan al sistema (propietarios y administradores).',
  token_recuperacion: 'Reservada para enlaces de recuperación; hoy la recuperación usa codigo_verificacion.',
  actividad_usuario: 'Cada ingreso o registro de un usuario, con la IP. El monitoreo de inactividad lee esta tabla.',
  auditoria: 'Registro de acciones importantes: quién, qué, cuándo y desde qué IP.',
  codigo_verificacion: 'Códigos de 6 dígitos enviados por correo (registro, herederos, recuperación y portal).',
  tipo_activo: 'Tipos de activo digital y su sensibilidad (BAJA o FINANCIERA).',
  activo_digital: 'Cada activo digital del propietario: cuenta, correo, red social, cuenta bancaria, etc.',
  beneficiario: 'Herederos designados por cada propietario.',
  activo_beneficiario: 'Qué heredero recibe cada activo y con qué prioridad (relación muchos a muchos).',
  validador_externo: 'Persona de confianza que aprueba la liberación de activos financieros.',
  entidad_financiera: 'Catálogo de bancos; los de fábrica son de todos y los creados por un usuario, solo suyos.',
  historial_monto: 'Cada cambio de monto de un activo, con fecha, usuario e IP.',
  regla_liberacion: 'Cuándo y cómo se libera el legado: días de inactividad, confirmaciones y espera.',
  reporte_fallecimiento: 'Aviso de fallecimiento hecho por un beneficiario (segundo disparador del proceso).',
  proceso_liberacion: 'Cada proceso de entrega del legado, desde que se detecta hasta que termina.',
  proceso_activo: 'Activos que entran a un proceso de liberación.',
  confirmacion_beneficiario: 'Respuesta de cada heredero a la solicitud de confirmación de un proceso.',
  validacion_externa: 'Resultado de la validación del validador externo en un proceso.',
  objecion: 'Objeciones presentadas durante un proceso (por un heredero o por el propietario).',
  entrega: 'Entrega de cada activo a su heredero, con el acceso autorizado.',
  guia_legal: 'Textos de orientación legal para guiar a los herederos.',
  orientacion_legal_generada: 'Qué guía legal se entregó por cada activo en un proceso.',
  notificacion: 'Mensajes enviados a propietarios o herederos durante un proceso.',
  plan: 'Planes de suscripción (Básico gratuito y Premium) y su límite de herederos.',
  suscripcion: 'Plan que tiene o tuvo cada usuario.',
  pago: 'Pagos de las suscripciones (se llenará al conectar Culqi).',
  requisito_documental: 'Catálogo de documentos que debe reunir un heredero (lo mantiene el administrador).',
  documento_heredero: 'Checklist de cada heredero: qué documento, en qué estado y dónde está el original.'
};

// Descripciones por nombre de campo (valen para cualquier tabla). Las llaves se explican solas.
const CAMPOS: Record<string, string> = {
  nombre: 'Nombre.', nombres: 'Nombres de la persona.', apellidos: 'Apellidos de la persona.',
  descripcion: 'Texto descriptivo (en activo_digital va cifrado).', estado: 'Estado del registro (por ejemplo ACTIVO o INACTIVO).',
  dni: 'Documento de identidad (8 dígitos).', correo: 'Correo electrónico.', telefono: 'Teléfono de contacto (9 dígitos).',
  password_hash: 'Contraseña cifrada con bcrypt (nunca en texto plano).', clave_acceso_hash: 'Ya no se usa: el heredero entra con códigos por correo.',
  fecha_registro: 'Fecha y hora de creación.', fecha: 'Fecha y hora del hecho.', fecha_actividad: 'Fecha y hora del evento.',
  fecha_creacion: 'Fecha y hora de creación.', fecha_expiracion: 'Fecha y hora en que vence.', fecha_inicio: 'Fecha y hora de inicio.',
  fecha_fin: 'Fecha y hora de fin (vacío = sigue abierto).', fecha_pago: 'Fecha y hora del pago.', fecha_envio: 'Fecha y hora de envío.',
  fecha_entrega: 'Fecha y hora en que se marcó como entregado.', fecha_generacion: 'Fecha y hora de generación.',
  fecha_reporte: 'Fecha y hora del reporte.', fecha_revision: 'Fecha y hora de la revisión.', fecha_resolucion: 'Fecha y hora de resolución.',
  fecha_autorizacion: 'Fecha y hora en que se autorizó el acceso.', fecha_acceso: 'Fecha y hora del primer acceso.',
  fecha_actualizacion: 'Fecha y hora de la última actualización.',
  ip_origen: 'Dirección IP desde la que se hizo la acción.', ip_registro: 'Dirección IP desde la que se creó la cuenta.',
  tipo_evento: 'Tipo de evento (INICIO_SESION, REGISTRO...).', accion: 'Acción realizada.', entidad: 'Tabla o entidad afectada.',
  proposito: 'Para qué es el código (REGISTRO, HEREDERO, RECUPERACION o PORTAL).', destino: 'Correo al que se envió el código.',
  codigo_hash: 'Código de 6 dígitos cifrado.', intentos: 'Intentos fallidos (máximo 5).', usado: 'Si ya se usó o se reemplazó.',
  token_hash: 'Token cifrado.', token_acceso_hash: 'Token de acceso cifrado.', categoria_sensibilidad: 'BAJA o FINANCIERA.',
  requiere_entidad: 'Si el tipo de activo exige elegir un banco.', ubicacion_referencia: 'Referencia de dónde está el activo.',
  moneda: 'PEN (soles) o USD (dólares).', monto: 'Monto sin cifrar (queda vacío: el monto va en monto_cifrado).',
  monto_cifrado: 'Monto cifrado con AES-256.', registrar_monto: 'Si el usuario decidió registrar el monto del activo.',
  parentesco: 'Relación con el propietario.', correo_verificado: 'Si el heredero confirmó su correo con un código.',
  prioridad: 'Orden de prioridad del heredero en el activo.', dias_inactividad: 'Días sin actividad antes de iniciar el proceso (7 a 3650).',
  min_confirmaciones: 'Herederos que deben confirmar como mínimo.', dias_periodo_espera: 'Días de espera final antes de liberar.',
  requiere_validador: 'Si se exige validador externo para activos financieros.', motivo: 'Motivo o razón.',
  resultado: 'Resultado de la acción.', observacion: 'Observación.', documentacion_adjunta: 'Referencia a la documentación presentada.',
  canal: 'Canal de envío (correo, SMS, llamada...).', asunto: 'Asunto del mensaje.', mensaje: 'Contenido del mensaje.',
  tema: 'Tema de la guía.', contenido: 'Texto completo.', version: 'Número de versión.', entidad_referencial: 'Entidad a la que acudir.',
  tipo: 'Tipo (FREE o PREMIUM en los planes).', precio: 'Precio mensual en soles.', limite_herederos: 'Máximo de herederos del plan (vacío = ilimitado).',
  referencia_pago_externa: 'Código de operación de la pasarela de pago (Culqi).', obligatorio: 'Si el documento se asigna a todos los herederos.',
  ubicacion: 'Dónde está el original del documento (nota del propietario).'
};

type Columna = { tabla: string; columna: string; tipo: string; nulo: string; defecto: string | null; identidad: string };

function formatearTipo(c: any): string {
  const t: Record<string, string> = {
    int4: 'INT', int8: 'BIGINT', varchar: 'VARCHAR', text: 'TEXT', bool: 'BOOLEAN',
    timestamptz: 'TIMESTAMPTZ', numeric: 'NUMERIC', date: 'DATE'
  };
  const base = t[c.udt_name] ?? c.udt_name.toUpperCase();
  if (c.udt_name === 'varchar' && c.character_maximum_length) return `${base}(${c.character_maximum_length})`;
  if (c.udt_name === 'numeric' && c.numeric_precision) return `${base}(${c.numeric_precision},${c.numeric_scale})`;
  return base;
}

async function main() {
  const columnas = await pool.query(
    `SELECT table_name, column_name, udt_name, character_maximum_length, numeric_precision, numeric_scale,
            is_nullable, column_default, is_identity
     FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`
  );

  const restricciones = await pool.query(
    `SELECT c.conrelid::regclass::text AS tabla, c.contype AS tipo, c.conname AS nombre,
            array(SELECT a.attname::text FROM unnest(c.conkey) k JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k) AS columnas,
            c.confrelid::regclass::text AS tabla_ref,
            array(SELECT a.attname::text FROM unnest(c.confkey) k JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k) AS columnas_ref,
            pg_get_constraintdef(c.oid) AS definicion
     FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace
     WHERE n.nspname = 'public' AND c.contype IN ('p', 'f', 'u', 'c') ORDER BY 1, 2, 3`
  );

  const indicesUnicos = await pool.query(
    `SELECT tablename AS tabla, indexdef FROM pg_indexes
     WHERE schemaname = 'public' AND indexdef LIKE 'CREATE UNIQUE INDEX%' AND indexname NOT LIKE '%_pkey'
       AND indexname NOT IN (SELECT conname FROM pg_constraint)`
  );

  const tablas = [...new Set(columnas.rows.map(c => c.table_name as string))];
  const claves = restricciones.rows.filter(r => r.tipo === 'p' || r.tipo === 'f');

  // ---- Diccionario ----
  let md = `**Generado automáticamente desde la base de datos el ${new Date().toLocaleDateString('es-PE')}** · ${tablas.length} tablas.\n\n`;

  for (const tabla of tablas) {
    md += `#### ${tabla}\n\n${TABLAS[tabla] ?? ''}\n\n`;
    md += '| Campo | Tipo | PK/FK | Restricción | Descripción |\n|---|---|---|---|---|\n';

    for (const c of columnas.rows.filter(x => x.table_name === tabla)) {
      const pk = restricciones.rows.find(r => r.tabla === tabla && r.tipo === 'p' && r.columnas.includes(c.column_name));
      const fk = restricciones.rows.find(r => r.tabla === tabla && r.tipo === 'f' && r.columnas.includes(c.column_name));
      const marca = [pk ? 'PK' : '', fk ? `FK → ${fk.tabla_ref}` : ''].filter(Boolean).join(', ') || '—';

      const reglas: string[] = [c.is_nullable === 'NO' ? 'NOT NULL' : 'Puede ser vacío'];
      if (c.is_identity === 'YES') reglas.push('Autonumérico');
      if (c.column_default && c.is_identity !== 'YES') reglas.push(`Por defecto ${c.column_default.replace(/::[a-z ]+/g, '').replace(/\|/g, '/')}`);
      for (const u of restricciones.rows.filter(r => r.tabla === tabla && r.tipo === 'u' && r.columnas.length === 1 && r.columnas[0] === c.column_name)) reglas.push('UNIQUE');
      for (const k of restricciones.rows.filter(r => r.tabla === tabla && r.tipo === 'c' && r.definicion.includes(c.column_name))) {
        reglas.push(k.definicion.replace('CHECK ', 'CHECK ').replace(/::[a-z ]+/g, '').replace(/\|/g, '/'));
      }

      let descripcion = CAMPOS[c.column_name] ?? '';
      if (pk && !fk) descripcion = 'Identificador único del registro.';
      if (fk) descripcion = `Referencia a ${fk.tabla_ref}.`;
      md += `| ${c.column_name} | ${formatearTipo(c)} | ${marca} | ${reglas.join('; ')} | ${descripcion || '—'} |\n`;
    }

    const compuestas = restricciones.rows.filter(r => r.tabla === tabla && r.tipo === 'u' && r.columnas.length > 1);
    const unicos = indicesUnicos.rows.filter(i => i.tabla === tabla);
    if (compuestas.length || unicos.length) {
      md += '\nValores únicos adicionales: ' +
        [...compuestas.map(r => `(${r.columnas.join(', ')})`), ...unicos.map(i => i.indexdef.replace(/^.*ON public\.[a-z_]+ USING btree /, ''))].join('; ') + '.\n';
    }
    md += '\n';
  }

  // ---- Relaciones ----
  md += '#### Relaciones entre tablas\n\nCada fila es una llave foránea. La cardinalidad se lee de la tabla padre (1) a la tabla hija (N).\n\n';
  md += '| Tabla padre (1) | Tabla hija (N) | Campo de la hija | Cardinalidad |\n|---|---|---|---|\n';
  for (const f of claves.filter(r => r.tipo === 'f')) {
    // Si la llave foránea es también la llave primaria completa de la hija, la relación es 1 a 1
    const pkHija = claves.find(r => r.tabla === f.tabla && r.tipo === 'p');
    const unoAUno = pkHija && pkHija.columnas.length === 1 && pkHija.columnas[0] === f.columnas[0];
    md += `| ${f.tabla_ref} | ${f.tabla} | ${f.columnas.join(', ')} | ${unoAUno ? '1 : 1' : '1 : N'} |\n`;
  }

  // ---- Se inserta en el documento ----
  const inicio = '<!-- DICCIONARIO:INICIO -->';
  const fin = '<!-- DICCIONARIO:FIN -->';
  const documento = readFileSync(ARCHIVO, 'utf8');
  const i = documento.indexOf(inicio);
  const j = documento.indexOf(fin);
  if (i < 0 || j < 0) throw new Error('Faltan las marcas del diccionario en DOCUMENTACION_SISTEMA.md');

  writeFileSync(ARCHIVO, documento.slice(0, i + inicio.length) + '\n\n' + md + '\n' + documento.slice(j));
  console.log(`Diccionario actualizado: ${tablas.length} tablas, ${claves.filter(r => r.tipo === 'f').length} relaciones.`);
  await pool.end();
}

main();
