import { Router } from 'express';
import { descargarComprobante, elegirPlan, iniciarPagoPlan, verResultadoPago, verSuscripcion } from '../controllers/suscripcion.controller';

const router = Router();

router.get('/', verSuscripcion);   // GET /api/suscripcion
router.post('/plan', elegirPlan);  // POST /api/suscripcion/plan
router.post('/pago/iniciar', iniciarPagoPlan);          // POST /api/suscripcion/pago/iniciar
router.get('/pago/:numeroPedido', verResultadoPago);    // GET /api/suscripcion/pago/:numeroPedido
router.get('/pago/:numeroPedido/comprobante', descargarComprobante);   // PDF de la boleta o factura

export default router;
