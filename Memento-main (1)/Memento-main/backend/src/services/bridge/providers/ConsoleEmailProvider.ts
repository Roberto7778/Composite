/**
 * PATRÓN BRIDGE - Concrete Implementor
 *
 * Implementación que imprime los correos en consola.
 * Útil para desarrollo y testing sin enviar correos reales.
 */
import { EmailProvider, Attachment } from '../EmailProvider';

export class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(to: string, subject: string, body: string, attachments?: Attachment[]): Promise<void> {
    console.log('=== EMAIL ENVIADO (CONSOLE) ===');
    console.log(`Para: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Cuerpo: ${body}`);
    if (attachments && attachments.length > 0) {
      console.log(`Adjuntos: ${attachments.length} archivo(s)`);
      attachments.forEach(att => {
        console.log(`  - ${att.filename} (${att.contentType || 'application/pdf'})`);
      });
    }
    console.log('==============================');
  }

  async sendEmailWithTemplate(to: string, template: string, data: Record<string, any>): Promise<void> {
    console.log('=== EMAIL CON TEMPLANTE ENVIADO (CONSOLE) ===');
    console.log(`Para: ${to}`);
    console.log(`Template: ${template}`);
    console.log(`Datos: ${JSON.stringify(data, null, 2)}`);
    console.log('============================================');
  }
}
