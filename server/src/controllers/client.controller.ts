import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { encrypt } from "../utils/encryption";
import { WorkspaceService } from "../services/workspace.service";
import { buildWorkspaceFilter } from "../middleware/resolveWorkspace";

// Función para generar contraseña aleatoria segura
function generateSecurePassword(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function listClients(req: Request, res: Response) {
  const isConsolidated = req.isConsolidatedView;
  const workspaceId = req.workspaceId;
  const userId = (req as any).user?.id;

  let query = `
    SELECT u.id, u.full_name, u.email, u.nit, u.role, u.is_active,
           cp.phone_number, cp.workspace_id, cp.active_infractions_count,
           w.name as workspace_name, w.color as workspace_color
    FROM users u
    LEFT JOIN clients_profiles cp ON cp.user_id = u.id
    LEFT JOIN workspaces w ON w.id = cp.workspace_id
    WHERE u.role='client'
  `;

  const params: any[] = [];

  // Filtrar por workspace
  if (!isConsolidated && workspaceId) {
    query += ` AND cp.workspace_id = ?`;
    params.push(workspaceId);
  } else if (isConsolidated && userId) {
    // En vista consolidada, filtrar por workspaces accesibles
    const workspaceService = new WorkspaceService(req.db!);
    const accessibleIds = await workspaceService.getAccessibleWorkspaceIds(userId);
    if (accessibleIds.length > 0) {
      const placeholders = accessibleIds.map(() => '?').join(',');
      query += ` AND cp.workspace_id IN (${placeholders})`;
      params.push(...accessibleIds);
    }
  }

  query += ` ORDER BY u.full_name`;

  const [rows] = await req.db!.query(query, params);
  res.json(rows);
}

export async function getClientById(req: Request, res: Response) {
const { id } = req.params;
const me = (req as any).user;
if (me.role === "client" && Number(me.sub) !== Number(id)) return res.status(403).json({ message: "No autorizado" });


const [[client]]: any = await req.db!.query(
`SELECT id, full_name, email, nit, role, is_active FROM users WHERE id=? AND role='client'`, [id]
);
if (!client) return res.status(404).json({ message: "Cliente no encontrado" });


const [[profile]]: any = await req.db!.query(
`SELECT contract_number, overall_rating, notes, phone_number, birth_date FROM clients_profiles WHERE user_id=?`, [id]
);


const [invoices] = await req.db!.query(
`SELECT id, invoice_year, invoice_month, previous_debt, monthly_fee, extras_fee, total_due, amount_paid, balance, payment_status, services_status, due_date, created_at
FROM monthly_invoices WHERE client_user_id=? ORDER BY invoice_year DESC, invoice_month DESC LIMIT 24`,
[id]
);
res.json({ client, profile: profile || null, invoices });
}

export async function upsertClientProfile(req: Request, res: Response) {
  const { id } = req.params;
  const { contract_number = null, sat_password, overall_rating = null, notes = null } = req.body;
  const workspaceId = req.workspaceId;

  // Verificar que el usuario existe
  const [[user]]: any = await req.db!.query(`SELECT id FROM users WHERE id=? AND role='client'`, [id]);
  if (!user) {
    return res.status(404).json({ message: 'Cliente no encontrado' });
  }

  const [[exists]]: any = await req.db!.query(`SELECT user_id FROM clients_profiles WHERE user_id=?`, [id]);
  const satEnc = sat_password ? encrypt(sat_password) : null;

  if (exists) {
    await req.db!.query(
      `UPDATE clients_profiles
      SET contract_number=COALESCE(?, contract_number),
      ${satEnc ? "sat_password_encrypted=?" : "sat_password_encrypted=sat_password_encrypted"},
      overall_rating=COALESCE(?, overall_rating),
      notes=COALESCE(?, notes)
      WHERE user_id=?`,
      satEnc ? [contract_number, satEnc, overall_rating, notes, id] : [contract_number, overall_rating, notes, id]
    );
  } else {
    // Al crear nuevo perfil, asignar workspace
    await req.db!.query(
      `INSERT INTO clients_profiles (user_id, workspace_id, contract_number, sat_password_encrypted, overall_rating, notes) VALUES (?,?,?,?,?,?)`,
      [id, workspaceId, contract_number, satEnc, overall_rating, notes]
    );
  }
  res.json({ ok: true });
}

export async function listClientServices(req: Request, res: Response) {
const { id } = req.params;
const [rows] = await req.db!.query(
`SELECT cs.id, s.service_name, s.description, COALESCE(cs.custom_price, s.default_price) AS price, cs.status, cs.start_date
FROM client_services cs JOIN services s ON s.id=cs.service_id
WHERE cs.client_user_id=? ORDER BY s.service_name`,
[id]
);
res.json(rows);
}

export async function addClientService(req: Request, res: Response) {
const { id } = req.params;
const { service_id, custom_price = null, start_date } = req.body;
const [r] = await req.db!.query(
`INSERT INTO client_services (client_user_id, service_id, custom_price, start_date) VALUES (?,?,?,?)`,
[id, service_id, custom_price, start_date]
);
res.status(201).json({ id: (r as any).insertId });
}

export async function cancelClientServiceById(req: Request, res: Response) {
const { csId } = req.params;
await req.db!.query(`UPDATE client_services SET status='cancelled' WHERE id=?`, [csId]);
res.json({ ok: true });
}

export async function getClientDashboard(req: Request, res: Response) {
  const user = (req as any).user || {};
  const clientId = user.sub ?? user.id; // por si tu JWT usa sub o id

  if (!clientId) return res.status(400).json({ message: "No user id in token" });

  // Facturas del cliente (últimas 12)
  const [invoices] = await req.db!.query(
    `SELECT id, invoice_year, invoice_month, total_due, amount_paid, balance, payment_status
     FROM monthly_invoices
     WHERE client_user_id=?
     ORDER BY invoice_year DESC, invoice_month DESC
     LIMIT 12`,
    [clientId]
  );

  // Servicios activos del cliente
  const [services] = await req.db!.query(
    `SELECT cs.id, s.service_name, s.description,
            COALESCE(cs.custom_price, s.default_price) AS custom_price,
            s.default_price, cs.status, cs.start_date
     FROM client_services cs
     JOIN services s ON s.id = cs.service_id
     WHERE cs.client_user_id = ? AND cs.status = 'active'
     ORDER BY s.service_name`,
    [clientId]
  );

  // Información del perfil con saldo y infracciones
  const [profile] = await req.db!.query(
    `SELECT cp.overall_rating, cp.phone_number, cp.account_balance, cp.active_infractions_count,
            u.full_name, u.nit, u.email, u.is_active, u.services_disabled_by_infractions
     FROM users u
     LEFT JOIN clients_profiles cp ON cp.user_id = u.id
     WHERE u.id = ?`,
    [clientId]
  );

  // Infracciones activas del cliente
  const [infractions] = await req.db!.query(
    `SELECT ci.id, ci.infraction_type, ci.reason, ci.created_at,
            ci.related_invoice_id, mi.invoice_year, mi.invoice_month
     FROM client_infractions ci
     LEFT JOIN monthly_invoices mi ON mi.id = ci.related_invoice_id
     WHERE ci.client_user_id = ? AND ci.is_active = TRUE
     ORDER BY ci.created_at DESC`,
    [clientId]
  );

  res.json({
    invoices,
    services,
    profile: (profile as any[])[0] || null,
    infractions
  });
}

/**
 * POST /clients/:id/deactivate
 * Desactiva completamente un cliente
 */
export async function deactivateClient(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user.sub;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'El motivo de desactivación es requerido' });
    }

    // Verificar que el cliente existe
    const [[client]]: any = await req.db!.query(
      'SELECT id, full_name FROM users WHERE id = ? AND role = "client"',
      [id]
    );

    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Desactivar el cliente
    await req.db!.query(
      `UPDATE users
       SET is_active = 0,
           deactivation_reason = ?,
           deactivated_at = NOW(),
           deactivated_by_user_id = ?
       WHERE id = ?`,
      [reason, userId, id]
    );

    console.log(`[DEACTIVATION] Cliente ${client.full_name} (ID: ${id}) desactivado por usuario ${userId}. Motivo: ${reason}`);

    res.json({
      ok: true,
      message: `Cliente ${client.full_name} desactivado exitosamente`
    });
  } catch (error: any) {
    console.error('Error deactivating client:', error);
    res.status(500).json({ message: 'Error al desactivar cliente', error: error.message });
  }
}

