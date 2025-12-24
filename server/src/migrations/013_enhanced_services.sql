-- ============================================
-- Migración 013: Sistema Mejorado de Servicios
-- ============================================
-- Añade: actividades, espacios de carga, formularios dinámicos,
-- recurrencia variable, suscripciones, y campos extendidos
-- ============================================

-- ============================================
-- 1. MODIFICAR TABLA services
-- ============================================

-- Costo operacional del servicio
ALTER TABLE services ADD COLUMN IF NOT EXISTS operational_cost DECIMAL(10,2) DEFAULT 0.00;

-- Tipo de recurrencia extendido
ALTER TABLE services ADD COLUMN IF NOT EXISTS recurrence_type_extended ENUM(
  'annual', 'semiannual', 'quarterly', 'bimonthly', 'monthly',
  'biweekly', 'weekly', 'on_demand', 'variable', 'one_time'
) DEFAULT 'monthly';

-- Observaciones para empleados (internas)
ALTER TABLE services ADD COLUMN IF NOT EXISTS employee_notes TEXT NULL;

-- Observaciones para clientes (visibles en portal)
ALTER TABLE services ADD COLUMN IF NOT EXISTS client_notes TEXT NULL;

-- Legacy: migrar important_notes a employee_notes si existe
-- (Se ejecutará solo si important_notes tiene datos)

-- Tipo de asignación
ALTER TABLE services ADD COLUMN IF NOT EXISTS assignment_type ENUM(
  'all_clients', 'selected_clients', 'on_request'
) DEFAULT 'selected_clients';

-- Configuración de archivos (reemplaza requires_file)
ALTER TABLE services ADD COLUMN IF NOT EXISTS file_config ENUM(
  'none', 'optional', 'required'
) DEFAULT 'required';

-- Visible para clientes en portal
ALTER TABLE services ADD COLUMN IF NOT EXISTS visible_to_clients BOOLEAN DEFAULT TRUE;

-- Permitir suscripción
ALTER TABLE services ADD COLUMN IF NOT EXISTS allow_subscription BOOLEAN DEFAULT FALSE;


-- ============================================
-- 2. TABLA: service_activities (Actividades para Empleados)
-- ============================================

