import { Request, Response } from "express";

/**
 * GET /services
 * Lista servicios (globales + del workspace actual)
 */
export async function listServices(req: Request, res: Response) {
  try {
    const isConsolidated = (req as any).isConsolidatedView;
    const workspaceId = (req as any).workspaceId;
    const accessibleIds = (req as any).accessibleWorkspaceIds || [];

    let query = `
      SELECT
        id,
        workspace_id,
        service_name,
        description,
        default_price,
        operational_cost,
        recurrence_type,
        recurrence_type_extended,
        recurrence_days,
        activation_day,
        activation_window_days,
        requires_file,
        file_config,
        completion_determines_next,
        is_on_request,
        is_active,
        is_global,
        employee_notes,
        client_notes,
        assignment_type,
        visible_to_clients,
        allow_subscription,
        created_at
      FROM services
      WHERE is_active = TRUE
    `;
    const params: any[] = [];

    // Filtrar por workspace: mostrar globales + del workspace actual
    if (!isConsolidated && workspaceId) {
      query += ` AND (is_global = TRUE OR workspace_id = ?)`;
      params.push(workspaceId);
    } else if (isConsolidated && accessibleIds.length > 0) {
      const placeholders = accessibleIds.map(() => '?').join(',');
      query += ` AND (is_global = TRUE OR workspace_id IN (${placeholders}))`;
      params.push(...accessibleIds);
    }

    query += ` ORDER BY is_global DESC, service_name ASC`;

    const [rows] = await req.db!.query(query, params);
    res.json(rows);
  } catch (error: any) {
    console.error('Error listing services:', error);
    res.status(500).json({ message: 'Error al listar servicios', error: error.message });
  }
}

/**
 * GET /services/:id
 * Obtiene un servicio específico por ID
 */
export async function getService(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [rows]: any = await req.db!.query(`
      SELECT
        id,
        workspace_id,
        service_name,
        description,
        default_price,
        operational_cost,
        recurrence_type,
        recurrence_type_extended,
        recurrence_days,
        activation_day,
        activation_window_days,
        requires_file,
        file_config,
        completion_determines_next,
        is_on_request,
        is_active,
        is_global,
        employee_notes,
        client_notes,
        assignment_type,
        visible_to_clients,
        allow_subscription,
        created_at
      FROM services
      WHERE id = ?
    `, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error getting service:', error);
    res.status(500).json({ message: 'Error al obtener servicio', error: error.message });
  }
}

/**
 * POST /services
 * Crea un nuevo servicio
 */
