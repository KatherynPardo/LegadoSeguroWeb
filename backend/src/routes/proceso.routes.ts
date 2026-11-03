import { Router } from 'express';
import { cancelar, obtenerProcesos, verProceso, resolverObjecionDelProceso } from '../controllers/proceso.controller';

const router = Router();

router.get('/', obtenerProcesos);          // GET  /api/procesos
router.get('/:id', verProceso);            // GET  /api/procesos/5
router.post('/:id/cancelar', cancelar);    // POST /api/procesos/5/cancelar
router.post('/:id/objeciones/:idObjecion/resolver', resolverObjecionDelProceso); // POST /api/procesos/5/objeciones/2/resolver

export default router;
