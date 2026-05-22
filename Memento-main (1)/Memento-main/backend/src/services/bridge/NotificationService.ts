/**
 * PATRÓN BRIDGE - Abstraction
 * 
 * Clase abstracta que define la interfaz de alto nivel para enviar notificaciones.
 * Contiene una referencia al EmailProvider (Implementor) que puede variar.
 */
import { EmailProvider } from './EmailProvider';

export abstract class NotificationService {
  protected emailProvider: EmailProvider;

  constructor(emailProvider: EmailProvider) {
    this.emailProvider = emailProvider;
  }

  // Método para cambiar el proveedor de email en tiempo de ejecución
  setEmailProvider(emailProvider: EmailProvider): void {
    this.emailProvider = emailProvider;
  }

  // Método abstracto que las subclases deben implementar
  abstract sendNotification(recipient: string, data: Record<string, any>): Promise<void>;
}
