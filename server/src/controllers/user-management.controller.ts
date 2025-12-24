import { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';

/**
 * Lista usuarios (admin y empleados)
 * GET /api/user-management/users
 */
export const listUsers: RequestHandler = async (req: any, res) => {
  try {
    const { role, is_active, search } = req.query;
    const workspaceId = req.workspaceId;
    const isConsolidated = req.isConsolidatedView;

    let query = `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.role,
        u.is_active,
        u.created_at,
        0 as clients_count
      FROM users u
      WHERE u.role IN ('admin', 'employee')
    `;
    const params: any[] = [];

    // Filtro por workspace si no es vista consolidada
    if (!isConsolidated && workspaceId) {
      query += ` AND EXISTS (SELECT 1 FROM user_workspaces uw WHERE uw.user_id = u.id AND uw.workspace_id = ?)`;
      params.push(workspaceId);
    }

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (is_active !== undefined) {
      query += ` AND u.is_active = ?`;
      params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }

    if (search) {
      query += ` AND (u.email LIKE ? OR u.full_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.role ASC, u.full_name ASC`;

    const [users]: any = await req.db.query(query, params);

    res.json(users);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ message: 'Error al listar usuarios' });
  }
};

/**
 * Obtener un usuario específico
 * GET /api/user-management/users/:id
 */
