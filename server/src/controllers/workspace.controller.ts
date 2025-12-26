import { RequestHandler } from 'express';
import { WorkspaceService } from '../services/workspace.service';

/**
 * Listar workspaces del usuario actual
 * GET /api/workspaces/my
 */
export const listMyWorkspaces: RequestHandler = async (req: any, res) => {
  try {
    const workspaceService = new WorkspaceService(req.db);
    const userId = req.user.id;
    const workspaces = await workspaceService.getUserWorkspaces(userId);
    res.json(workspaces);
  } catch (error) {
    console.error('Error listing workspaces:', error);
    res.status(500).json({ message: 'Error al listar workspaces' });
  }
};

/**
 * Obtener un workspace por ID
 * GET /api/workspaces/:id
 */
export const getWorkspace: RequestHandler = async (req: any, res) => {
  try {
    const workspaceService = new WorkspaceService(req.db);
    const { id } = req.params;

    // Verificar acceso
    const hasAccess = await workspaceService.userHasAccessToWorkspace(req.user.id, Number(id));
    if (!hasAccess) {
      return res.status(403).json({ message: 'No tienes acceso a este workspace' });
    }

    const workspace = await workspaceService.getWorkspaceById(Number(id));
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace no encontrado' });
    }

    // Obtener estadísticas
    const stats = await workspaceService.getWorkspaceStats(Number(id));

    res.json({ ...workspace, stats });
  } catch (error) {
    console.error('Error getting workspace:', error);
    res.status(500).json({ message: 'Error al obtener workspace' });
  }
};

/**
 * Crear un nuevo workspace
 * POST /api/workspaces
 */
export const createWorkspace: RequestHandler = async (req: any, res) => {
  try {
    const workspaceService = new WorkspaceService(req.db);
    const { name, slug, description, color, icon } = req.body;

    // Validaciones
    if (!name || !slug) {
      return res.status(400).json({ message: 'Nombre y slug son requeridos' });
    }

    // Validar formato de slug (solo letras minúsculas, números y guiones)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return res.status(400).json({
        message: 'El identificador solo puede contener letras minúsculas, números y guiones'
      });
    }

    // Verificar que el slug sea único
    const slugExists = await workspaceService.slugExists(slug);
    if (slugExists) {
      return res.status(409).json({ message: 'Ya existe un workspace con ese identificador' });
    }

    const workspaceId = await workspaceService.createWorkspace(
      { name, slug, description, color, icon },
      req.user.id
    );

    const workspace = await workspaceService.getWorkspaceById(workspaceId);

    res.status(201).json({
      message: 'Workspace creado exitosamente',
      workspace
    });
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ message: 'Error al crear workspace' });
  }
};

/**
 * Actualizar un workspace
 * PUT /api/workspaces/:id
 */
export const updateWorkspace: RequestHandler = async (req: any, res) => {
  try {
    const workspaceService = new WorkspaceService(req.db);
    const { id } = req.params;
    const {
      name, description, color, icon, is_active,
      // Nuevos campos de configuración de infracciones
      max_infractions,
      infraction_color_0_bg, infraction_color_0_text,
      infraction_color_1_bg, infraction_color_1_text,
      infraction_color_2_bg, infraction_color_2_text
    } = req.body;

    // Verificar que tenga rol de admin u owner en el workspace
    const role = await workspaceService.getUserRoleInWorkspace(req.user.id, Number(id));
    if (!role || !['owner', 'admin'].includes(role)) {
      return res.status(403).json({ message: 'No tienes permisos para modificar este workspace' });
    }

    await workspaceService.updateWorkspace(Number(id), {
      name, description, color, icon, is_active,
      max_infractions,
      infraction_color_0_bg, infraction_color_0_text,
      infraction_color_1_bg, infraction_color_1_text,
      infraction_color_2_bg, infraction_color_2_text
    });

    const workspace = await workspaceService.getWorkspaceById(Number(id));

    res.json({
      message: 'Workspace actualizado exitosamente',
      workspace
    });
  } catch (error) {
    console.error('Error updating workspace:', error);
    res.status(500).json({ message: 'Error al actualizar workspace' });
  }
};

/**
 * Eliminar un workspace (soft delete)
 * DELETE /api/workspaces/:id
 */
