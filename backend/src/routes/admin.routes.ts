import { Router } from 'express';
import { actualizarEstado, obtenerUsuarios } from '../controllers/admin.controller';

const router = Router();

router.get('/usuarios', obtenerUsuarios); // GET /api/admin/usuarios
router.patch('/usuarios/:id/estado', actualizarEstado); // PATCH /api/admin/usuarios/:id/estado

export default router;
