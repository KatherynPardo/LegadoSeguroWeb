import { Router } from 'express';
import { obtenerDashboard } from '../controllers/dashboard.controller';

const router = Router();

router.get('/', obtenerDashboard); // GET /api/dashboard

export default router;
