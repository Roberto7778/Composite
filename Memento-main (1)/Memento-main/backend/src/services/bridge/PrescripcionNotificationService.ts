/**
 * PATRÓN BRIDGE - Refined Abstraction
 *
 * Especialización de NotificationService para enviar notificaciones de prescripciones.
 * Formatea el email específico para prescripciones médicas.
 */
import { NotificationService } from './NotificationService';
import { Attachment } from './EmailProvider';
import { PDFGeneratorService, PrescripcionPDFData } from '../pdf/PDFGeneratorService';

export interface PrescripcionData {
  pacienteNombre: string;
  pacienteEdad: number;
  medicoNombre: string;
  medicoEspecialidad: string;
  medicoCedula: string;
  medicamento: string;
  dosis: string;
  horario: number;
  tiempoTratamiento: number;
  viaAdministracion: string;
  indicaciones?: string;
  motivoCambio?: string;
  fechaCreacion: Date;
  prescripcionId: string;
}

export class PrescripcionNotificationService extends NotificationService {
  private pdfGenerator: PDFGeneratorService;

  constructor(emailProvider: any) {
    super(emailProvider);
    this.pdfGenerator = new PDFGeneratorService();
  }

  async sendNotification(recipient: string, data: Record<string, any>): Promise<void> {
    const prescripcionData = data as PrescripcionData;
    const emailBody = this.generatePrescripcionEmail(prescripcionData);

    // Generate PDF attachment
    const pdfData: PrescripcionPDFData = {
      pacienteNombre: prescripcionData.pacienteNombre,
      pacienteEdad: prescripcionData.pacienteEdad,
      medicoNombre: prescripcionData.medicoNombre,
      medicoEspecialidad: prescripcionData.medicoEspecialidad,
      medicoCedula: prescripcionData.medicoCedula,
      medicamento: prescripcionData.medicamento,
      dosis: prescripcionData.dosis,
      horario: prescripcionData.horario,
      tiempoTratamiento: prescripcionData.tiempoTratamiento,
      viaAdministracion: prescripcionData.viaAdministracion,
      indicaciones: prescripcionData.indicaciones,
      fechaCreacion: prescripcionData.fechaCreacion,
      prescripcionId: prescripcionData.prescripcionId,
    };

    const pdfBuffer = await this.pdfGenerator.generatePrescripcionPDF(pdfData);

    const attachment: Attachment = {
      filename: `receta_${prescripcionData.prescripcionId.slice(-8).toUpperCase()}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    };

    await this.emailProvider.sendEmail(
      recipient,
      'Nueva Prescripción Médica - Memento Medical',
      emailBody,
      [attachment]
    );
  }

  private generatePrescripcionEmail(data: PrescripcionData): string {
    const horarioTexto = this.formatHorario(data.horario);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Nueva Prescripción Médica</h2>

        <p>Estimado/a <strong>${data.pacienteNombre}</strong>,</p>

        <p>El Dr. <strong>${data.medicoNombre}</strong> (${data.medicoEspecialidad}) ha creado una nueva prescripción médica para usted:</p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #3498db; margin-top: 0;">Detalles de la Prescripción</h3>

          <p><strong>Medicamento:</strong> ${data.medicamento}</p>
          <p><strong>Dosis:</strong> ${data.dosis}</p>
          <p><strong>Frecuencia:</strong> Cada ${horarioTexto} horas</p>
          <p><strong>Duración del tratamiento:</strong> ${data.tiempoTratamiento} días</p>
          <p><strong>Vía de administración:</strong> ${data.viaAdministracion}</p>

          ${data.indicaciones ? `<p><strong>Indicaciones:</strong> ${data.indicaciones}</p>` : ''}

          ${data.motivoCambio ? `
            <div style="background-color: #fff3cd; padding: 10px; border-radius: 4px; margin-top: 15px;">
              <p style="margin: 0; color: #856404;"><strong>Motivo del cambio:</strong> ${data.motivoCambio}</p>
            </div>
          ` : ''}
        </div>

        <p>Se adjunta el PDF de la receta médica para su referencia.</p>

        <p>Por favor, siga las instrucciones de su médico y no modifique la dosis sin consultar previamente.</p>

        <p style="color: #7f8c8d; font-size: 12px;">
          Este es un mensaje automático de Memento Medical. Si tiene dudas, consulte a su médico.
        </p>
      </div>
    `;
  }

  private formatHorario(horario: number): string {
    const horarios: Record<number, string> = {
      6: '6 (4 veces al día)',
      8: '8 (3 veces al día)',
      12: '12 (2 veces al día)',
      24: '24 (1 vez al día)',
    };
    return horarios[horario] || horario.toString();
  }
}
