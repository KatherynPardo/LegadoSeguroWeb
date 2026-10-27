import { Router } from 'express';
import { comprobarSalud } from '../controllers/salud.controller';

const router = Router();

router.get('/', comprobarSalud); // GET /api/salud

export default router;
