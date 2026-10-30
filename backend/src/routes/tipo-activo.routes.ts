import { Router } from 'express';
import { obtenerTipos } from '../controllers/tipo-activo.controller';

const router = Router();

router.get('/', obtenerTipos); // GET /api/tipos-activo

export default router;
