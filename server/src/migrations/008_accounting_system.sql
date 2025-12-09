-- Migración 008: Sistema Contable Completo
-- Incluye: Pagos detallados, Infracciones, Gastos, Paquetes de servicios y Costos operativos
-- Ejecutar: mysql -u root -p sat_acme < server/src/migrations/008_accounting_system.sql

-- ============================================================================
-- PASO 1: Mejorar tabla monthly_invoices para tracking de pagos
-- ============================================================================

-- Agregar campos para rastrear quién y cuándo registró el pago
ALTER TABLE monthly_invoices
ADD COLUMN IF NOT EXISTS payment_registered_by_user_id INT NULL
COMMENT 'ID del admin/employee que registró el pago';

ALTER TABLE monthly_invoices
ADD COLUMN IF NOT EXISTS payment_registered_at TIMESTAMP NULL
COMMENT 'Fecha y hora en que se registró el pago';

-- Actualizar payment_status para incluir más estados
ALTER TABLE monthly_invoices
MODIFY COLUMN payment_status ENUM('paid', 'partial', 'pending', 'overdue', 'deferred_next_month', 'unpaid_auto') DEFAULT 'pending'
COMMENT 'paid=pagado completo, partial=abono/pago parcial, pending=pendiente, overdue=vencido, deferred_next_month=pasa al siguiente mes, unpaid_auto=no pagado automáticamente al fin de mes';

-- Foreign key para trazabilidad de pagos
ALTER TABLE monthly_invoices
ADD CONSTRAINT fk_payment_registered_by
FOREIGN KEY (payment_registered_by_user_id) REFERENCES users(id)
ON DELETE SET NULL;

-- ============================================================================
-- PASO 2: Sistema de Infracciones
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_infractions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_user_id INT NOT NULL,
  infraction_type ENUM('automatic_unpaid', 'manual') NOT NULL
  COMMENT 'automatic_unpaid=generada automáticamente por no pago, manual=creada por admin',

  reason TEXT NOT NULL
  COMMENT 'Motivo de la infracción',

  related_invoice_id INT NULL
  COMMENT 'ID de la factura relacionada (para infracciones por no pago)',

  created_by_user_id INT NULL
  COMMENT 'ID del admin que creó la infracción (NULL para automáticas)',

  is_active BOOLEAN DEFAULT TRUE
  COMMENT 'Si la infracción está activa (puede ser cancelada por admin)',

  resolved_by_user_id INT NULL
  COMMENT 'ID del admin que resolvió/canceló la infracción',

  resolved_at TIMESTAMP NULL
  COMMENT 'Fecha en que se resolvió la infracción',

  resolution_notes TEXT NULL
  COMMENT 'Notas sobre cómo se resolvió',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_invoice_id) REFERENCES monthly_invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_client_active (client_user_id, is_active),
  INDEX idx_type (infraction_type)
) COMMENT='Registro de infracciones de clientes (automáticas o manuales)';

-- Agregar contador de infracciones activas en clients_profiles
ALTER TABLE clients_profiles
ADD COLUMN IF NOT EXISTS active_infractions_count INT DEFAULT 0
COMMENT 'Número de infracciones activas del cliente';

-- Agregar flag para servicios deshabilitados por infracciones
ALTER TABLE users
ADD COLUMN IF NOT EXISTS services_disabled_by_infractions BOOLEAN DEFAULT FALSE
COMMENT 'TRUE si los servicios fueron deshabilitados por 3+ infracciones';

-- ============================================================================
-- PASO 3: Sistema de Gastos
-- ============================================================================

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,

  expense_type ENUM('one_time', 'monthly_recurring') NOT NULL
  COMMENT 'one_time=gasto único, monthly_recurring=gasto mensual recurrente',

  description TEXT NOT NULL
  COMMENT 'Descripción del gasto (ej: "Pago a trabajador A", "Compra de artículos")',

  amount DECIMAL(10,2) NOT NULL
  COMMENT 'Monto del gasto',

  expense_date DATE NOT NULL
  COMMENT 'Fecha del gasto',

  expense_month INT NOT NULL
  COMMENT 'Mes del gasto (1-12) para reportes',

  expense_year INT NOT NULL
  COMMENT 'Año del gasto para reportes',

  category VARCHAR(100) NULL
  COMMENT 'Categoría del gasto (ej: "Nómina", "Suministros", "Servicios")',

  created_by_user_id INT NOT NULL
  COMMENT 'Admin que registró el gasto',

  is_active BOOLEAN DEFAULT TRUE
  COMMENT 'Si el gasto está activo (para gastos recurrentes que pueden cancelarse)',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_date (expense_date),
  INDEX idx_month_year (expense_year, expense_month),
  INDEX idx_type (expense_type),
  INDEX idx_active (is_active)
) COMMENT='Gastos del negocio (únicos o recurrentes)';

