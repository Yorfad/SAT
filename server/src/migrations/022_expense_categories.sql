-- =====================================================
-- Migración 022: Sistema de Categorías de Gastos
-- =====================================================

-- Tabla de categorías de gastos
CREATE TABLE IF NOT EXISTS expense_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  color VARCHAR(7) DEFAULT '#6B7280',
  workspace_id INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by_user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_name_workspace (name, workspace_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_workspace (workspace_id),
  INDEX idx_active (is_active)
);

-- Categorías globales por defecto (workspace_id = NULL)
INSERT INTO expense_categories (name, description, color, workspace_id) VALUES
('Nómina', 'Pagos a empleados y colaboradores', '#3B82F6', NULL),
('Servicios Públicos', 'Agua, luz, internet, teléfono', '#10B981', NULL),
('Alquiler', 'Renta de oficinas y espacios', '#8B5CF6', NULL),
('Suministros', 'Materiales de oficina y consumibles', '#F59E0B', NULL),
('Transporte', 'Combustible, viáticos, envíos', '#EF4444', NULL),
('Tecnología', 'Software, hardware, suscripciones', '#6366F1', NULL),
('Impuestos', 'Obligaciones fiscales', '#DC2626', NULL),
('Marketing', 'Publicidad y promociones', '#EC4899', NULL),
('Seguros', 'Pólizas y coberturas', '#14B8A6', NULL),
('Capacitación', 'Cursos y formación', '#8B5CF6', NULL),
('Mantenimiento', 'Reparaciones y mantenimiento', '#F97316', NULL),
('Otros', 'Gastos no categorizados', '#6B7280', NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Agregar columna category_id a expenses (FK a expense_categories)
-- Mantenemos la columna category (VARCHAR) por compatibilidad
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS category_id INT NULL,
ADD CONSTRAINT fk_expense_category
  FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL;

-- Índice para búsquedas por categoría
ALTER TABLE expenses ADD INDEX IF NOT EXISTS idx_category_id (category_id);
