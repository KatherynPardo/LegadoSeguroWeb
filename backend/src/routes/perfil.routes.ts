import { Router } from 'express';
import { editarPassword, editarPerfil, verPerfil } from '../controllers/perfil.controller';

const router = Router();

router.get('/', verPerfil);                // GET /api/perfil
router.put('/', editarPerfil);             // PUT /api/perfil
router.put('/password', editarPassword);   // PUT /api/perfil/password

export default router;