/**
 * POST /clients/:id/activate
 * Reactiva un cliente desactivado
 */
export async function activateClient(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.sub;

    // Verificar que el cliente existe
    const [[client]]: any = await req.db!.query(
      'SELECT id, full_name FROM users WHERE id = ? AND role = "client"',
      [id]
    );

    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Activar el cliente y limpiar campos de desactivación
    await req.db!.query(
      `UPDATE users
       SET is_active = 1,
           deactivation_reason = NULL,
           deactivated_at = NULL,
           deactivated_by_user_id = NULL
       WHERE id = ?`,
      [id]
    );

    console.log(`[ACTIVATION] Cliente ${client.full_name} (ID: ${id}) reactivado por usuario ${userId}`);

    res.json({
      ok: true,
      message: `Cliente ${client.full_name} activado exitosamente`
    });
  } catch (error: any) {
    console.error('Error activating client:', error);
    res.status(500).json({ message: 'Error al activar cliente', error: error.message });
  }
}

/**
 * POST /clients/:id/services/:serviceId/deactivate
 * Desactiva un servicio específico de un cliente
 */
export async function deactivateClientService(req: Request, res: Response) {
  try {
    const { id: clientId, serviceId } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user.sub;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'El motivo de desactivación es requerido' });
    }

    // Verificar que el servicio del cliente existe
    const [[clientService]]: any = await req.db!.query(
      `SELECT cs.id, s.service_name, u.full_name as client_name
       FROM client_services cs
       JOIN services s ON s.id = cs.service_id
       JOIN users u ON u.id = cs.client_user_id
       WHERE cs.client_user_id = ? AND cs.service_id = ?`,
      [clientId, serviceId]
    );

    if (!clientService) {
      return res.status(404).json({ message: 'Servicio del cliente no encontrado' });
    }

    // Desactivar el servicio
    await req.db!.query(
      `UPDATE client_services
       SET status = 'inactive',
           deactivation_reason = ?,
           deactivated_at = NOW(),
           deactivated_by_user_id = ?
       WHERE client_user_id = ? AND service_id = ?`,
      [reason, userId, clientId, serviceId]
    );

    console.log(`[SERVICE-DEACTIVATION] Servicio "${clientService.service_name}" desactivado para cliente ${clientService.client_name}. Motivo: ${reason}`);

    res.json({
      ok: true,
      message: `Servicio "${clientService.service_name}" desactivado exitosamente`
    });
  } catch (error: any) {
    console.error('Error deactivating client service:', error);
    res.status(500).json({ message: 'Error al desactivar servicio', error: error.message });
  }
}

