import { Router } from 'express';
import * as controller from '../controllers/user-management.controller';
import { requirePermission } from '../middleware/permissions';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

  // ========================================
  // DASHBOARD DE ESTADÍSTICAS
  // ========================================

  /**
   * Obtiene las estadísticas del dashboard
   * GET /api/user-management/dashboard
   * Requiere: users:view o admin
   */
  router.get(
    '/dashboard',
    requirePermission('users:view', { auditAction: 'users:dashboard_view' }),
    controller.getDashboardStats
  );

  // ========================================
  // GESTIÓN DE USUARIOS
  // ========================================

  /**
   * Lista todos los usuarios
   * GET /api/user-management/users
   * Requiere: users:list
   */
  router.get(
    '/users',
    requirePermission('users:list', { auditAction: 'users:list' }),
    controller.listUsers
  );

  /**
   * Obtiene los detalles de un usuario
   * GET /api/user-management/users/:id
   * Requiere: users:view
   */
  router.get(
    '/users/:id',
    requirePermission('users:view', {
      auditAction: 'users:view',
      resourceType: 'user',
      getResourceId: (req) => parseInt(req.params.id),
    }),
    controller.getUserDetails
  );

  /**
   * Crea un nuevo usuario
   * POST /api/user-management/users
   * Requiere: users:create
   */
  router.post(
    '/users',
    requirePermission('users:create', { auditAction: 'users:create' }),
    controller.createUser
  );

  /**
   * Actualiza un usuario existente
   * PUT /api/user-management/users/:id
   * Requiere: users:edit
   */
  router.put(
    '/users/:id',
    requirePermission('users:edit', {
      auditAction: 'users:edit',
      resourceType: 'user',
      getResourceId: (req) => parseInt(req.params.id),
    }),
    controller.updateUser
  );

  /**
   * Activa o desactiva un usuario
   * PATCH /api/user-management/users/:id/status
   * Requiere: users:deactivate
   */
  router.patch(
    '/users/:id/status',
    requirePermission('users:deactivate', {
      auditAction: 'users:toggle_status',
      resourceType: 'user',
      getResourceId: (req) => parseInt(req.params.id),
    }),
    controller.toggleUserStatus
  );

  /**
   * Obtiene las estadísticas de un usuario
   * GET /api/user-management/users/:id/stats
   * Requiere: users:view
   */
  router.get(
    '/users/:id/stats',
    requirePermission('users:view', {
      auditAction: 'users:view_stats',
      resourceType: 'user',
      getResourceId: (req) => parseInt(req.params.id),
    }),
    controller.getUserStats
  );

export default router;
