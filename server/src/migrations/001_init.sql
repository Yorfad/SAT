-- Esquema por BD de cliente (coincide con tu diseño)
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