-- Migración 019: Actualización de páginas del sistema para coincidir con la UI real
-- Esta migración reorganiza system_pages para reflejar la estructura real del sidebar

-- ============================================
-- 1. ACTUALIZAR PÁGINAS EXISTENTES
-- ============================================

-- Actualizar nombres y descripciones de páginas existentes
UPDATE system_pages SET
  page_name = 'Dashboard',
  description = 'Panel principal con métricas y resumen general del negocio'
WHERE page_key = 'dashboard';

UPDATE system_pages SET
  page_name = 'Gestión Financiera',
  description = 'Acceso general a la página de Gestión Financiera'
WHERE page_key = 'financial';

UPDATE system_pages SET
  page_name = 'Gestión de Clientes',
  description = 'Administración completa de clientes: crear, editar, ver historial'
WHERE page_key = 'clients';

UPDATE system_pages SET
  page_name = 'Mis Clientes',
  description = 'Clientes asignados al usuario actual para seguimiento'
WHERE page_key = 'my-clients';

UPDATE system_pages SET
  page_name = 'Tareas Pendientes',
  description = 'Ver y gestionar tareas asignadas, marcar como completadas'
WHERE page_key = 'tasks';

UPDATE system_pages SET
  page_name = 'Servicios',
  description = 'Catálogo de servicios: crear, editar precios, configurar recurrencia'
WHERE page_key = 'services';

UPDATE system_pages SET
  page_name = 'Bundles',
  description = 'Paquetes de servicios predefinidos para asignar a clientes'
WHERE page_key = 'bundles';

UPDATE system_pages SET
  page_name = 'Usuarios',
  description = 'Administrar usuarios del sistema: empleados, admins, clientes'
WHERE page_key = 'users';

UPDATE system_pages SET
  page_name = 'Roles y Permisos',
  description = 'Crear roles y asignar permisos granulares'
WHERE page_key = 'roles';

-- ============================================
-- 2. AGREGAR NUEVAS PÁGINAS/SECCIONES
-- ============================================

-- Obtener el ID de la página financial para usarlo como padre
SET @financial_id = (SELECT id FROM system_pages WHERE page_key = 'financial');

-- Secciones de Gestión Financiera (con parent_page_id)
INSERT IGNORE INTO system_pages (page_key, page_name, description, parent_page_id, display_order) VALUES
  ('financial-payments', 'Gestión Financiera - Pagos', 'Tab de pagos: registrar cobros, ver pagos pendientes, historial', @financial_id, 71),
  ('financial-expenses', 'Gestión Financiera - Gastos', 'Tab de gastos: registrar gastos únicos y recurrentes', @financial_id, 72),
  ('financial-infractions', 'Gestión Financiera - Infracciones', 'Tab de infracciones: crear y resolver infracciones de clientes', @financial_id, 73);

-- Páginas nuevas que no existían
INSERT IGNORE INTO system_pages (page_key, page_name, description, display_order) VALUES
  ('client-fields', 'Campos de Cliente', 'Configurar campos personalizados para perfiles de clientes', 25),
  ('invitations', 'Invitaciones', 'Códigos de invitación para registro de nuevos clientes', 26),
  ('bulk-assignment', 'Asignación Masiva', 'Asignar tareas a múltiples clientes con filtros avanzados', 27),
  ('workspaces', 'Workspaces', 'Administrar espacios de trabajo (sucursales, departamentos)', 28);

-- ============================================
-- 3. DESACTIVAR PÁGINAS QUE YA NO EXISTEN
-- ============================================

-- Estas páginas estaban definidas pero no existen como páginas separadas en el sistema
UPDATE system_pages SET is_active = FALSE WHERE page_key IN ('invoices', 'pool', 'payments', 'infractions', 'expenses', 'audit', 'reports');

-- ============================================
-- 4. GENERAR PERMISOS PARA NUEVAS PÁGINAS
-- ============================================

