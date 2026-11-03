import { Router } from 'express';
import {
  obtenerBeneficiarios, registrarBeneficiario, editarBeneficiario, borrarBeneficiario, pedirCodigo
} from '../controllers/beneficiario.controller';
import { limitarPorMinuto } from '../middlewares/limite.middleware';

const router = Router();

router.get('/', obtenerBeneficiarios);       // GET /api/beneficiarios
router.post('/codigo', limitarPorMinuto(5), pedirCodigo); // POST /api/beneficiarios/codigo (envía el código al correo del heredero)
router.post('/', registrarBeneficiario);     // POST /api/beneficiarios
router.put('/:id', editarBeneficiario);      // PUT /api/beneficiarios/:id
router.delete('/:id', borrarBeneficiario);   // DELETE /api/beneficiarios/:id (queda INACTIVO)

export default router;
