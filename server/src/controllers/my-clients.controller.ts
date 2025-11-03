import { Request, Response } from "express";
import { decrypt } from "../utils/encryption";

/**
 * GET /api/my-clients/:clientId/omisos
 *
 * Obtiene todos los omisos (activos y resueltos) de un cliente específico
 */
export async function getClientOmisos(req: Request, res: Response) {
  try {
    const { clientId } = req.params;
    const db = req.db!;

    const [omisos]: any = await db.query(`
      SELECT
        co.id,
        co.motivo,
        co.archivo_path,
        co.estado,
        co.task_id,
        co.created_at,
        co.resolved_at,
        co.resolved_by_user_id,
        u.full_name as resolved_by_name
      FROM client_omisos co
      LEFT JOIN users u ON u.id = co.resolved_by_user_id
      WHERE co.client_id = ?
      ORDER BY co.created_at DESC
    `, [clientId]);

    res.json(omisos || []);
  } catch (error: any) {
    console.error('Error fetching client omisos:', error);
    res.status(500).json({
      message: 'Error al obtener omisos del cliente',
      error: error.message
    });
  }
}

/**
 * POST /api/my-clients/:clientId/omisos
 *
 * Activa un omiso para un cliente:
 * 1. Guarda el archivo y motivo
 * 2. Crea una tarea de tipo "omisos"
 * 3. Vincula el omiso con la tarea
 */
export async function activateClientOmiso(req: Request, res: Response) {
  try {
    const { clientId } = req.params;
    const { motivo } = req.body;
    const file = (req as any).file;
    const userId = (req as any).user.sub;
    const db = req.db!;

    if (!motivo || !motivo.trim()) {
      return res.status(400).json({ message: 'El motivo del omiso es obligatorio' });
    }

    if (!file) {
      return res.status(400).json({ message: 'Debe subir un archivo con el omiso' });
    }

    // Obtener la factura del mes actual para este cliente
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const [invoices]: any = await db.query(`
      SELECT id FROM monthly_invoices
      WHERE client_user_id = ? AND invoice_month = ? AND invoice_year = ?
      LIMIT 1
    `, [clientId, month, year]);

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({
        message: 'No se encontró factura para este cliente en el mes actual'
      });
    }

    const invoiceId = invoices[0].id;

    // Crear la tarea de omiso
    const [taskResult]: any = await db.query(`
      INSERT INTO monthly_service_checklist
        (invoice_id, task_name, status, file_path, file_type)
      VALUES (?, 'omisos', 'pending', ?, ?)
    `, [invoiceId, file.filename, file.mimetype]);

    const taskId = taskResult.insertId;

    // Crear el registro de omiso
    const [omisoResult]: any = await db.query(`
      INSERT INTO client_omisos
        (client_id, motivo, archivo_path, estado, task_id)
      VALUES (?, ?, ?, 'activo', ?)
    `, [clientId, motivo.trim(), file.filename, taskId]);

    const omisoId = omisoResult.insertId;

    // Vincular la tarea con el omiso
    await db.query(`
      UPDATE monthly_service_checklist
      SET omiso_id = ?
      WHERE id = ?
    `, [omisoId, taskId]);

    console.log(`[OMISO] Creado omiso ${omisoId} para cliente ${clientId}, tarea ${taskId}`);

    res.json({
      ok: true,
      message: 'Omiso activado exitosamente',
      omiso_id: omisoId,
      task_id: taskId
    });
  } catch (error: any) {
    console.error('Error activating omiso:', error);
    res.status(500).json({
      message: 'Error al activar el omiso',
      error: error.message
    });
  }
}

/**
 * GET /api/my-clients
 *
 * Retorna TODOS los clientes asignados al usuario logueado (admin o employee)
 * junto con sus servicios/tareas del mes ACTUAL.
 *
 * Los clientes son fijos (no cambian por mes), solo las tareas cambian.
 *
 * Respuesta: Array de clientes con sus servicios del mes actual
 */
