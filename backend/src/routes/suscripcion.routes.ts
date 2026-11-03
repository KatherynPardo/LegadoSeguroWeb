import { Router } from 'express';
import { elegirPlan, verSuscripcion } from '../controllers/suscripcion.controller';

const router = Router();

router.get('/', verSuscripcion);   // GET /api/suscripcion
router.post('/plan', elegirPlan);  // POST /api/suscripcion/plan

export default router;
