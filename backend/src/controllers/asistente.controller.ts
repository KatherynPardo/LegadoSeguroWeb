// Controlador del asistente virtual (rutas públicas, con límite de pedidos por minuto).

import { Request, Response } from 'express';
import { buscar, listarTemas, PREGUNTA_MAX, PREGUNTA_MIN, temaPorId } from '../services/asistente.service';

// GET /api/asistente/temas
export async function verTemas(_req: Request, res: Response) {
  try {
    res.json(await listarTemas());
  } catch (error) {
    console.error('Error al listar los temas del asistente:', error);
    res.status(500).json({ mensaje: 'Error al obtener los temas' });
  }
}

// POST /api/asistente/preguntar  con { pregunta } o con { idTema } (al elegir un tema sugerido)
export async function preguntar(req: Request, res: Response) {
  const { pregunta, idTema } = req.body ?? {};

  try {
    if (idTema !== undefined) {
      const tema = Number.isInteger(idTema) ? await temaPorId(idTema) : null;
      if (!tema) {
        res.status(404).json({ mensaje: 'No encontramos ese tema' });
        return;
      }
      res.json({ respuesta: tema, relacionados: [], temas: [] });
      return;
    }

    const texto = typeof pregunta === 'string' ? pregunta.trim() : '';
    if (texto.length < PREGUNTA_MIN || texto.length > PREGUNTA_MAX) {
      res.status(400).json({ mensaje: `Escribe tu pregunta (entre ${PREGUNTA_MIN} y ${PREGUNTA_MAX} caracteres)` });
      return;
    }

    const { respuesta, relacionados } = await buscar(texto);
    // Sin coincidencia no se inventa nada: se ofrecen los temas disponibles
    res.json({ respuesta, relacionados, temas: respuesta ? [] : await listarTemas() });
  } catch (error) {
    console.error('Error en el asistente virtual:', error);
    res.status(500).json({ mensaje: 'Error al responder tu pregunta' });
  }
}
