-- Tabla para ingresos externos (salarios, freelance, etc.)
CREATE TABLE IF NOT EXISTS external_incomes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant VARCHAR(50) NOT NULL,
  workspace_id INT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  income_date DATE NOT NULL,
  source ENUM('salary', 'freelance', 'investment', 'rental', 'other') NOT NULL DEFAULT 'other',
  notes TEXT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tenant_date (tenant, income_date),
  INDEX idx_workspace_date (workspace_id, income_date)
);
