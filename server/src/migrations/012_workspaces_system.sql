-- ============================================================================
-- MIGRACION 012: Sistema de Workspaces (Multi-Esquema)
-- ============================================================================
-- Permite separar datos por empresa/cliente grande
-- Cada workspace tiene sus propios empleados, tareas, clientes
-- Vista "General" para metricas consolidadas
-- ============================================================================

-- ============================================================================
-- PARTE 1: Crear tablas nuevas
-- ============================================================================

-- Tabla principal de workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL COMMENT 'Nombre del workspace (ej: Empresa ABC)',
  slug VARCHAR(100) NOT NULL UNIQUE COMMENT 'Identificador unico para URLs',
  description TEXT NULL,
  color VARCHAR(7) DEFAULT '#3b82f6' COMMENT 'Color hex para identificacion visual',
  icon VARCHAR(50) DEFAULT 'building' COMMENT 'Icono del workspace',
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE COMMENT 'Workspace por defecto para nuevos usuarios',
  created_by_user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_workspaces_slug (slug),
  INDEX idx_workspaces_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de asignacion de usuarios a workspaces
CREATE TABLE IF NOT EXISTS user_workspaces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  workspace_id INT NOT NULL,
  role_in_workspace ENUM('owner', 'admin', 'member', 'viewer') DEFAULT 'member',
  is_primary BOOLEAN DEFAULT FALSE COMMENT 'Workspace principal del usuario',
  assigned_by_user_id INT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_workspace (user_id, workspace_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  INDEX idx_user_workspaces_user (user_id),
  INDEX idx_user_workspaces_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PARTE 2: Agregar workspace_id a tablas existentes
-- ============================================================================

-- 2.1 CLIENTS_PROFILES
ALTER TABLE clients_profiles
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER user_id,
ADD INDEX IF NOT EXISTS idx_cp_workspace (workspace_id);

-- 2.2 SERVICES (+ campo is_global)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER id,
ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT FALSE COMMENT 'TRUE si el servicio esta disponible en todos los workspaces',
ADD INDEX IF NOT EXISTS idx_services_workspace (workspace_id);

-- 2.3 MONTHLY_INVOICES
ALTER TABLE monthly_invoices
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER id,
ADD INDEX IF NOT EXISTS idx_invoices_workspace (workspace_id);

-- 2.4 MONTHLY_SERVICE_CHECKLIST
ALTER TABLE monthly_service_checklist
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER id,
ADD INDEX IF NOT EXISTS idx_checklist_workspace (workspace_id);

-- 2.5 EXPENSES (+ campo is_shared)
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER id,
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE COMMENT 'TRUE si es gasto compartido entre workspaces',
ADD INDEX IF NOT EXISTS idx_expenses_workspace (workspace_id);

-- 2.6 SERVICE_OPERATIONAL_COSTS
ALTER TABLE service_operational_costs
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER id,
ADD INDEX IF NOT EXISTS idx_soc_workspace (workspace_id);

-- 2.7 CLIENT_POOL
ALTER TABLE client_pool
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER id,
ADD INDEX IF NOT EXISTS idx_pool_workspace (workspace_id);

-- 2.8 CLIENT_SERVICES
ALTER TABLE client_services
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER id,
ADD INDEX IF NOT EXISTS idx_cs_workspace (workspace_id);

-- 2.9 SERVICE_BUNDLES (si existe)
ALTER TABLE service_bundles
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER id,
ADD INDEX IF NOT EXISTS idx_bundles_workspace (workspace_id);

-- 2.10 CLIENT_INFRACTIONS
ALTER TABLE client_infractions
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER id,
ADD INDEX IF NOT EXISTS idx_infractions_workspace (workspace_id);

-- 2.11 CLIENT_SERVICE_PRIORITIES (si existe)
-- Solo agregar si la tabla existe
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'client_service_priorities');
SET @sql = IF(@table_exists > 0,
  'ALTER TABLE client_service_priorities ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER id, ADD INDEX IF NOT EXISTS idx_priorities_workspace (workspace_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.12 CLIENT_OMISOS
ALTER TABLE client_omisos
ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER id,
ADD INDEX IF NOT EXISTS idx_omisos_workspace (workspace_id);

-- 2.13 TASK_OBSERVATIONS (si existe)
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'task_observations');
SET @sql = IF(@table_exists > 0,
  'ALTER TABLE task_observations ADD COLUMN IF NOT EXISTS workspace_id INT NULL AFTER id, ADD INDEX IF NOT EXISTS idx_observations_workspace (workspace_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- PARTE 3: Crear workspace por defecto y migrar datos existentes
-- ============================================================================

-- Crear workspace "General" por defecto
INSERT INTO workspaces (name, slug, description, is_default, color, icon)
SELECT 'General', 'general', 'Workspace principal con todos los datos', TRUE, '#3b82f6', 'globe'
WHERE NOT EXISTS (SELECT 1 FROM workspaces WHERE slug = 'general');

-- Obtener el ID del workspace general
SET @default_workspace_id = (SELECT id FROM workspaces WHERE slug = 'general' LIMIT 1);

-- Migrar clientes existentes al workspace general
UPDATE clients_profiles SET workspace_id = @default_workspace_id WHERE workspace_id IS NULL;

-- Migrar servicios existentes (marcarlos como globales para mantener compatibilidad)
UPDATE services SET workspace_id = @default_workspace_id, is_global = TRUE WHERE workspace_id IS NULL;

-- Migrar facturas existentes
UPDATE monthly_invoices SET workspace_id = @default_workspace_id WHERE workspace_id IS NULL;

-- Migrar checklist existentes
UPDATE monthly_service_checklist SET workspace_id = @default_workspace_id WHERE workspace_id IS NULL;

-- Migrar gastos existentes
UPDATE expenses SET workspace_id = @default_workspace_id WHERE workspace_id IS NULL;

-- Migrar costos operativos
UPDATE service_operational_costs SET workspace_id = @default_workspace_id WHERE workspace_id IS NULL;

-- Migrar pool de clientes
UPDATE client_pool SET workspace_id = @default_workspace_id WHERE workspace_id IS NULL;

-- Migrar client services
UPDATE client_services SET workspace_id = @default_workspace_id WHERE workspace_id IS NULL;

-- Migrar bundles
UPDATE service_bundles SET workspace_id = @default_workspace_id WHERE workspace_id IS NULL;

-- Migrar infracciones
UPDATE client_infractions SET workspace_id = @default_workspace_id WHERE workspace_id IS NULL;

-- Migrar omisos
UPDATE client_omisos SET workspace_id = @default_workspace_id WHERE workspace_id IS NULL;

-- ============================================================================
-- PARTE 4: Asignar usuarios a workspaces
-- ============================================================================

-- Asignar todos los usuarios admin al workspace general como owners
INSERT INTO user_workspaces (user_id, workspace_id, role_in_workspace, is_primary)
SELECT id, @default_workspace_id, 'owner', TRUE
FROM users WHERE role = 'admin'
ON DUPLICATE KEY UPDATE role_in_workspace = 'owner', is_primary = TRUE;

-- Asignar empleados al workspace general como members
INSERT INTO user_workspaces (user_id, workspace_id, role_in_workspace, is_primary)
SELECT id, @default_workspace_id, 'member', TRUE
FROM users WHERE role = 'employee'
ON DUPLICATE KEY UPDATE role_in_workspace = 'member', is_primary = TRUE;

-- Asignar clientes al workspace general como viewers
INSERT INTO user_workspaces (user_id, workspace_id, role_in_workspace, is_primary)
SELECT id, @default_workspace_id, 'viewer', TRUE
FROM users WHERE role = 'client'
ON DUPLICATE KEY UPDATE role_in_workspace = 'viewer', is_primary = TRUE;

-- ============================================================================
-- PARTE 5: Agregar permisos para workspaces
-- ============================================================================

-- Agregar pagina de workspaces al catalogo
INSERT IGNORE INTO system_pages (page_key, page_name, description, display_order)
VALUES ('workspaces', 'Gestion de Workspaces', 'Administracion de espacios de trabajo separados', 17);

-- Generar permisos para workspaces (solo si system_pages y system_actions existen)
INSERT IGNORE INTO permissions (permission_key, page_id, action_id, description)
SELECT
  CONCAT('workspaces:', a.action_key) as permission_key,
  p.id as page_id,
  a.id as action_id,
  CONCAT(a.action_name, ' en ', p.page_name) as description
FROM system_pages p
CROSS JOIN system_actions a
WHERE p.page_key = 'workspaces'
AND a.action_key IN ('view', 'list', 'create', 'edit', 'delete', 'manage', 'assign');

-- Asignar permisos de workspaces al rol admin
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, TRUE
FROM roles r
CROSS JOIN permissions p
WHERE r.role_key = 'admin'
AND p.permission_key LIKE 'workspaces:%';

-- Asignar permiso de ver workspaces a managers (si existe el rol)
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, TRUE
FROM roles r
JOIN permissions p ON p.permission_key IN ('workspaces:view', 'workspaces:list')
WHERE r.role_key = 'manager';

-- ============================================================================
-- PARTE 6: Agregar FK a workspaces (despues de migrar datos)
-- ============================================================================

-- Nota: Las FK ya se definen en CREATE TABLE, no necesitan agregarse aqui

-- ============================================================================
-- FIN DE MIGRACION 012
-- ============================================================================
