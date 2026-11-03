import { Router } from 'express';
import { obtenerHistorial } from '../controllers/historial.controller';

const router = Router();

router.get('/', obtenerHistorial); // GET /api/historial

export default router;
