/**
 * Job automático para gestionar tareas periódicas basado en configuración de servicios
 * - Activar tareas mensuales/recurrentes según configuración del servicio
 * - Enviar recordatorios para servicios con fecha determinada al completar (ej: libros)
 * - Sistema completamente dinámico basado en tabla services
 */

import { getPoolForTenantSlug } from '../config/database';
import { env } from '../config/env';
import { sendTaskReminderEmail } from '../services/email.service';

interface Service {
  id: number;
  service_name: string;
  recurrence_type: 'monthly' | 'bimonthly' | 'quarterly' | 'annual' | 'custom' | 'one_time';
  recurrence_type_extended: string | null;
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

  // Servicios variables y bajo demanda NO se activan automáticamente
  // Se manejan al completar la tarea anterior
  if (service.recurrence_type_extended === 'variable' || service.recurrence_type_extended === 'on_demand') {
    return { should: false, targetMonth: currentMonth, targetYear: currentYear };
  }

  // Servicios tipo 'custom' sin extended type también son variables
  if (service.recurrence_type === 'custom' && !service.recurrence_type_extended) {
    return { should: false, targetMonth: currentMonth, targetYear: currentYear };
  }

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
      // Estamos en los últimos días del mes ACTUAL, preparando tarea del mes siguiente
      // Usar días del mes ACTUAL (no el anterior)
      const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
      const currentMonthWindowStart = daysInCurrentMonth + windowStart; // ej: 31 + (-2) = 29

