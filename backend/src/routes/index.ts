// Agrupa todas las rutas de la API bajo el prefijo /api (ver app.ts).

import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware';
import saludRoutes from './salud.routes';
import authRoutes from './auth.routes';
import beneficiarioRoutes from './beneficiario.routes';
import activoRoutes from './activo.routes';
import dashboardRoutes from './dashboard.routes';
import tipoActivoRoutes from './tipo-activo.routes';
import perfilRoutes from './perfil.routes';
import reniecRoutes from './reniec.routes';

const router = Router();

// Rutas públicas
router.use('/salud', saludRoutes);
router.use('/auth', authRoutes);

// Rutas protegidas: hace falta haber iniciado sesión
router.use('/beneficiarios', verificarToken, beneficiarioRoutes);
router.use('/activos', verificarToken, activoRoutes);
router.use('/dashboard', verificarToken, dashboardRoutes);
router.use('/tipos-activo', verificarToken, tipoActivoRoutes);
router.use('/perfil', verificarToken, perfilRoutes);
router.use('/reniec', verificarToken, reniecRoutes);

export default router;