/**
 * POST /clients/:id/services/:serviceId/activate
 * Reactiva un servicio específico de un cliente
 */
export async function activateClientService(req: Request, res: Response) {
  try {
    const { id: clientId, serviceId } = req.params;
    const userId = (req as any).user.sub;

    // Verificar que el servicio del cliente existe
    const [[clientService]]: any = await req.db!.query(
      `SELECT cs.id, s.service_name, u.full_name as client_name
       FROM client_services cs
       JOIN services s ON s.id = cs.service_id
       JOIN users u ON u.id = cs.client_user_id
       WHERE cs.client_user_id = ? AND cs.service_id = ?`,
      [clientId, serviceId]
    );

    if (!clientService) {
      return res.status(404).json({ message: 'Servicio del cliente no encontrado' });
    }

    // Activar el servicio y limpiar campos de desactivación
    await req.db!.query(
      `UPDATE client_services
       SET status = 'active',
           deactivation_reason = NULL,
           deactivated_at = NULL,
           deactivated_by_user_id = NULL
       WHERE client_user_id = ? AND service_id = ?`,
      [clientId, serviceId]
    );

    console.log(`[SERVICE-ACTIVATION] Servicio "${clientService.service_name}" reactivado para cliente ${clientService.client_name} por usuario ${userId}`);

    res.json({
      ok: true,
      message: `Servicio "${clientService.service_name}" activado exitosamente`
    });
  } catch (error: any) {
    console.error('Error activating client service:', error);
    res.status(500).json({ message: 'Error al activar servicio', error: error.message });
  }
}

