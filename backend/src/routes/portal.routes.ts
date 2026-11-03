import { Router } from 'express';
import { pedirCodigoPortal, entrarPortal, verChecklist, marcar } from '../controllers/portal.controller';
import { verificarHeredero } from '../middlewares/portal.middleware';
import { limitarPorMinuto } from '../middlewares/limite.middleware';

const router = Router();

// Públicas: así entra el heredero
router.post('/codigo', limitarPorMinuto(5), pedirCodigoPortal); // POST /api/portal/codigo
router.post('/entrar', limitarPorMinuto(10), entrarPortal);     // POST /api/portal/entrar

// Con sesión de heredero
router.get('/checklist', verificarHeredero, verChecklist);      // GET /api/portal/checklist
router.patch('/documentos/:id', verificarHeredero, marcar);     // PATCH /api/portal/documentos/:id

export default router;
