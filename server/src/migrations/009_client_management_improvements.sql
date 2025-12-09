-- ============================================================================
-- MIGRACIÓN 009: Mejoras de Gestión de Clientes y Servicios
-- ============================================================================
-- Agregar sede, grupo, pool de clientes, servicios por solicitud y prioridades

-- ============================================================================
-- 1. Agregar campos de sede y grupo a clients_profiles
-- ============================================================================
ALTER TABLE clients_profiles
ADD COLUMN sede VARCHAR(100) NULL COMMENT 'Sede del cliente (ej: Mazatenango, Guatemala, etc.)',
ADD COLUMN grupo VARCHAR(50) NULL COMMENT 'Grupo del cliente para organización y filtrado';

-- ============================================================================
-- 2. Agregar campo is_on_request a services
-- ============================================================================
ALTER TABLE services
ADD COLUMN is_on_request BOOLEAN DEFAULT FALSE COMMENT 'Indica si el servicio solo se activa por solicitud del cliente';

-- ============================================================================
-- 3. Crear tabla de prioridades de servicios por cliente
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_service_priorities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_user_id INT NOT NULL,
  service_id INT NULL,
  priority ENUM('baja', 'normal', 'alta', 'urgente') DEFAULT 'normal',
  notes TEXT NULL,
  created_by_user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_client_service_priority (client_user_id, service_id)
) COMMENT='Prioridades específicas de servicios para clientes';

-- ============================================================================
-- 4. Crear tabla de pool de clientes compartido
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_pool (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_user_id INT NOT NULL,
  invoice_id INT NULL,
  task_id INT NULL,
  service_id INT NULL,
  description TEXT NOT NULL COMMENT 'Descripción de la tarea pendiente',
  priority ENUM('baja', 'normal', 'alta', 'urgente') DEFAULT 'normal',
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  added_by_user_id INT NULL,
  assigned_to_user_id INT NULL COMMENT 'Usuario que tomó la tarea del pool',
  completed_by_user_id INT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  notes TEXT NULL,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES monthly_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES monthly_service_checklist(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (completed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_client (client_user_id),
  INDEX idx_assigned_to (assigned_to_user_id)
) COMMENT='Pool compartido de tareas de clientes para colaboración entre empleados';

-- ============================================================================
-- 5. Agregar índices para mejorar rendimiento de búsquedas
-- ============================================================================
ALTER TABLE clients_profiles
ADD INDEX idx_sede (sede),
ADD INDEX idx_grupo (grupo);

ALTER TABLE services
ADD INDEX idx_is_on_request (is_on_request);

-- ============================================================================
-- FIN DE MIGRACIÓN 009
-- ============================================================================
