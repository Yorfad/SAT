-- ============================================
-- Migración 014: Sistema de Códigos de Invitación
-- ============================================
-- Permite a contadores generar códigos/links para que
-- sus clientes se auto-registren en el workspace correcto
-- ============================================

-- ============================================
-- 1. TABLA: invitation_codes
-- ============================================

CREATE TABLE IF NOT EXISTS invitation_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Código único (ej: SAT-X7K9M2)
  code VARCHAR(20) NOT NULL UNIQUE,

  -- A qué workspace pertenece (cada BD es un tenant)
  workspace_id INT NULL,

  -- Configuración de uso
  expires_at DATETIME NULL,
  max_uses INT NULL COMMENT 'NULL = ilimitado',
  uses_count INT DEFAULT 0,

  -- Configuración de aprobación
  auto_approve BOOLEAN DEFAULT FALSE COMMENT 'Si TRUE, el cliente queda activo inmediatamente',

  -- Servicios a asignar automáticamente (IDs separados por coma o JSON)
  default_services JSON NULL COMMENT 'Array de service_ids a asignar al registrarse',

  -- Campos requeridos en el formulario de registro
  -- Cada contador puede decidir qué pedir
  required_fields JSON NOT NULL DEFAULT '["nit", "full_name", "password"]',
  -- Opciones: nit, full_name, email, phone_number, address, birth_date, business_name, tax_regime

  -- Campos opcionales que se muestran pero no son obligatorios
  optional_fields JSON NULL DEFAULT '["email", "phone_number"]',

  -- Nombre/descripción para identificar el código
  name VARCHAR(100) NULL COMMENT 'Nombre descriptivo para el admin',
  description TEXT NULL,

  -- Estado
  is_active BOOLEAN DEFAULT TRUE,

  -- Auditoría
  created_by_user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_invitation_code (code),
  INDEX idx_invitation_active (is_active, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 2. TABLA: invitation_code_uses (Registro de usos)
-- ============================================

CREATE TABLE IF NOT EXISTS invitation_code_uses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invitation_code_id INT NOT NULL,
  registered_user_id INT NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,

  FOREIGN KEY (invitation_code_id) REFERENCES invitation_codes(id) ON DELETE CASCADE,
  FOREIGN KEY (registered_user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_code_uses (invitation_code_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- 3. MODIFICAR users para tracking de invitación
-- ============================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS registered_via_invitation_id INT NULL,
  ADD COLUMN IF NOT EXISTS registration_ip VARCHAR(45) NULL,
  ADD CONSTRAINT fk_user_invitation
    FOREIGN KEY (registered_via_invitation_id)
    REFERENCES invitation_codes(id)
    ON DELETE SET NULL;


-- ============================================
-- FIN DE MIGRACIÓN 014
-- ============================================
