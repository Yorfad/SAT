-- ============================================
-- Migración 024: Agregar código de registro a workspaces
-- ============================================
-- Cada workspace tiene su propio código de 4 dígitos
-- para que los clientes se registren directamente
-- ============================================

-- Agregar columnas a workspaces
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS registration_code VARCHAR(4) NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS auto_approve_registration BOOLEAN DEFAULT FALSE;

-- Generar códigos únicos para workspaces existentes
-- Nota: Esto debe ejecutarse después de agregar la columna

-- Actualizar workspace 'general' con un código fijo para facilidad
UPDATE workspaces SET registration_code = '1001' WHERE slug = 'general' AND registration_code IS NULL;

-- Generar códigos aleatorios para otros workspaces sin código
-- Esta parte puede requerir ejecución manual en un script
-- ya que SQL no tiene fácilmente generación de aleatorios únicos garantizados

-- ============================================
-- FIN DE MIGRACIÓN 024
-- ============================================
