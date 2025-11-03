-- Migración: Agregar asignación de clientes a empleados/admins

-- Agregar columna assigned_to_user_id a la tabla users
-- Esto permitirá que cada cliente esté asignado a un admin o employee
ALTER TABLE users
ADD COLUMN assigned_to_user_id INT NULL,
ADD CONSTRAINT fk_users_assigned_to
  FOREIGN KEY (assigned_to_user_id)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- Crear índice para mejorar performance en consultas de clientes asignados
CREATE INDEX idx_users_assigned_to ON users(assigned_to_user_id);

-- Comentarios para documentación
-- assigned_to_user_id: ID del admin o employee que tiene asignado este cliente
-- NULL = cliente no asignado aún
-- Solo aplica para users con role='client'
