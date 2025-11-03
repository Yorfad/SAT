-- Migración 005: Sistema de Recurrencia de Servicios
-- Este sistema permite configurar cómo y cuándo se activan automáticamente las tareas
-- Ejecutar: mysql -u root -p sat_acme < server/src/migrations/005_services_recurrence.sql

-- ============================================================================
-- PASO 1: Agregar campos de recurrencia a tabla services
-- ============================================================================

-- Tipo de recurrencia del servicio
ALTER TABLE services
ADD COLUMN IF NOT EXISTS recurrence_type ENUM('monthly', 'bimonthly', 'quarterly', 'annual', 'custom', 'one_time') DEFAULT 'monthly'
COMMENT 'Tipo de recurrencia del servicio';

-- Días de recurrencia para tipo custom (ej: cada 45 días)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS recurrence_days INT NULL
COMMENT 'Número de días para recurrencia custom (ej: 30, 60, 90)';

-- Día del mes para activar la tarea (1-31)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS activation_day INT DEFAULT 25
COMMENT 'Día del mes en que se activa la tarea (ej: 25 = última semana)';

-- Ventana de días para activación (antes del día de activación)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS activation_window_days INT DEFAULT 7
COMMENT 'Días antes del activation_day en que se puede activar (ej: 7 = una semana antes)';

-- Si el servicio requiere subir archivo
ALTER TABLE services
ADD COLUMN IF NOT EXISTS requires_file BOOLEAN DEFAULT TRUE
COMMENT 'Indica si se debe subir un archivo al completar la tarea';

-- Si la fecha de siguiente ejecución se determina al completar (como libros)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS completion_determines_next BOOLEAN DEFAULT FALSE
COMMENT 'Si TRUE, el usuario especifica la próxima fecha al completar la tarea (como Libros)';

-- Si el servicio está activo (para activar/desactivar servicios)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
COMMENT 'Indica si el servicio está activo y genera tareas automáticamente';

-- ============================================================================
-- PASO 2: Agregar relación de tareas con servicios
-- ============================================================================

-- Relacionar cada tarea con un servicio específico
ALTER TABLE monthly_service_checklist
ADD COLUMN IF NOT EXISTS service_id INT NULL
COMMENT 'ID del servicio al que pertenece esta tarea';

-- Agregar foreign key (MySQL creará el índice automáticamente)
-- NOTA: Si este script ya fue ejecutado, usar el script de reset completo en su lugar
ALTER TABLE monthly_service_checklist
ADD CONSTRAINT fk_checklist_service
FOREIGN KEY (service_id) REFERENCES services(id)
ON DELETE SET NULL;

-- ============================================================================
-- PASO 3: Actualizar servicios existentes con configuración por defecto
-- ============================================================================

-- Libros al Día: La próxima fecha se especifica al completar
UPDATE services
SET
  recurrence_type = 'custom',
  completion_determines_next = TRUE,
  activation_day = NULL,
  activation_window_days = 60,
  requires_file = TRUE,
  is_active = TRUE
WHERE service_name LIKE '%Libro%';

-- Declaración de SAT: Mensual, última semana del mes
UPDATE services
SET
  recurrence_type = 'monthly',
  completion_determines_next = FALSE,
  activation_day = 25,
  activation_window_days = 7,
  requires_file = TRUE,
  is_active = TRUE
WHERE service_name LIKE '%Declaración%';

-- Factura: Mensual, penúltima semana del mes
UPDATE services
SET
  recurrence_type = 'monthly',
  completion_determines_next = FALSE,
  activation_day = 28,
  activation_window_days = 5,
  requires_file = TRUE,
  is_active = TRUE
WHERE service_name LIKE '%Factura%';

-- Rectificador: Mensual, última semana del mes
UPDATE services
SET
  recurrence_type = 'monthly',
  completion_determines_next = FALSE,
  activation_day = 25,
  activation_window_days = 7,
  requires_file = TRUE,
  is_active = TRUE
WHERE service_name LIKE '%Rectificador%';

-- ============================================================================
-- PASO 4: Relacionar tareas existentes con servicios
-- ============================================================================

-- Relacionar tareas de Libros
UPDATE monthly_service_checklist msc
JOIN services s ON s.service_name LIKE '%Libro%'
SET msc.service_id = s.id
WHERE msc.task_name LIKE '%Libro%';

-- Relacionar tareas de Declaración
UPDATE monthly_service_checklist msc
JOIN services s ON s.service_name LIKE '%Declaración%'
SET msc.service_id = s.id
WHERE msc.task_name LIKE '%Declaración%';

-- Relacionar tareas de Factura (excluyendo rectificador)
UPDATE monthly_service_checklist msc
JOIN services s ON s.service_name LIKE '%Factura%'
SET msc.service_id = s.id
WHERE msc.task_name LIKE '%Factura%' AND msc.task_name NOT LIKE '%Rectificador%';

-- Relacionar tareas de Rectificador
UPDATE monthly_service_checklist msc
JOIN services s ON s.service_name LIKE '%Rectificador%'
SET msc.service_id = s.id
WHERE msc.task_name LIKE '%Rectificador%';

-- ============================================================================
-- MIGRACIÓN COMPLETADA
-- ============================================================================

SELECT '✓ Migración 005 completada - Sistema de recurrencia configurado' AS Status;
SELECT
  service_name,
  recurrence_type,
  activation_day,
  activation_window_days,
  completion_determines_next,
  is_active
FROM services;
