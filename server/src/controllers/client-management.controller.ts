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
 * Actualizar perfil de cliente (datos personales + sede, grupo, etc.)
 */
export const updateClientProfile: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const { fullName, email, nit, phoneNumber, isActive, sede, grupo, contractNumber, notes } = req.body;

  try {
    // Actualizar tabla users (datos básicos)
    const userUpdates: string[] = [];
    const userParams: any[] = [];

    if (fullName !== undefined) {
      userUpdates.push('full_name = ?');
      userParams.push(fullName);
    }

    if (email !== undefined) {
      userUpdates.push('email = ?');
      userParams.push(email);
    }

    if (nit !== undefined) {
      userUpdates.push('nit = ?');
      userParams.push(nit || null);
    }

    if (phoneNumber !== undefined) {
      userUpdates.push('phone_number = ?');
      userParams.push(phoneNumber || null);
    }

    if (isActive !== undefined) {
      userUpdates.push('is_active = ?');
      userParams.push(isActive ? 1 : 0);
    }

    if (userUpdates.length > 0) {
      userParams.push(id);
      await req.db.query(
        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
        userParams
      );
    }

    // Actualizar tabla clients_profiles (datos organizacionales)
    const profileUpdates: string[] = [];
    const profileParams: any[] = [];

    if (sede !== undefined) {
      profileUpdates.push('sede = ?');
      profileParams.push(sede || null);
    }

    if (grupo !== undefined) {
      profileUpdates.push('grupo = ?');
      profileParams.push(grupo || null);
    }

    if (contractNumber !== undefined) {
      profileUpdates.push('contract_number = ?');
      profileParams.push(contractNumber || null);
    }

    if (notes !== undefined) {
      profileUpdates.push('notes = ?');
      profileParams.push(notes || null);
    }

    if (profileUpdates.length > 0) {
      profileParams.push(id);
      await req.db.query(
        `UPDATE clients_profiles SET ${profileUpdates.join(', ')} WHERE user_id = ?`,
        profileParams
      );
    }

    if (userUpdates.length === 0 && profileUpdates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    res.json({ success: true, message: 'Cliente actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
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
