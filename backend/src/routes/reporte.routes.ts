import { Router } from 'express';
import { verReporte } from '../controllers/reporte.controller';

const router = Router();

router.get('/', verReporte); // GET /api/reportes

export default router;
