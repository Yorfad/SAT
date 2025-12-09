import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import {
  Workspace,
  UserWorkspace,
  WorkspaceWithRole,
  WorkspaceUser,
  CreateWorkspaceDTO,
  UpdateWorkspaceDTO
} from '../models/workspace.model';

export class WorkspaceService {
  constructor(private db: Pool) {}

  /**
   * Obtener todos los workspaces de un usuario
   */
  async getUserWorkspaces(userId: number): Promise<WorkspaceWithRole[]> {
    const [rows] = await this.db.execute<WorkspaceWithRole[]>(`
      SELECT w.*, uw.role_in_workspace, uw.is_primary
      FROM workspaces w
      INNER JOIN user_workspaces uw ON uw.workspace_id = w.id
      WHERE uw.user_id = ? AND w.is_active = TRUE
      ORDER BY uw.is_primary DESC, w.name ASC
    `, [userId]);
    return rows;
  }

  /**
   * Obtener workspace por ID
   */
  async getWorkspaceById(workspaceId: number): Promise<Workspace | null> {
    const [rows] = await this.db.execute<Workspace[]>(
      'SELECT * FROM workspaces WHERE id = ?',
      [workspaceId]
    );
    return rows[0] || null;
  }

  /**
   * Obtener workspace por slug
   */
  async getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
    const [rows] = await this.db.execute<Workspace[]>(
      'SELECT * FROM workspaces WHERE slug = ? AND is_active = TRUE',
      [slug]
    );
    return rows[0] || null;
  }

  /**
   * Verificar si un usuario tiene acceso a un workspace
   */
  async userHasAccessToWorkspace(userId: number, workspaceId: number): Promise<boolean> {
    const [rows] = await this.db.execute<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM user_workspaces
      WHERE user_id = ? AND workspace_id = ?
    `, [userId, workspaceId]);
    return rows[0].count > 0;
  }

  /**
   * Obtener el rol de un usuario en un workspace
   */
  async getUserRoleInWorkspace(userId: number, workspaceId: number): Promise<string | null> {
    const [rows] = await this.db.execute<RowDataPacket[]>(`
      SELECT role_in_workspace FROM user_workspaces
      WHERE user_id = ? AND workspace_id = ?
    `, [userId, workspaceId]);
    return rows[0]?.role_in_workspace || null;
  }

  /**
   * Crear un nuevo workspace
   */
  async createWorkspace(data: CreateWorkspaceDTO, createdBy: number): Promise<number> {
    const [result] = await this.db.execute<ResultSetHeader>(`
      INSERT INTO workspaces (name, slug, description, color, icon, created_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      data.name,
      data.slug.toLowerCase(),
      data.description || null,
      data.color || '#3b82f6',
      data.icon || 'building',
      createdBy
    ]);

    const workspaceId = result.insertId;

    // Asignar el creador como owner
    await this.db.execute(`
      INSERT INTO user_workspaces (user_id, workspace_id, role_in_workspace, is_primary, assigned_by_user_id)
      VALUES (?, ?, 'owner', FALSE, ?)
    `, [createdBy, workspaceId, createdBy]);

    return workspaceId;
  }

  /**
   * Actualizar un workspace
   */
  async updateWorkspace(workspaceId: number, data: UpdateWorkspaceDTO): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      params.push(data.color);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      params.push(data.icon);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(data.is_active);
    }

    if (updates.length === 0) return;

    params.push(workspaceId);
    await this.db.execute(
      `UPDATE workspaces SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }

  /**
   * Eliminar un workspace (soft delete)
   */
  async deleteWorkspace(workspaceId: number): Promise<void> {
    await this.db.execute(
      'UPDATE workspaces SET is_active = FALSE WHERE id = ?',
      [workspaceId]
    );
  }

  /**
   * Asignar un usuario a un workspace
   */
  async assignUserToWorkspace(
    userId: number,
    workspaceId: number,
    role: string,
    assignedBy: number,
    isPrimary: boolean = false
  ): Promise<void> {
    // Si se marca como primario, quitar el primario de otros workspaces del usuario
    if (isPrimary) {
      await this.db.execute(
        'UPDATE user_workspaces SET is_primary = FALSE WHERE user_id = ?',
        [userId]
      );
    }

    await this.db.execute(`
      INSERT INTO user_workspaces (user_id, workspace_id, role_in_workspace, is_primary, assigned_by_user_id)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        role_in_workspace = VALUES(role_in_workspace),
        is_primary = VALUES(is_primary)
    `, [userId, workspaceId, role, isPrimary, assignedBy]);
  }

  /**
   * Remover un usuario de un workspace
   */
  async removeUserFromWorkspace(userId: number, workspaceId: number): Promise<void> {
    await this.db.execute(
      'DELETE FROM user_workspaces WHERE user_id = ? AND workspace_id = ?',
      [userId, workspaceId]
    );
  }

  /**
   * Obtener todos los usuarios de un workspace
   */
  async getWorkspaceUsers(workspaceId: number): Promise<WorkspaceUser[]> {
    const [rows] = await this.db.execute<WorkspaceUser[]>(`
      SELECT u.id, u.email, u.full_name, u.role, uw.role_in_workspace, uw.is_primary
      FROM users u
      INNER JOIN user_workspaces uw ON uw.user_id = u.id
      WHERE uw.workspace_id = ? AND u.is_active = TRUE
      ORDER BY
        FIELD(uw.role_in_workspace, 'owner', 'admin', 'member', 'viewer'),
        u.full_name
    `, [workspaceId]);
    return rows;
  }

  /**
   * Obtener el workspace primario de un usuario
   */
  async getPrimaryWorkspace(userId: number): Promise<WorkspaceWithRole | null> {
    const [rows] = await this.db.execute<WorkspaceWithRole[]>(`
      SELECT w.*, uw.role_in_workspace, uw.is_primary
      FROM workspaces w
      INNER JOIN user_workspaces uw ON uw.workspace_id = w.id
      WHERE uw.user_id = ? AND uw.is_primary = TRUE AND w.is_active = TRUE
      LIMIT 1
    `, [userId]);

    if (rows.length > 0) return rows[0];

    // Si no hay workspace primario, devolver el primero disponible
    const [fallback] = await this.db.execute<WorkspaceWithRole[]>(`
      SELECT w.*, uw.role_in_workspace, uw.is_primary
      FROM workspaces w
      INNER JOIN user_workspaces uw ON uw.workspace_id = w.id
      WHERE uw.user_id = ? AND w.is_active = TRUE
      ORDER BY w.is_default DESC, w.name ASC
      LIMIT 1
    `, [userId]);

    return fallback[0] || null;
  }

  /**
   * Verificar si un slug ya existe
   */
  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM workspaces WHERE slug = ?';
    const params: any[] = [slug.toLowerCase()];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await this.db.execute<RowDataPacket[]>(query, params);
    return rows[0].count > 0;
  }

  /**
   * Obtener IDs de workspaces accesibles por un usuario
   */
  async getAccessibleWorkspaceIds(userId: number): Promise<number[]> {
    const [rows] = await this.db.execute<RowDataPacket[]>(`
      SELECT uw.workspace_id
      FROM user_workspaces uw
      INNER JOIN workspaces w ON w.id = uw.workspace_id
      WHERE uw.user_id = ? AND w.is_active = TRUE
    `, [userId]);
    return rows.map(r => r.workspace_id);
  }

  /**
   * Obtener estadísticas de un workspace
   */
  async getWorkspaceStats(workspaceId: number): Promise<{
    totalClients: number;
    totalEmployees: number;
    totalServices: number;
  }> {
    const [clientsResult] = await this.db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM clients_profiles WHERE workspace_id = ?',
      [workspaceId]
    );

    const [employeesResult] = await this.db.execute<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM user_workspaces uw
      INNER JOIN users u ON u.id = uw.user_id
      WHERE uw.workspace_id = ? AND u.role = 'employee' AND u.is_active = TRUE
    `, [workspaceId]);

    const [servicesResult] = await this.db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM services WHERE (workspace_id = ? OR is_global = TRUE) AND is_active = TRUE',
      [workspaceId]
    );

    return {
      totalClients: clientsResult[0].count,
      totalEmployees: employeesResult[0].count,
      totalServices: servicesResult[0].count
    };
  }
}
