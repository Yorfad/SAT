/**
 * Servicio de envío de emails usando nodemailer
 * Configurar variables de entorno SMTP en .env
 */

import nodemailer from 'nodemailer';
import { env } from '../config/env';

// Interfaz para opciones de email
interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

// Configuración del transporter (se crea una vez)
let transporter: nodemailer.Transporter | null = null;

/**
 * Inicializa el transporter de nodemailer
 * Usa variables de entorno para configuración SMTP
 */
function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'SAT System <noreply@sat.local>';

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[EMAIL] SMTP no configurado. Emails serán simulados.');
    // Crear transporter de prueba que solo loguea
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  console.log(`[EMAIL] SMTP configurado: ${smtpHost}:${smtpPort}`);
  return transporter;
}

/**
 * Envía un email
 * Si SMTP no está configurado, solo loguea el mensaje
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transport = getTransporter();
  const smtpFrom = process.env.SMTP_FROM || 'SAT System <noreply@sat.local>';

  try {
    const info = await transport.sendMail({
      from: smtpFrom,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });

    // Si es transporte de prueba, loguear
    if (!process.env.SMTP_HOST) {
      console.log('[EMAIL] (Simulado) Email enviado:');
      console.log(`  Para: ${options.to}`);
      console.log(`  Asunto: ${options.subject}`);
      return { success: true, messageId: 'simulated' };
    }

    console.log(`[EMAIL] Enviado: ${info.messageId}`);
    return { success: true, messageId: info.messageId };

  } catch (error: any) {
    console.error('[EMAIL] Error enviando:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Envía recordatorio de tarea próxima a vencer
 */
export async function sendTaskReminderEmail(
  recipients: string[],
  clientName: string,
  taskName: string,
  daysUntilDue: number
): Promise<{ success: boolean }> {
  const subject = `⚠️ Recordatorio: ${taskName} - ${clientName} (${daysUntilDue} días)`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">📋 Recordatorio de Tarea</h2>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
        <p><strong>Cliente:</strong> ${clientName}</p>
        <p><strong>Tarea:</strong> ${taskName}</p>
        <p><strong>Vence en:</strong> <span style="color: ${daysUntilDue <= 7 ? '#dc2626' : '#f59e0b'};">${daysUntilDue} días</span></p>
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
        Este es un mensaje automático del Sistema SAT.
      </p>
    </div>
  `;

  const text = `
Recordatorio de Tarea
=====================
Cliente: ${clientName}
Tarea: ${taskName}
Vence en: ${daysUntilDue} días

Este es un mensaje automático del Sistema SAT.
  `;

  const result = await sendEmail({
    to: recipients,
    subject,
    html,
    text
  });

  return { success: result.success };
}

/**
 * Envía notificación de nueva tarea asignada
 */
export async function sendTaskAssignedEmail(
  recipientEmail: string,
  clientName: string,
  taskName: string,
  dueDate: string
): Promise<{ success: boolean }> {
  const subject = `📌 Nueva tarea asignada: ${taskName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">✨ Nueva Tarea Asignada</h2>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
        <p><strong>Cliente:</strong> ${clientName}</p>
        <p><strong>Tarea:</strong> ${taskName}</p>
        <p><strong>Fecha límite:</strong> ${dueDate}</p>
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
        Este es un mensaje automático del Sistema SAT.
      </p>
    </div>
  `;

  const result = await sendEmail({
    to: recipientEmail,
    subject,
    html
  });

  return { success: result.success };
}

/**
 * Verifica la conexión SMTP
 */
export async function verifyEmailConnection(): Promise<{ connected: boolean; error?: string }> {
  if (!process.env.SMTP_HOST) {
    return { connected: false, error: 'SMTP no configurado' };
  }

  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('[EMAIL] Conexión SMTP verificada');
    return { connected: true };
  } catch (error: any) {
    console.error('[EMAIL] Error verificando SMTP:', error.message);
    return { connected: false, error: error.message };
  }
}