export const getUserDetails: RequestHandler = async (req: any, res) => {
  try {
    const { id } = req.params;

    const [users]: any = await req.db.query(
      `SELECT id, email, full_name, role, is_active, created_at
       FROM users WHERE id = ?`,
      [id]
    );

    if (!users.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const user = users[0];

    // Obtener workspaces del usuario
    const [workspaces]: any = await req.db.query(
      `SELECT w.id, w.name, uw.role_in_workspace
       FROM workspaces w
       JOIN user_workspaces uw ON uw.workspace_id = w.id
       WHERE uw.user_id = ?`,
      [id]
    );

    // Obtener roles del usuario
    const [roles]: any = await req.db.query(
      `SELECT r.id, r.role_key, r.role_name
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = ? AND ur.is_active = TRUE`,
      [id]
    );

    res.json({ ...user, workspaces, roles });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
};

/**
 * Crear usuario (admin o empleado)
 * POST /api/user-management/users
 */
export const createUser: RequestHandler = async (req: any, res) => {
  try {
    const { email, password, full_name, role, workspaces = [] } = req.body;
    const currentWorkspaceId = req.workspaceId;

    // Validaciones
    if (!email || !password || !full_name) {
      return res.status(400).json({ message: 'Email, contraseña y nombre son requeridos' });
    }

    if (!['admin', 'employee'].includes(role)) {
      return res.status(400).json({ message: 'El rol debe ser admin o employee' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar email único
    const [existing]: any = await req.db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
    }

    // Crear usuario
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result]: any = await req.db.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [email, hashedPassword, full_name, role]
    );

    const userId = result.insertId;

    // Asignar a workspaces
    const workspaceIds = workspaces.length > 0 ? workspaces : [currentWorkspaceId];

    for (const wsId of workspaceIds) {
      if (wsId) {
        await req.db.query(
          `INSERT INTO user_workspaces (user_id, workspace_id, role_in_workspace, assigned_by_user_id)
           VALUES (?, ?, 'member', ?)
           ON DUPLICATE KEY UPDATE role_in_workspace = 'member'`,
          [userId, wsId, req.user.sub]
        );
      }
    }

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      id: userId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};

/**
 * Actualizar usuario
 * PUT /api/user-management/users/:id
 */
export const updateUser: RequestHandler = async (req: any, res) => {
  try {
    const { id } = req.params;
    const { email, full_name, role } = req.body;

    // Verificar que existe
    const [existing]: any = await req.db.query(
      'SELECT id, role FROM users WHERE id = ?',
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // No permitir cambiar rol de admin a algo menor si es el único admin
    if (existing[0].role === 'admin' && role !== 'admin') {
      const [admins]: any = await req.db.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = TRUE"
      );
      if (admins[0].count <= 1) {
        return res.status(400).json({ message: 'No puedes quitar el rol de admin al único administrador' });
      }
    }

    // Verificar email único si se cambia
    if (email) {
      const [emailCheck]: any = await req.db.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      if (emailCheck.length > 0) {
        return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
      }
    }

    // Actualizar
    const updates: string[] = [];
    const params: any[] = [];

    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (full_name) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (role && ['admin', 'employee'].includes(role)) {
      updates.push('role = ?');
      params.push(role);
    }

    if (updates.length > 0) {
      params.push(id);
      await req.db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

/**
 * Cambiar contraseña de un usuario
 * PATCH /api/user-management/users/:id/password
 */
export const changePassword: RequestHandler = async (req: any, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar que existe
    const [existing]: any = await req.db.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await req.db.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, id]
    );

    res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
};

/**
 * Activar/desactivar usuario
 * PATCH /api/user-management/users/:id/status
 */
export const toggleUserStatus: RequestHandler = async (req: any, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Verificar que existe
    const [existing]: any = await req.db.query(
      'SELECT id, role, is_active FROM users WHERE id = ?',
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // No permitir desactivar al último admin activo
    if (existing[0].role === 'admin' && !is_active) {
      const [admins]: any = await req.db.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = TRUE AND id != ?",
        [id]
      );
      if (admins[0].count === 0) {
        return res.status(400).json({ message: 'No puedes desactivar al único administrador activo' });
      }
    }

    await req.db.query(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active ? 1 : 0, id]
    );

    res.json({
      message: is_active ? 'Usuario activado' : 'Usuario desactivado'
    });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(500).json({ message: 'Error al cambiar estado' });
  }
};

/**
 * Asignar/quitar roles a un usuario
 * PUT /api/user-management/users/:id/roles
 */
export const updateUserRoles: RequestHandler = async (req: any, res) => {
  try {
    const { id } = req.params;
    const { role_ids } = req.body;

    if (!Array.isArray(role_ids)) {
      return res.status(400).json({ message: 'role_ids debe ser un array' });
    }

    // Verificar que el usuario existe
    const [existing]: any = await req.db.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Desactivar roles actuales
    await req.db.query(
      'UPDATE user_roles SET is_active = FALSE WHERE user_id = ?',
      [id]
    );

    // Asignar nuevos roles
    for (const roleId of role_ids) {
      await req.db.query(
        `INSERT INTO user_roles (user_id, role_id, granted_by, is_active)
         VALUES (?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE is_active = TRUE, granted_by = ?`,
        [id, roleId, req.user.sub, req.user.sub]
      );
    }

    res.json({ message: 'Roles actualizados' });
  } catch (error) {
    console.error('Error updating roles:', error);
    res.status(500).json({ message: 'Error al actualizar roles' });
  }
};

/**
 * Asignar usuario a workspaces
 * PUT /api/user-management/users/:id/workspaces
 */
export const updateUserWorkspaces: RequestHandler = async (req: any, res) => {
  try {
    const { id } = req.params;
    const { workspace_ids } = req.body;

    if (!Array.isArray(workspace_ids)) {
      return res.status(400).json({ message: 'workspace_ids debe ser un array' });
    }

    // Verificar que el usuario existe
    const [existing]: any = await req.db.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Eliminar asignaciones actuales
    await req.db.query(
      'DELETE FROM user_workspaces WHERE user_id = ?',
      [id]
    );

    // Asignar nuevos workspaces
    for (const wsId of workspace_ids) {
      await req.db.query(
        `INSERT INTO user_workspaces (user_id, workspace_id, role_in_workspace, assigned_by_user_id)
         VALUES (?, ?, 'member', ?)`,
        [id, wsId, req.user.sub]
      );
    }

    res.json({ message: 'Workspaces actualizados' });
  } catch (error) {
    console.error('Error updating workspaces:', error);
    res.status(500).json({ message: 'Error al actualizar workspaces' });
  }
};

/**
 * Obtener roles disponibles
 * GET /api/user-management/roles
 */
export const listRoles: RequestHandler = async (req: any, res) => {
  try {
    const [roles]: any = await req.db.query(
      `SELECT id, role_key, role_name, description
       FROM roles
       WHERE is_active = TRUE
       ORDER BY role_name`
    );

    res.json(roles);
  } catch (error) {
    console.error('Error listing roles:', error);
    res.status(500).json({ message: 'Error al listar roles' });
  }
};

// Exportaciones legacy para compatibilidad
export const getUserStats: RequestHandler = async (_req, res) => {
  res.json({ stats: {} });
};

export const getDashboardStats: RequestHandler = async (_req, res) => {
  res.json({ users: {}, tasks: {}, clients: {} });
};
