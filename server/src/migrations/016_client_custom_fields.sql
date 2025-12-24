-- Migración 016: Campos personalizados para clientes
-- Permite al admin definir qué información requiere de sus clientes

-- Tabla para definir los campos personalizados
CREATE TABLE IF NOT EXISTS client_profile_fields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workspace_id INT DEFAULT NULL,
  field_key VARCHAR(50) NOT NULL COMMENT 'Nombre interno del campo (slug)',
  field_label VARCHAR(100) NOT NULL COMMENT 'Etiqueta visible',
  field_type ENUM('text', 'number', 'email', 'phone', 'date', 'select', 'textarea', 'checkbox') DEFAULT 'text',
  placeholder VARCHAR(200) DEFAULT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  show_in_registration BOOLEAN DEFAULT TRUE COMMENT 'Mostrar en formulario de registro',
  show_in_list BOOLEAN DEFAULT FALSE COMMENT 'Mostrar en lista de clientes',
  select_options JSON DEFAULT NULL COMMENT 'Opciones para campos tipo select',
  validation_pattern VARCHAR(200) DEFAULT NULL COMMENT 'Regex para validación',
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_field_key (workspace_id, field_key),
  INDEX idx_workspace (workspace_id),
  INDEX idx_order (display_order)
);

-- Tabla para almacenar los valores de campos personalizados por cliente
CREATE TABLE IF NOT EXISTS client_custom_values (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_user_id INT NOT NULL,
  field_id INT NOT NULL,
  field_value TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_client_field (client_user_id, field_id),
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (field_id) REFERENCES client_profile_fields(id) ON DELETE CASCADE
);

-- Insertar campos predeterminados (basados en lo que ya existe)
INSERT INTO client_profile_fields (field_key, field_label, field_type, is_required, show_in_registration, show_in_list, display_order) VALUES
('sede', 'Sede', 'text', FALSE, TRUE, TRUE, 1),
('grupo', 'Grupo', 'text', FALSE, TRUE, TRUE, 2),
('contract_number', 'Número de Contrato', 'text', FALSE, FALSE, FALSE, 3),
('company_name', 'Nombre de Empresa', 'text', FALSE, TRUE, TRUE, 4),
('address', 'Dirección', 'textarea', FALSE, TRUE, FALSE, 5)
ON DUPLICATE KEY UPDATE field_label = VALUES(field_label);
