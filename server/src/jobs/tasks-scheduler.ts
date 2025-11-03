/**
 * Job automático para gestionar tareas periódicas basado en configuración de servicios
 * - Activar tareas mensuales/recurrentes según configuración del servicio
 * - Enviar recordatorios para servicios con fecha determinada al completar (ej: libros)
 * - Sistema completamente dinámico basado en tabla services
 */

import { getPoolForTenantSlug } from '../config/database';
import { env } from '../config/env';

interface Service {
  id: number;
  service_name: string;
  recurrence_type: 'monthly' | 'bimonthly' | 'quarterly' | 'annual' | 'custom' | 'one_time';
  recurrence_days: number | null;
  activation_day: number | null;
  activation_window_days: number;
  completion_determines_next: boolean;
  is_active: boolean;
}

interface TaskReminder {
  taskId: number;
  clientName: string;
  taskName: string;
  daysUntil: number;
}

/**
 * Determina si un servicio debe activarse hoy basado en su configuración
 */
function shouldActivateService(service: Service, currentDate: Date): { should: boolean; targetMonth: number; targetYear: number } {
  const dayOfMonth = currentDate.getDate();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  // Servicios que determinan su próxima ejecución al completar (como libros)
  // Se manejan separadamente por fecha específica
  if (service.completion_determines_next) {
    return { should: false, targetMonth: currentMonth, targetYear: currentYear };
  }

  // Servicios de una sola vez no se reactivan automáticamente
  if (service.recurrence_type === 'one_time') {
    return { should: false, targetMonth: currentMonth, targetYear: currentYear };
  }

  // Servicios mensuales
  if (service.recurrence_type === 'monthly' && service.activation_day !== null) {
    const activationDay = service.activation_day;
    const windowDays = service.activation_window_days;

    // Ventana de activación: desde (activation_day - window_days) hasta activation_day
    const windowStart = activationDay - windowDays;
    const windowEnd = activationDay;

    // Caso 1: Ventana está completamente dentro del mes actual
    if (windowStart >= 1) {
      if (dayOfMonth >= windowStart && dayOfMonth <= windowEnd) {
        return { should: true, targetMonth: currentMonth, targetYear: currentYear };
      }
    }
    // Caso 2: Ventana cruza al mes anterior (ej: activation_day=5, window=7 → comienza día -2 del mes anterior)
    else {
      // Estamos en los primeros días del mes y la ventana comenzó en el mes anterior
      if (dayOfMonth <= windowEnd) {
        return { should: true, targetMonth: currentMonth, targetYear: currentYear };
      }
      // Estamos en los últimos días del mes anterior
      const daysInPreviousMonth = new Date(currentYear, currentMonth - 1, 0).getDate();
      const previousMonthWindowStart = daysInPreviousMonth + windowStart; // ej: 30 + (-2) = 28

      if (dayOfMonth >= previousMonthWindowStart) {
        // Activar para el mes siguiente
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
        return { should: true, targetMonth: nextMonth, targetYear: nextYear };
      }
    }
  }

  // Servicios bimensuales (cada 2 meses)
  if (service.recurrence_type === 'bimonthly' && service.activation_day !== null) {
    // Solo activar en meses impares o pares según configuración
    // Simplificación: activar solo en meses impares (1, 3, 5, 7, 9, 11)
    if (currentMonth % 2 === 1) {
      const activationDay = service.activation_day;
      const windowDays = service.activation_window_days;
      const windowStart = Math.max(1, activationDay - windowDays);

      if (dayOfMonth >= windowStart && dayOfMonth <= activationDay) {
        return { should: true, targetMonth: currentMonth, targetYear: currentYear };
      }
    }
  }

  // Servicios trimestrales (cada 3 meses)
  if (service.recurrence_type === 'quarterly' && service.activation_day !== null) {
    // Solo activar en meses 1, 4, 7, 10
    if ([1, 4, 7, 10].includes(currentMonth)) {
      const activationDay = service.activation_day;
      const windowDays = service.activation_window_days;
      const windowStart = Math.max(1, activationDay - windowDays);

      if (dayOfMonth >= windowStart && dayOfMonth <= activationDay) {
        return { should: true, targetMonth: currentMonth, targetYear: currentYear };
      }
    }
  }

  // Servicios anuales
  if (service.recurrence_type === 'annual' && service.activation_day !== null) {
    // Solo activar en enero
    if (currentMonth === 1) {
      const activationDay = service.activation_day;
      const windowDays = service.activation_window_days;
      const windowStart = Math.max(1, activationDay - windowDays);

      if (dayOfMonth >= windowStart && dayOfMonth <= activationDay) {
        return { should: true, targetMonth: currentMonth, targetYear: currentYear };
      }
    }
  }

  return { should: false, targetMonth: currentMonth, targetYear: currentYear };
}

/**
 * Procesa tareas para un tenant específico
 */