CREATE TABLE IF NOT EXISTS service_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  activity_name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  display_order INT DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_service_activities_order (service_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 3. TABLA: task_activity_progress (Progreso de Actividades)
-- ============================================

CREATE TABLE IF NOT EXISTS task_activity_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  activity_id INT NOT NULL,
  status ENUM('pending', 'completed', 'skipped') DEFAULT 'pending',
  completed_by_user_id INT NULL,
  completed_at TIMESTAMP NULL,
  notes TEXT NULL,

  FOREIGN KEY (task_id) REFERENCES monthly_service_checklist(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_id) REFERENCES service_activities(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE KEY unique_task_activity (task_id, activity_id),
  INDEX idx_task_progress (task_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 4. TABLA: service_upload_slots (Espacios de Carga)
-- ============================================

CREATE TABLE IF NOT EXISTS service_upload_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  slot_name VARCHAR(100) NOT NULL,
  slot_label VARCHAR(255) NOT NULL,
  description TEXT NULL,
  display_order INT DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  allowed_file_types VARCHAR(255) DEFAULT '*',
  max_file_size_mb INT DEFAULT 10,
  visibility ENUM('admin_only', 'client_only', 'both') DEFAULT 'both',
  send_via_whatsapp BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_service_slots_order (service_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 5. TABLA: task_uploaded_files (Archivos Subidos)
-- ============================================

CREATE TABLE IF NOT EXISTS task_uploaded_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  slot_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NULL,
  file_path VARCHAR(512) NOT NULL,
  file_type VARCHAR(100) NULL,
  file_size_bytes BIGINT NULL,
  uploaded_by_user_id INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES monthly_service_checklist(id) ON DELETE CASCADE,
  FOREIGN KEY (slot_id) REFERENCES service_upload_slots(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_task_files (task_id),
  INDEX idx_slot_files (slot_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 6. TABLA: service_client_form_fields (Formularios Dinámicos)
-- ============================================

CREATE TABLE IF NOT EXISTS service_client_form_fields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type ENUM('text', 'number', 'date', 'select', 'multiselect', 'file', 'textarea', 'email', 'phone', 'checkbox') NOT NULL,
  placeholder TEXT NULL,
  default_value TEXT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  validation_rules JSON NULL,
  select_options JSON NULL,
  display_order INT DEFAULT 0,
  help_text TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_service_form_fields (service_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 7. TABLA: task_client_form_responses (Respuestas)
-- ============================================

CREATE TABLE IF NOT EXISTS task_client_form_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  field_id INT NOT NULL,
  response_value TEXT NULL,
  file_path VARCHAR(512) NULL,
  submitted_by_user_id INT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES monthly_service_checklist(id) ON DELETE CASCADE,
  FOREIGN KEY (field_id) REFERENCES service_client_form_fields(id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE CASCADE,

  UNIQUE KEY unique_task_field_response (task_id, field_id),
  INDEX idx_task_responses (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 8. TABLA: service_recurrence_rules (Recurrencia Variable)
-- ============================================

CREATE TABLE IF NOT EXISTS service_recurrence_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL UNIQUE,

  -- Para recurrencia variable: patrón JSON
  -- Ej: [{"interval_months": 1, "repeat": 1}, {"interval_months": 3, "repeat": 2}]
  variable_pattern JSON NULL,

  -- Días del mes para completar: [1, 15, 28]
  completion_days JSON NULL,

  -- Días de anticipación para activar
  activation_days_before INT DEFAULT 7,

  -- Para semanal/quincenal: día de la semana (0=Dom, 1=Lun, ... 6=Sab)
  day_of_week TINYINT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 9. TABLA: service_subscription_requests (Solicitudes)
-- ============================================

CREATE TABLE IF NOT EXISTS service_subscription_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_id INT NOT NULL,
  client_user_id INT NOT NULL,
  workspace_id INT NULL,

  request_type ENUM('one_time', 'subscribe') NOT NULL DEFAULT 'one_time',
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',

  request_notes TEXT NULL,
  admin_notes TEXT NULL,

  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  processed_by_user_id INT NULL,

  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (processed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_client_requests (client_user_id, status),
  INDEX idx_pending_requests (status, requested_at),
  INDEX idx_workspace_requests (workspace_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 10. MODIFICAR monthly_service_checklist
-- ============================================

ALTER TABLE monthly_service_checklist
  ADD COLUMN IF NOT EXISTS activities_completed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS activities_total INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_form_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS variable_step_index INT DEFAULT 0 COMMENT 'Índice del paso actual en patrón de recurrencia variable';


-- ============================================
-- 11. MODIFICAR client_services
-- ============================================

ALTER TABLE client_services
  ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS subscription_start_date DATE NULL,
  ADD COLUMN IF NOT EXISTS subscription_end_date DATE NULL;


-- ============================================
-- 12. MIGRAR DATOS EXISTENTES
-- ============================================

-- Mapear recurrence_type a recurrence_type_extended
UPDATE services
SET recurrence_type_extended = CASE recurrence_type
  WHEN 'monthly' THEN 'monthly'
  WHEN 'bimonthly' THEN 'bimonthly'
  WHEN 'quarterly' THEN 'quarterly'
  WHEN 'annual' THEN 'annual'
  WHEN 'custom' THEN 'variable'
  WHEN 'one_time' THEN 'one_time'
  ELSE 'monthly'
END
WHERE recurrence_type_extended = 'monthly'
  AND recurrence_type IS NOT NULL
  AND recurrence_type != 'monthly';

-- Mapear requires_file a file_config
UPDATE services
SET file_config = CASE
  WHEN requires_file = TRUE THEN 'required'
  ELSE 'none'
END
WHERE file_config = 'required'
  AND requires_file = FALSE;

-- Crear slot default para servicios que requieren archivo
INSERT INTO service_upload_slots (service_id, slot_name, slot_label, is_required, visibility, send_via_whatsapp)
SELECT
  s.id,
  'default_file',
  'Archivo',
  TRUE,
  'both',
  FALSE
FROM services s
WHERE s.requires_file = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM service_upload_slots sus WHERE sus.service_id = s.id
  );

-- Crear reglas de recurrencia para servicios con recurrence_days (custom)
INSERT INTO service_recurrence_rules (service_id, variable_pattern, activation_days_before)
SELECT
  s.id,
  JSON_ARRAY(JSON_OBJECT('interval_days', s.recurrence_days, 'repeat', 1)),
  COALESCE(s.activation_window_days, 7)
FROM services s
WHERE s.recurrence_type = 'custom'
  AND s.recurrence_days IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM service_recurrence_rules srr WHERE srr.service_id = s.id
  );


-- Migrar important_notes a employee_notes (si existe la columna legacy)
UPDATE services
SET employee_notes = important_notes
WHERE important_notes IS NOT NULL
  AND employee_notes IS NULL;


-- ============================================
-- FIN DE MIGRACIÓN 013
-- ============================================
