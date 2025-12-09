import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from '../services/workspace.service';

// Valor especial para indicar vista consolidada (todos los workspaces)
export const CONSOLIDATED_WORKSPACE = 'all';

// Extender el tipo Request de Express
declare global {
  namespace Express {
    interface Request {
      workspaceId?: number | null;
      workspaceSlug?: string;
      isConsolidatedView?: boolean;
      accessibleWorkspaceIds?: number[];
    }
  }
}

/**
 * Middleware para resolver el workspace desde el header o query param
 * - Header: X-Workspace
 * - Query: ?workspace=slug
 * - Valor especial "all" = vista consolidada
 */
export function resolveWorkspace(req: Request, res: Response, next: NextFunction) {
  const fromHeader = req.headers['x-workspace'] as string;
  const fromQuery = req.query.workspace as string;
  const workspaceSlug = fromHeader || fromQuery;

  if (!workspaceSlug || workspaceSlug === CONSOLIDATED_WORKSPACE) {
    req.isConsolidatedView = true;
    req.workspaceId = null;
    req.workspaceSlug = CONSOLIDATED_WORKSPACE;
    return next();
  }

  req.workspaceSlug = workspaceSlug;
  req.isConsolidatedView = false;
  next();
}

/**
 * Middleware para cargar el workspace_id desde el slug y verificar acceso
 * Debe usarse después de authenticateToken y resolveWorkspace
 */
export async function loadWorkspaceId(req: Request, res: Response, next: NextFunction) {
  // Si es vista consolidada, cargar todos los workspace IDs accesibles
  if (req.isConsolidatedView) {
    try {
      const workspaceService = new WorkspaceService(req.db!);
      const user = (req as any).user;

      if (user) {
        req.accessibleWorkspaceIds = await workspaceService.getAccessibleWorkspaceIds(user.id);
      }
      return next();
    } catch (error) {
      console.error('Error loading accessible workspaces:', error);
      return res.status(500).json({ message: 'Error al cargar workspaces' });
    }
  }

  // Si no hay slug de workspace, continuar sin workspace
  if (!req.workspaceSlug) {
    return next();
  }

  try {
    const workspaceService = new WorkspaceService(req.db!);
    const workspace = await workspaceService.getWorkspaceBySlug(req.workspaceSlug);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace no encontrado' });
    }

    req.workspaceId = workspace.id;

    // Verificar que el usuario tiene acceso al workspace
    const user = (req as any).user;
    if (user) {
      const hasAccess = await workspaceService.userHasAccessToWorkspace(user.id, workspace.id);
      if (!hasAccess) {
        return res.status(403).json({ message: 'No tienes acceso a este workspace' });
      }
    }

    next();
  } catch (error) {
    console.error('Error loading workspace:', error);
    res.status(500).json({ message: 'Error al cargar workspace' });
  }
}

/**
 * Middleware para requerir un workspace específico (no permitir vista consolidada)
 * Útil para operaciones de creación/edición que necesitan un workspace
 */
export function requireSpecificWorkspace(req: Request, res: Response, next: NextFunction) {
  if (req.isConsolidatedView || !req.workspaceId) {
    return res.status(400).json({
      message: 'Esta operación requiere seleccionar un workspace específico'
    });
  }
  next();
}

/**
 * Middleware para requerir rol específico en el workspace actual
 */
export function requireWorkspaceRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.workspaceId) {
      return res.status(400).json({ message: 'Workspace no especificado' });
    }

    try {
      const workspaceService = new WorkspaceService(req.db!);
      const user = (req as any).user;

      const role = await workspaceService.getUserRoleInWorkspace(user.id, req.workspaceId);

      if (!role || !allowedRoles.includes(role)) {
        return res.status(403).json({
          message: `Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Error checking workspace role:', error);
      res.status(500).json({ message: 'Error al verificar permisos' });
    }
  };
}

/**
 * Helper para construir condición SQL de filtrado por workspace
 * @param isConsolidated - Si es vista consolidada
 * @param workspaceId - ID del workspace actual
 * @param accessibleIds - IDs de workspaces accesibles (para vista consolidada)
 * @param columnName - Nombre de la columna workspace_id en la tabla
 * @returns Objeto con la cláusula WHERE y los parámetros
 */
export function buildWorkspaceFilter(
  isConsolidated: boolean,
  workspaceId: number | null | undefined,
  accessibleIds: number[] | undefined,
  columnName: string = 'workspace_id'
): { clause: string; params: any[] } {
  if (!isConsolidated && workspaceId) {
    return {
      clause: `${columnName} = ?`,
      params: [workspaceId]
    };
  }

  if (isConsolidated && accessibleIds && accessibleIds.length > 0) {
    const placeholders = accessibleIds.map(() => '?').join(',');
    return {
      clause: `${columnName} IN (${placeholders})`,
      params: accessibleIds
    };
  }

  // Sin filtro (no debería ocurrir en uso normal)
  return {
    clause: '1=1',
    params: []
  };
}
