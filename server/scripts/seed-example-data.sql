-- Script para insertar datos de ejemplo en la base de datos
-- Ejecutar después de crear las tablas básicas
-- IMPORTANTE: Asegúrate de que el tenant_id = 1 existe en la tabla tenants

-- Configurar variables para meses actuales
SET @current_year = YEAR(CURDATE());
SET @current_month = MONTH(CURDATE());
SET @prev_month = IF(@current_month = 1, 12, @current_month - 1);
SET @prev_year = IF(@current_month = 1, @current_year - 1, @current_year);

-- 1. Insertar usuarios de ejemplo
-- NOTA: Las contraseñas son "password123" hasheadas con bcrypt
-- En producción, usa el hash correcto generado por tu sistema
INSERT INTO `users` (`tenant_id`, `email`, `password_hash`, `full_name`, `role`, `nit`, `is_active`) VALUES
(1, 'admin@acme.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrador Principal', 'admin', 'ADMIN-001', 1),
(1, 'empleado@acme.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Empleado Ejemplo', 'employee', 'EMP-001', 1),
(1, 'cliente1@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Juan Pérez', 'client', '1234-567890-001-2', 1),
(1, 'cliente2@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'María García', 'client', '9876-543210-001-3', 1),
(1, 'cliente3@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Carlos Rodríguez', 'client', '5555-123456-001-4', 1);

-- Obtener IDs de los usuarios insertados (asumiendo que son los IDs 1, 2, 3, 4, 5 si es una BD nueva)
-- Si ya hay datos, ajusta estos valores según corresponda
SET @admin_id = (SELECT id FROM users WHERE email = 'admin@acme.com' AND tenant_id = 1);
SET @employee_id = (SELECT id FROM users WHERE email = 'empleado@acme.com' AND tenant_id = 1);
SET @client1_id = (SELECT id FROM users WHERE email = 'cliente1@example.com' AND tenant_id = 1);
SET @client2_id = (SELECT id FROM users WHERE email = 'cliente2@example.com' AND tenant_id = 1);
SET @client3_id = (SELECT id FROM users WHERE email = 'cliente3@example.com' AND tenant_id = 1);

-- 2. Insertar servicios para clientes (client_services)
-- Asumiendo que los service_ids son 1, 2, 3 (ya existen según el dump)
INSERT INTO `client_services` (`tenant_id`, `client_user_id`, `service_id`, `status`, `start_date`) VALUES
(1, @client1_id, 1, 'active', CURDATE()), -- Cliente 1: Contabilidad Mensual
(1, @client1_id, 2, 'active', CURDATE()), -- Cliente 1: Declaración IVA
(1, @client2_id, 1, 'active', CURDATE()), -- Cliente 2: Contabilidad Mensual
(1, @client2_id, 3, 'active', CURDATE()), -- Cliente 2: Apertura de Libros
(1, @client3_id, 1, 'active', CURDATE()), -- Cliente 3: Contabilidad Mensual
(1, @client3_id, 2, 'active', CURDATE()), -- Cliente 3: Declaración IVA
(1, @client3_id, 3, 'active', CURDATE()); -- Cliente 3: Apertura de Libros

-- 3. Insertar perfiles de clientes
INSERT INTO `clients_profiles` (`user_id`, `tenant_id`, `contract_number`, `overall_rating`) VALUES
(@client1_id, 1, 'CONT-2024-001', 5.00),
(@client2_id, 1, 'CONT-2024-002', 4.50),
(@client3_id, 1, 'CONT-2024-003', 4.75);

-- 4. Insertar facturas mensuales (monthly_invoices)
INSERT INTO `monthly_invoices` (
  `tenant_id`, `client_user_id`, `invoice_year`, `invoice_month`,
  `previous_debt`, `monthly_fee`, `extras_fee`, `extras_description`,
  `total_due`, `amount_paid`, `balance`, `payment_status`, `services_status`, `observations`
) VALUES
-- Cliente 1 - Mes actual
(1, @client1_id, @current_year, @current_month, 0.00, 125.00, 25.00, 'Costo adicional por consulta', 150.00, 0.00, 150.00, 'pending', 'pending', 'Cliente puntual, requiere seguimiento'),
-- Cliente 1 - Mes anterior
(1, @client1_id, @prev_year, @prev_month, 0.00, 125.00, 0.00, NULL, 125.00, 75.00, 50.00, 'partial', 'pending', NULL),
-- Cliente 2 - Mes actual
(1, @client2_id, @current_year, @current_month, 0.00, 160.00, 0.00, NULL, 160.00, 0.00, 160.00, 'pending', 'pending', 'Cliente nuevo, primera factura'),
-- Cliente 2 - Mes anterior
(1, @client2_id, @prev_year, @prev_month, 0.00, 160.00, 0.00, NULL, 160.00, 160.00, 0.00, 'paid', 'completed', NULL),
-- Cliente 3 - Mes actual
(1, @client3_id, @current_year, @current_month, 50.00, 210.00, 0.00, NULL, 260.00, 0.00, 260.00, 'pending', 'pending', 'Tiene deuda pendiente del mes anterior'),
-- Cliente 3 - Mes anterior
(1, @client3_id, @prev_year, @prev_month, 0.00, 210.00, 0.00, NULL, 210.00, 160.00, 50.00, 'partial', 'pending', NULL);

-- Obtener IDs de las facturas insertadas
SET @inv1_curr_id = (SELECT id FROM monthly_invoices WHERE client_user_id = @client1_id AND invoice_year = @current_year AND invoice_month = @current_month AND tenant_id = 1);
SET @inv1_prev_id = (SELECT id FROM monthly_invoices WHERE client_user_id = @client1_id AND invoice_year = @prev_year AND invoice_month = @prev_month AND tenant_id = 1);
SET @inv2_curr_id = (SELECT id FROM monthly_invoices WHERE client_user_id = @client2_id AND invoice_year = @current_year AND invoice_month = @current_month AND tenant_id = 1);
SET @inv2_prev_id = (SELECT id FROM monthly_invoices WHERE client_user_id = @client2_id AND invoice_year = @prev_year AND invoice_month = @prev_month AND tenant_id = 1);
SET @inv3_curr_id = (SELECT id FROM monthly_invoices WHERE client_user_id = @client3_id AND invoice_year = @current_year AND invoice_month = @current_month AND tenant_id = 1);
SET @inv3_prev_id = (SELECT id FROM monthly_invoices WHERE client_user_id = @client3_id AND invoice_year = @prev_year AND invoice_month = @prev_month AND tenant_id = 1);

-- 5. Insertar checklist de tareas pendientes (monthly_service_checklist)
INSERT INTO `monthly_service_checklist` (`tenant_id`, `invoice_id`, `task_name`, `status`) VALUES
-- Tareas para factura del mes actual - Cliente 1
(1, @inv1_curr_id, 'Factura del mes', 'pending'),
(1, @inv1_curr_id, 'Declaración de IVA', 'pending'),
-- Tareas para factura del mes anterior - Cliente 1
(1, @inv1_prev_id, 'Factura del mes', 'pending'),
(1, @inv1_prev_id, 'Declaración de IVA', 'pending'),
-- Tareas para factura del mes actual - Cliente 2
(1, @inv2_curr_id, 'Factura del mes', 'pending'),
(1, @inv2_curr_id, 'Apertura de Libros', 'pending'),
-- Tareas para factura del mes actual - Cliente 3
(1, @inv3_curr_id, 'Factura del mes', 'pending'),
(1, @inv3_curr_id, 'Declaración de IVA', 'pending'),
(1, @inv3_curr_id, 'Apertura de Libros', 'pending'),
-- Una tarea completada para ejemplo (mes anterior Cliente 2)
(1, @inv2_prev_id, 'Factura del mes', 'completed');

-- 6. Insertar items de servicios en facturas (invoice_service_items)
INSERT INTO `invoice_service_items` (`invoice_id`, `service_id`, `description`, `quantity`, `unit_price`) VALUES
-- Cliente 1 - Mes actual
(@inv1_curr_id, 1, 'Contabilidad Mensual', 1.00, 75.00),
(@inv1_curr_id, 2, 'Declaración IVA', 1.00, 50.00),
-- Cliente 1 - Mes anterior
(@inv1_prev_id, 1, 'Contabilidad Mensual', 1.00, 75.00),
(@inv1_prev_id, 2, 'Declaración IVA', 1.00, 50.00),
-- Cliente 2 - Mes actual
(@inv2_curr_id, 1, 'Contabilidad Mensual', 1.00, 75.00),
(@inv2_curr_id, 3, 'Apertura de Libros', 1.00, 85.00),
-- Cliente 2 - Mes anterior
(@inv2_prev_id, 1, 'Contabilidad Mensual', 1.00, 75.00),
(@inv2_prev_id, 3, 'Apertura de Libros', 1.00, 85.00),
-- Cliente 3 - Mes actual
(@inv3_curr_id, 1, 'Contabilidad Mensual', 1.00, 75.00),
(@inv3_curr_id, 2, 'Declaración IVA', 1.00, 50.00),
(@inv3_curr_id, 3, 'Apertura de Libros', 1.00, 85.00),
-- Cliente 3 - Mes anterior
(@inv3_prev_id, 1, 'Contabilidad Mensual', 1.00, 75.00),
(@inv3_prev_id, 2, 'Declaración IVA', 1.00, 50.00),
(@inv3_prev_id, 3, 'Apertura de Libros', 1.00, 85.00);

-- Verificar datos insertados
SELECT 'Usuarios creados:' as info, COUNT(*) as total FROM users WHERE tenant_id = 1;
SELECT 'Facturas creadas:' as info, COUNT(*) as total FROM monthly_invoices WHERE tenant_id = 1;
SELECT 'Tareas pendientes:' as info, COUNT(*) as total FROM monthly_service_checklist WHERE tenant_id = 1 AND status = 'pending';
SELECT 'Tareas completadas:' as info, COUNT(*) as total FROM monthly_service_checklist WHERE tenant_id = 1 AND status = 'completed';
