-- Migración para agregar campos necesarios para el sistema de tareas
-- Ejecutar: mysql -u root -p sat_acme < server/src/migrations/002_add_task_fields.sql

-- Agregar columna para próxima fecha de pago (para libros)
ALTER TABLE monthly_service_checklist 
ADD COLUMN IF NOT EXISTS next_payment_date DATE NULL;

-- Crear tabla para omisos si no existe
CREATE TABLE IF NOT EXISTS task_omisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL UNIQUE,
  value BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES monthly_service_checklist(id) ON DELETE CASCADE
);