export async function getMyAssignedClients(req: Request, res: Response) {
  try {
    const userId = (req as any).user.sub;
    // Siempre usar el mes/año actual del servidor
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    console.log(`[MY-CLIENTS] Usuario ${userId} consultando clientes para ${month}/${year}`);

    // Query para obtener clientes asignados con todos sus servicios
    const [clients]: any = await (req as any).db!.query(`
      SELECT
        u.id AS client_id,
        u.full_name AS client_name,
        u.email AS client_email,
        u.nit AS client_nit,
        cp.contract_number,
        cp.sat_password_encrypted,
        cp.overall_rating,
        cp.notes
      FROM users u
      LEFT JOIN clients_profiles cp ON cp.user_id = u.id
      WHERE u.role = 'client'
        AND u.assigned_to_user_id = ?
        AND u.is_active = 1
      ORDER BY u.full_name ASC
    `, [userId]);

    console.log(`[MY-CLIENTS] Encontrados ${clients.length} clientes asignados`);

    if (!clients || clients.length === 0) {
      return res.json([]);
    }

    // Descifrar contraseñas SAT de cada cliente
    clients.forEach((client: any) => {
      if (client.sat_password_encrypted) {
        try {
          client.sat_password_decrypted = decrypt(client.sat_password_encrypted);
        } catch (e) {
          console.warn(`No se pudo descifrar contraseña SAT para cliente ${client.client_id}`);
          client.sat_password_decrypted = null;
        }
      } else {
        client.sat_password_decrypted = null;
      }
    });

    // Para cada cliente, obtener sus servicios/tareas del mes especificado
    const clientIds = clients.map((c: any) => c.client_id);

    // Obtener facturas del mes para estos clientes
    const [invoices]: any = await (req as any).db!.query(`
      SELECT
        mi.id AS invoice_id,
        mi.client_user_id,
        mi.invoice_month,
        mi.invoice_year,
        mi.payment_status,
        mi.total_due,
        mi.amount_paid,
        mi.balance,
        mi.observations
      FROM monthly_invoices mi
      WHERE mi.client_user_id IN (?)
        AND mi.invoice_month = ?
        AND mi.invoice_year = ?
    `, [clientIds, month, year]);

    // Crear mapa de facturas por cliente
    const invoiceMap = new Map();
    invoices.forEach((inv: any) => {
      invoiceMap.set(inv.client_user_id, inv);
    });

    // Obtener todas las tareas/servicios de estas facturas
    const invoiceIds = invoices.map((inv: any) => inv.invoice_id);

    let tasks: any[] = [];
    if (invoiceIds.length > 0) {
      const [taskRows]: any = await (req as any).db!.query(`
        SELECT
          msc.id AS task_id,
          msc.invoice_id,
          msc.task_name,
          msc.status,
          msc.completed_by_user_id,
          msc.completion_date,
          msc.next_payment_date,
          mi.client_user_id,
          mi.invoice_month,
          mi.invoice_year,
          -- Calcular rango de activación
          CASE
            WHEN s.completion_determines_next = TRUE AND msc.next_payment_date IS NOT NULL THEN
              -- Para libros: mostrar la fecha específica
              DATE_FORMAT(msc.next_payment_date, '%d/%m/%Y')
            WHEN s.activation_day IS NOT NULL THEN
              -- Para servicios mensuales: calcular rango
              CONCAT(
                -- Inicio: activation_day - activation_window_days del mes actual
                LPAD(GREATEST(1, s.activation_day - s.activation_window_days), 2, '0'), '/',
                LPAD(mi.invoice_month, 2, '0'), '/', mi.invoice_year,
                ' - ',
                -- Fin: primeros días del mes siguiente
                '05/',
                LPAD(IF(mi.invoice_month = 12, 1, mi.invoice_month + 1), 2, '0'), '/',
                IF(mi.invoice_month = 12, mi.invoice_year + 1, mi.invoice_year)
              )
            ELSE NULL
          END AS activation_range
        FROM monthly_service_checklist msc
        JOIN monthly_invoices mi ON mi.id = msc.invoice_id
        LEFT JOIN services s ON s.id = msc.service_id
        WHERE msc.invoice_id IN (?)
        ORDER BY msc.task_name ASC
      `, [invoiceIds]);
      tasks = taskRows || [];
    }

    // Obtener información de omisos para todas las tareas
    const taskIds = tasks.map((t: any) => t.task_id);
    let omisosMap = new Map();

    if (taskIds.length > 0) {
      try {
        const [omisosRows]: any = await (req as any).db!.query(`
          SELECT task_id, value
          FROM task_omisos
          WHERE task_id IN (?)
        `, [taskIds]);

        omisosRows.forEach((o: any) => {
          omisosMap.set(o.task_id, o.value);
        });
      } catch (e) {
        console.warn('Tabla task_omisos no existe aún');
      }
    }

    // Obtener archivos subidos por tarea
    let filesMap = new Map();
    if (invoiceIds.length > 0) {
      try {
        const [filesRows]: any = await (req as any).db!.query(`
          SELECT
            invoice_id,
            COUNT(*) AS file_count
          FROM invoice_files
          WHERE invoice_id IN (?)
          GROUP BY invoice_id
        `, [invoiceIds]);

        filesRows.forEach((f: any) => {
          filesMap.set(f.invoice_id, f.file_count);
        });
      } catch (e) {
        console.warn('Error al obtener archivos');
      }
    }

    // Organizar tareas por cliente
    const tasksByClient = new Map();
    tasks.forEach((task: any) => {
      const clientId = task.client_user_id;
      if (!tasksByClient.has(clientId)) {
        tasksByClient.set(clientId, []);
      }

      tasksByClient.get(clientId).push({
        task_id: task.task_id,
        task_name: task.task_name,
        status: task.status,
        completed_by: task.completed_by_user_id,
        completion_date: task.completion_date,
        next_payment_date: task.next_payment_date,
        activation_range: task.activation_range,
        omisos_value: omisosMap.get(task.task_id) || false
      });
    });

    // Obtener omisos activos de todos los clientes
    let omisosActivosMap = new Map();
    if (clientIds.length > 0) {
      try {
        const [omisosRows]: any = await (req as any).db!.query(`
          SELECT client_id, COUNT(*) as active_omisos
          FROM client_omisos
          WHERE client_id IN (?) AND estado = 'activo'
          GROUP BY client_id
        `, [clientIds]);

        omisosRows.forEach((o: any) => {
          omisosActivosMap.set(o.client_id, o.active_omisos);
        });
      } catch (e) {
        console.warn('Error al obtener omisos activos');
      }
    }

    // Construir respuesta final
    const result = clients.map((client: any) => {
      const invoice = invoiceMap.get(client.client_id);
      const clientTasks = tasksByClient.get(client.client_id) || [];
      const fileCount = invoice ? (filesMap.get(invoice.invoice_id) || 0) : 0;
      const activeOmisos = omisosActivosMap.get(client.client_id) || 0;

      return {
        client_id: client.client_id,
        client_name: client.client_name,
        client_email: client.client_email,
        client_nit: client.client_nit,
        contract_number: client.contract_number,
        sat_password: client.sat_password_decrypted, // Contraseña ya descifrada
        overall_rating: client.overall_rating,
        notes: client.notes,
        has_active_omisos: activeOmisos > 0,
        active_omisos_count: activeOmisos,
        invoice: invoice ? {
          invoice_id: invoice.invoice_id,
          payment_status: invoice.payment_status,
          total_due: invoice.total_due,
          amount_paid: invoice.amount_paid,
          balance: invoice.balance,
          observations: invoice.observations,
          file_count: fileCount
        } : null,
        services: clientTasks,
        // Resumen rápido
        summary: {
          total_tasks: clientTasks.length,
          completed_tasks: clientTasks.filter((t: any) => t.status === 'completed').length,
          pending_tasks: clientTasks.filter((t: any) => t.status === 'pending').length
        }
      };
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching assigned clients:', error);
    res.status(500).json({
      message: 'Error al obtener clientes asignados',
      error: error.message
    });
  }
}
