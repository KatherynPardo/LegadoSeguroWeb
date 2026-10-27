import { Router } from 'express';
import { obtenerBeneficiarios } from '../controllers/beneficiario.controller';

const router = Router();

router.get('/', obtenerBeneficiarios); // GET /api/beneficiarios

export default router;
