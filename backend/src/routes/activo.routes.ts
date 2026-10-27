import { Router } from 'express';
import { obtenerActivos } from '../controllers/activo.controller';

const router = Router();

router.get('/', obtenerActivos); // GET /api/activos

export default router;
