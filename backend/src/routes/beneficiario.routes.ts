import { Router } from 'express';
import { obtenerBeneficiarios, registrarBeneficiario } from '../controllers/beneficiario.controller';

const router = Router();

router.get('/', obtenerBeneficiarios);     // GET /api/beneficiarios
router.post('/', registrarBeneficiario);   // POST /api/beneficiarios

export default router;