export async function processMonthlyTasks(tenantSlug: string) {
  const db = getPoolForTenantSlug(tenantSlug);
  const currentDate = new Date();

  try {
    // 1. Obtener todos los servicios activos
    const [services]: any = await db.query(`
      SELECT
        id, service_name, recurrence_type, recurrence_days,
        activation_day, activation_window_days,
        completion_determines_next, is_active
      FROM services
      WHERE is_active = TRUE
    `);

    console.log(`[${tenantSlug}] Procesando ${services.length} servicios activos`);

    // 2. Para cada servicio, verificar si debe activarse hoy
    for (const service of services as Service[]) {
      const { should, targetMonth, targetYear } = shouldActivateService(service, currentDate);

      if (should) {
        // Marcar todas las tareas de este servicio como pendientes para el mes objetivo
        const result: any = await db.query(`
          UPDATE monthly_service_checklist msc
          JOIN monthly_invoices mi ON mi.id = msc.invoice_id
          SET msc.status = 'pending'
          WHERE mi.invoice_year = ?
            AND mi.invoice_month = ?
            AND msc.service_id = ?
            AND msc.status <> 'completed'
        `, [targetYear, targetMonth, service.id]);

        if (result[0].affectedRows > 0) {
          console.log(
            `[${tenantSlug}] Activadas ${result[0].affectedRows} tareas de "${service.service_name}" ` +
            `para ${targetMonth}/${targetYear}`
          );
        }
      }
    }

    // 3. Procesar servicios con fecha determinada al completar (ej: libros)
    await processCompletionDeterminedServices(tenantSlug, db, currentDate);

    console.log(`[${tenantSlug}] Procesamiento de tareas completado`);
  } catch (error: any) {
    console.error(`[${tenantSlug}] Error procesando tareas:`, error.message);
  }
}

/**
 * Procesa servicios cuya próxima ejecución se determina al completar la tarea
 */
async function processCompletionDeterminedServices(tenantSlug: string, db: any, currentDate: Date) {
  // Obtener servicios con completion_determines_next = TRUE
  const [services]: any = await db.query(`
    SELECT id, service_name, activation_window_days
    FROM services
    WHERE is_active = TRUE
      AND completion_determines_next = TRUE
  `);

  for (const service of services) {
    const windowDays = service.activation_window_days || 60;

    // 1. Enviar recordatorios para tareas próximas a vencer
    const [reminders]: any = await db.query(`
      SELECT
        msc.id as task_id,
        u.full_name as client_name,
        msc.task_name,
        DATEDIFF(msc.next_payment_date, CURDATE()) as days_until
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.invoice_id
      JOIN users u ON u.id = mi.client_user_id
      WHERE msc.service_id = ?
        AND msc.next_payment_date IS NOT NULL
        AND msc.next_payment_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND msc.status <> 'completed'
    `, [service.id, windowDays]);

    if (reminders && reminders.length > 0) {
      for (const reminder of reminders) {
        await sendTaskReminderEmail(tenantSlug, reminder, db);
      }
    }

    // 2. Marcar tareas como pendientes cuando entren en la ventana de activación
    const activationThreshold = Math.floor(windowDays * 0.8); // 80% de la ventana
    const result: any = await db.query(`
      UPDATE monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.invoice_id
      SET msc.status = 'pending'
      WHERE msc.service_id = ?
        AND msc.next_payment_date IS NOT NULL
        AND DATEDIFF(msc.next_payment_date, CURDATE()) BETWEEN 1 AND ?
        AND msc.status <> 'completed'
    `, [service.id, activationThreshold]);

    if (result[0].affectedRows > 0) {
      console.log(
        `[${tenantSlug}] Activadas ${result[0].affectedRows} tareas de "${service.service_name}" ` +
        `por proximidad de fecha`
      );
    }
  }
}

/**
 * Envía recordatorio por email (placeholder - implementar con nodemailer)
 */
async function sendTaskReminderEmail(
  tenantSlug: string,
  reminder: TaskReminder,
  db: any
) {
  // Obtener emails de admin y empleados
  const [users]: any = await db.query(`
    SELECT email, full_name FROM users
    WHERE role IN ('admin', 'employee') AND is_active = 1
  `);

  // TODO: Implementar envío real de email
  // Por ahora solo log
  console.log(`[${tenantSlug}] Recordatorio de tarea:`);
  console.log(`  Cliente: ${reminder.clientName}`);
  console.log(`  Tarea: ${reminder.taskName}`);
  console.log(`  Días hasta vencimiento: ${reminder.daysUntil}`);
  console.log(`  Enviar a: ${users.map((u: any) => u.email).join(', ')}`);

  // Aquí implementarías el envío real con nodemailer o similar
  // await sendEmail(...)
}

/**
 * Ejecutar para todos los tenants configurados
 */
export async function runAllTenantsTasks() {
  const tenantSlugs = Object.keys(env.tenants);
  for (const slug of tenantSlugs) {
    await processMonthlyTasks(slug);
  }
}
