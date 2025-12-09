import { Request, Response, NextFunction } from 'express';
import { Pool } from 'mysql2/promise';
import { PermissionService } from '../services/permission.service';
import { createDeniedLog, createSuccessLog, extractRequestInfo } from '../models/audit-log.model';

// Extender la interfaz Request de Express para incluir usuario y servicios
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        fullName: string;
        role: string;
        tenant: number;
      };
      permissionService?: PermissionService;
      db?: Pool;
    }
  }
}

/**
 * Servicio de auditoría para registrar accesos
 */
class AuditService {
  constructor(private db: Pool) {}

  async logAccess(
    userId: number,
    action: string,
    result: 'success' | 'denied' | 'error',
    req: Request,
    resourceType?: string,
    resourceId?: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      const requestInfo = extractRequestInfo(req);

      const query = `
        INSERT INTO access_audit_log
        (user_id, action, resource_type, resource_id, result, ip_address, user_agent, request_path, request_method, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.db.execute(query, [
        userId,
        action,
        resourceType || null,
        resourceId || null,
        result,
        requestInfo.ip_address,
        requestInfo.user_agent,
        requestInfo.request_path,
        requestInfo.request_method,
        errorMessage || null,
      ]);
    } catch (error) {
      console.error('Error logging audit:', error);
      // No lanzar error para no interrumpir el flujo
    }
  }
}

/**
 * Inicializa los servicios de permisos y auditoría en la request
 */
export function initializePermissionServices(db: Pool) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.db = db;
    req.permissionService = new PermissionService(db);
    next();
  };
}

/**
 * Middleware para verificar que el usuario tiene un permiso específico
 * @param permissionKey Clave del permiso (formato: "page:action")
 * @param options Opciones adicionales
 */
export function requirePermission(
  permissionKey: string,
  options?: {
    resourceType?: string;
    getResourceId?: (req: Request) => number | undefined;
    auditAction?: string;
  }
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar que el usuario está autenticado
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const permissionService = req.permissionService!;
      const auditService = new AuditService(req.db!);
      const userId = req.user.id;

      // Verificar el permiso
      const hasPermission = await permissionService.hasPermission(userId, permissionKey);

      if (!hasPermission) {
        // Registrar acceso denegado
        await auditService.logAccess(
          userId,
          options?.auditAction || permissionKey,
          'denied',
          req,
          options?.resourceType,
          options?.getResourceId?.(req)
        );

        return res.status(403).json({
          message: 'No tiene permisos para realizar esta acción',
          required_permission: permissionKey,
        });
      }

      // Si se especifica un recurso, verificar acceso al recurso
      if (options?.resourceType && options?.getResourceId) {
        const resourceId = options.getResourceId(req);
        if (resourceId) {
          const canAccess = await permissionService.canAccessResource(
            userId,
            options.resourceType,
            resourceId
          );

          if (!canAccess) {
            await auditService.logAccess(
              userId,
              options?.auditAction || permissionKey,
              'denied',
              req,
              options.resourceType,
              resourceId
            );

            return res.status(403).json({
              message: 'No tiene acceso a este recurso',
              resource_type: options.resourceType,
              resource_id: resourceId,
            });
          }
        }
      }

      // Registrar acceso exitoso
      await auditService.logAccess(
        userId,
        options?.auditAction || permissionKey,
        'success',
        req,
        options?.resourceType,
        options?.getResourceId?.(req)
      );

      next();
    } catch (error) {
      console.error('Error in requirePermission middleware:', error);

      // Registrar error
      if (req.user && req.db) {
        const auditService = new AuditService(req.db);
        await auditService.logAccess(
          req.user.id,
          options?.auditAction || permissionKey,
          'error',
          req,
          options?.resourceType,
          options?.getResourceId?.(req),
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      return res.status(500).json({ message: 'Error al verificar permisos' });
    }
  };
}

/**
 * Middleware para verificar que el usuario tiene AL MENOS UNO de los permisos especificados
 * @param permissionKeys Array de claves de permisos
 */
export function requireAnyPermission(permissionKeys: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const permissionService = req.permissionService!;
      const auditService = new AuditService(req.db!);
      const userId = req.user.id;

      const hasAnyPermission = await permissionService.hasAnyPermission(userId, permissionKeys);

      if (!hasAnyPermission) {
        await auditService.logAccess(
          userId,
          `any_of[${permissionKeys.join(',')}]`,
          'denied',
          req
        );

        return res.status(403).json({
          message: 'No tiene permisos para realizar esta acción',
          required_permissions: permissionKeys,
          match_type: 'any',
        });
      }

      await auditService.logAccess(
        userId,
        `any_of[${permissionKeys.join(',')}]`,
        'success',
        req
      );

      next();
    } catch (error) {
      console.error('Error in requireAnyPermission middleware:', error);
      return res.status(500).json({ message: 'Error al verificar permisos' });
    }
  };
}

/**
 * Middleware para verificar que el usuario tiene TODOS los permisos especificados
 * @param permissionKeys Array de claves de permisos
 */
export function requireAllPermissions(permissionKeys: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const permissionService = req.permissionService!;
      const auditService = new AuditService(req.db!);
      const userId = req.user.id;

      const hasAllPermissions = await permissionService.hasAllPermissions(userId, permissionKeys);

      if (!hasAllPermissions) {
        await auditService.logAccess(
          userId,
          `all_of[${permissionKeys.join(',')}]`,
          'denied',
          req
        );

        return res.status(403).json({
          message: 'No tiene todos los permisos necesarios para realizar esta acción',
          required_permissions: permissionKeys,
          match_type: 'all',
        });
      }

      await auditService.logAccess(
        userId,
        `all_of[${permissionKeys.join(',')}]`,
        'success',
        req
      );

      next();
    } catch (error) {
      console.error('Error in requireAllPermissions middleware:', error);
      return res.status(500).json({ message: 'Error al verificar permisos' });
    }
  };
}

/**
 * Middleware para verificar acceso a un recurso específico
 * @param resourceType Tipo de recurso
 * @param getResourceId Función para extraer el ID del recurso de la request
 */
export function requireResourceAccess(
  resourceType: string,
  getResourceId: (req: Request) => number | undefined
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const resourceId = getResourceId(req);
      if (!resourceId) {
        return res.status(400).json({ message: 'ID de recurso no especificado' });
      }

      const permissionService = req.permissionService!;
      const auditService = new AuditService(req.db!);
      const userId = req.user.id;

      const canAccess = await permissionService.canAccessResource(userId, resourceType, resourceId);

      if (!canAccess) {
        await auditService.logAccess(
          userId,
          `access_${resourceType}`,
          'denied',
          req,
          resourceType,
          resourceId
        );

        return res.status(403).json({
          message: `No tiene acceso a este ${resourceType}`,
          resource_type: resourceType,
          resource_id: resourceId,
        });
      }

      await auditService.logAccess(
        userId,
        `access_${resourceType}`,
        'success',
        req,
        resourceType,
        resourceId
      );

      next();
    } catch (error) {
      console.error('Error in requireResourceAccess middleware:', error);
      return res.status(500).json({ message: 'Error al verificar acceso al recurso' });
    }
  };
}

/**
 * Middleware para verificar que el usuario tiene un rol específico
 * @param roleKey Clave del rol
 */
export function requireRole(roleKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      const permissionService = req.permissionService!;
      const userId = req.user.id;

      const hasRole = await permissionService.hasRole(userId, roleKey);

      if (!hasRole) {
        return res.status(403).json({
          message: 'No tiene el rol necesario para realizar esta acción',
          required_role: roleKey,
        });
      }

      next();
    } catch (error) {
      console.error('Error in requireRole middleware:', error);
      return res.status(500).json({ message: 'Error al verificar rol' });
    }
  };
}

/**
 * Middleware para verificar que el usuario es administrador
 */
export function requireAdmin() {
  return requireRole('admin');
}

/**
 * Helper para extraer el ID de un parámetro de la URL
 */
export function getParamId(paramName: string = 'id'): (req: Request) => number | undefined {
  return (req: Request) => {
    const id = req.params[paramName];
    return id ? parseInt(id, 10) : undefined;
  };
}

/**
 * Helper para extraer el ID del body
 */
export function getBodyId(fieldName: string = 'id'): (req: Request) => number | undefined {
  return (req: Request) => {
    const id = req.body[fieldName];
    return id ? parseInt(id, 10) : undefined;
  };
}
