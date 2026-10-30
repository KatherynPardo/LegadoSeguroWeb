import { Router } from 'express';
import { buscarPorDni } from '../controllers/reniec.controller';

const router = Router();

router.get('/dni/:dni', buscarPorDni); // GET /api/reniec/dni/12345678

export default router;
