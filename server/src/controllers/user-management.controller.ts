import { RequestHandler } from 'express';
import { RowDataPacket } from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { UserStats } from '../models/user-stats.model';

/**
 * Obtiene la lista de todos los usuarios con sus roles y estadísticas
 * GET /api/user-management/users
 */
export const listUsers: RequestHandler = async (req: any, res: any) => {
  try {
    const { is_active, role, search, limit = 50, offset = 0 } = req.query;

    let whereConditions: string[] = [];
    let queryParams: any[] = [];

    // Filtrar por tenant del usuario autenticado
    whereConditions.push('u.tenant_id = ?');
    queryParams.push(req.user.tenant);

    if (is_active !== undefined) {
      whereConditions.push('u.is_active = ?');
      queryParams.push(is_active === 'true' || is_active === '1');
    }

    if (role) {
      whereConditions.push('u.role = ?');
      queryParams.push(role);
    }

    if (search) {
      whereConditions.push('(u.email LIKE ? OR u.full_name LIKE ? OR u.nit LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT
        u.id as user_id,
        u.email,
        u.full_name,
        u.role as system_role,
        u.nit,
        u.phone_number,
        u.is_active,
        u.created_at,
        u.last_login,
        COUNT(DISTINCT ur.role_id) as roles_count,
        GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.role_name SEPARATOR ', ') as roles,
        COALESCE(SUM(uas.tasks_completed), 0) as total_tasks_completed,
        COALESCE(SUM(uas.login_count), 0) as total_logins,
        MAX(uas.last_login) as last_login_date,
        COUNT(DISTINCT CASE WHEN msc.status = 'completed' THEN msc.id END) as tasks_completed_count,
        COUNT(DISTINCT cp.user_id) as clients_managed_count
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
      LEFT JOIN roles r ON r.id = ur.role_id AND r.is_active = TRUE
      LEFT JOIN user_activity_stats uas ON uas.user_id = u.id
      LEFT JOIN monthly_service_checklist msc ON msc.completed_by = u.id
      LEFT JOIN clients_profiles cp ON cp.assigned_employee_id = u.id
      ${whereClause}
      GROUP BY u.id, u.email, u.full_name, u.role, u.nit, u.phone_number, u.is_active, u.created_at, u.last_login
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit as string), parseInt(offset as string));

    const [users] = await req.db.execute<UserStats[]>(query, queryParams);

    // Obtener el total de usuarios
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      ${whereClause}
    `;

    const [countResult] = await req.db.execute<RowDataPacket[]>(
      countQuery,
      queryParams.slice(0, -2) // Excluir limit y offset
    );

    const total = countResult[0].total;

    res.json({
      users,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        has_more: total > parseInt(offset as string) + users.length,
      },
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ message: 'Error al obtener la lista de usuarios' });
  }
};

/**
 * Obtiene los detalles de un usuario específico
 * GET /api/user-management/users/:id
 */
export const getUserDetails: RequestHandler = async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.id);

    const query = `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.role,
        u.nit,
        u.birth_date,
        u.phone_number,
        u.is_active,
        u.created_at,
        u.last_login,
        u.tenant_id
      FROM users u
      WHERE u.id = ? AND u.tenant_id = ?
    `;

    const [users] = await req.db.execute<RowDataPacket[]>(query, [userId, req.user.tenant]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];

    // Obtener roles asignados
    const rolesQuery = `
      SELECT
        ur.id as assignment_id,
        ur.role_id,
        r.role_key,
        r.role_name,
        r.description,
        ur.granted_at,
        ur.expires_at,
        ur.is_active,
        ur.notes,
        granted_by_user.full_name as granted_by_name
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      LEFT JOIN users granted_by_user ON granted_by_user.id = ur.granted_by
      WHERE ur.user_id = ?
      ORDER BY ur.granted_at DESC
    `;

    const [roles] = await req.db.execute<RowDataPacket[]>(rolesQuery, [userId]);

    // Obtener permisos directos
    const permissionsQuery = `
      SELECT
        up.id as assignment_id,
        up.permission_id,
        p.permission_key,
        sp.page_name,
        sa.action_name,
        up.granted,
        up.granted_at,
        up.expires_at,
        up.reason,
        granted_by_user.full_name as granted_by_name
      FROM user_permissions up
      JOIN permissions p ON p.id = up.permission_id
      JOIN system_pages sp ON sp.id = p.page_id
      JOIN system_actions sa ON sa.id = p.action_id
      LEFT JOIN users granted_by_user ON granted_by_user.id = up.granted_by
      WHERE up.user_id = ?
      ORDER BY up.granted_at DESC
    `;

    const [permissions] = await req.db.execute<RowDataPacket[]>(permissionsQuery, [userId]);

    // Obtener estadísticas
    const statsQuery = `
      SELECT
        COALESCE(SUM(tasks_completed), 0) as total_tasks_completed,
        COALESCE(SUM(services_completed), 0) as total_services_completed,
        COALESCE(SUM(login_count), 0) as total_logins,
        MAX(last_login) as last_login_date
      FROM user_activity_stats
      WHERE user_id = ?
    `;

    const [stats] = await req.db.execute<RowDataPacket[]>(statsQuery, [userId]);

    res.json({
      user,
      roles,
      permissions,
      stats: stats[0],
    });
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ message: 'Error al obtener los detalles del usuario' });
  }
};

/**
 * Crea un nuevo usuario
 * POST /api/user-management/users
 */
export const createUser: RequestHandler = async (req: any, res: any) => {
  try {
    const {
      email,
      password,
      full_name,
      role,
      nit,
      birth_date,
      phone_number,
      is_active = true,
      assign_roles = [],
    } = req.body;

    // Validaciones
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({
        message: 'Email, contraseña, nombre completo y rol son requeridos',
      });
    }

    // Verificar que el email no exista
    const checkEmailQuery = 'SELECT id FROM users WHERE email = ? AND tenant_id = ?';
    const [existingUsers] = await req.db.execute<RowDataPacket[]>(checkEmailQuery, [
      email,
      req.user.tenant,
    ]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const insertQuery = `
      INSERT INTO users (tenant_id, email, password, full_name, role, nit, birth_date, phone_number, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await req.db.execute<any>(insertQuery, [
      req.user.tenant,
      email,
      hashedPassword,
      full_name,
      role,
      nit || null,
      birth_date || null,
      phone_number || null,
      is_active,
    ]);

    const newUserId = result.insertId;

    // Asignar roles si se especificaron
    if (assign_roles && assign_roles.length > 0) {
      for (const roleId of assign_roles) {
        await req.db.execute(
          `INSERT INTO user_roles (user_id, role_id, granted_by, is_active)
           VALUES (?, ?, ?, TRUE)`,
          [newUserId, roleId, req.user.id]
        );
      }
    } else {
      // Asignar rol del sistema por defecto
      const defaultRoleQuery = `
        SELECT id FROM roles
        WHERE tenant_id = ? AND role_key = ? AND is_active = TRUE
        LIMIT 1
      `;
      const [defaultRoles] = await req.db.execute<RowDataPacket[]>(defaultRoleQuery, [
        req.user.tenant,
        role,
      ]);

      if (defaultRoles.length > 0) {
        await req.db.execute(
          `INSERT INTO user_roles (user_id, role_id, granted_by, is_active)
           VALUES (?, ?, ?, TRUE)`,
          [newUserId, defaultRoles[0].id, req.user.id]
        );
      }
    }

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user_id: newUserId,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error al crear el usuario' });
  }
};

