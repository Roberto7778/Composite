import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Prescripcion, { IPrescripcion } from '../models/Prescripcion';
import Medico from '../models/Medico';
import Paciente from '../models/Paciente';
import Usuario from '../models/Usuario';
import { EmailProviderFactory, PrescripcionNotificationService } from '../services/bridge';

/**
 * PATRÓN MEMENTO: Cada prescripción es un snapshot inmutable.
 * - No existe endpoint de actualización (PUT/PATCH)
 * - Solo se crean nuevas prescripciones
 * - Los cambios generan una nueva prescripción vinculada a la anterior
 * - Se puede comparar (diff) entre prescripciones vinculadas
 */

/**
 * PATRÓN BRIDGE: Envío de notificaciones de prescripciones por email.
 * - Abstracción: PrescripcionNotificationService
 * - Implementación: EmailProvider (Console, SMTP, SendGrid)
 * - Permite cambiar el proveedor de email sin modificar el código del controller
 */

// Helper function to send prescription email notification
const sendPrescripcionEmail = async (
  pacienteId: mongoose.Types.ObjectId,
  medicoId: mongoose.Types.ObjectId,
  prescripcion: any
): Promise<void> => {
  try {
    // Get patient's email
    const paciente = await Paciente.findById(pacienteId).populate('usuarioId');
    if (!paciente || !paciente.usuarioId) {
      console.log('No se encontró usuario del paciente para enviar email');
      return;
    }

    const usuario = await Usuario.findById(paciente.usuarioId);
    if (!usuario) {
      console.log('No se encontró usuario para enviar email');
      return;
    }

    // Get doctor's info
    const medico = await Medico.findById(medicoId);
    if (!medico) {
      console.log('No se encontró médico para enviar email');
      return;
    }

    // Create notification service using Bridge pattern
    const emailProvider = EmailProviderFactory.createEmailProvider();
    const notificationService = new PrescripcionNotificationService(emailProvider);

    // Send notification
    await notificationService.sendNotification(usuario.email, {
      pacienteNombre: paciente.nombre,
      pacienteEdad: paciente.edad,
      medicoNombre: medico.nombre,
      medicoEspecialidad: medico.especialidad,
      medicoCedula: medico.cedula,
      medicamento: prescripcion.medicamento,
      dosis: prescripcion.dosis,
      horario: prescripcion.horario,
      tiempoTratamiento: prescripcion.tiempoTratamiento,
      viaAdministracion: prescripcion.viaAdministracion,
      indicaciones: prescripcion.indicaciones,
      motivoCambio: prescripcion.motivoCambio,
      fechaCreacion: prescripcion.fechaCreacion,
      prescripcionId: prescripcion._id.toString(),
    });
  } catch (error) {
    console.error('Error enviando email de prescripción:', error);
    // Don't throw error to avoid breaking the prescription creation
  }
};

