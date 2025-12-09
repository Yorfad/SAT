import { RowDataPacket } from 'mysql2';

// ========================================
// INTERFACES DE ASIGNACIÓN DE ROLES Y PERMISOS A USUARIOS
// ========================================

export interface UserRole extends RowDataPacket {
  id: number;
  user_id: number;
  role_id: number;
  granted_by?: number;
  granted_at: Date;
  expires_at?: Date; // NULL = permanente
  is_active: boolean;
  notes?: string;
}

export interface UserPermission extends RowDataPacket {
  id: number;
  user_id: number;
  permission_id: number;
  granted: boolean; // true=permitir, false=denegar (sobrescribe rol)
  granted_by?: number;
  granted_at: Date;
  expires_at?: Date;
  reason?: string;
}

// ========================================
// VISTAS Y CONSULTAS COMPLEJAS
// ========================================

export interface UserRoleWithDetails extends UserRole {
  role_key: string;
  role_name: string;
  role_description?: string;
  granted_by_name?: string;
  is_expired: boolean;
}

export interface UserPermissionWithDetails extends UserPermission {
  permission_key: string;
  page_name: string;
  action_name: string;
  granted_by_name?: string;
  is_expired: boolean;
}

export interface UserWithRoles extends RowDataPacket {
  id: number;
  email: string;
  full_name: string;
  tenant_id: number;
  is_active: boolean;
  roles: {
    role_id: number;
    role_key: string;
    role_name: string;
    granted_at: Date;
    expires_at?: Date;
  }[];
  direct_permissions: {
    permission_id: number;
    permission_key: string;
    granted: boolean;
    granted_at: Date;
    expires_at?: Date;
  }[];
}

// ========================================
// TIPOS PARA CREACIÓN Y ACTUALIZACIÓN
// ========================================

export interface AssignRoleToUser {
  user_id: number;
  role_id: number;
  granted_by?: number;
  expires_at?: Date;
  is_active?: boolean;
  notes?: string;
}

export interface AssignPermissionToUser {
  user_id: number;
  permission_id: number;
  granted?: boolean;
  granted_by?: number;
  expires_at?: Date;
  reason?: string;
}

export interface BulkAssignRolesToUser {
  user_id: number;
  role_ids: number[];
  granted_by?: number;
  expires_at?: Date;
}

export interface BulkAssignPermissionsToUser {
  user_id: number;
  permissions: {
    permission_id: number;
    granted: boolean;
    reason?: string;
  }[];
  granted_by?: number;
  expires_at?: Date;
}

export interface UpdateUserRole {
  expires_at?: Date;
  is_active?: boolean;
  notes?: string;
}

export interface UpdateUserPermission {
  granted?: boolean;
  expires_at?: Date;
  reason?: string;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Verifica si una asignación de rol/permiso ha expirado
 */
export function isExpired(expiresAt?: Date): boolean {
  if (!expiresAt) return false; // NULL = permanente
  return new Date(expiresAt) <= new Date();
}

/**
 * Verifica si una asignación de rol/permiso está activa
 */
export function isAssignmentActive(assignment: UserRole | UserPermission): boolean {
  return assignment.is_active && !isExpired(assignment.expires_at);
}

/**
 * Filtra asignaciones activas y no expiradas
 */
export function getActiveAssignments<T extends UserRole | UserPermission>(assignments: T[]): T[] {
  return assignments.filter((assignment) => isAssignmentActive(assignment));
}

/**
 * Calcula cuántos días faltan para que expire una asignación
 */
export function daysUntilExpiration(expiresAt?: Date): number | null {
  if (!expiresAt) return null; // Permanente
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffTime = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Verifica si una asignación expira pronto (en los próximos N días)
 */
export function isExpiringSoon(expiresAt?: Date, daysThreshold: number = 7): boolean {
  const days = daysUntilExpiration(expiresAt);
  return days !== null && days > 0 && days <= daysThreshold;
}