-- ============================================================================
-- PASO 4: Sistema de Paquetes/Bundles de Servicios
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_bundles (
  id INT AUTO_INCREMENT PRIMARY KEY,

  bundle_name VARCHAR(255) NOT NULL
  COMMENT 'Nombre del paquete (ej: "Paquete Básico SAT")',

  description TEXT NULL
  COMMENT 'Descripción del paquete',

  bundle_price DECIMAL(10,2) NOT NULL
  COMMENT 'Precio del paquete completo',

  is_active BOOLEAN DEFAULT TRUE
  COMMENT 'Si el paquete está activo y disponible',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_active (is_active)
) COMMENT='Paquetes/bundles de servicios que se cobran juntos';

-- Tabla intermedia para servicios dentro de cada paquete
CREATE TABLE IF NOT EXISTS bundle_services (
  id INT AUTO_INCREMENT PRIMARY KEY,

  bundle_id INT NOT NULL
  COMMENT 'ID del paquete',

  service_id INT NOT NULL
  COMMENT 'ID del servicio incluido en el paquete',

  FOREIGN KEY (bundle_id) REFERENCES service_bundles(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,

  UNIQUE KEY unique_bundle_service (bundle_id, service_id),
  INDEX idx_bundle (bundle_id),
  INDEX idx_service (service_id)
) COMMENT='Servicios incluidos en cada paquete';

-- Relación de clientes con paquetes
CREATE TABLE IF NOT EXISTS client_bundles (
  id INT AUTO_INCREMENT PRIMARY KEY,

  client_user_id INT NOT NULL
  COMMENT 'ID del cliente',

  bundle_id INT NOT NULL
  COMMENT 'ID del paquete contratado',

  custom_price DECIMAL(10,2) NULL
  COMMENT 'Precio personalizado para este cliente (si aplica)',

  start_date DATE NULL
  COMMENT 'Fecha de inicio del paquete',

  status VARCHAR(50) DEFAULT 'active'
  COMMENT 'Estado del paquete para este cliente',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bundle_id) REFERENCES service_bundles(id) ON DELETE CASCADE,

  INDEX idx_client (client_user_id),
  INDEX idx_bundle (bundle_id),
  INDEX idx_status (status)
) COMMENT='Paquetes contratados por cada cliente';

-- ============================================================================
-- PASO 5: Costos Operativos de Servicios
-- ============================================================================

-- Agregar campos a tabla services para costos operativos
ALTER TABLE services
ADD COLUMN IF NOT EXISTS has_operational_cost BOOLEAN DEFAULT FALSE
COMMENT 'Si el servicio tiene un costo operativo (ej: libros, omisos)';

ALTER TABLE services
ADD COLUMN IF NOT EXISTS operational_cost_type ENUM('none', 'fixed', 'variable') DEFAULT 'none'
COMMENT 'none=sin costo, fixed=costo fijo, variable=costo varía por caso';

ALTER TABLE services
ADD COLUMN IF NOT EXISTS operational_cost_amount DECIMAL(10,2) NULL
COMMENT 'Monto del costo operativo para tipo fixed';

-- Tabla para costos operativos variables (como omisos)
CREATE TABLE IF NOT EXISTS service_operational_costs (
  id INT AUTO_INCREMENT PRIMARY KEY,

  service_id INT NOT NULL
  COMMENT 'ID del servicio',

  invoice_id INT NULL
  COMMENT 'ID de la factura específica (si aplica)',

  client_user_id INT NOT NULL
  COMMENT 'ID del cliente',

  cost_amount DECIMAL(10,2) NOT NULL
  COMMENT 'Monto del costo operativo',

  revenue_amount DECIMAL(10,2) NOT NULL
  COMMENT 'Monto cobrado al cliente',

  profit_amount DECIMAL(10,2) GENERATED ALWAYS AS (revenue_amount - cost_amount) STORED
  COMMENT 'Ganancia = revenue - cost (calculado automáticamente)',

  description TEXT NULL
  COMMENT 'Descripción del servicio específico (ej: "Omiso complejidad alta")',

  cost_date DATE NOT NULL
  COMMENT 'Fecha del costo',

  created_by_user_id INT NOT NULL
  COMMENT 'Admin que registró el costo',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES monthly_invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_service (service_id),
  INDEX idx_invoice (invoice_id),
  INDEX idx_client (client_user_id),
  INDEX idx_date (cost_date)
) COMMENT='Costos operativos variables de servicios (ej: cada omiso tiene costo diferente)';

