import { RowDataPacket } from 'mysql2';

// ========================================
// INTERFACES DE SISTEMA
// ========================================

export interface SystemPage extends RowDataPacket {
  id: number;
  page_key: string;
  page_name: string;
  description?: string;
  parent_page_id?: number;
  display_order: number;
  is_active: boolean;
  created_at: Date;
}

export interface SystemAction extends RowDataPacket {
  id: number;
  action_key: string;
  action_name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
}

export interface Permission extends RowDataPacket {
  id: number;
  permission_key: string; // Formato: "page_key:action_key" (ej: "clients:view")
  page_id: number;
  action_id: number;
  description?: string;
  is_active: boolean;
  created_at: Date;
  // Campos calculados al hacer JOIN
  page_name?: string;
  page_key?: string;
  action_name?: string;
  action_key?: string;
}

// ========================================
// VISTAS Y CONSULTAS COMPLEJAS
// ========================================

export interface PermissionWithDetails extends Permission {
  page_name: string;
  page_key: string;
  action_name: string;
  action_key: string;
}

export interface UserEffectivePermission extends RowDataPacket {
  user_id: number;
  email: string;
  full_name: string;
  permission_id: number;
  permission_key: string;
  page_name: string;
  action_name: string;
  is_granted: boolean;
  grant_source: 'direct' | 'role' | 'none';
  source_role?: string;
}

// ========================================
// TIPOS PARA CREACIÓN
// ========================================

export interface CreateSystemPage {
  page_key: string;
  page_name: string;
  description?: string;
  parent_page_id?: number;
  display_order?: number;
  is_active?: boolean;
}

export interface CreateSystemAction {
  action_key: string;
  action_name: string;
  description?: string;
  is_active?: boolean;
}

export interface CreatePermission {
  permission_key: string;
  page_id: number;
  action_id: number;
  description?: string;
  is_active?: boolean;
}

// ========================================
// CONSTANTES DE PERMISOS COMUNES
// ========================================

export const COMMON_ACTIONS = {
  VIEW: 'view',
  LIST: 'list',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  ASSIGN: 'assign',
  COMPLETE: 'complete',
  ACTIVATE: 'activate',
  DEACTIVATE: 'deactivate',
  EXPORT: 'export',
  IMPORT: 'import',
  APPROVE: 'approve',
  MANAGE: 'manage',
} as const;

export const COMMON_PAGES = {
  DASHBOARD: 'dashboard',
  CLIENTS: 'clients',
  SERVICES: 'services',
  TASKS: 'tasks',
  MY_CLIENTS: 'my-clients',
  INVOICES: 'invoices',
  FINANCIAL: 'financial',
  POOL: 'pool',
  PAYMENTS: 'payments',
  INFRACTIONS: 'infractions',
  EXPENSES: 'expenses',
  BUNDLES: 'bundles',
  USERS: 'users',
  ROLES: 'roles',
  AUDIT: 'audit',
  REPORTS: 'reports',
} as const;

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Construye un permission_key a partir de page_key y action_key
 */
export function buildPermissionKey(pageKey: string, actionKey: string): string {
  return `${pageKey}:${actionKey}`;
}

/**
 * Descompone un permission_key en sus partes
 */
export function parsePermissionKey(permissionKey: string): { pageKey: string; actionKey: string } {
  const [pageKey, actionKey] = permissionKey.split(':');
  return { pageKey, actionKey };
}

/**
 * Valida si un permission_key tiene el formato correcto
 */
export function isValidPermissionKey(permissionKey: string): boolean {
  const parts = permissionKey.split(':');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}
