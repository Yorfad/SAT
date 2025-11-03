-- ============================================================================
-- SCRIPT DE RESET COMPLETO DE BASE DE DATOS
-- ============================================================================
-- Este script elimina TODAS las tablas y las recrea desde cero con datos de seed
--
-- ADVERTENCIA: Este script ELIMINARÁ TODOS LOS DATOS de la base de datos
-- Solo debe usarse en desarrollo o para limpiar datos corruptos
--
-- Uso:
--   mysql -u root -p [nombre_db] < server/scripts/reset-database.sql
--
-- Ejemplo:
--   mysql -u root -p sat_acme < server/scripts/reset-database.sql
-- ============================================================================

-- Deshabilitar verificación de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- PASO 1: ELIMINAR TODAS LAS TABLAS EXISTENTES
-- ============================================================================

DROP TABLE IF EXISTS task_observations;
DROP TABLE IF EXISTS client_omisos;
DROP TABLE IF EXISTS task_omisos;
DROP TABLE IF EXISTS invoice_files;
DROP TABLE IF EXISTS invoice_artifacts;
DROP TABLE IF EXISTS invoice_service_items;
DROP TABLE IF EXISTS client_ratings;
DROP TABLE IF EXISTS monthly_service_checklist;
DROP TABLE IF EXISTS monthly_invoices;
DROP TABLE IF EXISTS client_services;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS clients_profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS settings;

-- Re-habilitar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- PASO 2: RECREAR TODAS LAS TABLAS (Migración 001)
-- ============================================================================

-- users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('client', 'admin', 'employee') NOT NULL,
  nit VARCHAR(50),
  birth_date DATE,
  phone_number VARCHAR(50),
  is_active TINYINT DEFAULT 1,
  assigned_to_user_id INT NULL,
  deactivation_reason TEXT NULL,
  deactivated_at TIMESTAMP NULL,
  deactivated_by_user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (deactivated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- monthly_invoices
CREATE TABLE IF NOT EXISTS monthly_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_user_id INT NOT NULL,
  invoice_year INT NOT NULL,
  invoice_month INT NOT NULL,
  previous_debt DECIMAL(10,2) DEFAULT 0.00,
  monthly_fee DECIMAL(10,2) DEFAULT 0.00,
  extras_fee DECIMAL(10,2) DEFAULT 0.00,
  extras_description TEXT,
  total_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0.00,
  balance DECIMAL(10,2) NOT NULL,
  payment_status ENUM('paid','pending','overdue','partial') DEFAULT 'pending',
  services_status VARCHAR(50),
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observations TEXT NULL,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_invoice_month (client_user_id, invoice_year, invoice_month)
);

-- services
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  default_price DECIMAL(10,2) NOT NULL,
  recurrence_type ENUM('monthly', 'bimonthly', 'quarterly', 'annual', 'custom', 'one_time') DEFAULT 'monthly',
  recurrence_days INT NULL,
  activation_day INT DEFAULT 25,
  activation_window_days INT DEFAULT 7,
  requires_file BOOLEAN DEFAULT TRUE,
  completion_determines_next BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- client_services
CREATE TABLE IF NOT EXISTS client_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_user_id INT NOT NULL,
  service_id INT NOT NULL,
  custom_price DECIMAL(10,2),
  start_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  deactivation_reason TEXT NULL,
  deactivated_at TIMESTAMP NULL,
  deactivated_by_user_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (deactivated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- invoice_service_items
CREATE TABLE IF NOT EXISTS invoice_service_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  service_id INT NOT NULL,
  description VARCHAR(255),
  quantity DECIMAL(10,2) DEFAULT 1.00,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES monthly_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id)
);

-- invoice_artifacts
CREATE TABLE IF NOT EXISTS invoice_artifacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  artifact_type VARCHAR(50) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES monthly_invoices(id) ON DELETE CASCADE
);

-- invoice_files
CREATE TABLE IF NOT EXISTS invoice_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  uploaded_by_user_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES monthly_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

-- client_ratings
CREATE TABLE IF NOT EXISTS client_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_user_id INT NOT NULL,
  rated_by_user_id INT NOT NULL,
  related_invoice_id INT,
  rating TINYINT NOT NULL,
  remarks TEXT,
  rating_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (rated_by_user_id) REFERENCES users(id),
  FOREIGN KEY (related_invoice_id) REFERENCES monthly_invoices(id)
);

-- clients_profiles
CREATE TABLE IF NOT EXISTS clients_profiles (
  user_id INT PRIMARY KEY,
  contract_number VARCHAR(50),
  sat_password_encrypted VARCHAR(255),
  overall_rating DECIMAL(3,2) DEFAULT 5.00,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- monthly_service_checklist
CREATE TABLE IF NOT EXISTS monthly_service_checklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  status ENUM('pending','completed','not_applicable') DEFAULT 'pending',
  completed_by_user_id INT,
  completion_date TIMESTAMP,
  next_payment_date DATE NULL,
  file_path VARCHAR(255) NULL,
  file_type VARCHAR(100) NULL,
  omiso_id INT NULL,
  service_id INT NULL,
  FOREIGN KEY (invoice_id) REFERENCES monthly_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by_user_id) REFERENCES users(id),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  INDEX idx_service_id (service_id)
);

-- settings
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  display_name VARCHAR(255),
  logo_url VARCHAR(512),
  theme_json JSON,
  features_json JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================================
-- PASO 3: CREAR TABLA DE OMISOS (Migración 004)
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_omisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  motivo TEXT NOT NULL,
  archivo_path VARCHAR(255) NOT NULL,
  estado ENUM('activo', 'resuelto') DEFAULT 'activo',
  task_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  resolved_by_user_id INT NULL,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES monthly_service_checklist(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_client_estado (client_id, estado),
  INDEX idx_task (task_id)
);