// Crear nueva prescripción (Memento snapshot #1)
export const crearPrescripcion = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const medico = await Medico.findOne({ usuarioId: req.user.userId });
    if (!medico) {
      res.status(404).json({ error: 'Médico no encontrado' });
      return;
    }

    const paciente = await Paciente.findById(req.body.pacienteId);
    if (!paciente) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }

    // Si hay prescripción anterior, desactivarla
    if (req.body.prescripcionAnteriorId) {
      const anterior = await Prescripcion.findById(req.body.prescripcionAnteriorId);
      if (anterior) {
        anterior.activa = false;
        await anterior.save();
      }
    }

    // Crear snapshot inmutable (Memento)
    const prescripcion = await Prescripcion.create({
      medicamento: req.body.medicamento,
      horario: req.body.horario,
      tiempoTratamiento: req.body.tiempoTratamiento,
      dosis: req.body.dosis,
      viaAdministracion: req.body.viaAdministracion,
      medicoId: medico._id,
      pacienteId: req.body.pacienteId,
      prescripcionAnteriorId: req.body.prescripcionAnteriorId || null,
      motivoCambio: req.body.motivoCambio || null,
      indicaciones: req.body.indicaciones || null,
      activa: true,
    });

    await prescripcion.populate('medicoId', 'nombre especialidad');

    res.status(201).json(prescripcion);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.message });
      return;
    }
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Nueva prescripción por alergia o cambio (Memento snapshot #N, vinculado al anterior)
export const nuevaPrescripcionPorAlergia = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const medico = await Medico.findOne({ usuarioId: req.user.userId });
    if (!medico) {
      res.status(404).json({ error: 'Médico no encontrado' });
      return;
    }

    const paciente = await Paciente.findById(req.body.pacienteId);
    if (!paciente) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }

    // Verificar que la prescripción anterior existe
    const prescripcionAnterior = await Prescripcion.findById(req.body.prescripcionAnteriorId);
    if (!prescripcionAnterior) {
      res.status(404).json({ error: 'Prescripción anterior no encontrada' });
      return;
    }

    // Desactivar prescripción anterior
    prescripcionAnterior.activa = false;
    await prescripcionAnterior.save();

    // Si el motivo es alergia, agregarla al paciente
    if (req.body.motivoCambio?.toLowerCase().includes('alergia')) {
      const nombreMedicamento = prescripcionAnterior.medicamento;
      if (!paciente.alergias.includes(nombreMedicamento)) {
        paciente.alergias.push(nombreMedicamento);
        await paciente.save();
      }
    }

    // Crear nuevo snapshot inmutable vinculado al anterior
    const nuevaPrescripcion = await Prescripcion.create({
      medicamento: req.body.medicamento,
      horario: req.body.horario,
      tiempoTratamiento: req.body.tiempoTratamiento,
      dosis: req.body.dosis,
      viaAdministracion: req.body.viaAdministracion,
      medicoId: medico._id,
      pacienteId: req.body.pacienteId,
      prescripcionAnteriorId: req.body.prescripcionAnteriorId,
      motivoCambio: req.body.motivoCambio,
      indicaciones: req.body.indicaciones || null,
      activa: true,
    });

    await nuevaPrescripcion.populate('medicoId', 'nombre especialidad');

    res.status(201).json({
      prescripcion: nuevaPrescripcion,
      prescripcionAnterior,
      alergiasActualizadas: paciente.alergias,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: 'Datos inválidos', detalles: error.message });
      return;
    }
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Ver historial clínico de un paciente (todas las prescripciones ordenadas por fecha)
export const getHistorialClinico = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const { pacienteId } = req.params;

    const medico = await Medico.findOne({ usuarioId: req.user.userId });
    if (!medico) {
      res.status(404).json({ error: 'Médico no encontrado' });
      return;
    }

    // Verificar que el paciente le pertenezca al médico
    const paciente = await Paciente.findOne({ _id: pacienteId, medicoId: medico._id });
    if (!paciente) {
      res.status(404).json({ error: 'Paciente no encontrado o no autorizado' });
      return;
    }

    const historial = await Prescripcion.find({ pacienteId })
      .populate('medicoId', 'nombre especialidad cedula')
      .populate('prescripcionAnteriorId')
      .sort({ fechaCreacion: -1 });

    res.json({ paciente, historial });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Comparar dos prescripciones (diff entre Memento snapshots)