/**
 * Actualiza un usuario existente
 * PUT /api/user-management/users/:id
 */
export const updateUser: RequestHandler = async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.id);
    const { email, full_name, role, nit, birth_date, phone_number, password } = req.body;

    // Verificar que el usuario existe
    const checkQuery = 'SELECT id FROM users WHERE id = ? AND tenant_id = ?';
    const [existingUsers] = await req.db.execute<RowDataPacket[]>(checkQuery, [
      userId,
      req.user.tenant,
    ]);

    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Si se cambia el email, verificar que no exista
    if (email) {
      const checkEmailQuery = 'SELECT id FROM users WHERE email = ? AND tenant_id = ? AND id != ?';
      const [duplicateUsers] = await req.db.execute<RowDataPacket[]>(checkEmailQuery, [
        email,
        req.user.tenant,
        userId,
      ]);

      if (duplicateUsers.length > 0) {
        return res.status(400).json({ message: 'El email ya está registrado' });
      }
    }

    // Construir query de actualización
    const updates: string[] = [];
    const params: any[] = [];

    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (nit !== undefined) {
      updates.push('nit = ?');
      params.push(nit);
    }
    if (birth_date !== undefined) {
      updates.push('birth_date = ?');
      params.push(birth_date);
    }
    if (phone_number !== undefined) {
      updates.push('phone_number = ?');
      params.push(phone_number);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    params.push(userId, req.user.tenant);

    const updateQuery = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = ? AND tenant_id = ?
    `;

    await req.db.execute(updateQuery, params);

    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
};

/**
 * Activa o desactiva un usuario
 * PATCH /api/user-management/users/:id/status
 */
export const toggleUserStatus: RequestHandler = async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.id);
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({ message: 'El campo is_active es requerido' });
    }

    const query = `
      UPDATE users
      SET is_active = ?
      WHERE id = ? AND tenant_id = ?
    `;

    const [result] = await req.db.execute<any>(query, [is_active, userId, req.user.tenant]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: `Usuario ${is_active ? 'activado' : 'desactivado'} exitosamente`,
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ message: 'Error al cambiar el estado del usuario' });
  }
};

/**
 * Obtiene las estadísticas de actividad de un usuario
 * GET /api/user-management/users/:id/stats
 */
export const getUserStats: RequestHandler = async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.id);
    const { period = 'month' } = req.query; // 'week', 'month', 'year', 'all'

    let dateCondition = '';
    if (period === 'week') {
      dateCondition = 'AND uas.stat_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (period === 'month') {
      dateCondition = 'AND uas.stat_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    } else if (period === 'year') {
      dateCondition = 'AND uas.stat_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
    }

    const query = `
      SELECT
        uas.stat_date,
        uas.tasks_completed,
        uas.clients_managed,
        uas.services_completed,
        uas.login_count,
        uas.actions_performed
      FROM user_activity_stats uas
      WHERE uas.user_id = ?
      ${dateCondition}
      ORDER BY uas.stat_date DESC
    `;

    const [stats] = await req.db.execute<RowDataPacket[]>(query, [userId]);

    // Calcular totales
    const totals = stats.reduce(
      (acc, stat) => ({
        tasks_completed: acc.tasks_completed + (stat.tasks_completed || 0),
        clients_managed: acc.clients_managed + (stat.clients_managed || 0),
        services_completed: acc.services_completed + (stat.services_completed || 0),
        logins: acc.logins + (stat.login_count || 0),
        actions_performed: acc.actions_performed + (stat.actions_performed || 0),
      }),
      { tasks_completed: 0, clients_managed: 0, services_completed: 0, logins: 0, actions_performed: 0 }
    );

    res.json({
      user_id: userId,
      period,
      stats,
      totals,
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ message: 'Error al obtener las estadísticas del usuario' });
  }
};

/**
 * Obtiene el dashboard de estadísticas generales
 * GET /api/user-management/dashboard
 */
export const getDashboardStats: RequestHandler = async (req: any, res: any) => {
  try {
    // Estadísticas generales de usuarios
    const usersStatsQuery = `
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) as employees,
        SUM(CASE WHEN role = 'client' THEN 1 ELSE 0 END) as clients
      FROM users
      WHERE tenant_id = ?
    `;

    const [usersStats] = await req.db.execute<RowDataPacket[]>(usersStatsQuery, [req.user.tenant]);

    // Estadísticas de tareas
    const tasksStatsQuery = `
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'omitted' THEN 1 ELSE 0 END) as omitted_tasks
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.monthly_invoice_id
      JOIN users u ON u.id = mi.user_id
      WHERE u.tenant_id = ?
    `;

    const [tasksStats] = await req.db.execute<RowDataPacket[]>(tasksStatsQuery, [req.user.tenant]);

    // Estadísticas de clientes
    const clientsStatsQuery = `
      SELECT
        COUNT(DISTINCT cp.user_id) as total_clients,
        SUM(CASE WHEN cp.group_classification = 'A' THEN 1 ELSE 0 END) as group_a,
        SUM(CASE WHEN cp.group_classification = 'B' THEN 1 ELSE 0 END) as group_b,
        SUM(CASE WHEN cp.group_classification = 'C' THEN 1 ELSE 0 END) as group_c,
        SUM(CASE WHEN cp.assigned_employee_id IS NOT NULL THEN 1 ELSE 0 END) as assigned_clients,
        SUM(CASE WHEN cp.assigned_employee_id IS NULL THEN 1 ELSE 0 END) as unassigned_clients
      FROM clients_profiles cp
      JOIN users u ON u.id = cp.user_id
      WHERE u.tenant_id = ? AND u.is_active = TRUE
    `;

    const [clientsStats] = await req.db.execute<RowDataPacket[]>(clientsStatsQuery, [req.user.tenant]);

    // Actividad reciente (últimos 7 días)
    const recentActivityQuery = `
      SELECT
        stat_date,
        SUM(tasks_completed) as tasks_completed,
        SUM(login_count) as logins,
        SUM(actions_performed) as actions
      FROM user_activity_stats uas
      JOIN users u ON u.id = uas.user_id
      WHERE u.tenant_id = ?
        AND uas.stat_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY stat_date
      ORDER BY stat_date DESC
    `;

    const [recentActivity] = await req.db.execute<RowDataPacket[]>(recentActivityQuery, [req.user.tenant]);

    // Top usuarios por tareas completadas
    const topUsersQuery = `
      SELECT
        u.id,
        u.full_name,
        u.email,
        SUM(uas.tasks_completed) as total_tasks_completed
      FROM users u
      JOIN user_activity_stats uas ON uas.user_id = u.id
      WHERE u.tenant_id = ?
        AND u.role IN ('admin', 'employee')
        AND uas.stat_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY u.id, u.full_name, u.email
      ORDER BY total_tasks_completed DESC
      LIMIT 10
    `;

    const [topUsers] = await req.db.execute<RowDataPacket[]>(topUsersQuery, [req.user.tenant]);

    res.json({
      users: usersStats[0],
      tasks: tasksStats[0],
      clients: clientsStats[0],
      recent_activity: recentActivity,
      top_users: topUsers,
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Error al obtener las estadísticas del dashboard' });
  }
};
