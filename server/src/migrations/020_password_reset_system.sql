-- Migración 020: Sistema de Restablecimiento de Contraseñas
-- Agrega soporte para:
-- 1. Contraseñas temporales que obligan a cambiar al primer login
-- 2. Restablecimiento por email con token
-- 3. Historial de cambios de contraseña

-- ============================================
-- 1. CAMPOS EN TABLA USERS
-- ============================================

-- Campo para marcar que la contraseña es temporal y debe cambiarse
ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE;

-- Token para restablecimiento por email
ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL;

-- Expiración del token (24 horas normalmente)
ALTER TABLE users ADD COLUMN password_reset_expires DATETIME NULL;

-- Fecha del último cambio de contraseña
ALTER TABLE users ADD COLUMN password_changed_at DATETIME NULL;

-- Índice para buscar por token
CREATE INDEX idx_users_reset_token ON users(password_reset_token);

-- ============================================
-- 2. TABLA DE HISTORIAL DE CONTRASEÑAS
-- ============================================

CREATE TABLE IF NOT EXISTS password_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action ENUM('reset_by_admin', 'reset_by_email', 'changed_by_user', 'first_login_change') NOT NULL,
  performed_by INT NULL COMMENT 'ID del admin que realizó el reset, NULL si fue el propio usuario',
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- 3. CONFIGURACIÓN DE EMAIL PARA RESET
-- ============================================

-- Agregar configuración de email en tenant_settings si no existe
INSERT IGNORE INTO tenant_settings (setting_key, value, description) VALUES
  ('smtp_host', '', 'Host del servidor SMTP'),
  ('smtp_port', '587', 'Puerto del servidor SMTP'),
  ('smtp_user', '', 'Usuario SMTP'),
  ('smtp_password', '', 'Contraseña SMTP (encriptada)'),
  ('smtp_from_email', '', 'Email del remitente'),
  ('smtp_from_name', '', 'Nombre del remitente'),
  ('password_reset_expiry_hours', '24', 'Horas de validez del token de reset');

-- ============================================
-- 4. ACTUALIZAR CLIENTES EXISTENTES
-- ============================================

-- Marcar que los clientes existentes ya tienen contraseña establecida
UPDATE users SET must_change_password = FALSE WHERE role = 'client';

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
