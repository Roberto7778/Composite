/**
 * PATRÓN BRIDGE - Factory
 * 
 * Factory para crear la instancia del EmailProvider apropiado según la configuración.
 * Permite cambiar fácilmente entre diferentes proveedores de email.
 */
import { env } from '../../config/env';
import { EmailProvider } from './EmailProvider';
import { ConsoleEmailProvider } from './providers/ConsoleEmailProvider';
import { SMTPEmailProvider } from './providers/SMTPEmailProvider';
import { SendGridEmailProvider } from './providers/SendGridEmailProvider';

export class EmailProviderFactory {
  static createEmailProvider(): EmailProvider {
    switch (env.EMAIL_PROVIDER.toLowerCase()) {
      case 'smtp':
        if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
          console.warn('SMTP configuration incomplete, falling back to console');
          return new ConsoleEmailProvider();
        }
        return new SMTPEmailProvider(env.SMTP_HOST, env.SMTP_PORT, env.SMTP_USER, env.SMTP_PASS);
      
      case 'sendgrid':
        if (!env.SENDGRID_API_KEY) {
          console.warn('SendGrid API key not configured, falling back to console');
          return new ConsoleEmailProvider();
        }
        return new SendGridEmailProvider(env.SENDGRID_API_KEY);
      
      case 'console':
      default:
        return new ConsoleEmailProvider();
    }
  }
}
