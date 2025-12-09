import { Pool, RowDataPacket } from 'mysql2/promise';
import { Permission, UserEffectivePermission } from '../models/permission.model';
import { UserRole } from '../models/user-role.model';
import { Role } from '../models/role.model';

/**
 * Servicio para evaluar permisos de usuarios
 * Implementa la lógica de RBAC (Role-Based Access Control) con permisos directos
 */
export class PermissionService {
  constructor(private db: Pool) {}

  /**
   * Verifica si un usuario tiene un permiso específico
   * @param userId ID del usuario
   * @param permissionKey Clave del permiso (formato: "page:action")
   * @returns true si tiene el permiso, false en caso contrario
   */
  async hasPermission(userId: number, permissionKey: string): Promise<boolean> {
    try {
      const query = `
        SELECT
          COALESCE(
            (SELECT granted FROM user_permissions
             WHERE user_id = ?
             AND permission_id = (SELECT id FROM permissions WHERE permission_key = ? AND is_active = TRUE)
             AND (expires_at IS NULL OR expires_at > NOW())
             LIMIT 1),
            (SELECT rp.granted
             FROM user_roles ur
             JOIN role_permissions rp ON rp.role_id = ur.role_id
             JOIN permissions p ON p.id = rp.permission_id
             WHERE ur.user_id = ?
             AND ur.is_active = TRUE
             AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
             AND p.permission_key = ?
             AND p.is_active = TRUE
             LIMIT 1),
            FALSE
          ) as has_permission
      `;

      const [rows] = await this.db.execute<RowDataPacket[]>(query, [
        userId,
        permissionKey,
        userId,
        permissionKey,
      ]);

      if (rows.length === 0) return false;

      return Boolean(rows[0].has_permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Verifica si un usuario tiene CUALQUIERA de los permisos especificados
   * @param userId ID del usuario
   * @param permissionKeys Array de claves de permisos
   * @returns true si tiene al menos uno de los permisos
   */
  async hasAnyPermission(userId: number, permissionKeys: string[]): Promise<boolean> {
    if (permissionKeys.length === 0) return false;

    const checks = await Promise.all(
      permissionKeys.map((key) => this.hasPermission(userId, key))
    );

    return checks.some((result) => result === true);
  }

  /**
   * Verifica si un usuario tiene TODOS los permisos especificados
   * @param userId ID del usuario
   * @param permissionKeys Array de claves de permisos
   * @returns true si tiene todos los permisos
   */
  async hasAllPermissions(userId: number, permissionKeys: string[]): Promise<boolean> {
    if (permissionKeys.length === 0) return true;

    const checks = await Promise.all(
      permissionKeys.map((key) => this.hasPermission(userId, key))
    );

    return checks.every((result) => result === true);
  }

  /**
   * Obtiene todos los permisos efectivos de un usuario
   * (incluyendo los heredados de roles y los directos)
   * @param userId ID del usuario
   * @returns Lista de permisos con detalles
   */
  async getUserEffectivePermissions(userId: number): Promise<UserEffectivePermission[]> {
    const query = `
      SELECT DISTINCT
        u.id as user_id,
        u.email,
        u.full_name,
        p.id as permission_id,
        p.permission_key,
        sp.page_name,
        sa.action_name,
        COALESCE(up.granted, rp.granted, FALSE) as is_granted,
        CASE
          WHEN up.id IS NOT NULL THEN 'direct'
          WHEN rp.id IS NOT NULL THEN 'role'
          ELSE 'none'
        END as grant_source,
        r.role_name as source_role
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      LEFT JOIN roles r ON r.id = ur.role_id AND r.is_active = TRUE
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
        OR p.id IN (SELECT permission_id FROM user_permissions WHERE user_id = u.id)
      LEFT JOIN user_permissions up ON up.user_id = u.id
        AND up.permission_id = p.id
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
      LEFT JOIN system_pages sp ON sp.id = p.page_id
      LEFT JOIN system_actions sa ON sa.id = p.action_id
      WHERE u.id = ?
        AND u.is_active = TRUE
        AND p.is_active = TRUE
        AND COALESCE(up.granted, rp.granted, FALSE) = TRUE
      ORDER BY p.permission_key
    `;

    const [rows] = await this.db.execute<UserEffectivePermission[]>(query, [userId]);
    return rows;
  }

  /**
   * Obtiene los permisos agrupados por página
   * @param userId ID del usuario
   * @returns Objeto con páginas y sus permisos
   */
  async getUserPermissionsByPage(userId: number): Promise<Record<string, string[]>> {
    const permissions = await this.getUserEffectivePermissions(userId);

    const grouped: Record<string, string[]> = {};

    permissions.forEach((perm) => {
      const [pageKey, actionKey] = perm.permission_key.split(':');
      if (!grouped[pageKey]) {
        grouped[pageKey] = [];
      }
      if (!grouped[pageKey].includes(actionKey)) {
        grouped[pageKey].push(actionKey);
      }
    });

    return grouped;
  }

  /**
   * Verifica si un usuario puede acceder a una página
   * (tiene al menos permiso de ver o listar)
   * @param userId ID del usuario
   * @param pageKey Clave de la página
   * @returns true si puede acceder
   */
  async canAccessPage(userId: number, pageKey: string): Promise<boolean> {
    const viewPermission = `${pageKey}:view`;
    const listPermission = `${pageKey}:list`;

    return await this.hasAnyPermission(userId, [viewPermission, listPermission]);
  }

  /**
   * Verifica si un usuario puede realizar una acción en una página
   * @param userId ID del usuario
   * @param pageKey Clave de la página
   * @param actionKey Clave de la acción
   * @returns true si puede realizar la acción
   */
  async canPerformAction(userId: number, pageKey: string, actionKey: string): Promise<boolean> {
    const permissionKey = `${pageKey}:${actionKey}`;
    return await this.hasPermission(userId, permissionKey);
  }

  /**
   * Obtiene todos los roles de un usuario (activos y no expirados)
   * @param userId ID del usuario
   * @returns Lista de roles
   */
  async getUserRoles(userId: number): Promise<UserRole[]> {
    const query = `
      SELECT ur.*, r.role_key, r.role_name
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ?
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        AND r.is_active = TRUE
      ORDER BY r.role_key
    `;

    const [rows] = await this.db.execute<UserRole[]>(query, [userId]);
    return rows;
  }

  /**
   * Verifica si un usuario tiene un rol específico
   * @param userId ID del usuario
   * @param roleKey Clave del rol
   * @returns true si tiene el rol
   */
  async hasRole(userId: number, roleKey: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ?
        AND r.role_key = ?
        AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        AND r.is_active = TRUE
    `;

    const [rows] = await this.db.execute<RowDataPacket[]>(query, [userId, roleKey]);
    return rows[0].count > 0;
  }

  /**
   * Verifica si un usuario es administrador
   * @param userId ID del usuario
   * @returns true si es admin
   */
  async isAdmin(userId: number): Promise<boolean> {
    return await this.hasRole(userId, 'admin');
  }

  /**
   * Verifica si un usuario puede acceder a un recurso específico
   * (por ejemplo, un cliente asignado a él)
   * @param userId ID del usuario
   * @param resourceType Tipo de recurso (ej: 'client', 'task')
   * @param resourceId ID del recurso
   * @returns true si puede acceder
   */
  async canAccessResource(
    userId: number,
    resourceType: string,
    resourceId: number
  ): Promise<boolean> {
    // Si es admin, puede acceder a todo
    if (await this.isAdmin(userId)) {
      return true;
    }

    // Validación específica por tipo de recurso
    switch (resourceType) {
      case 'client':
        return await this.canAccessClient(userId, resourceId);
      case 'task':
        return await this.canAccessTask(userId, resourceId);
      case 'invoice':
        return await this.canAccessInvoice(userId, resourceId);
      default:
        // Por defecto, si no hay validación específica, permitir solo a admins
        return false;
    }
  }

  /**
   * Verifica si un usuario puede acceder a un cliente específico
   * @param userId ID del usuario
   * @param clientId ID del cliente
   * @returns true si puede acceder
   */
  private async canAccessClient(userId: number, clientId: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM clients_profiles cp
      WHERE cp.user_id = ?
        AND (cp.assigned_employee_id = ? OR ? = cp.user_id)
    `;

    const [rows] = await this.db.execute<RowDataPacket[]>(query, [clientId, userId, userId]);
    return rows[0].count > 0;
  }

  /**
   * Verifica si un usuario puede acceder a una tarea específica
   * @param userId ID del usuario
   * @param taskId ID de la tarea
   * @returns true si puede acceder
   */
  private async canAccessTask(userId: number, taskId: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.monthly_invoice_id
      JOIN clients_profiles cp ON cp.user_id = mi.user_id
      WHERE msc.id = ?
        AND (cp.assigned_employee_id = ? OR mi.user_id = ?)
    `;

    const [rows] = await this.db.execute<RowDataPacket[]>(query, [taskId, userId, userId]);
    return rows[0].count > 0;
  }

  /**
   * Verifica si un usuario puede acceder a una factura específica
   * @param userId ID del usuario
   * @param invoiceId ID de la factura
   * @returns true si puede acceder
   */
  private async canAccessInvoice(userId: number, invoiceId: number): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM monthly_invoices mi
      LEFT JOIN clients_profiles cp ON cp.user_id = mi.user_id
      WHERE mi.id = ?
        AND (mi.user_id = ? OR cp.assigned_employee_id = ?)
    `;

    const [rows] = await this.db.execute<RowDataPacket[]>(query, [invoiceId, userId, userId]);
    return rows[0].count > 0;
  }

  /**
   * Filtra una lista de recursos según lo que el usuario puede acceder
   * @param userId ID del usuario
   * @param resourceType Tipo de recurso
   * @param resourceIds Lista de IDs de recursos
   * @returns Lista de IDs a los que el usuario puede acceder
   */
  async filterAccessibleResources(
    userId: number,
    resourceType: string,
    resourceIds: number[]
  ): Promise<number[]> {
    if (resourceIds.length === 0) return [];

    // Si es admin, puede acceder a todos
    if (await this.isAdmin(userId)) {
      return resourceIds;
    }

    const checks = await Promise.all(
      resourceIds.map((id) => this.canAccessResource(userId, resourceType, id))
    );

    return resourceIds.filter((_, index) => checks[index]);
  }

  /**
   * Cachea los permisos de un usuario en memoria
   * (útil para operaciones frecuentes en la misma request)
   */
  private permissionCache: Map<string, { permissions: Set<string>; timestamp: number }> = new Map();
  private CACHE_TTL = 60000; // 1 minuto

  async getCachedPermissions(userId: number): Promise<Set<string>> {
    const cacheKey = `user_${userId}`;
    const cached = this.permissionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.permissions;
    }

    const permissions = await this.getUserEffectivePermissions(userId);
    const permissionSet = new Set(permissions.map((p) => p.permission_key));

    this.permissionCache.set(cacheKey, {
      permissions: permissionSet,
      timestamp: Date.now(),
    });

    return permissionSet;
  }

  clearCache(userId?: number): void {
    if (userId) {
      this.permissionCache.delete(`user_${userId}`);
    } else {
      this.permissionCache.clear();
    }
  }
}