-- ============================================================================
-- PASO 6: Triggers para mantener contador de infracciones
-- ============================================================================

DELIMITER $$

-- Trigger para incrementar contador al crear infracción activa
DROP TRIGGER IF EXISTS after_insert_infraction$$
CREATE TRIGGER after_insert_infraction
AFTER INSERT ON client_infractions
FOR EACH ROW
BEGIN
  IF NEW.is_active = TRUE THEN
    -- Incrementar contador de infracciones activas
    UPDATE clients_profiles
    SET active_infractions_count = active_infractions_count + 1
    WHERE user_id = NEW.client_user_id;

    -- Verificar si alcanzó 3 infracciones para deshabilitar servicios
    UPDATE users
    SET services_disabled_by_infractions = TRUE
    WHERE id = NEW.client_user_id
      AND (SELECT active_infractions_count FROM clients_profiles WHERE user_id = NEW.client_user_id) >= 3;
  END IF;
END$$

-- Trigger para actualizar contador al resolver/activar infracción
DROP TRIGGER IF EXISTS after_update_infraction$$
CREATE TRIGGER after_update_infraction
AFTER UPDATE ON client_infractions
FOR EACH ROW
BEGIN
  -- Si cambió de activa a inactiva
  IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
    UPDATE clients_profiles
    SET active_infractions_count = GREATEST(0, active_infractions_count - 1)
    WHERE user_id = NEW.client_user_id;
  END IF;

  -- Si cambió de inactiva a activa
  IF OLD.is_active = FALSE AND NEW.is_active = TRUE THEN
    UPDATE clients_profiles
    SET active_infractions_count = active_infractions_count + 1
    WHERE user_id = NEW.client_user_id;
  END IF;

  -- Actualizar flag de servicios deshabilitados
  UPDATE users u
  JOIN clients_profiles cp ON u.id = cp.user_id
  SET u.services_disabled_by_infractions = (cp.active_infractions_count >= 3)
  WHERE u.id = NEW.client_user_id;
END$$

-- Trigger para decrementar contador al eliminar infracción activa
DROP TRIGGER IF EXISTS after_delete_infraction$$
CREATE TRIGGER after_delete_infraction
AFTER DELETE ON client_infractions
FOR EACH ROW
BEGIN
  IF OLD.is_active = TRUE THEN
    UPDATE clients_profiles
    SET active_infractions_count = GREATEST(0, active_infractions_count - 1)
    WHERE user_id = OLD.client_user_id;

    -- Actualizar flag de servicios deshabilitados
    UPDATE users u
    JOIN clients_profiles cp ON u.id = cp.user_id
    SET u.services_disabled_by_infractions = (cp.active_infractions_count >= 3)
    WHERE u.id = OLD.client_user_id;
  END IF;
END$$

DELIMITER ;

-- ============================================================================
-- PASO 7: Datos iniciales de ejemplo
-- ============================================================================

-- Insertar un paquete básico de servicios SAT (si no existe)
INSERT IGNORE INTO service_bundles (id, bundle_name, description, bundle_price, is_active)
VALUES (1, 'Paquete Básico SAT', 'Incluye los 4 servicios principales de SAT', 50.00, TRUE);

-- Relacionar los servicios básicos con el paquete (ajustar IDs según tu BD)
-- Esto es un ejemplo, deberás ajustar los IDs de servicios según tu base de datos
INSERT IGNORE INTO bundle_services (bundle_id, service_id)
SELECT 1, id FROM services WHERE service_name IN ('Declaración SAT', 'Factura Electrónica', 'Rectificador', 'Libros al Día');

-- ============================================================================
-- MIGRACIÓN COMPLETADA
-- ============================================================================

SELECT '✓ Migración 008 completada - Sistema contable completo configurado' AS Status;

-- Mostrar resumen de nuevas tablas
SELECT 'Nuevas tablas creadas:' AS Info;
SHOW TABLES LIKE '%infraction%';
SHOW TABLES LIKE '%expense%';
SHOW TABLES LIKE '%bundle%';
SHOW TABLES LIKE '%operational_cost%';
