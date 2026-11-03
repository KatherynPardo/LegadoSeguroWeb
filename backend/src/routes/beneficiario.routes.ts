import { Router } from 'express';
import {
  obtenerBeneficiarios, registrarBeneficiario, editarBeneficiario, borrarBeneficiario
} from '../controllers/beneficiario.controller';

const router = Router();

router.get('/', obtenerBeneficiarios);       // GET /api/beneficiarios
router.post('/', registrarBeneficiario);     // POST /api/beneficiarios
router.put('/:id', editarBeneficiario);      // PUT /api/beneficiarios/:id
router.delete('/:id', borrarBeneficiario);   // DELETE /api/beneficiarios/:id (queda INACTIVO)

export default router;