export const compararPrescripciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id1, id2 } = req.params;

    const p1 = await Prescripcion.findById(id1).populate('medicoId', 'nombre especialidad');
    const p2 = await Prescripcion.findById(id2).populate('medicoId', 'nombre especialidad');

    if (!p1 || !p2) {
      res.status(404).json({ error: 'Prescripción no encontrada' });
      return;
    }

    // Generar diff entre los dos snapshots
    const campos = ['medicamento', 'horario', 'tiempoTratamiento', 'dosis', 'viaAdministracion', 'activa'] as const;
    const diferencias = campos
      .map((campo) => {
        const val1 = p1[campo];
        const val2 = p2[campo];
        if (val1 !== val2) {
          return { campo, anterior: val1, nuevo: val2 };
        }
        return null;
      })
      .filter(Boolean);

    res.json({
      prescripcionAnterior: p1,
      prescripcionNueva: p2,
      motivoCambio: p2.motivoCambio,
      diferencias,
      sonIguales: diferencias.length === 0,
    });
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Obtener prescripciones activas de un paciente
export const getPrescripcionesActivas = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const { pacienteId } = req.params;

    const medico = await Medico.findOne({ usuarioId: req.user.userId });
    if (!medico) {
      res.status(404).json({ error: 'Médico no encontrado' });
      return;
    }

    // Verificar que el paciente le pertenezca al médico
    const paciente = await Paciente.findOne({ _id: pacienteId, medicoId: medico._id });
    if (!paciente) {
      res.status(404).json({ error: 'Paciente no encontrado o no autorizado' });
      return;
    }

    const prescripciones = await Prescripcion.find({
      pacienteId,
      activa: true,
    })
      .populate('medicoId', 'nombre especialidad cedula')
      .sort({ fechaCreacion: -1 });

    res.json(prescripciones);
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Obtener una prescripción por ID
export const getPrescripcionById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const medico = await Medico.findOne({ usuarioId: req.user.userId });
    
    // Si es médico, verificar que la prescripción le pertenezca (a través del paciente o directamente)
    const prescripcion = await Prescripcion.findById(req.params.id)
      .populate('medicoId', 'nombre especialidad cedula')
      .populate('pacienteId')
      .populate('prescripcionAnteriorId');

    if (!prescripcion) {
      res.status(404).json({ error: 'Prescripción no encontrada' });
      return;
    }

    // Seguridad: Si es médico, confirmar que él creó la prescripción o el paciente es suyo
    if (req.user.rol === 'medico' && medico) {
      const paciente = prescripcion.pacienteId as any;
      if (prescripcion.medicoId.toString() !== medico._id.toString() && 
          paciente.medicoId?.toString() !== medico._id.toString()) {
        res.status(404).json({ error: 'Prescripción no encontrada o no autorizada' });
        return;
      }
    }

    res.json(prescripcion);
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Obtener la cadena de prescripciones vinculadas (historial de cambios)
export const getCadenaPrescripciones = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const cadena: IPrescripcion[] = [];
    let actual = await Prescripcion.findById(id).populate('medicoId', 'nombre especialidad');

    while (actual) {
      cadena.push(actual);
      if (actual.prescripcionAnteriorId) {
        actual = await Prescripcion.findById(actual.prescripcionAnteriorId).populate('medicoId', 'nombre especialidad');
      } else {
        break;
      }
    }

    res.json(cadena);
  } catch {
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Enviar prescripción por email (manual)
export const enviarPrescripcionEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email es requerido' });
      return;
    }

    const prescripcion = await Prescripcion.findById(id)
      .populate('medicoId', 'nombre especialidad cedula')
      .populate('pacienteId');

    if (!prescripcion) {
      res.status(404).json({ error: 'Prescripción no encontrada' });
      return;
    }

    const paciente = prescripcion.pacienteId as any;
    const medico = prescripcion.medicoId as any;

    // Create notification service using Bridge pattern
    const emailProvider = EmailProviderFactory.createEmailProvider();
    const notificationService = new PrescripcionNotificationService(emailProvider);

    // Send notification
    await notificationService.sendNotification(email, {
      pacienteNombre: paciente.nombre,
      pacienteEdad: paciente.edad,
      medicoNombre: medico.nombre,
      medicoEspecialidad: medico.especialidad,
      medicoCedula: medico.cedula,
      medicamento: prescripcion.medicamento,
      dosis: prescripcion.dosis,
      horario: prescripcion.horario,
      tiempoTratamiento: prescripcion.tiempoTratamiento,
      viaAdministracion: prescripcion.viaAdministracion,
      indicaciones: prescripcion.indicaciones,
      motivoCambio: prescripcion.motivoCambio,
      fechaCreacion: prescripcion.fechaCreacion,
      prescripcionId: prescripcion._id.toString(),
    });

    res.json({ message: 'Email enviado exitosamente', email });
  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({ error: 'Error del servidor al enviar email' });
  }
};
