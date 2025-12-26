import { RowDataPacket } from 'mysql2/promise';

export interface Workspace extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  is_default: boolean;
  created_by_user_id: number | null;
  created_at: Date;
  updated_at: Date;
  // Configuración de infracciones
  max_infractions: number;
  infraction_color_0_bg: string | null;
  infraction_color_0_text: string | null;
  infraction_color_1_bg: string;
  infraction_color_1_text: string;
  infraction_color_2_bg: string;
  infraction_color_2_text: string;
}

export interface UserWorkspace extends RowDataPacket {
  id: number;
  user_id: number;
  workspace_id: number;
  role_in_workspace: 'owner' | 'admin' | 'member' | 'viewer';
  is_primary: boolean;
  assigned_by_user_id: number | null;
  assigned_at: Date;
}

export interface WorkspaceWithRole extends Workspace {
  role_in_workspace: 'owner' | 'admin' | 'member' | 'viewer';
  is_primary: boolean;
}

export interface WorkspaceUser extends RowDataPacket {
  id: number;
  email: string;
  full_name: string;
  role: string;
  role_in_workspace: 'owner' | 'admin' | 'member' | 'viewer';
  is_primary: boolean;
}

export interface CreateWorkspaceDTO {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateWorkspaceDTO {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
  // Configuración de infracciones
  max_infractions?: number;
  infraction_color_0_bg?: string | null;
  infraction_color_0_text?: string | null;
  infraction_color_1_bg?: string;
  infraction_color_1_text?: string;
  infraction_color_2_bg?: string;
  infraction_color_2_text?: string;
}

export interface AssignUserToWorkspaceDTO {
  user_id: number;
  role_in_workspace: 'owner' | 'admin' | 'member' | 'viewer';
  is_primary?: boolean;
}
