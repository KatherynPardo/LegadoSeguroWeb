import { Router } from 'express';
import { login, registro } from '../controllers/auth.controller';

const router = Router();

router.post('/login', login); // POST /api/auth/login
router.post('/registro', registro); // POST /api/auth/registro

export default router;
