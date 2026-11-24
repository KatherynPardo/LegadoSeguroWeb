import { Router } from 'express';
import { crearReclamo } from '../controllers/reclamo.controller';
import { limitarPorMinuto } from '../middlewares/limite.middleware';

const router = Router();

// Pública: cualquier consumidor puede presentar su hoja de reclamación
router.post('/', limitarPorMinuto(3), crearReclamo); // POST /api/reclamos

export default router;
