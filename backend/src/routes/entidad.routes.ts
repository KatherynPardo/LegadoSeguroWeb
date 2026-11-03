import { Router } from 'express';
import { obtenerEntidades, registrarEntidad } from '../controllers/entidad.controller';

const router = Router();

router.get('/', obtenerEntidades);    // GET /api/entidades
router.post('/', registrarEntidad);   // POST /api/entidades

export default router;
