import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 4000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/memento-medical',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  // Email configuration
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'console',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
};