-- Tabla de observaciones y ratings (Migración 007)
CREATE TABLE IF NOT EXISTS task_observations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  client_user_id INT NOT NULL,
  created_by_user_id INT NOT NULL,
  observation_text TEXT NULL,
  rating TINYINT NULL CHECK (rating >= 1 AND rating <= 5),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES monthly_service_checklist(id) ON DELETE CASCADE,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_client (client_user_id),
  INDEX idx_task (task_id),
  INDEX idx_primary (client_user_id, is_primary)
);

-- Agregar campo ratings_count a clients_profiles
ALTER TABLE clients_profiles
ADD COLUMN IF NOT EXISTS ratings_count INT DEFAULT 0;

-- ============================================================================
-- PASO 4: CARGAR DATOS DE SEED
-- ============================================================================

-- Insertar usuarios de ejemplo
-- Contraseña para todos: "password123" (bcrypt hash)
INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES
  ('admin@sat.com', '$2a$10$hkknUkGEeyHF7/DChW3Yn.qDmz3leATQnpe7N2QpHD6jTcQ3v84HS', 'Administrador Principal', 'admin', 1),
  ('employee1@sat.com', '$2a$10$hkknUkGEeyHF7/DChW3Yn.qDmz3leATQnpe7N2QpHD6jTcQ3v84HS', 'Empleado 1', 'employee', 1),
  ('employee2@sat.com', '$2a$10$hkknUkGEeyHF7/DChW3Yn.qDmz3leATQnpe7N2QpHD6jTcQ3v84HS', 'Empleado 2', 'employee', 1),
  ('cliente1@example.com', '$2a$10$hkknUkGEeyHF7/DChW3Yn.qDmz3leATQnpe7N2QpHD6jTcQ3v84HS', 'Cliente de Prueba 1', 'client', 1),
  ('cliente2@example.com', '$2a$10$hkknUkGEeyHF7/DChW3Yn.qDmz3leATQnpe7N2QpHD6jTcQ3v84HS', 'Cliente de Prueba 2', 'client', 1);

-- Asignar clientes a employee1 (id: 2)
UPDATE users SET assigned_to_user_id = 2 WHERE email IN ('cliente1@example.com', 'cliente2@example.com');

-- Insertar servicios base con configuración de recurrencia
INSERT INTO services (
  service_name,
  description,
  default_price,
  recurrence_type,
  recurrence_days,
  activation_day,
  activation_window_days,
  requires_file,
  completion_determines_next,
  is_active
) VALUES
  -- Libros al Día: El usuario especifica próxima fecha al completar
  ('Libros al Día', 'Mantenimiento de libros contables al día', 150.00, 'custom', NULL, NULL, 60, TRUE, TRUE, TRUE),
  -- Declaración de SAT: Mensual, última semana del mes
  ('Declaración de SAT', 'Declaración mensual a 0 de la SAT', 50.00, 'monthly', NULL, 25, 7, TRUE, FALSE, TRUE),
  -- Factura: Mensual, penúltima semana del mes
  ('Factura', 'Emisión de factura mensual', 75.00, 'monthly', NULL, 28, 5, TRUE, FALSE, TRUE),
  -- Rectificador: Mensual, última semana del mes
  ('Rectificador', 'Rectificación de documentos SAT', 100.00, 'monthly', NULL, 25, 7, TRUE, FALSE, TRUE);

-- Insertar perfil de cliente (sin contraseña SAT cifrada por ahora)
INSERT INTO clients_profiles (user_id, contract_number, overall_rating, notes) VALUES
  (4, 'CONT-001', 5.00, 'Cliente de prueba 1'),
  (5, 'CONT-002', 5.00, 'Cliente de prueba 2');

-- Insertar factura del mes actual para testing
INSERT INTO monthly_invoices (client_user_id, invoice_year, invoice_month, total_due, balance, payment_status) VALUES
  (4, YEAR(CURDATE()), MONTH(CURDATE()), 275.00, 275.00, 'pending'),
  (5, YEAR(CURDATE()), MONTH(CURDATE()), 275.00, 275.00, 'pending');

-- Insertar tareas de ejemplo para el mes actual (relacionadas con servicios)
INSERT INTO monthly_service_checklist (invoice_id, task_name, status, service_id) VALUES
  (1, 'Libros al Día', 'pending', 1),
  (1, 'Declaración de SAT', 'pending', 2),
  (1, 'Factura', 'pending', 3),
  (1, 'Rectificador', 'pending', 4),
  (2, 'Libros al Día', 'pending', 1),
  (2, 'Declaración de SAT', 'pending', 2),
  (2, 'Factura', 'pending', 3),
  (2, 'Rectificador', 'pending', 4);

-- ============================================================================
-- RESET COMPLETADO
-- ============================================================================
-- La base de datos ha sido reseteada completamente.
-- Usuarios de prueba creados con contraseña: "password123"
--
-- Usuarios disponibles:
--   • admin@sat.com (admin) - password123
--   • employee1@sat.com (employee) - password123
--   • employee2@sat.com (employee) - password123
--   • cliente1@example.com (client) - password123
--   • cliente2@example.com (client) - password123
-- ============================================================================

SELECT '✓ Base de datos reseteada exitosamente' AS Status;
SELECT COUNT(*) AS 'Total Usuarios' FROM users;
SELECT COUNT(*) AS 'Total Servicios' FROM services;
SELECT COUNT(*) AS 'Total Tareas' FROM monthly_service_checklist;