export const deleteWorkspace: RequestHandler = async (req: any, res) => {
  try {
    const workspaceService = new WorkspaceService(req.db);
    const { id } = req.params;

    // Verificar que sea owner del workspace
    const role = await workspaceService.getUserRoleInWorkspace(req.user.id, Number(id));
    if (role !== 'owner') {
      return res.status(403).json({ message: 'Solo el propietario puede eliminar el workspace' });
    }

    // No permitir eliminar el workspace por defecto
    const workspace = await workspaceService.getWorkspaceById(Number(id));
    if (workspace?.is_default) {
      return res.status(400).json({ message: 'No se puede eliminar el workspace por defecto' });
    }

    await workspaceService.deleteWorkspace(Number(id));

    res.json({ message: 'Workspace eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({ message: 'Error al eliminar workspace' });
  }
};

/**
 * Obtener usuarios de un workspace
 * GET /api/workspaces/:id/users
 */
export const getWorkspaceUsers: RequestHandler = async (req: any, res) => {
  try {
    const workspaceService = new WorkspaceService(req.db);
    const { id } = req.params;

    const hasAccess = await workspaceService.userHasAccessToWorkspace(req.user.id, Number(id));
    if (!hasAccess) {
      return res.status(403).json({ message: 'No tienes acceso a este workspace' });
    }

    const users = await workspaceService.getWorkspaceUsers(Number(id));
    res.json(users);
  } catch (error) {
    console.error('Error getting workspace users:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

/**
 * Asignar usuario a workspace
 * POST /api/workspaces/:id/users
 */
export const assignUserToWorkspace: RequestHandler = async (req: any, res) => {
  try {
    const workspaceService = new WorkspaceService(req.db);
    const { id } = req.params;
    const { user_id, role_in_workspace, is_primary } = req.body;

    if (!user_id || !role_in_workspace) {
      return res.status(400).json({ message: 'user_id y role_in_workspace son requeridos' });
    }

    // Verificar permisos (debe ser owner o admin del workspace)
    const myRole = await workspaceService.getUserRoleInWorkspace(req.user.id, Number(id));
    if (!myRole || !['owner', 'admin'].includes(myRole)) {
      return res.status(403).json({ message: 'No tienes permisos para asignar usuarios' });
    }

    // Solo owners pueden asignar otros owners o admins
    if (['owner', 'admin'].includes(role_in_workspace) && myRole !== 'owner') {
      return res.status(403).json({ message: 'Solo el propietario puede asignar roles de administración' });
    }

    await workspaceService.assignUserToWorkspace(
      user_id,
      Number(id),
      role_in_workspace,
      req.user.id,
      is_primary || false
    );

    res.json({ message: 'Usuario asignado exitosamente' });
  } catch (error) {
    console.error('Error assigning user:', error);
    res.status(500).json({ message: 'Error al asignar usuario' });
  }
};

/**
 * Remover usuario de workspace
 * DELETE /api/workspaces/:id/users/:userId
 */
export const removeUserFromWorkspace: RequestHandler = async (req: any, res) => {
  try {
    const workspaceService = new WorkspaceService(req.db);
    const { id, userId } = req.params;

    // Verificar permisos
    const myRole = await workspaceService.getUserRoleInWorkspace(req.user.id, Number(id));
    if (!myRole || !['owner', 'admin'].includes(myRole)) {
      return res.status(403).json({ message: 'No tienes permisos para remover usuarios' });
    }

    // No permitir remover al owner
    const targetRole = await workspaceService.getUserRoleInWorkspace(Number(userId), Number(id));
    if (targetRole === 'owner') {
      return res.status(400).json({ message: 'No se puede remover al propietario del workspace' });
    }

    await workspaceService.removeUserFromWorkspace(Number(userId), Number(id));

    res.json({ message: 'Usuario removido exitosamente' });
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({ message: 'Error al remover usuario' });
  }
};

/**
 * Cambiar workspace activo del usuario (guarda preferencia)
 * POST /api/workspaces/switch
 */
export const switchWorkspace: RequestHandler = async (req: any, res) => {
  try {
    const workspaceService = new WorkspaceService(req.db);
    const { workspace_id } = req.body;

    if (!workspace_id) {
      return res.status(400).json({ message: 'workspace_id es requerido' });
    }

    const hasAccess = await workspaceService.userHasAccessToWorkspace(req.user.id, workspace_id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'No tienes acceso a este workspace' });
    }

    const workspace = await workspaceService.getWorkspaceById(workspace_id);

    res.json({
      message: 'Workspace cambiado exitosamente',
      workspace
    });
  } catch (error) {
    console.error('Error switching workspace:', error);
    res.status(500).json({ message: 'Error al cambiar workspace' });
  }
};

/**
 * Dashboard consolidado - métricas de todos los workspaces
 * GET /api/workspaces/dashboard/consolidated
 */
export const getConsolidatedDashboard: RequestHandler = async (req: any, res) => {
  try {
    const workspaceService = new WorkspaceService(req.db);
    const userWorkspaces = await workspaceService.getUserWorkspaces(req.user.id);
    const workspaceIds = userWorkspaces.map(w => w.id);

    if (workspaceIds.length === 0) {
      return res.json({
        period: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
        totals: { ingresos: 0, gastos: 0, gananciaNeta: 0 },
        byWorkspace: []
      });
    }

    const { year, month } = req.query;
    const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month as string) : new Date().getMonth() + 1;

    const placeholders = workspaceIds.map(() => '?').join(',');

    // Obtener ingresos por workspace
    const [ingresosData]: any = await req.db.query(`
      SELECT
        w.id as workspace_id,
        w.name as workspace_name,
        w.color,
        COALESCE(SUM(mi.amount_paid), 0) as ingresos
      FROM workspaces w
      LEFT JOIN monthly_invoices mi ON mi.workspace_id = w.id
        AND mi.invoice_year = ? AND mi.invoice_month = ?
        AND mi.payment_status IN ('paid', 'partial')
      WHERE w.id IN (${placeholders})
      GROUP BY w.id, w.name, w.color
    `, [currentYear, currentMonth, ...workspaceIds]);

    // Obtener gastos por workspace
    const [gastosData]: any = await req.db.query(`
      SELECT
        workspace_id,
        COALESCE(SUM(amount), 0) as gastos
      FROM expenses
      WHERE workspace_id IN (${placeholders})
        AND expense_year = ? AND expense_month = ?
        AND is_active = TRUE
      GROUP BY workspace_id
    `, [...workspaceIds, currentYear, currentMonth]);

    // Combinar datos
    const gastosMap = new Map(gastosData.map((g: any) => [g.workspace_id, Number(g.gastos)]));

    const byWorkspace = ingresosData.map((ws: any) => {
      const ingresos = Number(ws.ingresos);
      const gastos = Number(gastosMap.get(ws.workspace_id) || 0);
      return {
        workspace_id: ws.workspace_id,
        workspace_name: ws.workspace_name,
        color: ws.color,
        ingresos,
        gastos,
        gananciaNeta: ingresos - gastos
      };
    });

    // Calcular totales
    const totals = byWorkspace.reduce((acc: any, ws: any) => ({
      ingresos: acc.ingresos + ws.ingresos,
      gastos: acc.gastos + ws.gastos,
      gananciaNeta: acc.gananciaNeta + ws.gananciaNeta
    }), { ingresos: 0, gastos: 0, gananciaNeta: 0 });

    res.json({
      period: { year: currentYear, month: currentMonth },
      totals,
      byWorkspace
    });
  } catch (error) {
    console.error('Error getting consolidated dashboard:', error);
    res.status(500).json({ message: 'Error al obtener dashboard consolidado' });
  }
};

/**
 * Listar todos los workspaces (solo admin del sistema)
 * GET /api/workspaces
 */
export const listAllWorkspaces: RequestHandler = async (req: any, res) => {
  try {
    const [rows]: any = await req.db.query(`
      SELECT w.*,
        (SELECT COUNT(*) FROM user_workspaces WHERE workspace_id = w.id) as total_users,
        (SELECT COUNT(*) FROM clients_profiles WHERE workspace_id = w.id) as total_clients
      FROM workspaces w
      WHERE w.is_active = TRUE
      ORDER BY w.is_default DESC, w.name ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error listing all workspaces:', error);
    res.status(500).json({ message: 'Error al listar workspaces' });
  }
};

/**
 * Obtener usuarios disponibles para asignar a un workspace
 * GET /api/workspaces/:id/available-users
 */
export const getAvailableUsers: RequestHandler = async (req: any, res) => {
  try {
    const { id } = req.params;

    // Obtener usuarios que NO están en el workspace y son admin o employee
    const [rows]: any = await req.db.query(`
      SELECT u.id, u.email, u.full_name, u.role
      FROM users u
      WHERE u.is_active = TRUE
        AND u.role IN ('admin', 'employee')
        AND u.id NOT IN (
          SELECT user_id FROM user_workspaces WHERE workspace_id = ?
        )
      ORDER BY u.full_name
    `, [id]);

    res.json(rows);
  } catch (error) {
    console.error('Error getting available users:', error);
    res.status(500).json({ message: 'Error al obtener usuarios disponibles' });
  }
};
