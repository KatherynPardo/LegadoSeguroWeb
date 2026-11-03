import { Router } from 'express';
import {
  obtenerActivos, registrarActivo, editarActivo, borrarActivo, asignarBeneficiarios, obtenerHistorial
} from '../controllers/activo.controller';

const router = Router();

router.get('/', obtenerActivos);     // GET /api/activos
router.post('/', registrarActivo);   // POST /api/activos
router.put('/:id', editarActivo);    // PUT /api/activos/:id
router.delete('/:id', borrarActivo); // DELETE /api/activos/:id (queda INACTIVO)
router.put('/:id/beneficiarios', asignarBeneficiarios); // PUT /api/activos/:id/beneficiarios
router.get('/:id/historial', obtenerHistorial);         // GET /api/activos/:id/historial

export default router;
