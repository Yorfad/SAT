import { RowDataPacket } from 'mysql2';

// ========================================
// INTERFACES DE AUDITORÍA
// ========================================

export interface AccessAuditLog extends RowDataPacket {
  id: number;
  user_id: number;
  action: string;
  resource_type?: string;
  resource_id?: number;
  result: 'success' | 'denied' | 'error';
  ip_address?: string;
  user_agent?: string;
  request_path?: string;
  request_method?: string;
  error_message?: string;
  created_at: Date;
}

// ========================================
// VISTAS Y CONSULTAS COMPLEJAS
// ========================================

export interface AuditLogWithUserInfo extends AccessAuditLog {
  user_email: string;
  user_full_name: string;
  user_role: string;
}

export interface AuditLogSummary {
  period_start: Date;
  period_end: Date;
  total_actions: number;
  successful_actions: number;
  denied_actions: number;
  error_actions: number;
  unique_users: number;
  most_common_action: string;
  most_common_resource: string;
}

export interface UserAuditSummary {
  user_id: number;
  user_email: string;
  user_full_name: string;
  total_actions: number;
  successful_actions: number;
  denied_actions: number;
  error_actions: number;
  last_action_date: Date;
  most_common_action: string;
}

export interface ResourceAccessLog {
  resource_type: string;
  resource_id: number;
  total_accesses: number;
  unique_users: number;
  last_access: Date;
  access_breakdown: {
    action: string;
    count: number;
    success_count: number;
    denied_count: number;
  }[];
}

// ========================================
// TIPOS PARA CREACIÓN Y FILTROS
// ========================================

export interface CreateAuditLog {
  user_id: number;
  action: string;
  resource_type?: string;
  resource_id?: number;
  result: 'success' | 'denied' | 'error';
  ip_address?: string;
  user_agent?: string;
  request_path?: string;
  request_method?: string;
  error_message?: string;
}

export interface AuditLogFilter {
  user_id?: number;
  action?: string;
  resource_type?: string;
  resource_id?: number;
  result?: 'success' | 'denied' | 'error';
  start_date?: Date;
  end_date?: Date;
  ip_address?: string;
  limit?: number;
  offset?: number;
}

export interface SecurityAlert {
  alert_type: 'multiple_failed_attempts' | 'unusual_access_pattern' | 'privilege_escalation_attempt' | 'suspicious_ip';
  user_id?: number;
  user_email?: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detected_at: Date;
  related_logs: number[]; // IDs de los logs relacionados
}

// ========================================
// CONSTANTES
// ========================================

export const AUDIT_RESULT = {
  SUCCESS: 'success',
  DENIED: 'denied',
  ERROR: 'error',
} as const;

export const AUDIT_ACTIONS = {
  // Autenticación
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  LOGIN_FAILED: 'auth:login_failed',
  PASSWORD_CHANGE: 'auth:password_change',
  PASSWORD_RESET: 'auth:password_reset',

  // Usuarios
  USER_CREATE: 'users:create',
  USER_VIEW: 'users:view',
  USER_EDIT: 'users:edit',
  USER_DELETE: 'users:delete',
  USER_ACTIVATE: 'users:activate',
  USER_DEACTIVATE: 'users:deactivate',

  // Roles y Permisos
  ROLE_ASSIGN: 'roles:assign',
  ROLE_REVOKE: 'roles:revoke',
  PERMISSION_GRANT: 'permissions:grant',
  PERMISSION_REVOKE: 'permissions:revoke',

  // Clientes
  CLIENT_CREATE: 'clients:create',
  CLIENT_VIEW: 'clients:view',
  CLIENT_EDIT: 'clients:edit',
  CLIENT_DELETE: 'clients:delete',
  CLIENT_ASSIGN: 'clients:assign',

  // Servicios
  SERVICE_CREATE: 'services:create',
  SERVICE_VIEW: 'services:view',
  SERVICE_EDIT: 'services:edit',
  SERVICE_DELETE: 'services:delete',

  // Tareas
  TASK_VIEW: 'tasks:view',
  TASK_COMPLETE: 'tasks:complete',
  TASK_ASSIGN: 'tasks:assign',

  // Finanzas
  PAYMENT_RECORD: 'payments:record',
  EXPENSE_CREATE: 'expenses:create',
  INVOICE_VIEW: 'invoices:view',

  // Exportaciones y Reportes
  DATA_EXPORT: 'data:export',
  REPORT_GENERATE: 'reports:generate',

  // Accesos sensibles
  SENSITIVE_DATA_ACCESS: 'sensitive:access',
  ADMIN_PANEL_ACCESS: 'admin:panel_access',
} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS] | string;

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Crea un log de auditoría para una acción exitosa
 */
