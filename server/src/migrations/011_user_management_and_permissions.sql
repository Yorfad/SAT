-- Migración 011: Sistema de Gestión de Usuarios y Permisos Granulares
-- Implementa RBAC (Role-Based Access Control) con permisos granulares por página y acción

-- ============================================
-- 1. TABLAS DE PÁGINAS Y ACCIONES DEL SISTEMA
-- ============================================

-- Catálogo de páginas/módulos del sistema
CREATE TABLE IF NOT EXISTS system_pages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  page_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'Clave única de la página (ej: clients, services)',
  page_name VARCHAR(200) NOT NULL COMMENT 'Nombre legible de la página',
  description TEXT,
  parent_page_id INT NULL COMMENT 'Para páginas anidadas',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_page_id) REFERENCES system_pages(id),
  INDEX idx_page_key (page_key),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catálogo de acciones que se pueden realizar
CREATE TABLE IF NOT EXISTS system_actions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'Clave única de la acción (ej: view, create, edit, delete)',
  action_name VARCHAR(200) NOT NULL COMMENT 'Nombre legible de la acción',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action_key (action_key),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permisos: combinación de página + acción
CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permission_key VARCHAR(200) NOT NULL UNIQUE COMMENT 'Formato: page_key:action_key (ej: clients:view)',
  page_id INT NOT NULL,
  action_id INT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES system_pages(id),
  FOREIGN KEY (action_id) REFERENCES system_actions(id),
  INDEX idx_permission_key (permission_key),
  INDEX idx_page_action (page_id, action_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. SISTEMA DE ROLES
-- ============================================

-- Roles personalizados
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_key VARCHAR(100) NOT NULL UNIQUE COMMENT 'Clave única del rol (ej: admin, manager, employee)',
  role_name VARCHAR(200) NOT NULL COMMENT 'Nombre legible del rol',
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE COMMENT 'TRUE si es un rol del sistema (no se puede eliminar)',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role_key (role_key),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permisos asignados a cada rol
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted BOOLEAN DEFAULT TRUE COMMENT 'TRUE=permitir, FALSE=denegar',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT NULL COMMENT 'Usuario que otorgó el permiso',
  UNIQUE KEY unique_role_permission (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_role (role_id),
  INDEX idx_permission (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. ASIGNACIÓN DE ROLES Y PERMISOS A USUARIOS
-- ============================================

-- Roles asignados a usuarios
CREATE TABLE IF NOT EXISTS user_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  granted_by INT NULL COMMENT 'Usuario que otorgó el rol',
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL COMMENT 'Fecha de expiración del rol (NULL=permanente)',
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT COMMENT 'Notas sobre la asignación',
  UNIQUE KEY unique_user_role (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_role (role_id),
  INDEX idx_active (is_active),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permisos individuales asignados directamente a usuarios (sobrescribe roles)
CREATE TABLE IF NOT EXISTS user_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted BOOLEAN DEFAULT TRUE COMMENT 'TRUE=permitir, FALSE=denegar (sobrescribe rol)',
  granted_by INT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  reason TEXT COMMENT 'Razón de la asignación directa',
  UNIQUE KEY unique_user_permission (user_id, permission_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_permission (permission_id),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. AUDITORÍA Y ESTADÍSTICAS
-- ============================================

-- Log de auditoría de accesos y acciones
CREATE TABLE IF NOT EXISTS access_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action VARCHAR(200) NOT NULL COMMENT 'Acción realizada o intentada',
  resource_type VARCHAR(100) NULL COMMENT 'Tipo de recurso (ej: client, service)',
  resource_id INT NULL COMMENT 'ID del recurso específico',
  result ENUM('success', 'denied', 'error') NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  request_path VARCHAR(500) NULL,
  request_method VARCHAR(10) NULL COMMENT 'GET, POST, PUT, DELETE',
  error_message TEXT NULL COMMENT 'Mensaje de error si result=error',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_action (user_id, action),
  INDEX idx_timestamp (created_at),
  INDEX idx_result (result),
  INDEX idx_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Estadísticas de actividad de usuarios por día
CREATE TABLE IF NOT EXISTS user_activity_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  stat_date DATE NOT NULL,
  tasks_completed INT DEFAULT 0 COMMENT 'Tareas completadas en el día',
  clients_managed INT DEFAULT 0 COMMENT 'Clientes gestionados',
  services_completed INT DEFAULT 0 COMMENT 'Servicios completados',
  login_count INT DEFAULT 0 COMMENT 'Veces que inició sesión',
  actions_performed INT DEFAULT 0 COMMENT 'Acciones totales realizadas',
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date (user_id, stat_date),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user (user_id),
  INDEX idx_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. INSERTAR DATOS INICIALES
-- ============================================

-- Insertar páginas del sistema
INSERT IGNORE INTO system_pages (page_key, page_name, description, display_order) VALUES
  ('dashboard', 'Dashboard', 'Panel principal con métricas financieras', 1),
  ('clients', 'Gestión de Clientes', 'CRUD de clientes y asignación', 2),
  ('services', 'Administración de Servicios', 'Configuración de servicios y recurrencia', 3),
  ('tasks', 'Tareas', 'Gestión de tareas y checklist mensual', 4),
  ('my-clients', 'Mis Clientes', 'Clientes asignados al empleado', 5),
  ('invoices', 'Facturas', 'Gestión de facturas mensuales', 6),
  ('financial', 'Panel Financiero', 'Gestión de gastos e ingresos', 7),
  ('pool', 'Pool de Clientes', 'Pool compartido de clientes', 8),
  ('payments', 'Pagos', 'Registro de pagos de clientes', 9),
  ('infractions', 'Infracciones', 'Gestión de infracciones de clientes', 10),
  ('expenses', 'Gastos', 'Registro de gastos operativos', 11),
  ('bundles', 'Paquetes de Servicios', 'Configuración de bundles', 12),
  ('users', 'Gestión de Usuarios', 'Administración de usuarios del sistema', 13),
  ('roles', 'Gestión de Roles', 'Administración de roles y permisos', 14),
  ('audit', 'Auditoría', 'Logs de auditoría y actividad', 15),
  ('reports', 'Reportes', 'Generación de reportes', 16);

-- Insertar acciones del sistema
INSERT IGNORE INTO system_actions (action_key, action_name, description) VALUES
  ('view', 'Ver', 'Visualizar información'),
  ('list', 'Listar', 'Ver listado de registros'),
  ('create', 'Crear', 'Crear nuevos registros'),
  ('edit', 'Editar', 'Modificar registros existentes'),
  ('delete', 'Eliminar', 'Eliminar registros'),
  ('assign', 'Asignar', 'Asignar recursos a usuarios'),
  ('complete', 'Completar', 'Marcar como completado'),
  ('activate', 'Activar', 'Activar registros'),
  ('deactivate', 'Desactivar', 'Desactivar registros'),
  ('export', 'Exportar', 'Exportar datos'),
  ('import', 'Importar', 'Importar datos'),
  ('approve', 'Aprobar', 'Aprobar solicitudes o cambios'),
  ('manage', 'Gestionar', 'Gestión completa del módulo');

-- Generar permisos automáticamente (combinaciones página:acción relevantes)
INSERT IGNORE INTO permissions (permission_key, page_id, action_id, description)
SELECT
  CONCAT(p.page_key, ':', a.action_key) as permission_key,
  p.id as page_id,
  a.id as action_id,
  CONCAT(a.action_name, ' en ', p.page_name) as description
FROM system_pages p
CROSS JOIN system_actions a
WHERE
  -- Todas las páginas pueden tener view y list
  a.action_key IN ('view', 'list')
  OR
  -- Páginas con CRUD completo
  (p.page_key IN ('clients', 'services', 'tasks', 'invoices', 'expenses', 'bundles', 'users', 'roles', 'infractions', 'payments')
   AND a.action_key IN ('create', 'edit', 'delete'))
  OR
  -- Permisos específicos por página
  (p.page_key = 'clients' AND a.action_key IN ('assign', 'activate', 'deactivate'))
  OR
  (p.page_key = 'tasks' AND a.action_key IN ('complete', 'assign'))
  OR
  (p.page_key = 'payments' AND a.action_key IN ('approve'))
  OR
  (p.page_key = 'financial' AND a.action_key = 'manage')
  OR
  (p.page_key = 'reports' AND a.action_key = 'export')
  OR
  (p.page_key = 'users' AND a.action_key IN ('activate', 'deactivate', 'manage'))
  OR
  (p.page_key = 'roles' AND a.action_key = 'manage')
  OR
  (p.page_key = 'audit' AND a.action_key = 'view')
  OR
  (p.page_key = 'pool' AND a.action_key IN ('assign', 'manage'));

-- Crear roles del sistema
INSERT IGNORE INTO roles (role_key, role_name, description, is_system_role) VALUES
  ('admin', 'Administrador', 'Acceso completo al sistema', TRUE),
  ('manager', 'Gerente', 'Puede gestionar empleados y ver reportes', TRUE),
  ('employee', 'Empleado', 'Acceso a clientes asignados y tareas', TRUE),
  ('client', 'Cliente', 'Acceso solo a su información', TRUE);

-- Asignar TODOS los permisos al rol admin
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, TRUE
FROM roles r
CROSS JOIN permissions p
WHERE r.role_key = 'admin';

-- Asignar permisos al rol manager
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, TRUE
FROM roles r
JOIN permissions p ON (
  p.permission_key LIKE 'clients:%' OR
  p.permission_key LIKE 'tasks:%' OR
  p.permission_key LIKE 'my-clients:%' OR
  p.permission_key LIKE 'invoices:%' OR
  p.permission_key LIKE 'reports:%' OR
  p.permission_key LIKE 'dashboard:%' OR
  p.permission_key LIKE 'users:view' OR
  p.permission_key LIKE 'users:list'
)
WHERE r.role_key = 'manager';

-- Asignar permisos al rol employee
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, TRUE
FROM roles r
JOIN permissions p ON (
  p.permission_key LIKE 'my-clients:%' OR
  p.permission_key LIKE 'tasks:view' OR
  p.permission_key LIKE 'tasks:list' OR
  p.permission_key LIKE 'tasks:complete' OR
  p.permission_key LIKE 'invoices:view' OR
  p.permission_key LIKE 'invoices:list' OR
  p.permission_key LIKE 'dashboard:view'
)
WHERE r.role_key = 'employee';

-- Asignar permisos al rol client
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, TRUE
FROM roles r
JOIN permissions p ON (
  p.permission_key LIKE 'dashboard:view' OR
  p.permission_key LIKE 'invoices:view' OR
  p.permission_key LIKE 'invoices:list'
)
WHERE r.role_key = 'client';

-- Migrar usuarios existentes al nuevo sistema de roles
-- Asignar rol según el campo 'role' actual de la tabla users
INSERT IGNORE INTO user_roles (user_id, role_id, granted_at, is_active)
SELECT
  u.id as user_id,
  r.id as role_id,
  NOW() as granted_at,
  u.is_active as is_active
FROM users u
JOIN roles r ON r.role_key = u.role
WHERE u.is_active = TRUE;

-- ============================================
-- 6. TRIGGERS PARA ACTUALIZAR ESTADÍSTICAS
-- ============================================

-- NOTA: Los triggers deben ser creados manualmente en el CLI de MySQL
-- debido a limitaciones con DELIMITER en scripts SQL ejecutados desde Node.js

-- Trigger para actualizar estadísticas cuando se completa una tarea:
-- DELIMITER //
-- CREATE TRIGGER after_task_complete
-- AFTER UPDATE ON monthly_service_checklist
-- FOR EACH ROW
-- BEGIN
--   IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
--     INSERT INTO user_activity_stats (user_id, stat_date, tasks_completed)
--     VALUES (NEW.completed_by, CURDATE(), 1)
--     ON DUPLICATE KEY UPDATE
--       tasks_completed = tasks_completed + 1,
--       updated_at = NOW();
--   END IF;
-- END//
-- DELIMITER ;

-- Trigger para registrar login en estadísticas:
-- DELIMITER //
-- CREATE TRIGGER after_user_login
-- AFTER UPDATE ON users
-- FOR EACH ROW
-- BEGIN
--   IF NEW.last_login != OLD.last_login THEN
--     INSERT INTO user_activity_stats (user_id, stat_date, login_count, last_login)
--     VALUES (NEW.id, CURDATE(), 1, NEW.last_login)
--     ON DUPLICATE KEY UPDATE
--       login_count = login_count + 1,
--       last_login = NEW.last_login,
--       updated_at = NOW();
--   END IF;
-- END//
-- DELIMITER ;

-- ============================================
-- 7. VISTAS ÚTILES PARA CONSULTAS
-- ============================================

-- NOTA: Las vistas deben ser creadas manualmente después de verificar
-- que existen todas las columnas necesarias en las tablas

-- Vista para ver todos los permisos de un usuario (incluyendo los heredados de roles)
-- CREATE OR REPLACE VIEW v_user_effective_permissions AS
-- SELECT DISTINCT
--   u.id as user_id,
--   u.email,
--   u.full_name,
--   p.id as permission_id,
--   p.permission_key,
--   sp.page_name,
--   sa.action_name,
--   COALESCE(up.granted, rp.granted, FALSE) as is_granted,
--   CASE
--     WHEN up.id IS NOT NULL THEN 'direct'
--     WHEN rp.id IS NOT NULL THEN 'role'
--     ELSE 'none'
--   END as grant_source,
--   r.role_name as source_role
-- FROM users u
-- LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
-- LEFT JOIN roles r ON r.id = ur.role_id AND r.is_active = TRUE
-- LEFT JOIN role_permissions rp ON rp.role_id = r.id
-- LEFT JOIN permissions p ON p.id = rp.permission_id OR p.id IN (SELECT permission_id FROM user_permissions WHERE user_id = u.id)
-- LEFT JOIN user_permissions up ON up.user_id = u.id AND up.permission_id = p.id AND (up.expires_at IS NULL OR up.expires_at > NOW())
-- LEFT JOIN system_pages sp ON sp.id = p.page_id
-- LEFT JOIN system_actions sa ON sa.id = p.action_id
-- WHERE u.is_active = TRUE AND p.is_active = TRUE;

-- Vista para estadísticas de usuario
-- CREATE OR REPLACE VIEW v_user_stats AS
-- SELECT
--   u.id as user_id,
--   u.email,
--   u.full_name,
--   u.role as system_role,
--   COUNT(DISTINCT ur.role_id) as roles_count,
--   GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.role_name SEPARATOR ', ') as roles,
--   COALESCE(SUM(uas.tasks_completed), 0) as total_tasks_completed,
--   COALESCE(SUM(uas.login_count), 0) as total_logins,
--   MAX(uas.last_login) as last_login_date,
--   COUNT(DISTINCT CASE WHEN msc.status = 'completed' THEN msc.id END) as tasks_completed_count,
--   COUNT(DISTINCT cp.user_id) as clients_managed_count,
--   u.is_active
-- FROM users u
-- LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
-- LEFT JOIN roles r ON r.id = ur.role_id AND r.is_active = TRUE
-- LEFT JOIN user_activity_stats uas ON uas.user_id = u.id
-- LEFT JOIN monthly_service_checklist msc ON msc.completed_by = u.id
-- LEFT JOIN clients_profiles cp ON cp.assigned_employee_id = u.id
-- GROUP BY u.id, u.email, u.full_name, u.role, u.is_active;

-- ============================================
-- 8. ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================

-- Índices para consultas frecuentes de permisos
CREATE INDEX idx_user_roles_active ON user_roles(user_id, is_active, expires_at);
CREATE INDEX idx_user_permissions_active ON user_permissions(user_id, expires_at);
CREATE INDEX idx_role_permissions_granted ON role_permissions(role_id, granted);

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