      if (dayOfMonth >= currentMonthWindowStart) {
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
  const dayOfMonth = currentDate.getDate();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  console.log(`\n[${tenantSlug}] ════════════════════════════════════════`);
  console.log(`[${tenantSlug}] Scheduler ejecutándose: ${dayOfMonth}/${currentMonth}/${currentYear}`);
  console.log(`[${tenantSlug}] ════════════════════════════════════════`);

  try {
    // 1. Obtener todos los servicios activos (excluyendo variables y bajo demanda)
    const [services]: any = await db.query(`
      SELECT
        id, service_name, recurrence_type, recurrence_type_extended, recurrence_days,
        activation_day, activation_window_days,
        completion_determines_next, is_active
      FROM services
      WHERE is_active = TRUE
        AND (recurrence_type_extended IS NULL OR recurrence_type_extended NOT IN ('variable', 'on_demand'))
    `);

    console.log(`[${tenantSlug}] Servicios activos encontrados: ${services.length}`);

    // 2. Para cada servicio, verificar si debe activarse hoy
    let servicesChecked = 0;
    let servicesActivated = 0;
    let totalTasksActivated = 0;

    for (const service of services as Service[]) {
      servicesChecked++;
      const { should, targetMonth, targetYear } = shouldActivateService(service, currentDate);

      // Log detallado de cada servicio
      const windowInfo = service.activation_day
        ? `día ${service.activation_day} (ventana: ${service.activation_window_days} días)`
        : 'sin día fijo';

      if (should) {
        servicesActivated++;
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
          totalTasksActivated += result[0].affectedRows;
          console.log(
            `[${tenantSlug}] ✓ "${service.service_name}" (${service.recurrence_type}, ${windowInfo}): ` +
            `${result[0].affectedRows} tareas activadas para ${targetMonth}/${targetYear}`
          );
        } else {
          console.log(
            `[${tenantSlug}] ○ "${service.service_name}": En ventana pero sin tareas pendientes`
          );
        }
      }
    }

    console.log(`[${tenantSlug}] ────────────────────────────────────────`);
    console.log(`[${tenantSlug}] Resumen: ${servicesActivated}/${servicesChecked} servicios en ventana`);
    console.log(`[${tenantSlug}] Total tareas activadas: ${totalTasksActivated}`);

    // 3. Procesar servicios con fecha determinada al completar (ej: libros)
    await processCompletionDeterminedServices(tenantSlug, db, currentDate);

    console.log(`[${tenantSlug}] ════════════════════════════════════════`);
    console.log(`[${tenantSlug}] ✓ Procesamiento completado\n`);
  } catch (error: any) {
    console.error(`[${tenantSlug}] ✗ ERROR: ${error.message}`);
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

  if (services.length > 0) {
    console.log(`[${tenantSlug}] Procesando ${services.length} servicios con fecha variable (ej: Libros)`);
  }

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
        // Mapear propiedades de DB a interfaz TaskReminder
        const taskReminder: TaskReminder = {
          taskId: reminder.task_id,
          clientName: reminder.client_name,
          taskName: reminder.task_name,
          daysUntil: reminder.days_until
        };
        await sendReminderEmailToStaff(tenantSlug, taskReminder, db);
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
 * Envía recordatorio por email usando el servicio de email
 */
async function sendReminderEmailToStaff(
  tenantSlug: string,
  reminder: TaskReminder,
  db: any
) {
  // Obtener emails de admin y empleados
  const [users]: any = await db.query(`
    SELECT email, full_name FROM users
    WHERE role IN ('admin', 'employee') AND is_active = 1
  `);

  if (!users || users.length === 0) {
    console.log(`[${tenantSlug}] No hay usuarios para notificar`);
    return;
  }

  const emails = users.map((u: any) => u.email);

  console.log(`[${tenantSlug}] 📧 Enviando recordatorio:`);
  console.log(`  Cliente: ${reminder.clientName}`);
  console.log(`  Tarea: ${reminder.taskName}`);
  console.log(`  Días hasta vencimiento: ${reminder.daysUntil}`);

  const result = await sendTaskReminderEmail(
    emails,
    reminder.clientName,
    reminder.taskName,
    reminder.daysUntil
  );

  if (result.success) {
    console.log(`[${tenantSlug}] ✓ Email enviado a: ${emails.join(', ')}`);
  } else {
    console.log(`[${tenantSlug}] ✗ Error enviando email`);
  }
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

/**
 * Genera la siguiente tarea para un servicio con recurrencia variable
 * Se llama cuando se completa una tarea de un servicio variable
 */
export async function generateNextVariableTask(
  db: any,
  taskId: number,
  serviceId: number,
  clientUserId: number
): Promise<{ success: boolean; nextTaskId?: number; nextDueDate?: Date; message: string }> {
  try {
    // 1. Obtener información del servicio y sus reglas de recurrencia
    const [serviceRows]: any = await db.query(`
      SELECT s.*, sr.variable_pattern, sr.activation_days_before
      FROM services s
      LEFT JOIN service_recurrence_rules sr ON sr.service_id = s.id
      WHERE s.id = ?
    `, [serviceId]);

    if (!serviceRows || serviceRows.length === 0) {
      return { success: false, message: 'Servicio no encontrado' };
    }

    const service = serviceRows[0];

    // Verificar que es un servicio variable
    if (service.recurrence_type_extended !== 'variable') {
      return { success: false, message: 'El servicio no es de recurrencia variable' };
    }

    // 2. Parsear el patrón de recurrencia
    let pattern: { interval_days: number; repeat: number }[] = [];
    try {
      pattern = JSON.parse(service.variable_pattern || '[]');
    } catch (e) {
      return { success: false, message: 'Patrón de recurrencia inválido' };
    }

    if (!pattern || pattern.length === 0) {
      return { success: false, message: 'No hay patrón de recurrencia definido' };
    }

    // 3. Obtener historial de tareas completadas para este servicio/cliente
    const [completedTasks]: any = await db.query(`
      SELECT msc.id, msc.completion_date, msc.variable_step_index
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.invoice_id
      WHERE msc.service_id = ?
        AND mi.client_user_id = ?
        AND msc.status = 'completed'
      ORDER BY msc.completion_date DESC
      LIMIT 10
    `, [serviceId, clientUserId]);

    // 4. Determinar en qué paso del patrón estamos
    let currentStepIndex = 0;
    let currentRepeatCount = 0;

    // Si hay tareas previas, usar el índice guardado
    if (completedTasks && completedTasks.length > 0) {
      const lastTask = completedTasks[0];
      currentStepIndex = lastTask.variable_step_index || 0;

      // Contar cuántas veces se ha ejecutado este paso
      const sameStepTasks = completedTasks.filter((t: any) =>
        t.variable_step_index === currentStepIndex
      );
      currentRepeatCount = sameStepTasks.length;
    }

    // 5. Calcular siguiente paso y fecha
    const currentStep = pattern[currentStepIndex];
    let nextStepIndex = currentStepIndex;

    // Verificar si debemos avanzar al siguiente paso del patrón
    if (currentRepeatCount >= currentStep.repeat) {
      nextStepIndex = (currentStepIndex + 1) % pattern.length; // Ciclo infinito
    }

    const nextStep = pattern[nextStepIndex];
    const intervalDays = nextStep.interval_days;
    const activationDaysBefore = service.activation_days_before || 7;

    // Calcular fecha de vencimiento (desde hoy + intervalo)
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + intervalDays);

    // Fecha de activación (vencimiento - días anticipación)
    const activationDate = new Date(dueDate);
    activationDate.setDate(activationDate.getDate() - activationDaysBefore);

    // 6. Crear o reutilizar invoice del mes
    const invoiceMonth = dueDate.getMonth() + 1;
    const invoiceYear = dueDate.getFullYear();

    let invoiceId: number;
    const [existingInvoice]: any = await db.query(`
      SELECT id FROM monthly_invoices
      WHERE client_user_id = ? AND invoice_year = ? AND invoice_month = ?
    `, [clientUserId, invoiceYear, invoiceMonth]);

    if (existingInvoice && existingInvoice.length > 0) {
      invoiceId = existingInvoice[0].id;
    } else {
      // Crear nueva invoice
      const price = service.default_price || 0;
      const [newInvoice]: any = await db.query(`
        INSERT INTO monthly_invoices (
          client_user_id, invoice_year, invoice_month,
          previous_debt, monthly_fee, extras_fee, total_due, amount_paid, balance, payment_status
        ) VALUES (?, ?, ?, 0, ?, 0, ?, 0, ?, 'pending')
      `, [clientUserId, invoiceYear, invoiceMonth, price, price, price]);
      invoiceId = newInvoice.insertId;
    }

    // 7. Crear la nueva tarea
    const [newTask]: any = await db.query(`
      INSERT INTO monthly_service_checklist (
        invoice_id, task_name, status, service_id,
        next_payment_date, variable_step_index
      ) VALUES (?, ?, 'inactive', ?, ?, ?)
    `, [invoiceId, service.service_name, serviceId, dueDate, nextStepIndex]);

    console.log(`[VARIABLE-TASK] Creada tarea ${newTask.insertId} para servicio "${service.service_name}"`);
    console.log(`  - Paso ${nextStepIndex + 1}/${pattern.length} del patrón`);
    console.log(`  - Intervalo: ${intervalDays} días`);
    console.log(`  - Fecha vencimiento: ${dueDate.toISOString().split('T')[0]}`);

    return {
      success: true,
      nextTaskId: newTask.insertId,
      nextDueDate: dueDate,
      message: `Siguiente tarea creada para ${dueDate.toISOString().split('T')[0]}`
    };

  } catch (error: any) {
    console.error('[VARIABLE-TASK] Error generando siguiente tarea:', error.message);
    return { success: false, message: error.message };
  }
}