// ===============================
// ENDPOINTS PARA CLIENTE MÓVIL
// ===============================

/**
 * GET /clients/my-tasks
 * Obtiene las tareas del cliente autenticado para la app móvil
 */
export async function getClientTasks(req: Request, res: Response) {
  try {
    const clientId = (req as any).user?.sub || (req as any).user?.id;

    if (!clientId) {
      return res.status(400).json({ message: "No user id in token" });
    }

    // Obtener tareas del cliente a través de la relación con monthly_invoices
    const [tasks]: any = await req.db!.query(
      `SELECT
        msc.id,
        msc.task_name,
        msc.status,
        msc.file_path,
        msc.client_approved,
        msc.client_approved_at,
        msc.client_rejection_reason,
        msc.files_uploaded_at,
        msc.auto_approve_days,
        msc.auto_approved,
        mi.invoice_month,
        mi.invoice_year,
        s.service_name
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.invoice_id
      LEFT JOIN services s ON s.id = msc.service_id
      WHERE mi.client_user_id = ?
      ORDER BY mi.invoice_year DESC, mi.invoice_month DESC, msc.id DESC`,
      [clientId]
    );

    res.json({ tasks });
  } catch (error: any) {
    console.error('Error getting client tasks:', error);
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
}

/**
 * POST /clients/tasks/:id/approve
 * Aprueba una tarea completada
 */
export async function approveTask(req: Request, res: Response) {
  try {
    const { id: taskId } = req.params;
    const clientId = (req as any).user?.sub || (req as any).user?.id;

    // Verificar que la tarea existe y pertenece al cliente (a través de invoice)
    const [[task]]: any = await req.db!.query(
      `SELECT msc.id, mi.client_user_id, msc.status, msc.client_approved
       FROM monthly_service_checklist msc
       JOIN monthly_invoices mi ON mi.id = msc.invoice_id
       WHERE msc.id = ?`,
      [taskId]
    );

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    if (task.client_user_id !== clientId) {
      return res.status(403).json({ message: 'No autorizado para aprobar esta tarea' });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Solo se pueden aprobar tareas completadas' });
    }

    if (task.client_approved !== null) {
      return res.status(400).json({ message: 'Esta tarea ya fue revisada' });
    }

    // Aprobar la tarea
    await req.db!.query(
      `UPDATE monthly_service_checklist
       SET client_approved = TRUE,
           client_approved_at = NOW(),
           auto_approved = FALSE
       WHERE id = ?`,
      [taskId]
    );

    res.json({ ok: true, message: 'Tarea aprobada exitosamente' });
  } catch (error: any) {
    console.error('Error approving task:', error);
    res.status(500).json({ message: 'Error al aprobar tarea', error: error.message });
  }
}

/**
 * POST /clients/tasks/:id/reject
 * Rechaza una tarea con motivo
 */
export async function rejectTask(req: Request, res: Response) {
  try {
    const { id: taskId } = req.params;
    const { reason } = req.body;
    const clientId = (req as any).user?.sub || (req as any).user?.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'El motivo del rechazo es requerido' });
    }

    // Verificar que la tarea existe y pertenece al cliente (a través de invoice)
    const [[task]]: any = await req.db!.query(
      `SELECT msc.id, mi.client_user_id, msc.status, msc.client_approved
       FROM monthly_service_checklist msc
       JOIN monthly_invoices mi ON mi.id = msc.invoice_id
       WHERE msc.id = ?`,
      [taskId]
    );

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    if (task.client_user_id !== clientId) {
      return res.status(403).json({ message: 'No autorizado para rechazar esta tarea' });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Solo se pueden rechazar tareas completadas' });
    }

    if (task.client_approved !== null) {
      return res.status(400).json({ message: 'Esta tarea ya fue revisada' });
    }

    // Rechazar la tarea
    await req.db!.query(
      `UPDATE monthly_service_checklist
       SET client_approved = FALSE,
           client_approved_at = NOW(),
           client_rejection_reason = ?,
           status = 'pending'
       WHERE id = ?`,
      [reason, taskId]
    );

    res.json({ ok: true, message: 'Problema reportado exitosamente' });
  } catch (error: any) {
    console.error('Error rejecting task:', error);
    res.status(500).json({ message: 'Error al reportar problema', error: error.message });
  }
}

