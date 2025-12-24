import { RequestHandler } from 'express';

/**
 * Lista todos los roles del tenant
 * GET /api/roles-permissions/roles
 */
export const listRoles: RequestHandler = async (req: any, res: any) => {
  try {
    const { include_stats = 'true' } = req.query;

    let query = `
      SELECT
        r.id,
        r.role_key,
        r.role_name,
        r.description,
        r.is_system_role,
        r.is_active,
        r.created_at,
        r.updated_at
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
    `;

    if (include_stats === 'true') {
      query += `
        LEFT JOIN role_permissions rp ON rp.role_id = r.id
        LEFT JOIN user_roles ur ON ur.role_id = r.id
        LEFT JOIN users u ON u.id = ur.user_id
      `;
    }

    query += `
      WHERE r.tenant_id = ?
    `;

    if (include_stats === 'true') {
      query += `
        GROUP BY r.id, r.role_key, r.role_name, r.description, r.is_system_role, r.is_active, r.created_at, r.updated_at
      `;
    }

    query += `
      ORDER BY r.is_system_role DESC, r.role_name ASC
    `;

    const [roles]: any = await req.db.execute(query, [req.user.tenant]);

    res.json({ roles });
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
      SELECT * FROM roles
      WHERE id = ? AND tenant_id = ?
    `;

    const [roles]: any = await req.db.execute(roleQuery, [
      roleId,
      req.user.tenant,
    ]);

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

    const [permissions]: any = await req.db.execute(permissionsQuery, [roleId]);

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

    const [users]: any = await req.db.execute(usersQuery, [roleId]);

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

    // Validaciones
    if (!role_key || !role_name) {
      return res.status(400).json({ message: 'role_key y role_name son requeridos' });
    }

    // Verificar que el role_key no exista
    const checkQuery = 'SELECT id FROM roles WHERE tenant_id = ? AND role_key = ?';
    const [existing]: any = await req.db.execute(checkQuery, [
      req.user.tenant,
      role_key,
    ]);

    if (existing.length > 0) {
      return res.status(400).json({ message: 'El role_key ya existe' });
    }

    // Crear el rol
    const insertQuery = `
      INSERT INTO roles (tenant_id, role_key, role_name, description, is_system_role, is_active)
      VALUES (?, ?, ?, ?, FALSE, ?)
    `;

    const [result]: any = await req.db.execute(insertQuery, [
      req.user.tenant,
      role_key,
      role_name,
      description || null,
      is_active,
    ]);

    const newRoleId = result.insertId;

    // Asignar permisos si se especificaron
    if (permissions && permissions.length > 0) {
      for (const permissionId of permissions) {
        await req.db.execute(
          `INSERT INTO role_permissions (role_id, permission_id, granted, created_by)
           VALUES (?, ?, TRUE, ?)`,
          [newRoleId, permissionId, req.user.id]
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
    const checkQuery = 'SELECT is_system_role FROM roles WHERE id = ? AND tenant_id = ?';
    const [roles]: any = await req.db.execute(checkQuery, [
      roleId,
      req.user.tenant,
    ]);

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

    params.push(roleId, req.user.tenant);

    const updateQuery = `
      UPDATE roles
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = ? AND tenant_id = ?
    `;

    await req.db.execute(updateQuery, params);

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
    const checkQuery = 'SELECT is_system_role FROM roles WHERE id = ? AND tenant_id = ?';
    const [roles]: any = await req.db.execute(checkQuery, [
      roleId,
      req.user.tenant,
    ]);

    if (roles.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    if (roles[0].is_system_role) {
      return res.status(400).json({ message: 'No se pueden eliminar roles del sistema' });
    }

    // Eliminar el rol (las asignaciones se eliminan en cascada)
    const deleteQuery = 'DELETE FROM roles WHERE id = ? AND tenant_id = ?';
    await req.db.execute(deleteQuery, [roleId, req.user.tenant]);

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

    const [permissions]: any = await req.db.execute(query);

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
    const checkQuery = 'SELECT id FROM roles WHERE id = ? AND tenant_id = ?';
    const [roles]: any = await req.db.execute(checkQuery, [
      roleId,
      req.user.tenant,
    ]);

    if (roles.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // Asignar permisos
    for (const permissionId of permission_ids) {
      await req.db.execute(
        `INSERT INTO role_permissions (role_id, permission_id, granted, created_by)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE granted = ?, created_by = ?`,
        [roleId, permissionId, granted, req.user.id, granted, req.user.id]
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
    const checkQuery = 'SELECT id FROM roles WHERE id = ? AND tenant_id = ?';
    const [roles]: any = await req.db.execute(checkQuery, [
      roleId,
      req.user.tenant,
    ]);

    if (roles.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // Revocar permisos
    const placeholders = permission_ids.map(() => '?').join(',');
    const deleteQuery = `
      DELETE FROM role_permissions
      WHERE role_id = ? AND permission_id IN (${placeholders})
    `;

    await req.db.execute(deleteQuery, [roleId, ...permission_ids]);

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

    // Verificar que el usuario y el rol existen en el mismo tenant
    const checkQuery = `
      SELECT u.id as user_exists, r.id as role_exists
      FROM users u
      CROSS JOIN roles r
      WHERE u.id = ? AND u.tenant_id = ?
        AND r.id = ? AND r.tenant_id = ?
    `;

    const [check]: any = await req.db.execute(checkQuery, [
      userId,
      req.user.tenant,
      role_id,
      req.user.tenant,
    ]);

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

    await req.db.execute(insertQuery, [
      userId,
      role_id,
      req.user.id,
      expires_at || null,
      notes || null,
      req.user.id,
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
      DELETE ur FROM user_roles ur
      JOIN users u ON u.id = ur.user_id
      WHERE ur.user_id = ? AND ur.role_id = ? AND u.tenant_id = ?
    `;

    const [result]: any = await req.db.execute(deleteQuery, [
      userId,
      roleId,
      req.user.tenant,
    ]);

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
    const checkQuery = 'SELECT id FROM users WHERE id = ? AND tenant_id = ?';
    const [users]: any = await req.db.execute(checkQuery, [
      userId,
      req.user.tenant,
    ]);

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

    await req.db.execute(insertQuery, [
      userId,
      permission_id,
      granted,
      req.user.id,
      expires_at || null,
      reason || null,
      granted,
      req.user.id,
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
      DELETE up FROM user_permissions up
      JOIN users u ON u.id = up.user_id
      WHERE up.user_id = ? AND up.permission_id = ? AND u.tenant_id = ?
    `;

    const [result]: any = await req.db.execute(deleteQuery, [
      userId,
      permissionId,
      req.user.tenant,
    ]);

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

    const [permissions]: any = await req.db.execute(query, [userId]);

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
