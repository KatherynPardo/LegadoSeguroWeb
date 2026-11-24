import { Router } from 'express';
import { buscarPorDni, buscarPorRuc } from '../controllers/reniec.controller';

const router = Router();

router.get('/dni/:dni', buscarPorDni); // GET /api/reniec/dni/12345678
router.get('/ruc/:ruc', buscarPorRuc); // GET /api/reniec/ruc/20516530767

export default router;