export function createSuccessLog(
  userId: number,
  action: AuditAction,
  resourceType?: string,
  resourceId?: number,
  additionalInfo?: Partial<CreateAuditLog>
): CreateAuditLog {
  return {
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    result: AUDIT_RESULT.SUCCESS,
    ...additionalInfo,
  };
}

/**
 * Crea un log de auditoría para una acción denegada
 */
export function createDeniedLog(
  userId: number,
  action: AuditAction,
  resourceType?: string,
  resourceId?: number,
  additionalInfo?: Partial<CreateAuditLog>
): CreateAuditLog {
  return {
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    result: AUDIT_RESULT.DENIED,
    ...additionalInfo,
  };
}

/**
 * Crea un log de auditoría para una acción con error
 */
export function createErrorLog(
  userId: number,
  action: AuditAction,
  errorMessage: string,
  resourceType?: string,
  resourceId?: number,
  additionalInfo?: Partial<CreateAuditLog>
): CreateAuditLog {
  return {
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    result: AUDIT_RESULT.ERROR,
    error_message: errorMessage,
    ...additionalInfo,
  };
}

/**
 * Extrae información de la request de Express
 */
export function extractRequestInfo(req: any): Pick<CreateAuditLog, 'ip_address' | 'user_agent' | 'request_path' | 'request_method'> {
  return {
    ip_address: req.ip || req.connection?.remoteAddress,
    user_agent: req.get('user-agent'),
    request_path: req.originalUrl || req.url,
    request_method: req.method,
  };
}

/**
 * Detecta patrones sospechosos en los logs
 */
export function detectSuspiciousPatterns(logs: AccessAuditLog[]): SecurityAlert[] {
  const alerts: SecurityAlert[] = [];

  // Detectar múltiples intentos fallidos
  const failedLogins = logs.filter(
    (log) => log.action === AUDIT_ACTIONS.LOGIN_FAILED && log.result === AUDIT_RESULT.DENIED
  );

  if (failedLogins.length >= 5) {
    const userIds = [...new Set(failedLogins.map((log) => log.user_id))];
    userIds.forEach((userId) => {
      const userFailedLogins = failedLogins.filter((log) => log.user_id === userId);
      if (userFailedLogins.length >= 5) {
        alerts.push({
          alert_type: 'multiple_failed_attempts',
          user_id: userId,
          details: `${userFailedLogins.length} intentos de login fallidos`,
          severity: 'high',
          detected_at: new Date(),
          related_logs: userFailedLogins.map((log) => log.id),
        });
      }
    });
  }

  // Detectar accesos denegados repetidos
  const deniedAccesses = logs.filter((log) => log.result === AUDIT_RESULT.DENIED);
  if (deniedAccesses.length >= 10) {
    alerts.push({
      alert_type: 'unusual_access_pattern',
      details: `${deniedAccesses.length} accesos denegados en el período`,
      severity: 'medium',
      detected_at: new Date(),
      related_logs: deniedAccesses.map((log) => log.id),
    });
  }

  // Detectar intentos de escalación de privilegios
  const privilegeAttempts = logs.filter(
    (log) =>
      (log.action.includes('role:') || log.action.includes('permission:')) &&
      log.result === AUDIT_RESULT.DENIED
  );

  if (privilegeAttempts.length >= 3) {
    alerts.push({
      alert_type: 'privilege_escalation_attempt',
      details: `${privilegeAttempts.length} intentos de modificar permisos denegados`,
      severity: 'critical',
      detected_at: new Date(),
      related_logs: privilegeAttempts.map((log) => log.id),
    });
  }

  return alerts;
}

/**
 * Calcula métricas de seguridad
 */
export function calculateSecurityMetrics(logs: AccessAuditLog[]): {
  total_actions: number;
  success_rate: number;
  denied_rate: number;
  error_rate: number;
  risk_score: number; // 0-100, donde 100 es máximo riesgo
} {
  const total = logs.length;
  if (total === 0) {
    return { total_actions: 0, success_rate: 0, denied_rate: 0, error_rate: 0, risk_score: 0 };
  }

  const successful = logs.filter((log) => log.result === AUDIT_RESULT.SUCCESS).length;
  const denied = logs.filter((log) => log.result === AUDIT_RESULT.DENIED).length;
  const errors = logs.filter((log) => log.result === AUDIT_RESULT.ERROR).length;

  const success_rate = (successful / total) * 100;
  const denied_rate = (denied / total) * 100;
  const error_rate = (errors / total) * 100;

  // Calcular score de riesgo (más denegaciones y errores = mayor riesgo)
  const risk_score = Math.min(100, (denied_rate * 0.7 + error_rate * 0.3));

  return {
    total_actions: total,
    success_rate: Math.round(success_rate * 100) / 100,
    denied_rate: Math.round(denied_rate * 100) / 100,
    error_rate: Math.round(error_rate * 100) / 100,
    risk_score: Math.round(risk_score * 100) / 100,
  };
}
