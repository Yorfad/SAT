-- Migración 015: Sistema de Aprobación del Cliente
-- Permite a los clientes revisar y aprobar/rechazar los trabajos realizados

-- Agregar campos de aprobación a la tabla de tareas
ALTER TABLE monthly_service_checklist
ADD COLUMN IF NOT EXISTS client_approved BOOLEAN DEFAULT NULL COMMENT 'NULL=pendiente, TRUE=aprobado, FALSE=rechazado',
ADD COLUMN IF NOT EXISTS client_approved_at TIMESTAMP NULL COMMENT 'Fecha de aprobación/rechazo',
ADD COLUMN IF NOT EXISTS client_rejection_reason TEXT NULL COMMENT 'Motivo del rechazo',
ADD COLUMN IF NOT EXISTS auto_approve_days INT DEFAULT 7 COMMENT 'Días para auto-aprobar después de subir archivos',
ADD COLUMN IF NOT EXISTS files_uploaded_at TIMESTAMP NULL COMMENT 'Fecha cuando se subieron los archivos',
ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE COMMENT 'Si fue auto-aprobado por tiempo';

-- Tabla para solicitudes de servicios adicionales
CREATE TABLE IF NOT EXISTS service_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_user_id INT NOT NULL,
  service_id INT NULL COMMENT 'Servicio solicitado (puede ser NULL si es descripción libre)',
  request_description TEXT NULL COMMENT 'Descripción de lo que necesita',
  status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  admin_notes TEXT NULL,
  reviewed_by_user_id INT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_checklist_client_approved ON monthly_service_checklist(client_approved);
CREATE INDEX IF NOT EXISTS idx_service_requests_client ON service_requests(client_user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
