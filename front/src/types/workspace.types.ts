export interface Workspace {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  is_active: boolean;
  is_default: boolean;
  role_in_workspace: 'owner' | 'admin' | 'member' | 'viewer';
  is_primary: boolean;
  // Configuración de infracciones
  max_infractions: number;
  infraction_color_0_bg: string | null;
  infraction_color_0_text: string | null;
  infraction_color_1_bg: string;
  infraction_color_1_text: string;
  infraction_color_2_bg: string;
  infraction_color_2_text: string;
}
