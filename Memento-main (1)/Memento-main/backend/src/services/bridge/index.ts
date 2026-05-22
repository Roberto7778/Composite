/**
 * PATRÓN BRIDGE - Exportaciones
 * 
 * Exporta todas las clases del patrón Bridge para facilitar su uso.
 */
export { EmailProvider } from './EmailProvider';
export { NotificationService } from './NotificationService';
export { PrescripcionNotificationService, PrescripcionData } from './PrescripcionNotificationService';
export { EmailProviderFactory } from './EmailProviderFactory';

export { ConsoleEmailProvider } from './providers/ConsoleEmailProvider';
export { SMTPEmailProvider } from './providers/SMTPEmailProvider';
export { SendGridEmailProvider } from './providers/SendGridEmailProvider';
