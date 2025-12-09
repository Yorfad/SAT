import { RequestHandler } from "express";

/**
 * GET /api/pool
 * Listar items del pool con filtros
 */
export const listPoolItems: RequestHandler = async (req: any, res: any) => {
  const { status, priority, assignedTo } = req.query;

  try {
    let query = `
      SELECT
        cp.id,
        cp.client_user_id,
        cp.invoice_id,
        cp.task_id,
        cp.service_id,
        cp.description,
        cp.priority,
        cp.status,
        cp.added_at,
        cp.started_at,
        cp.completed_at,
        cp.notes,
        client.full_name as client_name,
        client.email as client_email,
        added_by.full_name as added_by_name,
        assigned_to.full_name as assigned_to_name,
        completed_by.full_name as completed_by_name,
        s.service_name,
        cp_profile.sede,
        cp_profile.grupo
      FROM client_pool cp
      JOIN users client ON client.id = cp.client_user_id
      LEFT JOIN users added_by ON added_by.id = cp.added_by_user_id
      LEFT JOIN users assigned_to ON assigned_to.id = cp.assigned_to_user_id
      LEFT JOIN users completed_by ON completed_by.id = cp.completed_by_user_id
      LEFT JOIN services s ON s.id = cp.service_id
      LEFT JOIN clients_profiles cp_profile ON cp_profile.user_id = cp.client_user_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (status) {
      query += ` AND cp.status = ?`;
      params.push(status);
    }

    if (priority) {
      query += ` AND cp.priority = ?`;
      params.push(priority);
    }

    if (assignedTo) {
      if (assignedTo === 'me') {
        query += ` AND cp.assigned_to_user_id = ?`;
        params.push(req.user.id);
      } else if (assignedTo === 'unassigned') {
        query += ` AND cp.assigned_to_user_id IS NULL`;
      } else if (assignedTo !== 'all') {
        query += ` AND cp.assigned_to_user_id = ?`;
        params.push(parseInt(assignedTo));
      }
    }

    query += ` ORDER BY
      FIELD(cp.priority, 'urgente', 'alta', 'normal', 'baja'),
      cp.added_at DESC
    `;

    const [rows] = await req.db.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Error listando items del pool:', error);
    res.status(500).json({ error: 'Error al listar items del pool' });
  }
};

/**
 * POST /api/pool
 * Agregar item al pool
 */
export const addToPool: RequestHandler = async (req: any, res: any) => {
  const {
    clientUserId,
    invoiceId,
    taskId,
    serviceId,
    description,
    priority,
    notes
  } = req.body;

  const addedByUserId = req.user.id;

  try {
    const [result]: any = await req.db.query(
      `INSERT INTO client_pool
       (client_user_id, invoice_id, task_id, service_id, description, priority, added_by_user_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientUserId,
        invoiceId || null,
        taskId || null,
        serviceId || null,
        description,
        priority || 'normal',
        addedByUserId,
        notes || null
      ]
    );

    res.json({
      success: true,
      poolItemId: result.insertId,
      message: 'Item agregado al pool correctamente'
    });
  } catch (error) {
    console.error('Error agregando al pool:', error);
    res.status(500).json({ error: 'Error al agregar al pool' });
  }
};

/**
 * PATCH /api/pool/:id/take
 * Tomar un item del pool (asignarlo a uno mismo)
 */
export const takePoolItem: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Verificar que el item esté disponible
    const [items]: any = await req.db.query(
      `SELECT status, assigned_to_user_id FROM client_pool WHERE id = ?`,
      [id]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    const item = items[0];

    if (item.status !== 'pending') {
      return res.status(400).json({ error: 'Este item ya no está disponible' });
    }

    if (item.assigned_to_user_id && item.assigned_to_user_id !== userId) {
      return res.status(400).json({ error: 'Este item ya está asignado a otro usuario' });
    }

    await req.db.query(
      `UPDATE client_pool
       SET assigned_to_user_id = ?, status = 'in_progress', started_at = NOW()
       WHERE id = ?`,
      [userId, id]
    );

    res.json({ success: true, message: 'Tarea tomada correctamente' });
  } catch (error) {
    console.error('Error tomando item del pool:', error);
    res.status(500).json({ error: 'Error al tomar item' });
  }
};

/**
 * PATCH /api/pool/:id/complete
 * Completar un item del pool
 */
export const completePoolItem: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const { notes } = req.body;
  const userId = req.user.id;

  try {
    // Verificar que el usuario tenga asignado este item o sea admin
    const [items]: any = await req.db.query(
      `SELECT assigned_to_user_id, status FROM client_pool WHERE id = ?`,
      [id]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    const item = items[0];

    if (req.user.role !== 'admin' && item.assigned_to_user_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para completar este item' });
    }

    if (item.status === 'completed') {
      return res.status(400).json({ error: 'Este item ya está completado' });
    }

    await req.db.query(
      `UPDATE client_pool
       SET status = 'completed', completed_by_user_id = ?, completed_at = NOW(), notes = ?
       WHERE id = ?`,
      [userId, notes || null, id]
    );

    res.json({ success: true, message: 'Tarea completada correctamente' });
  } catch (error) {
    console.error('Error completando item:', error);
    res.status(500).json({ error: 'Error al completar item' });
  }
};

/**
 * PATCH /api/pool/:id/cancel
 * Cancelar un item del pool
 */
export const cancelPoolItem: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const { notes } = req.body;

  try {
    await req.db.query(
      `UPDATE client_pool SET status = 'cancelled', notes = ? WHERE id = ?`,
      [notes || null, id]
    );

    res.json({ success: true, message: 'Item cancelado correctamente' });
  } catch (error) {
    console.error('Error cancelando item:', error);
    res.status(500).json({ error: 'Error al cancelar item' });
  }
};

/**
 * GET /api/pool/stats
 * Obtener estadísticas del pool
 */
export const getPoolStats: RequestHandler = async (req: any, res: any) => {
  try {
    const [statusStats] = await req.db.query(
      `SELECT
        status,
        COUNT(*) as count
       FROM client_pool
       GROUP BY status`
    );

    const [priorityStats] = await req.db.query(
      `SELECT
        priority,
        COUNT(*) as count
       FROM client_pool
       WHERE status IN ('pending', 'in_progress')
       GROUP BY priority`
    );

    const [userStats] = await req.db.query(
      `SELECT
        u.id,
        u.full_name,
        COUNT(CASE WHEN cp.status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN cp.status = 'in_progress' THEN 1 END) as in_progress_count
       FROM users u
       LEFT JOIN client_pool cp ON cp.assigned_to_user_id = u.id
       WHERE u.role IN ('admin', 'employee')
       AND u.is_active = TRUE
       GROUP BY u.id, u.full_name
       ORDER BY completed_count DESC`
    );

    res.json({
      statusStats,
      priorityStats,
      userStats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas del pool:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