/**
 * POST /clients/request-service
 * Solicita un nuevo servicio
 */
export async function requestService(req: Request, res: Response) {
  try {
    const { service_id, description } = req.body;
    const clientId = (req as any).user?.sub || (req as any).user?.id;

    if (!service_id && (!description || description.trim().length === 0)) {
      return res.status(400).json({ message: 'Debe seleccionar un servicio o proporcionar una descripción' });
    }

    // Insertar la solicitud
    const [result]: any = await req.db!.query(
      `INSERT INTO service_requests (client_user_id, service_id, request_description, status, created_at)
       VALUES (?, ?, ?, 'pending', NOW())`,
      [clientId, service_id || null, description || null]
    );

    res.status(201).json({
      ok: true,
      id: result.insertId,
      message: 'Solicitud enviada exitosamente'
    });
  } catch (error: any) {
    console.error('Error requesting service:', error);
    res.status(500).json({ message: 'Error al enviar solicitud', error: error.message });
  }
}

/**
 * GET /clients/available-services
 * Lista los servicios disponibles que el cliente puede solicitar
 */
export async function getAvailableServices(req: Request, res: Response) {
  try {
    const clientId = (req as any).user?.sub || (req as any).user?.id;

    // Obtener servicios disponibles que:
    // 1. Están activos
    // 2. Son de tipo 'on_request' o 'selected_clients'
    // 3. El cliente NO tiene asignados actualmente
    const [services]: any = await req.db!.query(
      `SELECT s.id, s.service_name, s.description, s.default_price
       FROM services s
       WHERE s.is_active = 1
         AND s.assignment_type IN ('on_request', 'selected_clients')
         AND s.id NOT IN (
           SELECT cs.service_id FROM client_services cs
           WHERE cs.client_user_id = ? AND cs.status = 'active'
         )
       ORDER BY s.service_name`,
      [clientId]
    );

    res.json({ services });
  } catch (error: any) {
    console.error('Error getting available services:', error);
    res.status(500).json({ message: 'Error al obtener servicios', error: error.message });
  }
}

/**
 * POST /clients/:id/reset-password
 * Genera una contraseña temporal que el cliente DEBE cambiar al iniciar sesión
 * Solo accesible por admin/superadmin
 */
export async function resetClientPassword(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const adminUserId = (req as any).user?.sub;

    // Verificar que el cliente existe y es role='client'
    const [[client]]: any = await req.db!.query(
      'SELECT id, full_name, nit, email FROM users WHERE id = ? AND role = "client"',
      [id]
    );

    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // SIEMPRE generar contraseña temporal aleatoria
    const temporaryPassword = generateSecurePassword(8);

    // Hashear la contraseña temporal
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Actualizar contraseña y marcar como TEMPORAL (debe cambiarla)
    await req.db!.query(
      `UPDATE users SET
        password_hash = ?,
        must_change_password = TRUE,
        password_changed_at = NULL
       WHERE id = ?`,
      [passwordHash, id]
    );

    // Registrar en historial
    await req.db!.query(
      `INSERT INTO password_history (user_id, action, performed_by, ip_address)
       VALUES (?, 'reset_by_admin', ?, ?)`,
      [id, adminUserId, req.ip]
    );

    console.log(`[PASSWORD-RESET] Contraseña temporal generada para ${client.full_name} (ID: ${id}) por admin ${adminUserId}`);

    res.json({
      success: true,
      message: 'Contraseña temporal generada',
      client: {
        id: client.id,
        full_name: client.full_name,
        nit: client.nit,
        email: client.email
      },
      temporaryPassword: temporaryPassword,
      instructions: [
        `1. Comunique esta contraseña temporal al cliente: ${temporaryPassword}`,
        '2. El cliente deberá cambiarla obligatoriamente al iniciar sesión',
        '3. Esta contraseña no se mostrará nuevamente',
        '4. El cliente también puede restablecer desde "Olvidé mi contraseña" si tiene email'
      ]
    });
  } catch (error: any) {
    console.error('Error resetting client password:', error);
    res.status(500).json({ message: 'Error al restablecer contraseña', error: error.message });
  }
}