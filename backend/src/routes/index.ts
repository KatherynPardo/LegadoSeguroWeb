// Agrupa todas las rutas de la API bajo el prefijo /api (ver app.ts).

import { Router } from 'express';
import saludRoutes from './salud.routes';
import beneficiarioRoutes from './beneficiario.routes';
import activoRoutes from './activo.routes';

const router = Router();

router.use('/salud', saludRoutes);
router.use('/beneficiarios', beneficiarioRoutes);
router.use('/activos', activoRoutes);

export default router;
