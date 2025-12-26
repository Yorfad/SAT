-- =====================================================
-- Migración: Sistema de columnas dinámicas para clientes
-- =====================================================
-- Los campos de cliente ahora son columnas REALES en clients_profiles
-- client_profile_fields solo almacena la CONFIGURACIÓN (visible, requerido, orden)
-- =====================================================

-- 1. Agregar columna para identificar campos del sistema vs dinámicos
ALTER TABLE client_profile_fields
ADD COLUMN IF NOT EXISTS is_system_field TINYINT(1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS column_type VARCHAR(50) DEFAULT 'VARCHAR(255)',
ADD COLUMN IF NOT EXISTS column_exists TINYINT(1) DEFAULT 0;

-- 2. Marcar campos existentes como del sistema (no se pueden eliminar)
UPDATE client_profile_fields
SET is_system_field = 1, column_exists = 1
WHERE field_key IN ('sede', 'grupo', 'contract_number', 'sat_password_encrypted',
                    'overall_rating', 'notes', 'active_infractions_count', 'ratings_count');

-- 3. Campos que ya existen como columnas
UPDATE client_profile_fields SET column_exists = 1 WHERE field_key = 'sede';
UPDATE client_profile_fields SET column_exists = 1 WHERE field_key = 'grupo';
UPDATE client_profile_fields SET column_exists = 1 WHERE field_key = 'contract_number';

-- 4. Crear tabla para tracking de columnas dinámicas
CREATE TABLE IF NOT EXISTS client_profile_columns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    column_name VARCHAR(50) NOT NULL UNIQUE,
    column_type VARCHAR(100) NOT NULL DEFAULT 'VARCHAR(255)',
    is_system TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id INT,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Registrar columnas existentes del sistema
INSERT IGNORE INTO client_profile_columns (column_name, column_type, is_system) VALUES
('user_id', 'INT', 1),
('workspace_id', 'INT', 1),
('contract_number', 'VARCHAR(50)', 1),
('sat_password_encrypted', 'VARCHAR(255)', 1),
('overall_rating', 'DECIMAL(3,2)', 1),
('notes', 'TEXT', 1),
('sede', 'VARCHAR(100)', 1),
('grupo', 'VARCHAR(50)', 1),
('active_infractions_count', 'INT', 1),
('ratings_count', 'INT', 1);

-- 6. Eliminar tabla de valores EAV (ya no necesaria)
-- NOTA: Primero migrar datos existentes si los hay
-- DROP TABLE IF EXISTS client_custom_values;

-- 7. Agregar índice para búsqueda rápida de configuración por workspace
CREATE INDEX IF NOT EXISTS idx_cpf_workspace_key
ON client_profile_fields(workspace_id, field_key);
