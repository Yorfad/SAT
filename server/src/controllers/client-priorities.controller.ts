import { RequestHandler } from "express";

/**
 * GET /api/priorities
 * Listar prioridades de servicios por cliente
 */
export const listPriorities: RequestHandler = async (req: any, res: any) => {
  const { clientUserId, priority } = req.query;

  try {
    let query = `
      SELECT
        csp.id,
        csp.client_user_id,
        csp.service_id,
        csp.priority,
        csp.notes,
        csp.created_at,
        csp.updated_at,
        client.full_name as client_name,
        client.email as client_email,
        s.service_name,
        created_by.full_name as created_by_name
      FROM client_service_priorities csp
      JOIN users client ON client.id = csp.client_user_id
      LEFT JOIN services s ON s.id = csp.service_id
      LEFT JOIN users created_by ON created_by.id = csp.created_by_user_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (clientUserId) {
      query += ` AND csp.client_user_id = ?`;
      params.push(clientUserId);
    }

    if (priority) {
      query += ` AND csp.priority = ?`;
      params.push(priority);
    }

    query += ` ORDER BY
      FIELD(csp.priority, 'urgente', 'alta', 'normal', 'baja'),
      client.full_name ASC
    `;

    const [rows] = await req.db.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Error listando prioridades:', error);
    res.status(500).json({ error: 'Error al listar prioridades' });
  }
};

/**
 * POST /api/priorities
 * Crear o actualizar prioridad de servicio para un cliente
 */
export const setPriority: RequestHandler = async (req: any, res: any) => {
  const { clientUserId, serviceId, priority, notes } = req.body;
  const createdByUserId = req.user.id;

  try {
    // Verificar si ya existe una prioridad para este cliente/servicio
    const [existing]: any = await req.db.query(
      `SELECT id FROM client_service_priorities WHERE client_user_id = ? AND service_id = ?`,
      [clientUserId, serviceId || null]
    );

    if (existing.length > 0) {
      // Actualizar prioridad existente
      await req.db.query(
        `UPDATE client_service_priorities
         SET priority = ?, notes = ?, updated_at = NOW()
         WHERE id = ?`,
        [priority, notes || null, existing[0].id]
      );

      res.json({
        success: true,
        priorityId: existing[0].id,
        message: 'Prioridad actualizada correctamente'
      });
    } else {
      // Crear nueva prioridad
      const [result]: any = await req.db.query(
        `INSERT INTO client_service_priorities
         (client_user_id, service_id, priority, notes, created_by_user_id)
         VALUES (?, ?, ?, ?, ?)`,
        [clientUserId, serviceId || null, priority, notes || null, createdByUserId]
      );

      res.json({
        success: true,
        priorityId: result.insertId,
        message: 'Prioridad establecida correctamente'
      });
    }
  } catch (error) {
    console.error('Error estableciendo prioridad:', error);
    res.status(500).json({ error: 'Error al establecer prioridad' });
  }
};

/**
 * DELETE /api/priorities/:id
 * Eliminar prioridad
 */
export const deletePriority: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    await req.db.query(`DELETE FROM client_service_priorities WHERE id = ?`, [id]);

    res.json({ success: true, message: 'Prioridad eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando prioridad:', error);
    res.status(500).json({ error: 'Error al eliminar prioridad' });
  }
};

/**
 * GET /api/priorities/client/:clientId
 * Obtener todas las prioridades de un cliente específico
 */
export const getClientPriorities: RequestHandler = async (req: any, res: any) => {
  const { clientId } = req.params;

  try {
    const [priorities] = await req.db.query(
      `SELECT
        csp.id,
        csp.service_id,
        csp.priority,
        csp.notes,
        s.service_name,
        csp.created_at,
        csp.updated_at
       FROM client_service_priorities csp
       LEFT JOIN services s ON s.id = csp.service_id
       WHERE csp.client_user_id = ?
       ORDER BY FIELD(csp.priority, 'urgente', 'alta', 'normal', 'baja')`,
      [clientId]
    );

    res.json(priorities);
  } catch (error) {
    console.error('Error obteniendo prioridades del cliente:', error);
    res.status(500).json({ error: 'Error al obtener prioridades' });
  }
};
