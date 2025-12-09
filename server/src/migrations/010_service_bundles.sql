-- Migración 010: Agregar funcionalidad de bundles para agrupar servicios en un solo cobro

-- Tabla para definir bundles de servicios
CREATE TABLE IF NOT EXISTS service_bundles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_price DECIMAL(10,2) NOT NULL,
  operational_cost DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_client_bundle (client_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar campo bundle_id a client_services
ALTER TABLE client_services
ADD COLUMN bundle_id INT NULL AFTER is_active,
ADD FOREIGN KEY fk_bundle (bundle_id) REFERENCES service_bundles(id) ON DELETE SET NULL,
ADD INDEX idx_bundle (bundle_id);