-- Permisos para financial-payments
INSERT IGNORE INTO permissions (permission_key, page_id, action_id, description)
SELECT
  CONCAT('financial-payments:', a.action_key) as permission_key,
  p.id as page_id,
  a.id as action_id,
  CONCAT(a.action_name, ' en Gestión Financiera - Pagos') as description
FROM system_pages p
CROSS JOIN system_actions a
WHERE p.page_key = 'financial-payments'
  AND a.action_key IN ('view', 'list', 'create', 'edit', 'approve');

-- Permisos para financial-expenses
INSERT IGNORE INTO permissions (permission_key, page_id, action_id, description)
SELECT
  CONCAT('financial-expenses:', a.action_key) as permission_key,
  p.id as page_id,
  a.id as action_id,
  CONCAT(a.action_name, ' en Gestión Financiera - Gastos') as description
FROM system_pages p
CROSS JOIN system_actions a
WHERE p.page_key = 'financial-expenses'
  AND a.action_key IN ('view', 'list', 'create', 'edit', 'delete', 'activate', 'deactivate');

-- Permisos para financial-infractions
INSERT IGNORE INTO permissions (permission_key, page_id, action_id, description)
SELECT
  CONCAT('financial-infractions:', a.action_key) as permission_key,
  p.id as page_id,
  a.id as action_id,
  CONCAT(a.action_name, ' en Gestión Financiera - Infracciones') as description
FROM system_pages p
CROSS JOIN system_actions a
WHERE p.page_key = 'financial-infractions'
  AND a.action_key IN ('view', 'list', 'create', 'edit', 'deactivate');

-- Permisos para client-fields
INSERT IGNORE INTO permissions (permission_key, page_id, action_id, description)
SELECT
  CONCAT('client-fields:', a.action_key) as permission_key,
  p.id as page_id,
  a.id as action_id,
  CONCAT(a.action_name, ' en Campos de Cliente') as description
FROM system_pages p
CROSS JOIN system_actions a
WHERE p.page_key = 'client-fields'
  AND a.action_key IN ('view', 'list', 'create', 'edit', 'delete');

-- Permisos para invitations
INSERT IGNORE INTO permissions (permission_key, page_id, action_id, description)
SELECT
  CONCAT('invitations:', a.action_key) as permission_key,
  p.id as page_id,
  a.id as action_id,
  CONCAT(a.action_name, ' en Invitaciones') as description
FROM system_pages p
CROSS JOIN system_actions a
WHERE p.page_key = 'invitations'
  AND a.action_key IN ('view', 'list', 'create', 'delete');

-- Permisos para bulk-assignment
INSERT IGNORE INTO permissions (permission_key, page_id, action_id, description)
SELECT
  CONCAT('bulk-assignment:', a.action_key) as permission_key,
  p.id as page_id,
  a.id as action_id,
  CONCAT(a.action_name, ' en Asignación Masiva') as description
FROM system_pages p
CROSS JOIN system_actions a
WHERE p.page_key = 'bulk-assignment'
  AND a.action_key IN ('view', 'list', 'create', 'assign');

-- Permisos para workspaces
INSERT IGNORE INTO permissions (permission_key, page_id, action_id, description)
SELECT
  CONCAT('workspaces:', a.action_key) as permission_key,
  p.id as page_id,
  a.id as action_id,
  CONCAT(a.action_name, ' en Workspaces') as description
FROM system_pages p
CROSS JOIN system_actions a
WHERE p.page_key = 'workspaces'
  AND a.action_key IN ('view', 'list', 'create', 'edit', 'delete', 'manage');

-- ============================================
-- 5. ASIGNAR NUEVOS PERMISOS AL ROL ADMIN
-- ============================================

-- El admin debe tener todos los permisos nuevos
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, TRUE
FROM roles r
CROSS JOIN permissions p
WHERE r.role_key = 'admin'
  AND p.permission_key LIKE 'financial-%'
  OR p.permission_key LIKE 'client-fields:%'
  OR p.permission_key LIKE 'invitations:%'
  OR p.permission_key LIKE 'bulk-assignment:%'
  OR p.permission_key LIKE 'workspaces:%';

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
