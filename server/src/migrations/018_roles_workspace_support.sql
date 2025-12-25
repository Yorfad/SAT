-- Migración: Soporte de roles por workspace
-- Permite que los roles sean globales o específicos por workspace

-- Agregar campo para tracking del workspace donde se creó el rol
ALTER TABLE roles ADD COLUMN created_in_workspace_id INT NULL AFTER is_active;
ALTER TABLE roles ADD CONSTRAINT fk_roles_workspace
  FOREIGN KEY (created_in_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

-- Tabla de configuración del tenant (si no existe)
CREATE TABLE IF NOT EXISTS tenant_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Configuración por defecto: roles globales
INSERT INTO tenant_settings (setting_key, setting_value, setting_type, description)
VALUES ('roles_per_workspace', 'false', 'boolean', 'Si true, los roles son específicos por workspace. Si false, son globales.')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
