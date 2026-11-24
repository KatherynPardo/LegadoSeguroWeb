import { Router } from 'express';
import { configurarRegla, verRegla, verSugerencia } from '../controllers/regla.controller';

const router = Router();

router.get('/', verRegla);                  // GET /api/reglas
router.get('/sugerencia', verSugerencia);   // GET /api/reglas/sugerencia
router.put('/', configurarRegla);   // PUT /api/reglas

export default router;
