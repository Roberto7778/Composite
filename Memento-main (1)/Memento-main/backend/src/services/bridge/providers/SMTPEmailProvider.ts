/**
 * PATRÓN BRIDGE - Concrete Implementor
 *
 * Implementación que usa SMTP para enviar correos reales.
 */
import nodemailer from 'nodemailer';
import { EmailProvider, Attachment } from '../EmailProvider';

export class SMTPEmailProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor(host: string, port: number, user: string, pass: string) {
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendEmail(to: string, subject: string, body: string, attachments?: Attachment[]): Promise<void> {
    await this.transporter.sendMail({
      from: '"Memento Medical" <noreply@mementomedical.com>',
      to,
      subject,
      html: body,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType || 'application/pdf',
      })),
    });
  }

  async sendEmailWithTemplate(to: string, template: string, data: Record<string, any>): Promise<void> {
    // Para SMTP, simplemente reemplazamos variables en el template
    let body = template;
    Object.keys(data).forEach(key => {
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
    });

    await this.sendEmail(to, 'Notificación Memento Medical', body);
  }
}
