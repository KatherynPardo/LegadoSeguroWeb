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
import reglaRoutes from './regla.routes';
import procesoRoutes from './proceso.routes';
import adminRoutes from './admin.routes';
import entidadRoutes from './entidad.routes';
import historialRoutes from './historial.routes';
import suscripcionRoutes from './suscripcion.routes';
import reporteRoutes from './reporte.routes';
import portalRoutes from './portal.routes';
import { soloAdmin } from '../middlewares/admin.middleware';

const router = Router();

// Rutas públicas
router.use('/salud', saludRoutes);
router.use('/auth', authRoutes);
router.use('/portal', portalRoutes); // portal del heredero (tiene su propia sesión)

// Rutas protegidas: hace falta haber iniciado sesión
router.use('/beneficiarios', verificarToken, beneficiarioRoutes);
router.use('/activos', verificarToken, activoRoutes);
router.use('/dashboard', verificarToken, dashboardRoutes);
router.use('/tipos-activo', verificarToken, tipoActivoRoutes);
router.use('/perfil', verificarToken, perfilRoutes);
router.use('/reniec', verificarToken, reniecRoutes);
router.use('/reglas', verificarToken, reglaRoutes);
router.use('/procesos', verificarToken, procesoRoutes);
router.use('/entidades', verificarToken, entidadRoutes);
router.use('/historial', verificarToken, historialRoutes);
router.use('/suscripcion', verificarToken, suscripcionRoutes);
router.use('/reportes', verificarToken, reporteRoutes);

// Solo administradores
router.use('/admin', verificarToken, soloAdmin, adminRoutes);

export default router;
