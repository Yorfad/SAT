import { RequestHandler } from 'express';

/**
 * Lista todos los roles
 * GET /api/roles-permissions/roles
 */
export const listRoles: RequestHandler = async (req: any, res: any) => {
  try {
    const { include_stats = 'true' } = req.query;
    const workspaceId = req.workspaceId;

    // Obtener configuración de roles por workspace
    const [settings]: any = await req.db.query(
      "SELECT setting_value FROM tenant_settings WHERE setting_key = 'roles_per_workspace'"
    );
    const rolesPerWorkspace = settings.length > 0 && settings[0].setting_value === 'true';

    let query = `
      SELECT
        r.id,
        r.role_key,
        r.role_name,
        r.description,
        r.is_system_role,
        r.is_active,
        r.created_at,
        r.updated_at,
        r.created_in_workspace_id,
        w.name as workspace_name
    `;

    if (include_stats === 'true') {
      query += `,
        COUNT(DISTINCT rp.permission_id) as permissions_count,
        COUNT(DISTINCT ur.user_id) as users_count,
        COUNT(DISTINCT CASE WHEN ur.is_active = TRUE AND u.is_active = TRUE THEN ur.user_id END) as active_users_count
      `;
    }

    query += `
      FROM roles r
      LEFT JOIN workspaces w ON w.id = r.created_in_workspace_id
    `;

    if (include_stats === 'true') {
      query += `
        LEFT JOIN role_permissions rp ON rp.role_id = r.id
        LEFT JOIN user_roles ur ON ur.role_id = r.id
        LEFT JOIN users u ON u.id = ur.user_id
      `;
    }

    query += ` WHERE r.is_active = TRUE `;

    const params: any[] = [];

    // Filtrar por workspace si está configurado
    if (rolesPerWorkspace && workspaceId) {
      query += ` AND (r.is_system_role = TRUE OR r.created_in_workspace_id = ? OR r.created_in_workspace_id IS NULL)`;
      params.push(workspaceId);
    }

    if (include_stats === 'true') {
      query += `
        GROUP BY r.id, r.role_key, r.role_name, r.description, r.is_system_role, r.is_active, r.created_at, r.updated_at, r.created_in_workspace_id, w.name
      `;
    }

    query += `
      ORDER BY r.is_system_role DESC, r.role_name ASC
    `;

    const [roles]: any = await req.db.query(query, params);

    res.json({ roles, roles_per_workspace: rolesPerWorkspace });
  } catch (error) {
    console.error('Error listing roles:', error);
    res.status(500).json({ message: 'Error al obtener la lista de roles' });
  }
};

/**
 * Obtiene los detalles de un rol específico
 * GET /api/roles-permissions/roles/:id
 */
