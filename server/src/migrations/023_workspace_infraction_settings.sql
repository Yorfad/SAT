-- Migración 023: Configuración de infracciones por workspace
-- Agrega campos para límite de infracciones y colores visuales

-- Agregar campos de configuración de infracciones al workspace
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS max_infractions INT DEFAULT 3 COMMENT 'Límite de infracciones antes de desactivar cliente',
ADD COLUMN IF NOT EXISTS infraction_color_0_bg VARCHAR(7) DEFAULT NULL COMMENT 'Color fondo sin infracciones (null=default)',
ADD COLUMN IF NOT EXISTS infraction_color_0_text VARCHAR(7) DEFAULT NULL COMMENT 'Color texto sin infracciones (null=default)',
ADD COLUMN IF NOT EXISTS infraction_color_1_bg VARCHAR(7) DEFAULT '#FEF3C7' COMMENT 'Color fondo 1 infracción (amarillo claro)',
ADD COLUMN IF NOT EXISTS infraction_color_1_text VARCHAR(7) DEFAULT '#92400E' COMMENT 'Color texto 1 infracción (amarillo oscuro)',
ADD COLUMN IF NOT EXISTS infraction_color_2_bg VARCHAR(7) DEFAULT '#FEE2E2' COMMENT 'Color fondo 2+ infracciones (rojo claro)',
ADD COLUMN IF NOT EXISTS infraction_color_2_text VARCHAR(7) DEFAULT '#991B1B' COMMENT 'Color texto 2+ infracciones (rojo oscuro)';
