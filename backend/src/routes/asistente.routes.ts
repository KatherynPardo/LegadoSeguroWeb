import { Router } from 'express';
import { preguntar, verTemas } from '../controllers/asistente.controller';
import { limitarPorMinuto } from '../middlewares/limite.middleware';

const router = Router();

// Públicas: el asistente también se usa antes de crear la cuenta
router.get('/temas', limitarPorMinuto(30), verTemas);            // GET /api/asistente/temas
router.post('/preguntar', limitarPorMinuto(10), preguntar);      // POST /api/asistente/preguntar

export default router;
