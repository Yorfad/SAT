-- Migración inicial: Esquema completo de la base de datos SAT

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
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
  FOREIGN KEY (invoice_id) REFERENCES monthly_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by_user_id) REFERENCES users(id)
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