export const getRoleDetails: RequestHandler = async (req: any, res: any) => {
  try {
    const roleId = parseInt(req.params.id);

    const roleQuery = `
      SELECT r.*, w.name as workspace_name
      FROM roles r
      LEFT JOIN workspaces w ON w.id = r.created_in_workspace_id
      WHERE r.id = ?
    `;

    const [roles]: any = await req.db.query(roleQuery, [roleId]);

    if (roles.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    const role = roles[0];

    // Obtener permisos asignados
    const permissionsQuery = `
      SELECT
        rp.id as assignment_id,
        rp.permission_id,
        p.permission_key,
        sp.page_name,
        sp.page_key,
        sa.action_name,
        sa.action_key,
        rp.granted
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      JOIN system_pages sp ON sp.id = p.page_id
      JOIN system_actions sa ON sa.id = p.action_id
      WHERE rp.role_id = ?
      ORDER BY sp.display_order, sp.page_name, sa.action_name
    `;

    const [permissions]: any = await req.db.query(permissionsQuery, [roleId]);

    // Obtener usuarios con este rol
    const usersQuery = `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.is_active,
        ur.granted_at,
        ur.expires_at,
        ur.is_active as assignment_active
      FROM user_roles ur
      JOIN users u ON u.id = ur.user_id
      WHERE ur.role_id = ?
      ORDER BY ur.granted_at DESC
    `;

    const [users]: any = await req.db.query(usersQuery, [roleId]);

    res.json({
      role,
      permissions,
      users,
    });
  } catch (error) {
    console.error('Error getting role details:', error);
    res.status(500).json({ message: 'Error al obtener los detalles del rol' });
  }
};

/**
 * Crea un nuevo rol personalizado
 * POST /api/roles-permissions/roles
 */
export const createRole: RequestHandler = async (req: any, res: any) => {
  try {
    const { role_key, role_name, description, is_active = true, permissions = [] } = req.body;
    const workspaceId = req.workspaceId;

    // Validaciones
    if (!role_key || !role_name) {
      return res.status(400).json({ message: 'role_key y role_name son requeridos' });
    }

    // Verificar que el role_key no exista
    const checkQuery = 'SELECT id FROM roles WHERE role_key = ?';
    const [existing]: any = await req.db.query(checkQuery, [role_key]);

    if (existing.length > 0) {
      return res.status(400).json({ message: 'El role_key ya existe' });
    }

    // Crear el rol con workspace de origen
    const insertQuery = `
      INSERT INTO roles (role_key, role_name, description, is_system_role, is_active, created_in_workspace_id)
      VALUES (?, ?, ?, FALSE, ?, ?)
    `;

    const [result]: any = await req.db.query(insertQuery, [
      role_key,
      role_name,
      description || null,
      is_active,
      workspaceId || null,
    ]);

    const newRoleId = result.insertId;

    // Asignar permisos si se especificaron
    if (permissions && permissions.length > 0) {
      for (const permissionId of permissions) {
        await req.db.query(
          `INSERT INTO role_permissions (role_id, permission_id, granted, created_by)
           VALUES (?, ?, TRUE, ?)`,
          [newRoleId, permissionId, req.user.sub]
        );
      }
    }

    res.status(201).json({
      message: 'Rol creado exitosamente',
      role_id: newRoleId,
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ message: 'Error al crear el rol' });
  }
};

/**
 * Actualiza un rol existente
 * PUT /api/roles-permissions/roles/:id
 */
export const updateRole: RequestHandler = async (req: any, res: any) => {
  try {
    const roleId = parseInt(req.params.id);
    const { role_name, description, is_active } = req.body;

    // Verificar que el rol existe y no es un rol del sistema
    const checkQuery = 'SELECT is_system_role FROM roles WHERE id = ?';
    const [roles]: any = await req.db.query(checkQuery, [roleId]);

    if (roles.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    if (roles[0].is_system_role) {
      return res.status(400).json({ message: 'No se pueden editar roles del sistema' });
    }

    // Construir query de actualización
    const updates: string[] = [];
    const params: any[] = [];

    if (role_name !== undefined) {
      updates.push('role_name = ?');
      params.push(role_name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    params.push(roleId);

    const updateQuery = `
      UPDATE roles
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `;

    await req.db.query(updateQuery, params);

    res.json({ message: 'Rol actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ message: 'Error al actualizar el rol' });
  }
};

/**
 * Elimina un rol personalizado
 * DELETE /api/roles-permissions/roles/:id
 */
export const deleteRole: RequestHandler = async (req: any, res: any) => {
  try {
    const roleId = parseInt(req.params.id);

    // Verificar que el rol existe y no es un rol del sistema
    const checkQuery = 'SELECT is_system_role FROM roles WHERE id = ?';
    const [roles]: any = await req.db.query(checkQuery, [roleId]);

    if (roles.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    if (roles[0].is_system_role) {
      return res.status(400).json({ message: 'No se pueden eliminar roles del sistema' });
    }

    // Eliminar el rol (las asignaciones se eliminan en cascada)
    const deleteQuery = 'DELETE FROM roles WHERE id = ?';
    await req.db.query(deleteQuery, [roleId]);

    res.json({ message: 'Rol eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ message: 'Error al eliminar el rol' });
  }
};

/**
 * Lista todos los permisos disponibles
 * GET /api/roles-permissions/permissions
 */
export const listPermissions: RequestHandler = async (req: any, res: any) => {
  try {
    const { group_by = 'page' } = req.query;

    const query = `
      SELECT
        p.id,
        p.permission_key,
        p.description,
        sp.id as page_id,
        sp.page_key,
        sp.page_name,
        sa.id as action_id,
        sa.action_key,
        sa.action_name
      FROM permissions p
      JOIN system_pages sp ON sp.id = p.page_id
      JOIN system_actions sa ON sa.id = p.action_id
      WHERE p.is_active = TRUE
        AND sp.is_active = TRUE
        AND sa.is_active = TRUE
      ORDER BY sp.display_order, sp.page_name, sa.action_name
    `;

    const [permissions]: any = await req.db.query(query);

    if (group_by === 'page') {
      // Agrupar por página
      const grouped: Record<string, any> = {};

      permissions.forEach((perm: any) => {
        if (!grouped[perm.page_key]) {
          grouped[perm.page_key] = {
            page_id: perm.page_id,
            page_key: perm.page_key,
            page_name: perm.page_name,
            permissions: [],
          };
        }

        grouped[perm.page_key].permissions.push({
          id: perm.id,
          permission_key: perm.permission_key,
          action_id: perm.action_id,
          action_key: perm.action_key,
          action_name: perm.action_name,
          description: perm.description,
        });
      });

      res.json({ permissions: Object.values(grouped) });
    } else {
      res.json({ permissions });
    }
  } catch (error) {
    console.error('Error listing permissions:', error);
    res.status(500).json({ message: 'Error al obtener la lista de permisos' });
  }
};

/**
 * Asigna permisos a un rol
 * POST /api/roles-permissions/roles/:id/permissions
 */
export const assignPermissionsToRole: RequestHandler = async (req: any, res: any) => {
  try {
    const roleId = parseInt(req.params.id);
    const { permission_ids, granted = true } = req.body;

    if (!permission_ids || !Array.isArray(permission_ids)) {
      return res.status(400).json({ message: 'permission_ids debe ser un array' });
    }

    // Verificar que el rol existe
    const checkQuery = 'SELECT id FROM roles WHERE id = ?';
    const [roles]: any = await req.db.query(checkQuery, [roleId]);

    if (roles.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // Asignar permisos
    for (const permissionId of permission_ids) {
      await req.db.query(
        `INSERT INTO role_permissions (role_id, permission_id, granted, created_by)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE granted = ?, created_by = ?`,
        [roleId, permissionId, granted, req.user.sub, granted, req.user.sub]
      );
    }

    res.json({ message: 'Permisos asignados exitosamente' });
  } catch (error) {
    console.error('Error assigning permissions to role:', error);
    res.status(500).json({ message: 'Error al asignar permisos al rol' });
  }
};

/**
 * Revoca permisos de un rol
 * DELETE /api/roles-permissions/roles/:id/permissions
 */
export const revokePermissionsFromRole: RequestHandler = async (req: any, res: any) => {
  try {
    const roleId = parseInt(req.params.id);
    const { permission_ids } = req.body;

    if (!permission_ids || !Array.isArray(permission_ids)) {
      return res.status(400).json({ message: 'permission_ids debe ser un array' });
    }

    // Verificar que el rol existe
    const checkQuery = 'SELECT id FROM roles WHERE id = ?';
    const [roles]: any = await req.db.query(checkQuery, [roleId]);

    if (roles.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // Revocar permisos
    const placeholders = permission_ids.map(() => '?').join(',');
    const deleteQuery = `
      DELETE FROM role_permissions
      WHERE role_id = ? AND permission_id IN (${placeholders})
    `;

    await req.db.query(deleteQuery, [roleId, ...permission_ids]);

    res.json({ message: 'Permisos revocados exitosamente' });
  } catch (error) {
    console.error('Error revoking permissions from role:', error);
    res.status(500).json({ message: 'Error al revocar permisos del rol' });
  }
};

/**
 * Asigna un rol a un usuario
 * POST /api/roles-permissions/users/:userId/roles
 */
export const assignRoleToUser: RequestHandler = async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.userId);
    const { role_id, expires_at, notes } = req.body;

    if (!role_id) {
      return res.status(400).json({ message: 'role_id es requerido' });
    }

    // Verificar que el usuario y el rol existen
    const checkQuery = `
      SELECT u.id as user_exists, r.id as role_exists
      FROM users u
      CROSS JOIN roles r
      WHERE u.id = ? AND r.id = ?
    `;

    const [check]: any = await req.db.query(checkQuery, [userId, role_id]);

    if (check.length === 0) {
      return res.status(404).json({ message: 'Usuario o rol no encontrado' });
    }

    // Asignar rol
    const insertQuery = `
      INSERT INTO user_roles (user_id, role_id, granted_by, expires_at, notes, is_active)
      VALUES (?, ?, ?, ?, ?, TRUE)
      ON DUPLICATE KEY UPDATE
        granted_by = ?,
        expires_at = ?,
        notes = ?,
        is_active = TRUE,
        granted_at = NOW()
    `;

    await req.db.query(insertQuery, [
      userId,
      role_id,
      req.user.sub,
      expires_at || null,
      notes || null,
      req.user.sub,
      expires_at || null,
      notes || null,
    ]);

    res.json({ message: 'Rol asignado exitosamente' });
  } catch (error) {
    console.error('Error assigning role to user:', error);
    res.status(500).json({ message: 'Error al asignar rol al usuario' });
  }
};

/**
 * Revoca un rol de un usuario
 * DELETE /api/roles-permissions/users/:userId/roles/:roleId
 */
export const revokeRoleFromUser: RequestHandler = async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.userId);
    const roleId = parseInt(req.params.roleId);

    const deleteQuery = `
      DELETE FROM user_roles
      WHERE user_id = ? AND role_id = ?
    `;

    const [result]: any = await req.db.query(deleteQuery, [userId, roleId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Asignación de rol no encontrada' });
    }

    res.json({ message: 'Rol revocado exitosamente' });
  } catch (error) {
    console.error('Error revoking role from user:', error);
    res.status(500).json({ message: 'Error al revocar rol del usuario' });
  }
};

/**
 * Asigna un permiso directo a un usuario
 * POST /api/roles-permissions/users/:userId/permissions
 */
export const assignPermissionToUser: RequestHandler = async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.userId);
    const { permission_id, granted = true, expires_at, reason } = req.body;

    if (!permission_id) {
      return res.status(400).json({ message: 'permission_id es requerido' });
    }

    // Verificar que el usuario existe
    const checkQuery = 'SELECT id FROM users WHERE id = ?';
    const [users]: any = await req.db.query(checkQuery, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Asignar permiso
    const insertQuery = `
      INSERT INTO user_permissions (user_id, permission_id, granted, granted_by, expires_at, reason)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        granted = ?,
        granted_by = ?,
        expires_at = ?,
        reason = ?,
        granted_at = NOW()
    `;

    await req.db.query(insertQuery, [
      userId,
      permission_id,
      granted,
      req.user.sub,
      expires_at || null,
      reason || null,
      granted,
      req.user.sub,
      expires_at || null,
      reason || null,
    ]);

    res.json({ message: 'Permiso asignado exitosamente' });
  } catch (error) {
    console.error('Error assigning permission to user:', error);
    res.status(500).json({ message: 'Error al asignar permiso al usuario' });
  }
};

/**
 * Revoca un permiso directo de un usuario
 * DELETE /api/roles-permissions/users/:userId/permissions/:permissionId
 */
export const revokePermissionFromUser: RequestHandler = async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.userId);
    const permissionId = parseInt(req.params.permissionId);

    const deleteQuery = `
      DELETE FROM user_permissions
      WHERE user_id = ? AND permission_id = ?
    `;

    const [result]: any = await req.db.query(deleteQuery, [userId, permissionId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Asignación de permiso no encontrada' });
    }

    res.json({ message: 'Permiso revocado exitosamente' });
  } catch (error) {
    console.error('Error revoking permission from user:', error);
    res.status(500).json({ message: 'Error al revocar permiso del usuario' });
  }
};

/**
 * Obtiene la matriz completa de permisos (páginas × acciones) para un rol
 * GET /api/roles-permissions/roles/:id/matrix
 */
export const getRolePermissionMatrix: RequestHandler = async (req: any, res: any) => {
  try {
    const roleId = parseInt(req.params.id);

    // Verificar que el rol existe
    const [roles]: any = await req.db.query('SELECT id, role_name FROM roles WHERE id = ?', [roleId]);
    if (roles.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // Obtener todas las páginas del sistema
    const [pages]: any = await req.db.query(`
      SELECT id, page_key, page_name, description
      FROM system_pages
      WHERE is_active = TRUE
      ORDER BY display_order, page_name
    `);

    // Obtener todas las acciones del sistema
    const [actions]: any = await req.db.query(`
      SELECT id, action_key, action_name
      FROM system_actions
      WHERE is_active = TRUE
      ORDER BY action_name
    `);

    // Obtener todos los permisos con su estado para este rol
    const [rolePermissions]: any = await req.db.query(`
      SELECT
        p.id as permission_id,
        p.page_id,
        p.action_id,
        p.permission_key,
        COALESCE(rp.granted, FALSE) as granted
      FROM permissions p
      LEFT JOIN role_permissions rp ON rp.permission_id = p.id AND rp.role_id = ?
      WHERE p.is_active = TRUE
    `, [roleId]);

    // Crear mapa de permisos
    const permissionMap: Record<string, { permission_id: number; granted: boolean }> = {};
    rolePermissions.forEach((rp: any) => {
      permissionMap[`${rp.page_id}:${rp.action_id}`] = {
        permission_id: rp.permission_id,
        granted: rp.granted === 1 || rp.granted === true,
      };
    });

    // Construir la matriz
    const matrix = pages.map((page: any) => ({
      page_id: page.id,
      page_key: page.page_key,
      page_name: page.page_name,
      description: page.description,
      actions: actions.map((action: any) => {
        const key = `${page.id}:${action.id}`;
        const perm = permissionMap[key];
        return {
          action_id: action.id,
          action_key: action.action_key,
          action_name: action.action_name,
          permission_id: perm?.permission_id || null,
          granted: perm?.granted || false,
        };
      }),
    }));

    res.json({
      role: roles[0],
      matrix,
      actions,
    });
  } catch (error) {
    console.error('Error getting permission matrix:', error);
    res.status(500).json({ message: 'Error al obtener la matriz de permisos' });
  }
};

/**
 * Actualiza toda la matriz de permisos de un rol
 * PUT /api/roles-permissions/roles/:id/matrix
 */
export const updateRolePermissionMatrix: RequestHandler = async (req: any, res: any) => {
  try {
    const roleId = parseInt(req.params.id);
    const { permissions } = req.body; // Array de { permission_id, granted }

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ message: 'permissions debe ser un array' });
    }

    // Verificar que el rol existe y no es del sistema
    const [roles]: any = await req.db.query('SELECT is_system_role FROM roles WHERE id = ?', [roleId]);
    if (roles.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // Permitir editar permisos de roles del sistema (pero no eliminar el rol)
    // if (roles[0].is_system_role) {
    //   return res.status(400).json({ message: 'No se pueden editar permisos de roles del sistema' });
    // }

    // Eliminar permisos anteriores
    await req.db.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

    // Insertar nuevos permisos (solo los granted = true)
    const grantedPermissions = permissions.filter((p: any) => p.granted && p.permission_id);

    for (const perm of grantedPermissions) {
      await req.db.query(
        `INSERT INTO role_permissions (role_id, permission_id, granted, created_by)
         VALUES (?, ?, TRUE, ?)`,
        [roleId, perm.permission_id, req.user.sub]
      );
    }

    res.json({
      message: 'Permisos actualizados exitosamente',
      updated_count: grantedPermissions.length,
    });
  } catch (error) {
    console.error('Error updating permission matrix:', error);
    res.status(500).json({ message: 'Error al actualizar la matriz de permisos' });
  }
};

/**
 * Obtiene los roles asignados a un usuario
 * GET /api/roles-permissions/users/:userId/roles
 */
export const getUserRoles: RequestHandler = async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.userId);

    const [userRoles]: any = await req.db.query(`
      SELECT
        r.id,
        r.role_key,
        r.role_name,
        r.description,
        r.is_system_role,
        ur.granted_at,
        ur.expires_at,
        ur.is_active,
        ur.notes,
        CONCAT(u.full_name) as granted_by_name
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      LEFT JOIN users u ON u.id = ur.granted_by
      WHERE ur.user_id = ?
      ORDER BY ur.granted_at DESC
    `, [userId]);

    res.json({ roles: userRoles });
  } catch (error) {
    console.error('Error getting user roles:', error);
    res.status(500).json({ message: 'Error al obtener los roles del usuario' });
  }
};

