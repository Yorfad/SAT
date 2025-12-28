-- Migración 027: Extensión de configuración de infracciones por workspace
-- Agrega columnas para niveles de color 3-10, auto_deactivate_on_limit y infraction_color_scheme

-- Agregar auto_deactivate_on_limit
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS auto_deactivate_on_limit BOOLEAN DEFAULT TRUE COMMENT 'Si TRUE, desactiva cliente al alcanzar límite; si FALSE, solo bloquea agregar más';

-- Agregar esquema de colores seleccionado
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS infraction_color_scheme ENUM('clasico', 'intenso', 'profesional', 'oscuro', 'custom') DEFAULT 'clasico' COMMENT 'Esquema de colores de infracciones';

-- Agregar colores para niveles 3-10
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS infraction_color_3_bg VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_3_text VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_4_bg VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_4_text VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_5_bg VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_5_text VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_6_bg VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_6_text VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_7_bg VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_7_text VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_8_bg VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_8_text VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_9_bg VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_9_text VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_10_bg VARCHAR(7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS infraction_color_10_text VARCHAR(7) DEFAULT NULL;
