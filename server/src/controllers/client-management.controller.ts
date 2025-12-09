import { RequestHandler } from "express";

/**
 * GET /api/admin/clients
 * Listar clientes con filtros (sede, grupo, asignación, etc.)
 */
export const listClients: RequestHandler = async (req: any, res: any) => {
  const { sede, grupo, assignedTo, isActive, searchTerm } = req.query;

  try {
    let query = `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.nit,
        u.phone_number,
        u.is_active,
        u.assigned_to_user_id,
        u.services_disabled_by_infractions,
        assigned_user.full_name as assigned_to_name,
        cp.contract_number,
        cp.sede,
        cp.grupo,
        cp.overall_rating,
        cp.active_infractions_count
      FROM users u
      LEFT JOIN users assigned_user ON assigned_user.id = u.assigned_to_user_id
      LEFT JOIN clients_profiles cp ON cp.user_id = u.id
      WHERE u.role = 'client'
    `;

    const params: any[] = [];

    if (sede) {
      query += ` AND cp.sede = ?`;
      params.push(sede);
    }

    if (grupo) {
      query += ` AND cp.grupo = ?`;
      params.push(grupo);
    }

    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        query += ` AND u.assigned_to_user_id IS NULL`;
      } else if (assignedTo !== 'all') {
        query += ` AND u.assigned_to_user_id = ?`;
        params.push(parseInt(assignedTo));
      }
    }

    if (isActive !== undefined) {
      query += ` AND u.is_active = ?`;
      params.push(isActive === 'true' ? 1 : 0);
    }

    if (searchTerm) {
      query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.nit LIKE ?)`;
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY u.full_name ASC`;

    const [rows] = await req.db.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Error listando clientes:', error);
    res.status(500).json({ error: 'Error al listar clientes' });
  }
};

/**
 * PATCH /api/admin/clients/:id/assign
 * Asignar o reasignar un cliente a un empleado
 */
export const assignClient: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const { assignedToUserId } = req.body;

  try {
    await req.db.query(
      `UPDATE users SET assigned_to_user_id = ? WHERE id = ? AND role = 'client'`,
      [assignedToUserId || null, id]
    );

    res.json({ success: true, message: 'Cliente asignado correctamente' });
  } catch (error) {
    console.error('Error asignando cliente:', error);
    res.status(500).json({ error: 'Error al asignar cliente' });
  }
};

/**
 * POST /api/admin/clients/bulk-assign
 * Asignar múltiples clientes a un empleado
 */
export const bulkAssignClients: RequestHandler = async (req: any, res: any) => {
  const { clientIds, assignedToUserId } = req.body;

  if (!Array.isArray(clientIds) || clientIds.length === 0) {
    return res.status(400).json({ error: 'clientIds debe ser un array no vacío' });
  }

  try {
    const placeholders = clientIds.map(() => '?').join(',');
    await req.db.query(
      `UPDATE users SET assigned_to_user_id = ? WHERE id IN (${placeholders}) AND role = 'client'`,
      [assignedToUserId || null, ...clientIds]
    );

    res.json({
      success: true,
      message: `${clientIds.length} clientes asignados correctamente`
    });
  } catch (error) {
    console.error('Error en asignación masiva:', error);
    res.status(500).json({ error: 'Error al asignar clientes' });
  }
};

/**
 * PATCH /api/admin/clients/:id/profile
 * Actualizar perfil de cliente (sede, grupo, etc.)
 */
export const updateClientProfile: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const { sede, grupo, contractNumber, notes } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (sede !== undefined) {
      updates.push('sede = ?');
      params.push(sede);
    }

    if (grupo !== undefined) {
      updates.push('grupo = ?');
      params.push(grupo);
    }

    if (contractNumber !== undefined) {
      updates.push('contract_number = ?');
      params.push(contractNumber);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(id);

    await req.db.query(
      `UPDATE clients_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
      params
    );

    res.json({ success: true, message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando perfil de cliente:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

/**
 * GET /api/admin/clients/filter-options
 * Obtener opciones disponibles para filtros (sedes, grupos)
 */
export const getFilterOptions: RequestHandler = async (req: any, res: any) => {
  try {
    const [sedes] = await req.db.query(
      `SELECT DISTINCT sede FROM clients_profiles WHERE sede IS NOT NULL ORDER BY sede ASC`
    );

    const [grupos] = await req.db.query(
      `SELECT DISTINCT grupo FROM clients_profiles WHERE grupo IS NOT NULL ORDER BY grupo ASC`
    );

    const [employees] = await req.db.query(
      `SELECT id, full_name FROM users WHERE role IN ('admin', 'employee') AND is_active = TRUE ORDER BY full_name ASC`
    );

    res.json({
      sedes,
      grupos,
      employees
    });
  } catch (error) {
    console.error('Error obteniendo opciones de filtro:', error);
    res.status(500).json({ error: 'Error al obtener opciones' });
  }
};
