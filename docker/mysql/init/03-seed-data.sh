#!/bin/bash
# ============================================
# Insertar datos iniciales (seed)
# Se ejecuta solo la primera vez que inicia MySQL
# ============================================

set -e

echo "==========================================="
echo "Insertando datos iniciales..."
echo "==========================================="

# Hash de password123 generado con bcryptjs
ADMIN_PASSWORD_HASH='\$2a\$10\$HLw4VW7.r0RyP4/kHGgXqOY7/g9NqH9nEJu5Qg5gqVk6kqYPrVPpO'

# Array de bases de datos
databases=("sat_acme" "sat_solis")

for db in "${databases[@]}"; do
    echo ""
    echo "Insertando datos en: $db"

    mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$db" << EOSQL

    -- ============================================
    -- 1. Insertar páginas del sistema
    -- ============================================
    INSERT IGNORE INTO system_pages (page_key, page_name, description, display_order) VALUES
      ('dashboard', 'Dashboard', 'Panel principal con métricas', 1),
      ('clients', 'Gestión de Clientes', 'CRUD de clientes', 2),
      ('services', 'Administración de Servicios', 'Configuración de servicios', 3),
      ('tasks', 'Tareas', 'Gestión de tareas y checklist', 4),
      ('my-clients', 'Mis Clientes', 'Clientes asignados', 5),
      ('invoices', 'Facturas', 'Gestión de facturas', 6),
      ('financial', 'Panel Financiero', 'Gestión financiera', 7),
      ('pool', 'Pool de Clientes', 'Pool compartido', 8),
      ('payments', 'Pagos', 'Registro de pagos', 9),
      ('infractions', 'Infracciones', 'Gestión de infracciones', 10),
      ('expenses', 'Gastos', 'Registro de gastos', 11),
      ('bundles', 'Paquetes', 'Bundles de servicios', 12),
      ('users', 'Gestión de Usuarios', 'Administración de usuarios', 13),
      ('roles', 'Gestión de Roles', 'Roles y permisos', 14),
      ('audit', 'Auditoría', 'Logs de auditoría', 15),
      ('reports', 'Reportes', 'Generación de reportes', 16),
      ('workspaces', 'Workspaces', 'Gestión de espacios de trabajo', 17);

    -- ============================================
    -- 2. Insertar acciones del sistema
    -- ============================================
    INSERT IGNORE INTO system_actions (action_key, action_name, description) VALUES
      ('view', 'Ver', 'Visualizar información'),
      ('list', 'Listar', 'Ver listado'),
      ('create', 'Crear', 'Crear registros'),
      ('edit', 'Editar', 'Modificar registros'),
      ('delete', 'Eliminar', 'Eliminar registros'),
      ('assign', 'Asignar', 'Asignar recursos'),
      ('complete', 'Completar', 'Marcar como completado'),
      ('activate', 'Activar', 'Activar registros'),
      ('deactivate', 'Desactivar', 'Desactivar registros'),
      ('export', 'Exportar', 'Exportar datos'),
      ('import', 'Importar', 'Importar datos'),
      ('approve', 'Aprobar', 'Aprobar solicitudes'),
      ('manage', 'Gestionar', 'Gestión completa');

    -- ============================================
    -- 3. Generar permisos
    -- ============================================
    INSERT IGNORE INTO permissions (permission_key, page_id, action_id, description)
    SELECT
      CONCAT(p.page_key, ':', a.action_key) as permission_key,
      p.id as page_id,
      a.id as action_id,
      CONCAT(a.action_name, ' en ', p.page_name) as description
    FROM system_pages p
    CROSS JOIN system_actions a
    WHERE a.action_key IN ('view', 'list')
       OR (p.page_key IN ('clients', 'services', 'tasks', 'invoices', 'expenses', 'bundles', 'users', 'roles', 'infractions', 'payments', 'workspaces')
           AND a.action_key IN ('create', 'edit', 'delete'))
       OR (p.page_key = 'clients' AND a.action_key IN ('assign', 'activate', 'deactivate'))
       OR (p.page_key = 'tasks' AND a.action_key IN ('complete', 'assign'))
       OR (p.page_key = 'payments' AND a.action_key IN ('approve'))
       OR (p.page_key = 'financial' AND a.action_key = 'manage')
       OR (p.page_key = 'reports' AND a.action_key = 'export')
       OR (p.page_key = 'users' AND a.action_key IN ('activate', 'deactivate', 'manage'))
       OR (p.page_key = 'roles' AND a.action_key = 'manage')
       OR (p.page_key = 'workspaces' AND a.action_key IN ('assign', 'manage'))
       OR (p.page_key = 'pool' AND a.action_key IN ('assign', 'manage'));

    -- ============================================
    -- 4. Crear roles del sistema
    -- ============================================
    INSERT IGNORE INTO roles (role_key, role_name, description, is_system_role) VALUES
      ('admin', 'Administrador', 'Acceso completo al sistema', TRUE),
      ('manager', 'Gerente', 'Puede gestionar empleados y ver reportes', TRUE),
      ('employee', 'Empleado', 'Acceso a clientes asignados y tareas', TRUE),
      ('client', 'Cliente', 'Acceso solo a su información', TRUE);

    -- ============================================
    -- 5. Asignar todos los permisos al admin
    -- ============================================
    INSERT IGNORE INTO role_permissions (role_id, permission_id, granted)
    SELECT r.id, p.id, TRUE
    FROM roles r
    CROSS JOIN permissions p
    WHERE r.role_key = 'admin';

    -- ============================================
    -- 6. Usuario administrador inicial
    -- ============================================
    INSERT INTO users (email, password_hash, full_name, role, is_active)
    SELECT 'admin@sat.com', '$ADMIN_PASSWORD_HASH', 'Administrador', 'admin', 1
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@sat.com');

    -- ============================================
    -- 7. Asignar rol admin al usuario
    -- ============================================
    INSERT IGNORE INTO user_roles (user_id, role_id, is_active)
    SELECT u.id, r.id, TRUE
    FROM users u
    JOIN roles r ON r.role_key = 'admin'
    WHERE u.email = 'admin@sat.com';

    -- ============================================
    -- 8. Asignar admin al workspace general
    -- ============================================
    INSERT IGNORE INTO user_workspaces (user_id, workspace_id, role_in_workspace, is_primary)
    SELECT u.id, w.id, 'owner', TRUE
    FROM users u
    CROSS JOIN workspaces w
    WHERE u.email = 'admin@sat.com' AND w.slug = 'general';

    -- ============================================
    -- 9. Servicios básicos
    -- ============================================
    INSERT INTO services (service_name, description, default_price, recurrence_type, is_active, is_global)
    SELECT 'Declaración SAT', 'Declaración mensual de impuestos', 50.00, 'monthly', TRUE, TRUE
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name = 'Declaración SAT');

    INSERT INTO services (service_name, description, default_price, recurrence_type, is_active, is_global)
    SELECT 'Factura Electrónica', 'Gestión de facturación electrónica', 30.00, 'monthly', TRUE, TRUE
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name = 'Factura Electrónica');

    INSERT INTO services (service_name, description, default_price, recurrence_type, is_active, is_global)
    SELECT 'Libros al Día', 'Actualización de libros contables', 100.00, 'custom', TRUE, TRUE
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name = 'Libros al Día');

    INSERT INTO services (service_name, description, default_price, recurrence_type, is_active, is_global)
    SELECT 'Rectificador', 'Rectificación de declaraciones', 75.00, 'one_time', TRUE, TRUE
    WHERE NOT EXISTS (SELECT 1 FROM services WHERE service_name = 'Rectificador');

    -- ============================================
    -- 10. Actualizar workspace_id de servicios
    -- ============================================
    UPDATE services SET workspace_id = (SELECT id FROM workspaces WHERE slug = 'general' LIMIT 1)
    WHERE workspace_id IS NULL;

    SELECT 'Datos iniciales insertados correctamente' AS status;

EOSQL

    echo "Datos insertados en $db"
done

echo ""
echo "==========================================="
echo "DATOS INICIALES COMPLETADOS"
echo "==========================================="
echo ""
echo "Credenciales de acceso:"
echo "  Email: admin@sat.com"
echo "  Password: password123"
echo "==========================================="
