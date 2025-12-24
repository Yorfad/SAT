-- Migración: Agregar rol superadmin
-- Este rol es para el administrador principal del sistema
-- que tiene acceso total y no aparece en la lista de usuarios

-- Modificar el ENUM de roles para incluir superadmin
ALTER TABLE users MODIFY COLUMN role ENUM('client', 'admin', 'employee', 'superadmin') NOT NULL;

-- Actualizar el usuario ID 1 a superadmin
UPDATE users SET role = 'superadmin' WHERE id = 1;
