import { Router } from 'express';
import * as controller from '../controllers/roles-permissions.controller';
import { requirePermission } from '../middleware/permissions';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

  // ========================================
  // GESTIÓN DE ROLES
  // ========================================

  /**
   * Lista todos los roles
   * GET /api/roles-permissions/roles
   * Requiere: roles:view o roles:manage
   */
  router.get(
    '/roles',
    requirePermission('roles:view', { auditAction: 'roles:list' }),
    controller.listRoles
  );

  /**
   * Obtiene los detalles de un rol
   * GET /api/roles-permissions/roles/:id
   * Requiere: roles:view
   */
  router.get(
    '/roles/:id',
    requirePermission('roles:view', { auditAction: 'roles:view' }),
    controller.getRoleDetails
  );

  /**
   * Crea un nuevo rol personalizado
   * POST /api/roles-permissions/roles
   * Requiere: roles:manage
   */
  router.post(
    '/roles',
    requirePermission('roles:manage', { auditAction: 'roles:create' }),
    controller.createRole
  );

  /**
   * Actualiza un rol existente
   * PUT /api/roles-permissions/roles/:id
   * Requiere: roles:manage
   */
  router.put(
    '/roles/:id',
    requirePermission('roles:manage', { auditAction: 'roles:edit' }),
    controller.updateRole
  );

  /**
   * Elimina un rol personalizado
   * DELETE /api/roles-permissions/roles/:id
   * Requiere: roles:manage
   */
  router.delete(
    '/roles/:id',
    requirePermission('roles:manage', { auditAction: 'roles:delete' }),
    controller.deleteRole
  );

  /**
   * Asigna permisos a un rol
   * POST /api/roles-permissions/roles/:id/permissions
   * Requiere: roles:manage
   */
  router.post(
    '/roles/:id/permissions',
    requirePermission('roles:manage', { auditAction: 'roles:assign_permissions' }),
    controller.assignPermissionsToRole
  );

  /**
   * Revoca permisos de un rol
   * DELETE /api/roles-permissions/roles/:id/permissions
   * Requiere: roles:manage
   */
  router.delete(
    '/roles/:id/permissions',
    requirePermission('roles:manage', { auditAction: 'roles:revoke_permissions' }),
    controller.revokePermissionsFromRole
  );

  // ========================================
  // GESTIÓN DE PERMISOS
  // ========================================

  /**
   * Lista todos los permisos disponibles
   * GET /api/roles-permissions/permissions
   * Requiere: roles:view
   */
  router.get(
    '/permissions',
    requirePermission('roles:view', { auditAction: 'permissions:list' }),
    controller.listPermissions
  );

  // ========================================
  // ASIGNACIÓN DE ROLES Y PERMISOS A USUARIOS
  // ========================================

  /**
   * Asigna un rol a un usuario
   * POST /api/roles-permissions/users/:userId/roles
   * Requiere: users:manage
   */
  router.post(
    '/users/:userId/roles',
    requirePermission('users:manage', { auditAction: 'users:assign_role' }),
    controller.assignRoleToUser
  );

  /**
   * Revoca un rol de un usuario
   * DELETE /api/roles-permissions/users/:userId/roles/:roleId
   * Requiere: users:manage
   */
  router.delete(
    '/users/:userId/roles/:roleId',
    requirePermission('users:manage', { auditAction: 'users:revoke_role' }),
    controller.revokeRoleFromUser
  );

  /**
   * Asigna un permiso directo a un usuario
   * POST /api/roles-permissions/users/:userId/permissions
   * Requiere: users:manage
   */
  router.post(
    '/users/:userId/permissions',
    requirePermission('users:manage', { auditAction: 'users:assign_permission' }),
    controller.assignPermissionToUser
  );

  /**
   * Revoca un permiso directo de un usuario
   * DELETE /api/roles-permissions/users/:userId/permissions/:permissionId
   * Requiere: users:manage
   */
  router.delete(
    '/users/:userId/permissions/:permissionId',
    requirePermission('users:manage', { auditAction: 'users:revoke_permission' }),
    controller.revokePermissionFromUser
  );

  /**
   * Obtiene los permisos efectivos de un usuario
   * GET /api/roles-permissions/users/:userId/effective-permissions
   * Requiere: users:view
   */
  router.get(
    '/users/:userId/effective-permissions',
    requirePermission('users:view', { auditAction: 'users:view_permissions' }),
    controller.getUserEffectivePermissions
  );

export default router;
