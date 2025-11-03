-- Migración 004: Rediseño del sistema de omisos
-- Los omisos son ahora un ESTADO del cliente, no de las tareas individuales
-- Ejecutar: mysql -u root -p sat_acme < server/src/migrations/004_omisos_redesign.sql

-- Eliminar la tabla antigua de task_omisos (era incorrecta conceptualmente)
DROP TABLE IF EXISTS task_omisos;

-- Crear tabla de omisos de clientes
CREATE TABLE IF NOT EXISTS client_omisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  motivo TEXT NOT NULL,
  archivo_path VARCHAR(255) NOT NULL,
  estado ENUM('activo', 'resuelto') DEFAULT 'activo',
  task_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  resolved_by_user_id INT NULL,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES monthly_service_checklist(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_client_estado (client_id, estado),
  INDEX idx_task (task_id)
);

-- Agregar columna para almacenar la ruta del archivo en las tareas completadas
ALTER TABLE monthly_service_checklist
ADD COLUMN IF NOT EXISTS file_path VARCHAR(255) NULL;

-- Agregar columna para tipo MIME del archivo
ALTER TABLE monthly_service_checklist
ADD COLUMN IF NOT EXISTS file_type VARCHAR(100) NULL;

-- Agregar columna para el ID del omiso relacionado (solo para tareas de tipo omisos)
ALTER TABLE monthly_service_checklist
ADD COLUMN IF NOT EXISTS omiso_id INT NULL;

-- Agregar clave foránea para omiso_id (solo si la columna se agregó correctamente)
-- Nota: Si ya existe, esta línea dará error y se puede ignorar
-- ALTER TABLE monthly_service_checklist
-- ADD CONSTRAINT fk_omiso_id FOREIGN KEY (omiso_id) REFERENCES client_omisos(id) ON DELETE SET NULL;
