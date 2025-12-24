-- Migración 015: Configuración avanzada de servicios en bundles
-- Permite definir cómo cada servicio afecta el precio del bundle

-- Agregar campos de configuración a bundle_services
ALTER TABLE bundle_services
ADD COLUMN include_in_base_price BOOLEAN DEFAULT TRUE COMMENT 'Si TRUE, el precio del servicio está incluido en el precio base del bundle',
ADD COLUMN add_when_due BOOLEAN DEFAULT FALSE COMMENT 'Si TRUE, se suma el precio del servicio cuando corresponde por recurrencia',
ADD COLUMN custom_price DECIMAL(10,2) DEFAULT NULL COMMENT 'Precio personalizado del servicio dentro del bundle (NULL = usar default_price)',
ADD COLUMN assignment_type ENUM('all_clients', 'selected_clients') DEFAULT 'all_clients' COMMENT 'Si el servicio del bundle se asigna a todos o solo seleccionados';

-- Agregar campo assignment_type a la tabla services si no existe
-- (para servicios individuales fuera de bundles)
ALTER TABLE services
MODIFY COLUMN assignment_type ENUM('all_clients', 'selected_clients', 'on_request') DEFAULT 'selected_clients';

-- Agregar descripción del bundle que se muestra al cliente
ALTER TABLE service_bundles
ADD COLUMN client_description TEXT DEFAULT NULL COMMENT 'Descripción visible para el cliente',
ADD COLUMN base_price DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Precio base mensual del bundle (servicios incluidos)',
ADD COLUMN billing_type ENUM('fixed', 'dynamic') DEFAULT 'dynamic' COMMENT 'fixed=siempre igual, dynamic=varía según servicios que tocan';

-- Índice para búsquedas por tipo de asignación
CREATE INDEX IF NOT EXISTS idx_bundle_services_assignment ON bundle_services(assignment_type);
