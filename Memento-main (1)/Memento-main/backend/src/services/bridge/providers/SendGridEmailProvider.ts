/**
 * PATRÓN BRIDGE - Concrete Implementor
 *
 * Implementación que usa SendGrid API para enviar correos.
 * Requiere @sendgrid/mail package.
 */
import { EmailProvider, Attachment } from '../EmailProvider';

export class SendGridEmailProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(to: string, subject: string, body: string, attachments?: Attachment[]): Promise<void> {
    // Nota: Requiere instalar @sendgrid/mail
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(this.apiKey);

    // await sgMail.send({
    //   to,
    //   from: 'noreply@mementomedical.com',
    //   subject,
    //   html: body,
    //   attachments: attachments?.map(att => ({
    //     filename: att.filename,
    //     content: att.content.toString('base64'),
    //     type: att.contentType || 'application/pdf',
    //     disposition: 'attachment',
    //   })),
    // });

    console.log('SendGrid email would be sent here (requires @sendgrid/mail package)');
  }

  async sendEmailWithTemplate(to: string, template: string, data: Record<string, any>): Promise<void> {
    // SendGrid tiene su propio sistema de templates
    console.log('SendGrid template email would be sent here (requires @sendgrid/mail package)');
  }
}
