import { Router } from 'express';
import {
  actualizarEstado, obtenerAuditoria, obtenerUsuarios, obtenerAlertas, ejecutarMonitoreoAhora, adelantarVencimiento
} from '../controllers/admin.controller';
import { obtenerCatalogo, registrarRequisito, modificarRequisito } from '../controllers/documento.controller';

const router = Router();

router.get('/usuarios', obtenerUsuarios); // GET /api/admin/usuarios
router.patch('/usuarios/:id/estado', actualizarEstado); // PATCH /api/admin/usuarios/:id/estado
router.get('/auditoria', obtenerAuditoria); // GET /api/admin/auditoria
router.get('/alertas', obtenerAlertas);                     // GET /api/admin/alertas
router.post('/monitoreo/ejecutar', ejecutarMonitoreoAhora); // POST /api/admin/monitoreo/ejecutar
router.post('/alertas/:id/adelantar', adelantarVencimiento); // POST /api/admin/alertas/:id/adelantar (solo pruebas)
router.get('/requisitos', obtenerCatalogo);      // GET /api/admin/requisitos
router.post('/requisitos', registrarRequisito);  // POST /api/admin/requisitos
router.put('/requisitos/:id', modificarRequisito); // PUT /api/admin/requisitos/:id

export default router;
