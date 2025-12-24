#!/bin/bash
# ============================================
# Aplicar migraciones a ambas bases de datos
# Se ejecuta solo la primera vez que inicia MySQL
# ============================================

set -e

echo "==========================================="
echo "Aplicando migraciones a bases de datos..."
echo "==========================================="

# Función para aplicar migración con manejo de errores
apply_migration() {
    local db=$1
    local sql=$2
    local name=$3

    echo "  -> $name en $db..."
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$db" <<< "$sql" 2>/dev/null || {
        echo "     (algunos elementos ya existían, continuando...)"
    }
}

# Array de bases de datos
databases=("sat_acme" "sat_solis")

for db in "${databases[@]}"; do
    echo ""
    echo "==========================================="
    echo "Migrando base de datos: $db"
    echo "==========================================="

    # ============================================
    # MIGRACIÓN 001: Esquema inicial
    # ============================================
    apply_migration "$db" "
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

        -- services
        CREATE TABLE IF NOT EXISTS services (
          id INT AUTO_INCREMENT PRIMARY KEY,
          service_name VARCHAR(255) NOT NULL,
          description TEXT,
          default_price DECIMAL(10,2) NOT NULL,
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
    " "Migración 001 - Esquema inicial"

    # ============================================
    # MIGRACIÓN 003: Asignación de clientes
    # ============================================
    apply_migration "$db" "
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS assigned_to_user_id INT NULL;
    " "Migración 003 - Asignación de clientes"

    # ============================================
    # MIGRACIÓN 004: Omisos
    # ============================================
    apply_migration "$db" "
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
          INDEX idx_client_estado (client_id, estado)
        );

        ALTER TABLE monthly_service_checklist
        ADD COLUMN IF NOT EXISTS file_path VARCHAR(255) NULL,
        ADD COLUMN IF NOT EXISTS file_type VARCHAR(100) NULL,
        ADD COLUMN IF NOT EXISTS omiso_id INT NULL;
    " "Migración 004 - Sistema de omisos"

    # ============================================
    # MIGRACIÓN 005: Recurrencia de servicios
    # ============================================
    apply_migration "$db" "
        ALTER TABLE services
        ADD COLUMN IF NOT EXISTS recurrence_type ENUM('monthly', 'bimonthly', 'quarterly', 'annual', 'custom', 'one_time') DEFAULT 'monthly',
        ADD COLUMN IF NOT EXISTS recurrence_days INT NULL,
        ADD COLUMN IF NOT EXISTS activation_day INT DEFAULT 25,
        ADD COLUMN IF NOT EXISTS activation_window_days INT DEFAULT 7,
        ADD COLUMN IF NOT EXISTS requires_file BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS completion_determines_next BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

        ALTER TABLE monthly_service_checklist
        ADD COLUMN IF NOT EXISTS service_id INT NULL,
        ADD COLUMN IF NOT EXISTS next_payment_date DATE NULL;
    " "Migración 005 - Recurrencia de servicios"

    # ============================================
    # MIGRACIÓN 006: Desactivación
    # ============================================
    apply_migration "$db" "
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS deactivation_reason TEXT NULL,
        ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS deactivated_by_user_id INT NULL;

        ALTER TABLE client_services
        ADD COLUMN IF NOT EXISTS deactivation_reason TEXT NULL,
        ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS deactivated_by_user_id INT NULL,
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    " "Migración 006 - Sistema de desactivación"

    # ============================================
    # MIGRACIÓN 007: Observaciones y ratings
    # ============================================
    apply_migration "$db" "
        CREATE TABLE IF NOT EXISTS task_observations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          task_id INT NOT NULL,
          client_user_id INT NOT NULL,
          created_by_user_id INT NOT NULL,
          observation_text TEXT NULL,
          rating TINYINT NULL,
          is_primary BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES monthly_service_checklist(id) ON DELETE CASCADE,
          FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_client (client_user_id),
          INDEX idx_task (task_id)
        );

        ALTER TABLE clients_profiles
        ADD COLUMN IF NOT EXISTS ratings_count INT DEFAULT 0;
    " "Migración 007 - Observaciones y ratings"

    # ============================================
    # MIGRACIÓN 008: Sistema contable
    # ============================================
    apply_migration "$db" "
        ALTER TABLE monthly_invoices
        ADD COLUMN IF NOT EXISTS payment_registered_by_user_id INT NULL,
        ADD COLUMN IF NOT EXISTS payment_registered_at TIMESTAMP NULL;

        CREATE TABLE IF NOT EXISTS client_infractions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          client_user_id INT NOT NULL,
          infraction_type ENUM('automatic_unpaid', 'manual') NOT NULL,
          reason TEXT NOT NULL,
          related_invoice_id INT NULL,
          created_by_user_id INT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          resolved_by_user_id INT NULL,
          resolved_at TIMESTAMP NULL,
          resolution_notes TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_client_active (client_user_id, is_active)
        );

        ALTER TABLE clients_profiles
        ADD COLUMN IF NOT EXISTS active_infractions_count INT DEFAULT 0;

        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS services_disabled_by_infractions BOOLEAN DEFAULT FALSE;

        CREATE TABLE IF NOT EXISTS expenses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          expense_type ENUM('one_time', 'monthly_recurring') NOT NULL,
          description TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          expense_date DATE NOT NULL,
          expense_month INT NOT NULL,
          expense_year INT NOT NULL,
          category VARCHAR(100) NULL,
          created_by_user_id INT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_date (expense_date),
          INDEX idx_month_year (expense_year, expense_month)
        );

        CREATE TABLE IF NOT EXISTS service_bundles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          bundle_name VARCHAR(255) NOT NULL,
          description TEXT NULL,
          bundle_price DECIMAL(10,2) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bundle_services (
          id INT AUTO_INCREMENT PRIMARY KEY,
          bundle_id INT NOT NULL,
          service_id INT NOT NULL,
          FOREIGN KEY (bundle_id) REFERENCES service_bundles(id) ON DELETE CASCADE,
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
          UNIQUE KEY unique_bundle_service (bundle_id, service_id)
        );

        CREATE TABLE IF NOT EXISTS client_bundles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          client_user_id INT NOT NULL,
          bundle_id INT NOT NULL,
          custom_price DECIMAL(10,2) NULL,
          start_date DATE NULL,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (bundle_id) REFERENCES service_bundles(id) ON DELETE CASCADE
        );

        ALTER TABLE services
        ADD COLUMN IF NOT EXISTS has_operational_cost BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS operational_cost_type ENUM('none', 'fixed', 'variable') DEFAULT 'none',
        ADD COLUMN IF NOT EXISTS operational_cost_amount DECIMAL(10,2) NULL;

        CREATE TABLE IF NOT EXISTS service_operational_costs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          service_id INT NOT NULL,
          invoice_id INT NULL,
          client_user_id INT NOT NULL,
          cost_amount DECIMAL(10,2) NOT NULL,
          revenue_amount DECIMAL(10,2) NOT NULL,
          description TEXT NULL,
          cost_date DATE NOT NULL,
          created_by_user_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
          FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    " "Migración 008 - Sistema contable"

    # ============================================
    # MIGRACIÓN 009: Gestión de clientes
    # ============================================
    apply_migration "$db" "
        ALTER TABLE clients_profiles
        ADD COLUMN IF NOT EXISTS sede VARCHAR(100) NULL,
        ADD COLUMN IF NOT EXISTS grupo VARCHAR(50) NULL;

        ALTER TABLE services
        ADD COLUMN IF NOT EXISTS is_on_request BOOLEAN DEFAULT FALSE;

        CREATE TABLE IF NOT EXISTS client_service_priorities (
          id INT AUTO_INCREMENT PRIMARY KEY,
          client_user_id INT NOT NULL,
          service_id INT NULL,
          priority ENUM('baja', 'normal', 'alta', 'urgente') DEFAULT 'normal',
          notes TEXT NULL,
          created_by_user_id INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_client_service_priority (client_user_id, service_id)
        );

        CREATE TABLE IF NOT EXISTS client_pool (
          id INT AUTO_INCREMENT PRIMARY KEY,
          client_user_id INT NOT NULL,
          invoice_id INT NULL,
          task_id INT NULL,
          service_id INT NULL,
          description TEXT NOT NULL,
          priority ENUM('baja', 'normal', 'alta', 'urgente') DEFAULT 'normal',
          status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
          added_by_user_id INT NULL,
          assigned_to_user_id INT NULL,
          completed_by_user_id INT NULL,
          added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          started_at TIMESTAMP NULL,
          completed_at TIMESTAMP NULL,
          notes TEXT NULL,
          FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_status (status),
          INDEX idx_priority (priority)
        );
    " "Migración 009 - Gestión de clientes"

    # ============================================
    # MIGRACIÓN 011: Usuarios y permisos
    # ============================================
    apply_migration "$db" "
        CREATE TABLE IF NOT EXISTS system_pages (
          id INT PRIMARY KEY AUTO_INCREMENT,
          page_key VARCHAR(100) NOT NULL UNIQUE,
          page_name VARCHAR(200) NOT NULL,
          description TEXT,
          parent_page_id INT NULL,
          display_order INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS system_actions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          action_key VARCHAR(100) NOT NULL UNIQUE,
          action_name VARCHAR(200) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS permissions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          permission_key VARCHAR(200) NOT NULL UNIQUE,
          page_id INT NOT NULL,
          action_id INT NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (page_id) REFERENCES system_pages(id),
          FOREIGN KEY (action_id) REFERENCES system_actions(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS roles (
          id INT PRIMARY KEY AUTO_INCREMENT,
          role_key VARCHAR(100) NOT NULL UNIQUE,
          role_name VARCHAR(200) NOT NULL,
          description TEXT,
          is_system_role BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS role_permissions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          role_id INT NOT NULL,
          permission_id INT NOT NULL,
          granted BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by INT NULL,
          UNIQUE KEY unique_role_permission (role_id, permission_id),
          FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
          FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS user_roles (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          role_id INT NOT NULL,
          granted_by INT NULL,
          granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NULL,
          is_active BOOLEAN DEFAULT TRUE,
          notes TEXT,
          UNIQUE KEY unique_user_role (user_id, role_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS user_permissions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          permission_id INT NOT NULL,
          granted BOOLEAN DEFAULT TRUE,
          granted_by INT NULL,
          granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NULL,
          reason TEXT,
          UNIQUE KEY unique_user_permission (user_id, permission_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS access_audit_log (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          action VARCHAR(200) NOT NULL,
          resource_type VARCHAR(100) NULL,
          resource_id INT NULL,
          result ENUM('success', 'denied', 'error') NOT NULL,
          ip_address VARCHAR(45) NULL,
          user_agent TEXT NULL,
          request_path VARCHAR(500) NULL,
          request_method VARCHAR(10) NULL,
          error_message TEXT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS user_activity_stats (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          stat_date DATE NOT NULL,
          tasks_completed INT DEFAULT 0,
          clients_managed INT DEFAULT 0,
          services_completed INT DEFAULT 0,
          login_count INT DEFAULT 0,
          actions_performed INT DEFAULT 0,
          last_login TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_date (user_id, stat_date),
          FOREIGN KEY (user_id) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    " "Migración 011 - Sistema de permisos"

    # ============================================
    # MIGRACIÓN 012: Workspaces
    # ============================================
    apply_migration "$db" "
        CREATE TABLE IF NOT EXISTS workspaces (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          slug VARCHAR(100) NOT NULL UNIQUE,
          description TEXT NULL,
          color VARCHAR(7) DEFAULT '#3b82f6',
          icon VARCHAR(50) DEFAULT 'building',
          is_active BOOLEAN DEFAULT TRUE,
          is_default BOOLEAN DEFAULT FALSE,
          created_by_user_id INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_workspaces_slug (slug),
          INDEX idx_workspaces_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        CREATE TABLE IF NOT EXISTS user_workspaces (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          workspace_id INT NOT NULL,
          role_in_workspace ENUM('owner', 'admin', 'member', 'viewer') DEFAULT 'member',
          is_primary BOOLEAN DEFAULT FALSE,
          assigned_by_user_id INT NULL,
          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_workspace (user_id, workspace_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
          INDEX idx_user_workspaces_user (user_id),
          INDEX idx_user_workspaces_workspace (workspace_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

        -- Agregar workspace_id a tablas existentes
        ALTER TABLE clients_profiles ADD COLUMN IF NOT EXISTS workspace_id INT NULL;
        ALTER TABLE services ADD COLUMN IF NOT EXISTS workspace_id INT NULL, ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT FALSE;
        ALTER TABLE monthly_invoices ADD COLUMN IF NOT EXISTS workspace_id INT NULL;
        ALTER TABLE monthly_service_checklist ADD COLUMN IF NOT EXISTS workspace_id INT NULL;
        ALTER TABLE expenses ADD COLUMN IF NOT EXISTS workspace_id INT NULL, ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE;
        ALTER TABLE service_operational_costs ADD COLUMN IF NOT EXISTS workspace_id INT NULL;
        ALTER TABLE client_pool ADD COLUMN IF NOT EXISTS workspace_id INT NULL;
        ALTER TABLE client_services ADD COLUMN IF NOT EXISTS workspace_id INT NULL;
        ALTER TABLE service_bundles ADD COLUMN IF NOT EXISTS workspace_id INT NULL;
        ALTER TABLE client_infractions ADD COLUMN IF NOT EXISTS workspace_id INT NULL;
        ALTER TABLE client_omisos ADD COLUMN IF NOT EXISTS workspace_id INT NULL;

        -- Crear workspace por defecto
        INSERT INTO workspaces (name, slug, description, is_default, color, icon)
        SELECT 'General', 'general', 'Workspace principal', TRUE, '#3b82f6', 'globe'
        WHERE NOT EXISTS (SELECT 1 FROM workspaces WHERE slug = 'general');
    " "Migración 012 - Sistema de workspaces"

    echo ""
    echo "Base de datos $db migrada exitosamente!"
done

echo ""
echo "==========================================="
echo "TODAS LAS MIGRACIONES COMPLETADAS"
echo "==========================================="
