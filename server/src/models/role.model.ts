import { RowDataPacket } from 'mysql2';

// ========================================
// INTERFACES DE ROLES
// ========================================

export interface Role extends RowDataPacket {
  id: number;
  tenant_id: number;
  role_key: string;
  role_name: string;
  description?: string;
  is_system_role: boolean; // Los roles del sistema no se pueden eliminar
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RolePermission extends RowDataPacket {
  id: number;
  role_id: number;
  permission_id: number;
  granted: boolean; // true=permitir, false=denegar
  created_at: Date;
  created_by?: number;
}

// ========================================
// VISTAS Y CONSULTAS COMPLEJAS
// ========================================

export interface RoleWithPermissions extends Role {
  permissions: {
    permission_id: number;
    permission_key: string;
    page_name: string;
    action_name: string;
    granted: boolean;
  }[];
  permissions_count: number;
  users_count: number; // Cuántos usuarios tienen este rol
}

export interface RoleWithStats extends Role {
  permissions_count: number;
  users_count: number;
  active_users_count: number;
}

// ========================================
// TIPOS PARA CREACIÓN Y ACTUALIZACIÓN
// ========================================

export interface CreateRole {
  tenant_id: number;
  role_key: string;
  role_name: string;
  description?: string;
  is_system_role?: boolean;
  is_active?: boolean;
}

export interface UpdateRole {
  role_name?: string;
  description?: string;
  is_active?: boolean;
}

export interface AssignPermissionToRole {
  role_id: number;
  permission_id: number;
  granted?: boolean;
  created_by?: number;
}

export interface BulkAssignPermissionsToRole {
  role_id: number;
  permission_ids: number[];
  granted?: boolean;
  created_by?: number;
}

// ========================================
// CONSTANTES DE ROLES DEL SISTEMA
// ========================================

export const SYSTEM_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  CLIENT: 'client',
} as const;

export type SystemRoleKey = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Verifica si un rol es un rol del sistema
 */
export function isSystemRole(roleKey: string): boolean {
  return Object.values(SYSTEM_ROLES).includes(roleKey as SystemRoleKey);
}

/**
 * Obtiene el rol más alto en la jerarquía
 */
export function getHighestRole(roles: Role[]): Role | null {
  if (roles.length === 0) return null;

  const hierarchy = [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.MANAGER, SYSTEM_ROLES.EMPLOYEE, SYSTEM_ROLES.CLIENT];

  for (const roleKey of hierarchy) {
    const role = roles.find((r) => r.role_key === roleKey);
    if (role) return role;
  }

  return roles[0]; // Si no encuentra un rol del sistema, retorna el primero
}

/**
 * Verifica si un rol tiene más privilegios que otro
 */
export function isRoleHigher(role1Key: string, role2Key: string): boolean {
  const hierarchy = [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.MANAGER, SYSTEM_ROLES.EMPLOYEE, SYSTEM_ROLES.CLIENT];

  const index1 = hierarchy.indexOf(role1Key as SystemRoleKey);
  const index2 = hierarchy.indexOf(role2Key as SystemRoleKey);

  if (index1 === -1 || index2 === -1) return false;

  return index1 < index2; // Menor índice = mayor privilegio
}
