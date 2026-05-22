import { Router } from 'express';
import {
  crearPrescripcion,
  nuevaPrescripcionPorAlergia,
  getHistorialClinico,
  compararPrescripciones,
  getPrescripcionesActivas,
  getPrescripcionById,
  getCadenaPrescripciones,
  enviarPrescripcionEmail,
} from '../controllers/prescripcion.controller';
import { authenticate, authorizeRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { crearPrescripcionSchema, nuevaPrescripcionPorAlergiaSchema } from '../validations/prescripcion.validation';

const router = Router();

// Solo médicos pueden crear prescripciones
router.post(
  '/',
  authenticate,
  authorizeRole('medico'),
  validate(crearPrescripcionSchema),
  crearPrescripcion
);

// Flujo especial: nueva prescripción por alergia o cambio
router.post(
  '/alergia',
  authenticate,
  authorizeRole('medico'),
  validate(nuevaPrescripcionPorAlergiaSchema),
  nuevaPrescripcionPorAlergia
);

// Historial clínico de un paciente
router.get(
  '/historial/:pacienteId',
  authenticate,
  getHistorialClinico
);

// Comparar dos prescripciones (diff)
router.get(
  '/comparar/:id1/:id2',
  authenticate,
  compararPrescripciones
);

// Prescripciones activas de un paciente
router.get(
  '/activas/:pacienteId',
  authenticate,
  getPrescripcionesActivas
);

// Cadena de prescripciones vinculadas
router.get(
  '/cadena/:id',
  authenticate,
  getCadenaPrescripciones
);

// Obtener prescripción por ID
router.get(
  '/:id',
  authenticate,
  getPrescripcionById
);

// Enviar prescripción por email
router.post(
  '/:id/email',
  authenticate,
  enviarPrescripcionEmail
);

export default router;
