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
