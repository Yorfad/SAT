-- Migración 006: Sistema de Desactivación de Clientes y Servicios
-- Permite a los admins desactivar clientes completamente o servicios específicos
-- con motivo y trazabilidad de quién y cuándo lo hizo
-- Ejecutar: mysql -u root -p sat_acme < server/src/migrations/006_deactivation_system.sql

-- ============================================================================
-- PASO 1: Agregar campos de desactivación a la tabla users
-- ============================================================================

-- Campos para desactivación total del cliente
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT NULL
COMMENT 'Motivo por el cual el cliente fue desactivado (ej: impago, fraude, etc.)';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP NULL
COMMENT 'Fecha y hora en que el cliente fue desactivado';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS deactivated_by_user_id INT NULL
COMMENT 'ID del admin/employee que desactivó al cliente';

-- Foreign key para trazabilidad
ALTER TABLE users
ADD CONSTRAINT fk_user_deactivated_by
FOREIGN KEY (deactivated_by_user_id) REFERENCES users(id)
ON DELETE SET NULL;

-- ============================================================================
-- PASO 2: Agregar campos de desactivación a la tabla client_services
-- ============================================================================

-- Campos para desactivación de servicios específicos
ALTER TABLE client_services
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT NULL
COMMENT 'Motivo por el cual el servicio fue desactivado para este cliente';

ALTER TABLE client_services
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP NULL
COMMENT 'Fecha y hora en que el servicio fue desactivado';

ALTER TABLE client_services
ADD COLUMN IF NOT EXISTS deactivated_by_user_id INT NULL
COMMENT 'ID del admin/employee que desactivó el servicio';

-- Foreign key para trazabilidad
ALTER TABLE client_services
ADD CONSTRAINT fk_service_deactivated_by
FOREIGN KEY (deactivated_by_user_id) REFERENCES users(id)
ON DELETE SET NULL;

-- ============================================================================
-- PASO 3: Crear índices para optimizar consultas de clientes activos
-- ============================================================================

-- Índice para filtrar rápidamente usuarios activos
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Índice compuesto para filtrar usuarios activos por rol
CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(is_active, role);

-- Índice para filtrar servicios activos de clientes
CREATE INDEX IF NOT EXISTS idx_client_services_status ON client_services(status);

-- ============================================================================
-- MIGRACIÓN COMPLETADA
-- ============================================================================

SELECT '✓ Migración 006 completada - Sistema de desactivación configurado' AS Status;

-- Mostrar información de los nuevos campos
SELECT
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_TYPE,
  COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('users', 'client_services')
  AND COLUMN_NAME LIKE '%deactivat%'
ORDER BY TABLE_NAME, ORDINAL_POSITION;
