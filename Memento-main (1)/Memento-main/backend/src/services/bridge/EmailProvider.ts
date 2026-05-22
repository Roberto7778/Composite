/**
 * PATRÓN BRIDGE - Implementor
 *
 * Interfaz que define las operaciones para enviar correos electrónicos.
 * Esta es la parte de implementación que puede variar independientemente de la abstracción.
 */
export interface Attachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface EmailProvider {
  sendEmail(to: string, subject: string, body: string, attachments?: Attachment[]): Promise<void>;
  sendEmailWithTemplate(to: string, template: string, data: Record<string, any>): Promise<void>;
}