export async function createService(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspaceId;
    const {
      service_name,
      description = null,
      default_price,
      operational_cost = 0,
      recurrence_type = 'monthly',
      recurrence_type_extended = 'monthly',
      recurrence_days = null,
      activation_day = 25,
      activation_window_days = 7,
      requires_file = true,
      file_config = 'required',
      completion_determines_next = false,
      is_on_request = false,
      is_active = true,
      is_global = false,
      employee_notes = null,
      client_notes = null,
      assignment_type = 'selected_clients',
      visible_to_clients = true,
      allow_subscription = false
    } = req.body;

    // Validaciones
    if (!service_name || default_price === undefined || default_price === null) {
      return res.status(400).json({ message: 'service_name y default_price son requeridos' });
    }

    if (completion_determines_next && activation_day !== null) {
      return res.status(400).json({
        message: 'Si completion_determines_next es true, activation_day debe ser null'
      });
    }

    if (recurrence_type === 'custom' && !recurrence_days) {
      return res.status(400).json({
        message: 'Para recurrence_type "custom", recurrence_days es requerido'
      });
    }

    const [result] = await req.db!.query(
      `INSERT INTO services (
        workspace_id,
        service_name,
        description,
        default_price,
        operational_cost,
        recurrence_type,
        recurrence_type_extended,
        recurrence_days,
        activation_day,
        activation_window_days,
        requires_file,
        file_config,
        completion_determines_next,
        is_on_request,
        is_active,
        is_global,
        employee_notes,
        client_notes,
        assignment_type,
        visible_to_clients,
        allow_subscription
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        is_global ? null : workspaceId,
        service_name,
        description,
        default_price,
        operational_cost,
        recurrence_type,
        recurrence_type_extended,
        recurrence_days,
        activation_day,
        activation_window_days,
        requires_file,
        file_config,
        completion_determines_next,
        is_on_request,
        is_active,
        is_global,
        employee_notes,
        client_notes,
        assignment_type,
        visible_to_clients,
        allow_subscription
      ]
    );

    res.status(201).json({ id: (result as any).insertId, message: 'Servicio creado exitosamente' });
  } catch (error: any) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Error al crear servicio', error: error.message });
  }
}

/**
 * PUT /services/:id
 * Actualiza un servicio (parcial o completo)
 */
export async function updateService(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body;

    // Verificar que el servicio existe
    const [existing]: any = await req.db!.query('SELECT * FROM services WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    const currentService = existing[0];

    // Merge: valores del body sobrescriben los actuales
    const completion_determines_next = body.completion_determines_next ?? currentService.completion_determines_next;
    const activation_day = body.activation_day !== undefined ? body.activation_day : currentService.activation_day;
    const recurrence_type = body.recurrence_type ?? currentService.recurrence_type;
    const recurrence_days = body.recurrence_days !== undefined ? body.recurrence_days : currentService.recurrence_days;

    // Validaciones
    if (completion_determines_next && activation_day !== null) {
      return res.status(400).json({
        message: 'Si completion_determines_next es true, activation_day debe ser null'
      });
    }

    if (recurrence_type === 'custom' && !recurrence_days) {
      return res.status(400).json({
        message: 'Para recurrence_type "custom", recurrence_days es requerido'
      });
    }

    // Campos actualizables
    const updatableFields = [
      'service_name', 'description', 'default_price', 'operational_cost',
      'recurrence_type', 'recurrence_type_extended', 'recurrence_days',
      'activation_day', 'activation_window_days', 'requires_file', 'file_config',
      'completion_determines_next', 'is_on_request', 'is_active',
      'employee_notes', 'client_notes', 'assignment_type',
      'visible_to_clients', 'allow_subscription'
    ];

    // Construir UPDATE dinámico solo con campos proporcionados
    const setClauses: string[] = [];
    const values: any[] = [];

    for (const field of updatableFields) {
      if (body[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    values.push(id);

    await req.db!.query(
      `UPDATE services SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Servicio actualizado exitosamente' });
  } catch (error: any) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Error al actualizar servicio', error: error.message });
  }
}

/**
 * PATCH /services/:id/status
 * Activa o desactiva un servicio
 */
export async function toggleServiceStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active debe ser boolean' });
    }

    const [result]: any = await req.db!.query(
      'UPDATE services SET is_active = ? WHERE id = ?',
      [is_active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    res.json({
      message: is_active ? 'Servicio activado exitosamente' : 'Servicio desactivado exitosamente'
    });
  } catch (error: any) {
    console.error('Error toggling service status:', error);
    res.status(500).json({ message: 'Error al cambiar estado del servicio', error: error.message });
  }
}

/**
 * DELETE /services/:id
 * Elimina un servicio (solo si no tiene tareas asociadas)
 */
export async function deleteService(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Verificar si hay tareas asociadas
    const [tasks]: any = await req.db!.query(
      'SELECT COUNT(*) as count FROM monthly_service_checklist WHERE service_id = ?',
      [id]
    );

    if (tasks[0].count > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar el servicio porque tiene tareas asociadas. Desactívalo en su lugar.'
      });
    }

    // Verificar si hay clientes con este servicio
    const [clients]: any = await req.db!.query(
      'SELECT COUNT(*) as count FROM client_services WHERE service_id = ?',
      [id]
    );

    if (clients[0].count > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar el servicio porque hay clientes que lo tienen asignado. Desactívalo en su lugar.'
      });
    }

    const [result]: any = await req.db!.query('DELETE FROM services WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    res.json({ message: 'Servicio eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Error al eliminar servicio', error: error.message });
  }
}
