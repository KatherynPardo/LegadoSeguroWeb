import { Router } from 'express';
import { configurarRegla, verRegla } from '../controllers/regla.controller';

const router = Router();

router.get('/', verRegla);          // GET /api/reglas
router.put('/', configurarRegla);   // PUT /api/reglas

export default router;
