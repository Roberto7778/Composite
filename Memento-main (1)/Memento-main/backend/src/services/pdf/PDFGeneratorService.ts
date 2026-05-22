/**
 * Servicio para generar PDFs de prescripciones médicas.
 * Usa Puppeteer para renderizar HTML a PDF.
 */
import puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer';

export interface PrescripcionPDFData {
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
  fechaCreacion: Date;
  prescripcionId: string;
}

export class PDFGeneratorService {
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  async generatePrescripcionPDF(data: PrescripcionPDFData): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    const html = this.generatePrescripcionHTML(data);

    await page.setContent(html, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A5',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    });

    await page.close();

    return Buffer.from(pdfBuffer);
  }

  private generatePrescripcionHTML(data: PrescripcionPDFData): string {
    const fechaFormateada = data.fechaCreacion.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const horarioTexto = this.formatHorario(data.horario);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            width: 148mm;
            height: 210mm;
            padding: 15mm;
            background: white;
          }
          .header {
            border-bottom: 2px solid #2563eb;
            padding-bottom: 24px;
            margin-bottom: 32px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .header h1 {
            font-size: 24px;
            font-weight: 900;
            color: #1d4ed8;
            letter-spacing: -0.5px;
          }
          .header h2 {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
            line-height: 1.2;
          }
          .header h3 {
            font-size: 14px;
            font-weight: 700;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header p {
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
          }
          .contact-info {
            text-align: right;
            font-size: 10px;
            color: #9ca3af;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .patient-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 40px;
            padding-bottom: 24px;
            border-bottom: 1px solid #f9fafb;
            font-size: 14px;
          }
          .patient-details label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 900;
            color: #9ca3af;
            margin-bottom: 4px;
            display: block;
          }
          .patient-details p {
            font-weight: 700;
            color: #111827;
          }
          .patient-details .text-right {
            text-align: right;
          }
          .patient-details .gray {
            color: #6b7280;
            font-weight: 500;
          }
          .rx-symbol {
            display: flex;
            align-items: baseline;
            gap: 16px;
            margin-bottom: 24px;
          }
          .rx-symbol span {
            font-size: 60px;
            font-family: serif;
            color: #1d4ed8;
          }
          .rx-symbol .small {
            font-size: 40px;
          }
          .rx-line {
            flex-grow: 1;
            height: 2px;
            background: #f9fafb;
          }
          .prescription-body {
            padding-left: 16px;
          }
          .prescription-body h3 {
            font-size: 20px;
            font-weight: 900;
            color: #111827;
            margin-bottom: 8px;
          }
          .prescription-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            font-size: 14px;
            margin-bottom: 32px;
          }
          .prescription-details p {
            color: #4b5563;
            font-weight: 500;
          }
          .prescription-details strong {
            color: #111827;
            font-weight: 700;
          }
          .indicaciones {
            background: #f9fafb;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid #f3f4f6;
          }
          .indicaciones label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 900;
            color: #9ca3af;
            margin-bottom: 8px;
            display: block;
          }
          .indicaciones p {
            font-size: 14px;
            color: #374151;
            line-height: 1.6;
            font-style: italic;
          }
          .footer {
            margin-top: auto;
            padding-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .stamp {
            width: 128px;
            height: 128px;
            border: 2px solid #eff6ff;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.3;
          }
          .stamp div {
            font-size: 8px;
            text-align: center;
            font-weight: 700;
            color: #60a5fa;
            padding: 8px;
            border: 1px dashed #60a5fa;
            border-radius: 8px;
          }
          .signature {
            text-align: center;
            width: 256px;
          }
          .signature-line {
            height: 1px;
            background: #111827;
            margin-bottom: 8px;
          }
          .signature p {
            font-size: 12px;
            font-weight: 700;
            color: #111827;
          }
          .signature .small {
            font-size: 10px;
            color: #9ca3af;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
            line-height: 1;
          }
          .disclaimer {
            margin-top: 32px;
            text-align: center;
            border-top: 1px solid #f9fafb;
            padding-top: 16px;
          }
          .disclaimer p {
            font-size: 9px;
            color: #d1d5db;
            font-weight: 500;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>MEMENTO MEDICAL</h1>
            <h2>Dr. ${data.medicoNombre}</h2>
            <h3>${data.medicoEspecialidad}</h3>
            <p>Cédula Prof: ${data.medicoCedula}</p>
          </div>
          <div class="contact-info">
            <div>Teléfono: (664) 123-4567</div>
            <div>Email: contacto@mementomedical.com</div>
            <div>Dirección: Tijuana, BC</div>
          </div>
        </div>

        <div class="patient-details">
          <div>
            <label>Paciente</label>
            <p>${data.pacienteNombre}</p>
            <p class="gray">${data.pacienteEdad} años</p>
          </div>
          <div class="text-right">
            <label>Fecha de Emisión</label>
            <p>${fechaFormateada}</p>
            <p class="gray">Exp: #${data.prescripcionId.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        <div class="rx-symbol">
          <span>R<span class="small">x</span></span>
          <div class="rx-line"></div>
        </div>

        <div class="prescription-body">
          <h3>${data.medicamento}</h3>
          <div class="prescription-details">
            <p>Dosificación: <strong>${data.dosis}</strong></p>
            <p>Vía: <strong>${data.viaAdministracion.toUpperCase()}</strong></p>
            <p>Frecuencia: <strong>Cada ${horarioTexto} horas</strong></p>
            <p>Duración: <strong>${data.tiempoTratamiento} días</strong></p>
          </div>

          ${data.indicaciones ? `
            <div class="indicaciones">
              <label>Indicaciones Especiales</label>
              <p>${data.indicaciones}</p>
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <div class="stamp">
            <div>SELLO DE LA CLÍNICA</div>
          </div>
          <div class="signature">
            <div class="signature-line"></div>
            <p>Dr. ${data.medicoNombre}</p>
            <p class="small">Firma y Sello del Médico</p>
          </div>
        </div>

        <div class="disclaimer">
          <p>Esta receta es válida por 30 días a partir de su fecha de emisión. Dr. MEMENTO v2.5 - Gestión Clínica Segura.</p>
        </div>
      </body>
      </html>
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

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