/**
 * Obtiene los permisos efectivos de un usuario
 * GET /api/roles-permissions/users/:userId/effective-permissions
 */
export const getUserEffectivePermissions: RequestHandler = async (req: any, res: any) => {
  try {
    const userId = parseInt(req.params.userId);

    // Usar la vista creada en la migración
    const query = `
      SELECT *
      FROM v_user_effective_permissions
      WHERE user_id = ?
      ORDER BY page_name, action_name
    `;

    const [permissions]: any = await req.db.query(query, [userId]);

    // Agrupar por página
    const grouped: Record<string, any> = {};

    permissions.forEach((perm: any) => {
      const pageKey = perm.permission_key.split(':')[0];

      if (!grouped[pageKey]) {
        grouped[pageKey] = {
          page_name: perm.page_name,
          permissions: [],
        };
      }

      grouped[pageKey].permissions.push({
        permission_key: perm.permission_key,
        action_name: perm.action_name,
        is_granted: perm.is_granted,
        grant_source: perm.grant_source,
        source_role: perm.source_role,
      });
    });

    res.json({
      user_id: userId,
      permissions: grouped,
    });
  } catch (error) {
    console.error('Error getting user effective permissions:', error);
    res.status(500).json({ message: 'Error al obtener los permisos del usuario' });
  }
};
