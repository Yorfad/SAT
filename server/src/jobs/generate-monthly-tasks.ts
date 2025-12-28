/**
 * Job para generar automáticamente tareas mensuales
 * Se ejecuta al inicio de cada mes para crear tareas basadas en client_services activos
 */

import { getPoolForTenantSlug } from '../config/database';
import { env } from '../config/env';

interface ClientService {
  client_id: number;
  service_id: number;
  service_name: string;
  custom_price: number | null;
  default_price: number;
  recurrence_type: string;
  recurrence_type_extended: string | null;
  is_active: boolean;
}

/**
 * Genera tareas para un mes específico de todos los clientes con servicios activos
 */
export async function generateMonthlyTasks(tenantSlug: string, targetYear?: number, targetMonth?: number) {
  const db = getPoolForTenantSlug(tenantSlug);
  const currentDate = new Date();

  // Usar mes/año actual si no se especifican
  const year = targetYear || currentDate.getFullYear();
  const month = targetMonth || (currentDate.getMonth() + 1);

  console.log(`[${tenantSlug}] Generando tareas para ${month}/${year}...`);

  try {
    // 1. Obtener todos los clientes activos con sus servicios
    // EXCLUIR servicios variables y bajo demanda (se manejan diferente)
    const [clientServices]: any = await db.query(`
      SELECT
        cs.client_user_id as client_id,
        cs.service_id,
        cs.custom_price,
        s.service_name,
        s.default_price,
        s.recurrence_type,
        s.recurrence_type_extended,
        s.is_active as service_active
      FROM client_services cs
      JOIN services s ON s.id = cs.service_id
      JOIN users u ON u.id = cs.client_user_id
      WHERE cs.status = 'active'
        AND u.is_active = 1
        AND s.is_active = TRUE
        AND (s.recurrence_type_extended IS NULL OR s.recurrence_type_extended NOT IN ('variable', 'on_demand'))
        AND s.recurrence_type <> 'custom'
      ORDER BY cs.client_user_id
    `);

    if (!clientServices || clientServices.length === 0) {
      console.log(`[${tenantSlug}] No hay clientes con servicios activos`);
      return;
    }

    // Agrupar servicios por cliente
    const clientsMap = new Map<number, ClientService[]>();
    for (const cs of clientServices as ClientService[]) {
      if (!clientsMap.has(cs.client_id)) {
        clientsMap.set(cs.client_id, []);
      }
      clientsMap.get(cs.client_id)!.push(cs);
    }

    console.log(`[${tenantSlug}] Procesando ${clientsMap.size} clientes con servicios activos`);

    let invoicesCreated = 0;
    let tasksCreated = 0;

    // 2. Para cada cliente, crear factura si no existe y agregar tareas
    for (const [clientId, services] of clientsMap.entries()) {
      // Verificar si ya existe una factura para este cliente en este mes
      const [existingInvoices]: any = await db.query(`
        SELECT id FROM monthly_invoices
        WHERE client_user_id = ?
          AND invoice_year = ?
          AND invoice_month = ?
      `, [clientId, year, month]);

      let invoiceId: number;

      if (existingInvoices && existingInvoices.length > 0) {
        // Ya existe la factura, usar su ID
        invoiceId = existingInvoices[0].id;
      } else {
        // Crear nueva factura
        const totalDue = services.reduce((sum, s) => sum + (s.custom_price || s.default_price), 0);

        // Verificar si el cliente tiene saldo prepagado
        const [clientBalance]: any = await db.query(`
          SELECT account_balance FROM clients_profiles WHERE user_id = ?
        `, [clientId]);

        const prepaidBalance = parseFloat(clientBalance[0]?.account_balance || 0);

        // Calcular cuánto del saldo aplicar
        let amountPaid = 0;
        let invoiceBalance = totalDue;
        let paymentStatus = 'pending';
        let remainingBalance = prepaidBalance;

        if (prepaidBalance > 0 && totalDue > 0) {
          if (prepaidBalance >= totalDue) {
            // Saldo cubre toda la factura
            amountPaid = totalDue;
            invoiceBalance = 0;
            paymentStatus = 'paid';
            remainingBalance = prepaidBalance - totalDue;
          } else {
            // Saldo cubre parcialmente
            amountPaid = prepaidBalance;
            invoiceBalance = totalDue - prepaidBalance;
            paymentStatus = 'partial';
            remainingBalance = 0;
          }

          // Actualizar saldo del cliente
          await db.query(`
            UPDATE clients_profiles SET account_balance = ? WHERE user_id = ?
          `, [remainingBalance, clientId]);

          console.log(`[${tenantSlug}] Cliente ${clientId}: Aplicado Q${amountPaid} de saldo prepagado a factura ${year}/${month}`);
        }

        const [invoiceResult]: any = await db.query(`
          INSERT INTO monthly_invoices (
            client_user_id,
            invoice_year,
            invoice_month,
            previous_debt,
            monthly_fee,
            extras_fee,
            total_due,
            amount_paid,
            balance,
            payment_status
          ) VALUES (?, ?, ?, 0, ?, 0, ?, ?, ?, ?)
        `, [clientId, year, month, totalDue, totalDue, amountPaid, invoiceBalance, paymentStatus]);

        invoiceId = invoiceResult.insertId;
        invoicesCreated++;
      }

      // 3. Para cada servicio del cliente, crear tarea si no existe
      for (const service of services) {
        // Verificar si ya existe una tarea para este servicio en esta factura
        const [existingTasks]: any = await db.query(`
          SELECT id FROM monthly_service_checklist
          WHERE invoice_id = ? AND service_id = ?
        `, [invoiceId, service.service_id]);

        if (!existingTasks || existingTasks.length === 0) {
          // Crear nueva tarea
          await db.query(`
            INSERT INTO monthly_service_checklist (
              invoice_id,
              task_name,
              status,
              service_id
            ) VALUES (?, ?, 'pending', ?)
          `, [invoiceId, service.service_name, service.service_id]);

          tasksCreated++;
        }
      }
    }

    console.log(`[${tenantSlug}] Generación completada:`);
    console.log(`  - Facturas creadas: ${invoicesCreated}`);
    console.log(`  - Tareas creadas: ${tasksCreated}`);

    return { invoicesCreated, tasksCreated };
  } catch (error: any) {
    console.error(`[${tenantSlug}] Error generando tareas:`, error.message);
    throw error;
  }
}

