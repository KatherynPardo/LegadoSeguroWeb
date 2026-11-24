import { Router } from 'express';
import {
  pedirCodigoPortal, entrarPortal, verChecklist, marcar, avisarListos,
  verSolicitudes, paso2Dni, paso3Selfie, quitarFoto, confirmar, objetar
} from '../controllers/portal.controller';
import { verificarHeredero } from '../middlewares/portal.middleware';
import { limitarPorMinuto } from '../middlewares/limite.middleware';

const router = Router();

// Públicas: así entra el heredero
router.post('/codigo', limitarPorMinuto(5), pedirCodigoPortal); // POST /api/portal/codigo
router.post('/entrar', limitarPorMinuto(10), entrarPortal);     // POST /api/portal/entrar

// Con sesión de heredero
router.get('/checklist', verificarHeredero, verChecklist);      // GET /api/portal/checklist
router.patch('/documentos/:idBeneficiario/:idRequisito', verificarHeredero, marcar); // PATCH /api/portal/documentos/:idBeneficiario/:idRequisito

// Solicitudes de liberación: los tres pasos y la decisión del heredero
router.post('/documentos/:idBeneficiario/listos', verificarHeredero, limitarPorMinuto(5), avisarListos); // POST /api/portal/documentos/:idBeneficiario/listos
router.get('/solicitudes', verificarHeredero, verSolicitudes);                                          // GET /api/portal/solicitudes
router.post('/solicitudes/:idProceso/:idBeneficiario/dni', verificarHeredero, limitarPorMinuto(10), paso2Dni); // validar el DNI
router.post('/solicitudes/:idProceso/:idBeneficiario/selfie', verificarHeredero, paso3Selfie);          // enviar la selfie
router.delete('/solicitudes/:idProceso/:idBeneficiario/selfie', verificarHeredero, quitarFoto);          // eliminar la selfie y retirar el consentimiento
router.post('/solicitudes/:idProceso/:idBeneficiario/confirmar', verificarHeredero, confirmar);         // confirmar participación
router.post('/solicitudes/:idProceso/:idBeneficiario/objecion', verificarHeredero, objetar);            // presentar objeción

export default router;
