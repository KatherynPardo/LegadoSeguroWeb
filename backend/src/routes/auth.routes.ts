import { Router } from 'express';
import { login, registro } from '../controllers/auth.controller';
import { buscarPorDni } from '../controllers/reniec.controller';
import { limitarPorMinuto } from '../middlewares/limite.middleware';

const router = Router();

router.post('/login', login); // POST /api/auth/login
router.post('/registro', limitarPorMinuto(10), registro); // POST /api/auth/registro
router.get('/dni/:dni', limitarPorMinuto(10), buscarPorDni); // GET /api/auth/dni/12345678 (público, para el registro)

export default router;
