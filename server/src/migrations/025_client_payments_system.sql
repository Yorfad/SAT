-- ============================================
-- Migración 025: Sistema de Pagos en Efectivo
-- ============================================
-- Permite registrar cualquier pago en efectivo de cualquier cliente
-- independiente de facturas mensuales
-- ============================================

-- Agregar campo de saldo a clients_profiles
ALTER TABLE clients_profiles
  ADD COLUMN IF NOT EXISTS account_balance DECIMAL(10,2) DEFAULT 0.00
  COMMENT 'Saldo actual del cliente (positivo = a favor, negativo = debe)';

-- Tabla para registrar todos los pagos
CREATE TABLE IF NOT EXISTS client_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,

  client_user_id INT NOT NULL
  COMMENT 'ID del cliente que realizó el pago',

  workspace_id INT NOT NULL
  COMMENT 'Workspace donde se registró el pago',

  amount DECIMAL(10,2) NOT NULL
  COMMENT 'Monto del pago',

  payment_method ENUM('cash', 'transfer', 'card', 'other') DEFAULT 'cash'
  COMMENT 'Método de pago',

  payment_type ENUM('regular', 'advance', 'partial', 'debt') DEFAULT 'regular'
  COMMENT 'Tipo: regular, anticipo, parcial, abono a deuda',

  notes TEXT NULL
  COMMENT 'Notas adicionales sobre el pago',

  reference_number VARCHAR(100) NULL
  COMMENT 'Número de referencia si aplica (transferencia, etc)',

  registered_by_user_id INT NOT NULL
  COMMENT 'Usuario que registró el pago',

  balance_before DECIMAL(10,2) NOT NULL
  COMMENT 'Saldo del cliente antes del pago',

  balance_after DECIMAL(10,2) NOT NULL
  COMMENT 'Saldo del cliente después del pago',

  payment_date DATE NOT NULL
  COMMENT 'Fecha del pago',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (registered_by_user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_client (client_user_id),
  INDEX idx_workspace (workspace_id),
  INDEX idx_date (payment_date),
  INDEX idx_created (created_at)
) COMMENT='Registro de todos los pagos en efectivo de clientes';

-- ============================================
-- FIN DE MIGRACIÓN 025
-- ============================================
