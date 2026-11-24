import { Router } from 'express';
import { respuestaPago } from '../controllers/suscripcion.controller';
import { limitarPorMinuto } from '../middlewares/limite.middleware';

const router = Router();

// Pública: el formulario de Niubiz envía aquí al navegador, sin sesión
router.post('/respuesta', limitarPorMinuto(10), respuestaPago); // POST /api/pago/respuesta?pedido=N

export default router;