/**
 * Genera tareas para el mes actual de todos los tenants
 */
export async function generateTasksForAllTenants() {
  const tenantSlugs = Object.keys(env.tenants);

  for (const slug of tenantSlugs) {
    try {
      await generateMonthlyTasks(slug);
    } catch (error: any) {
      console.error(`[${slug}] Error en generación de tareas:`, error.message);
      // Continuar con el siguiente tenant aunque falle uno
    }
  }
}

/**
 * Genera tareas para el próximo mes (útil para ejecutar al final del mes actual)
 */
export async function generateNextMonthTasks() {
  const tenantSlugs = Object.keys(env.tenants);
  const now = new Date();
  const nextMonth = now.getMonth() + 2; // +1 para convertir a 1-12, +1 para mes siguiente
  const nextYear = nextMonth > 12 ? now.getFullYear() + 1 : now.getFullYear();
  const finalMonth = nextMonth > 12 ? 1 : nextMonth;

  console.log(`Generando tareas para el próximo mes: ${finalMonth}/${nextYear}`);

  for (const slug of tenantSlugs) {
    try {
      await generateMonthlyTasks(slug, nextYear, finalMonth);
    } catch (error: any) {
      console.error(`[${slug}] Error en generación de tareas del próximo mes:`, error.message);
    }
  }
}
