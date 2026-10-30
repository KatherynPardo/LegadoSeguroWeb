import { Router } from 'express';
import { obtenerActivos, registrarActivo } from '../controllers/activo.controller';

const router = Router();

router.get('/', obtenerActivos);     // GET /api/activos
router.post('/', registrarActivo);   // POST /api/activos

export default router;
