// Asistente virtual de orientación: busca la pregunta del usuario en la guía del sistema (tabla guia_legal) con la
// búsqueda de texto completo de PostgreSQL en español. No guarda las preguntas ni usa servicios externos.

import { pool } from '../config/database';

export type Tema = { id: number; tema: string };
export type Respuesta = Tema & { contenido: string };

export const PREGUNTA_MIN = 3;
export const PREGUNTA_MAX = 300;

// Palabras de las preguntas que no ayudan a encontrar un tema (ya sin tildes)
const COMUNES = new Set([
  'como', 'cual', 'cuales', 'cuando', 'donde', 'que', 'quien', 'puedo', 'puede', 'pueden', 'hacer', 'tengo', 'quiero',
  'para', 'por', 'una', 'uno', 'unos', 'unas', 'los', 'las', 'del', 'mis', 'sus', 'con', 'sin', 'hay', 'esta', 'este',
  'eso', 'esto', 'sobre', 'tiene', 'tienen', 'seria', 'debo', 'necesito', 'sera', 'cada', 'mas', 'muy', 'pero'
]);

// Misma transformación que se aplica en SQL: minúsculas y sin tildes (la ñ se conserva)
function sinTildes(texto: string): string {
  return texto.toLowerCase().replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u');
}

export async function listarTemas(): Promise<Tema[]> {
  const r = await pool.query('SELECT id_guia AS id, tema FROM guia_legal ORDER BY id_guia');
  return r.rows;
}

export async function temaPorId(id: number): Promise<Respuesta | null> {
  const r = await pool.query('SELECT id_guia AS id, tema, contenido FROM guia_legal WHERE id_guia = $1', [id]);
  return r.rows[0] ?? null;
}

// Devuelve el tema más parecido a la pregunta y hasta dos temas relacionados. Si ninguno coincide, respuesta es null.
export async function buscar(pregunta: string): Promise<{ respuesta: Respuesta | null; relacionados: Tema[] }> {
  const palabras = (sinTildes(pregunta).match(/[\p{L}\p{N}]{3,}/gu) ?? [])
    .filter(p => !COMUNES.has(p))
    .slice(0, 12);
  if (palabras.length === 0) return { respuesta: null, relacionados: [] };

  // Las palabras solo tienen letras y números, así que se pueden unir con "|" (cualquiera de ellas sirve)
  const r = await pool.query(
    `SELECT id_guia AS id, tema, contenido
     FROM (
       SELECT g.id_guia, g.tema, g.contenido,
              setweight(to_tsvector('spanish', translate(lower(g.tema), 'áéíóúü', 'aeiouu')), 'A') ||
              setweight(to_tsvector('spanish', translate(lower(COALESCE(g.palabras_clave, '')), 'áéíóúü', 'aeiouu')), 'B') ||
              setweight(to_tsvector('spanish', translate(lower(g.contenido), 'áéíóúü', 'aeiouu')), 'C') AS vector
       FROM guia_legal g
     ) t
     WHERE vector @@ to_tsquery('spanish', $1)
     ORDER BY ts_rank_cd(vector, to_tsquery('spanish', $1)) DESC, id_guia
     LIMIT 3`,
    [palabras.join(' | ')]
  );

  const [primero, ...resto] = r.rows as Respuesta[];
  return {
    respuesta: primero ?? null,
    relacionados: resto.map(({ id, tema }) => ({ id, tema }))
  };
}
