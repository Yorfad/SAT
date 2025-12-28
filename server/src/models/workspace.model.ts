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
  auto_deactivate_on_limit: boolean;
  infraction_color_scheme: 'clasico' | 'intenso' | 'profesional' | 'oscuro' | 'custom';
  // Colores de infracción (niveles 1-10)
  infraction_color_1_bg?: string;
  infraction_color_1_text?: string;
  infraction_color_2_bg?: string;
  infraction_color_2_text?: string;
  infraction_color_3_bg?: string;
  infraction_color_3_text?: string;
  infraction_color_4_bg?: string;
  infraction_color_4_text?: string;
  infraction_color_5_bg?: string;
  infraction_color_5_text?: string;
  infraction_color_6_bg?: string;
  infraction_color_6_text?: string;
  infraction_color_7_bg?: string;
  infraction_color_7_text?: string;
  infraction_color_8_bg?: string;
  infraction_color_8_text?: string;
  infraction_color_9_bg?: string;
  infraction_color_9_text?: string;
  infraction_color_10_bg?: string;
  infraction_color_10_text?: string;
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
  auto_deactivate_on_limit?: boolean;
  infraction_color_scheme?: 'clasico' | 'intenso' | 'profesional' | 'oscuro' | 'custom';
  // Colores de infracción (niveles 1-10)
  infraction_color_1_bg?: string;
  infraction_color_1_text?: string;
  infraction_color_2_bg?: string;
  infraction_color_2_text?: string;
  infraction_color_3_bg?: string;
  infraction_color_3_text?: string;
  infraction_color_4_bg?: string;
  infraction_color_4_text?: string;
  infraction_color_5_bg?: string;
  infraction_color_5_text?: string;
  infraction_color_6_bg?: string;
  infraction_color_6_text?: string;
  infraction_color_7_bg?: string;
  infraction_color_7_text?: string;
  infraction_color_8_bg?: string;
  infraction_color_8_text?: string;
  infraction_color_9_bg?: string;
  infraction_color_9_text?: string;
  infraction_color_10_bg?: string;
  infraction_color_10_text?: string;
}

export interface AssignUserToWorkspaceDTO {
  user_id: number;
  role_in_workspace: 'owner' | 'admin' | 'member' | 'viewer';
  is_primary?: boolean;
}
