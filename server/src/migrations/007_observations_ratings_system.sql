-- Migración 007: Sistema de Observaciones y Calificaciones por Tarea
-- Permite a employees/admins agregar observaciones y calificar (0-5) cada tarea completada
-- Las observaciones pueden marcarse como primordiales para mostrarlas destacadas
-- Ejecutar: mysql -u root -p sat_acme < server/src/migrations/007_observations_ratings_system.sql

-- ============================================================================
-- PASO 1: Crear tabla de observaciones y ratings
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_observations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  client_user_id INT NOT NULL,
  created_by_user_id INT NOT NULL,
  observation_text TEXT NULL,
  rating TINYINT NULL CHECK (rating >= 1 AND rating <= 5),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES monthly_service_checklist(id) ON DELETE CASCADE,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_client (client_user_id),
  INDEX idx_task (task_id),
  INDEX idx_primary (client_user_id, is_primary)
) COMMENT='Observaciones y calificaciones por tarea completada';

-- ============================================================================
-- PASO 2: Agregar campo para tracking de ratings en clients_profiles
-- ============================================================================

-- Agregar columna para contar cuántos ratings se han promediado
ALTER TABLE clients_profiles
ADD COLUMN IF NOT EXISTS ratings_count INT DEFAULT 0
COMMENT 'Cantidad de ratings promediados en overall_rating';

-- ============================================================================
-- PASO 3: Crear trigger para asegurar solo una observación primordial por cliente
-- ============================================================================

DELIMITER $$

DROP TRIGGER IF EXISTS before_insert_task_observation$$
CREATE TRIGGER before_insert_task_observation
BEFORE INSERT ON task_observations
FOR EACH ROW
BEGIN
  -- Si se marca como primordial, desmarcar todas las demás del mismo cliente
  IF NEW.is_primary = TRUE THEN
    UPDATE task_observations
    SET is_primary = FALSE
    WHERE client_user_id = NEW.client_user_id
      AND is_primary = TRUE;
  END IF;
END$$

DROP TRIGGER IF EXISTS before_update_task_observation$$
CREATE TRIGGER before_update_task_observation
BEFORE UPDATE ON task_observations
FOR EACH ROW
BEGIN
  -- Si se marca como primordial, desmarcar todas las demás del mismo cliente
  IF NEW.is_primary = TRUE AND OLD.is_primary = FALSE THEN
    UPDATE task_observations
    SET is_primary = FALSE
    WHERE client_user_id = NEW.client_user_id
      AND is_primary = TRUE
      AND id != NEW.id;
  END IF;
END$$

DELIMITER ;

-- ============================================================================
-- MIGRACIÓN COMPLETADA
-- ============================================================================

SELECT '✓ Migración 007 completada - Sistema de observaciones y ratings configurado' AS Status;

-- Verificar estructura de la nueva tabla
DESCRIBE task_observations;
