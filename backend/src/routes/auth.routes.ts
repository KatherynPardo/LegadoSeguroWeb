import { Router } from 'express';
import { login, registro, verificarCorreo, reenviarCodigo } from '../controllers/auth.controller';
import { buscarPorDni } from '../controllers/reniec.controller';
import { limitarPorMinuto } from '../middlewares/limite.middleware';

const router = Router();

router.post('/login', login); // POST /api/auth/login
router.post('/registro', limitarPorMinuto(10), registro); // POST /api/auth/registro
router.post('/verificar-correo', limitarPorMinuto(10), verificarCorreo); // POST /api/auth/verificar-correo
router.post('/reenviar-codigo', limitarPorMinuto(5), reenviarCodigo); // POST /api/auth/reenviar-codigo
router.get('/dni/:dni', limitarPorMinuto(10), buscarPorDni); // GET /api/auth/dni/12345678 (público, para el registro)

export default router;
