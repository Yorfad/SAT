# Sistema de Roles y Permisos (RBAC)

## Resumen

Sistema completo de control de acceso basado en roles (RBAC) con:
- Roles personalizados creados por admin
- Permisos granulares (página × acción)
- Permisos directos por usuario (sobrescriben roles)
- Matriz visual de permisos
- Auditoría de accesos
- Soporte para expiración de permisos

## Casos de Uso

- Paneles administrativos con múltiples niveles de acceso
- Sistemas donde el cliente necesita crear sus propios roles
- Aplicaciones con módulos que requieren permisos específicos
- Sistemas multi-tenant con roles por workspace

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    MATRIZ DE PERMISOS                           │
│  ┌─────────────┬────────┬────────┬────────┬────────┬────────┐  │
│  │   Página    │  Ver   │ Crear  │ Editar │Eliminar│ Asignar│  │
│  ├─────────────┼────────┼────────┼────────┼────────┼────────┤  │
│  │ Dashboard   │   ✓    │   -    │   -    │   -    │   -    │  │
│  │ Clientes    │   ✓    │   ✓    │   ✓    │   ✓    │   ✓    │  │
│  │ Servicios   │   ✓    │   ✓    │   ✓    │   ✓    │   -    │  │
│  │ Reportes    │   ✓    │   -    │   -    │   -    │   -    │  │
│  └─────────────┴────────┴────────┴────────┴────────┴────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HERENCIA DE PERMISOS                         │
│                                                                 │
│  Usuario ←── Permiso Directo (sobrescribe)                      │
│     │                                                           │
│     └── Rol 1 ←── Permisos del Rol 1                           │
│     │                                                           │
│     └── Rol 2 ←── Permisos del Rol 2                           │
│                                                                 │
│  Permiso efectivo = Directo > Rol (OR entre roles)             │
└─────────────────────────────────────────────────────────────────┘
```

## Modelo de Datos

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  system_pages    │     │  system_actions  │     │   permissions    │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id               │     │ id               │     │ id               │
│ page_key         │────┐│ action_key       │────┐│ permission_key   │
│ page_name        │    ││ action_name      │    ││ page_id ─────────┘
│ description      │    │└──────────────────┘    ││ action_id ───────┘
│ display_order    │    │                        │└──────────────────┘
└──────────────────┘    │                        │
                        │                        │
┌──────────────────┐    │  ┌──────────────────┐  │  ┌──────────────────┐
│     roles        │    │  │ role_permissions │  │  │   user_roles     │
├──────────────────┤    │  ├──────────────────┤  │  ├──────────────────┤
│ id               │───────│ role_id          │  │  │ user_id          │
│ role_key         │    │  │ permission_id ───────┘  │ role_id ─────────┘
│ role_name        │    │  │ granted          │     │ granted_by       │
│ is_system_role   │    │  └──────────────────┘     │ expires_at       │
└──────────────────┘    │                           └──────────────────┘
                        │
                        │  ┌──────────────────┐
                        │  │ user_permissions │
                        │  ├──────────────────┤
                        └──│ user_id          │
                           │ permission_id    │
                           │ granted          │  ← Sobrescribe rol
                           │ expires_at       │
                           └──────────────────┘
```

---

## Implementación

### 1. Migración SQL

```sql
-- =====================================================
-- Sistema RBAC: Roles y Permisos Granulares
-- =====================================================

-- Catálogo de páginas/módulos del sistema
CREATE TABLE IF NOT EXISTS system_pages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  page_key VARCHAR(100) NOT NULL UNIQUE,
  page_name VARCHAR(200) NOT NULL,
  description TEXT,
  parent_page_id INT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_page_id) REFERENCES system_pages(id),
  INDEX idx_page_key (page_key)
);

-- Catálogo de acciones
CREATE TABLE IF NOT EXISTS system_actions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action_key VARCHAR(100) NOT NULL UNIQUE,
  action_name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action_key (action_key)
);

-- Permisos: combinación de página + acción
CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permission_key VARCHAR(200) NOT NULL UNIQUE, -- Formato: page:action
  page_id INT NOT NULL,
  action_id INT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES system_pages(id),
  FOREIGN KEY (action_id) REFERENCES system_actions(id),
  UNIQUE KEY unique_page_action (page_id, action_id)
);

-- Roles personalizados
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_key VARCHAR(100) NOT NULL UNIQUE,
  role_name VARCHAR(200) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE, -- No se puede eliminar
  is_active BOOLEAN DEFAULT TRUE,
  created_in_workspace_id INT NULL, -- Para roles por workspace
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Permisos asignados a roles
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted BOOLEAN DEFAULT TRUE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_role_permission (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Roles asignados a usuarios
CREATE TABLE IF NOT EXISTS user_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  granted_by INT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL, -- NULL = permanente
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  UNIQUE KEY unique_user_role (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, is_active, expires_at)
);

-- Permisos directos por usuario (sobrescriben roles)
CREATE TABLE IF NOT EXISTS user_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted BOOLEAN DEFAULT TRUE, -- FALSE = denegar explícitamente
  granted_by INT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  reason TEXT,
  UNIQUE KEY unique_user_permission (user_id, permission_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Auditoría de accesos
CREATE TABLE IF NOT EXISTS access_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  action VARCHAR(200) NOT NULL,
  resource_type VARCHAR(100) NULL,
  resource_id INT NULL,
  result ENUM('success', 'denied', 'error') NOT NULL,
  ip_address VARCHAR(45) NULL,
  request_path VARCHAR(500) NULL,
  request_method VARCHAR(10) NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_action (user_id, action),
  INDEX idx_timestamp (created_at)
);

-- Vista para permisos efectivos de usuario
CREATE OR REPLACE VIEW v_user_effective_permissions AS
SELECT DISTINCT
  u.id as user_id,
  p.permission_key,
  sp.page_name,
  sa.action_name,
  COALESCE(up.granted, rp.granted, FALSE) as is_granted,
  CASE
    WHEN up.id IS NOT NULL THEN 'direct'
    WHEN rp.id IS NOT NULL THEN 'role'
    ELSE 'none'
  END as grant_source,
  r.role_name as source_role
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
  AND ur.is_active = TRUE
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
LEFT JOIN roles r ON r.id = ur.role_id AND r.is_active = TRUE
LEFT JOIN role_permissions rp ON rp.role_id = r.id
LEFT JOIN permissions p ON p.id = rp.permission_id
  OR p.id IN (SELECT permission_id FROM user_permissions WHERE user_id = u.id)
LEFT JOIN user_permissions up ON up.user_id = u.id
  AND up.permission_id = p.id
  AND (up.expires_at IS NULL OR up.expires_at > NOW())
LEFT JOIN system_pages sp ON sp.id = p.page_id
LEFT JOIN system_actions sa ON sa.id = p.action_id
WHERE u.is_active = TRUE AND p.is_active = TRUE;

-- Datos iniciales
INSERT IGNORE INTO system_pages (page_key, page_name, display_order) VALUES
  ('dashboard', 'Dashboard', 1),
  ('clients', 'Clientes', 2),
  ('services', 'Servicios', 3),
  ('tasks', 'Tareas', 4),
  ('invoices', 'Facturas', 5),
  ('reports', 'Reportes', 6),
  ('users', 'Usuarios', 7),
  ('roles', 'Roles', 8),
  ('settings', 'Configuración', 9);

INSERT IGNORE INTO system_actions (action_key, action_name) VALUES
  ('view', 'Ver'),
  ('list', 'Listar'),
  ('create', 'Crear'),
  ('edit', 'Editar'),
  ('delete', 'Eliminar'),
  ('assign', 'Asignar'),
  ('export', 'Exportar'),
  ('manage', 'Gestionar');

-- Generar permisos automáticamente
INSERT IGNORE INTO permissions (permission_key, page_id, action_id, description)
SELECT
  CONCAT(p.page_key, ':', a.action_key),
  p.id,
  a.id,
  CONCAT(a.action_name, ' en ', p.page_name)
FROM system_pages p
CROSS JOIN system_actions a
WHERE a.action_key IN ('view', 'list', 'create', 'edit', 'delete');

-- Roles del sistema
INSERT IGNORE INTO roles (role_key, role_name, description, is_system_role) VALUES
  ('admin', 'Administrador', 'Acceso completo', TRUE),
  ('manager', 'Gerente', 'Gestión de equipo', TRUE),
  ('employee', 'Empleado', 'Acceso limitado', TRUE),
  ('client', 'Cliente', 'Solo lectura de su info', TRUE);

-- Admin tiene todos los permisos
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted)
SELECT r.id, p.id, TRUE
FROM roles r CROSS JOIN permissions p
WHERE r.role_key = 'admin';
```

### 2. Middleware de Autorización

```typescript
// middleware/rbac.ts

import { Request, Response, NextFunction } from "express";

/**
 * Middleware básico: verificar que el usuario tenga uno de los roles especificados
 */
export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;

    // Superadmin tiene acceso total
    if (userRole === 'superadmin') return next();

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    next();
  };
}

/**
 * Middleware avanzado: verificar permiso específico (página:acción)
 */
export function requirePermission(permissionKey: string) {
  return async (req: any, res: Response, next: NextFunction) => {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({ message: "No autenticado" });
    }

    // Superadmin tiene acceso total
    if (req.user?.role === 'superadmin') return next();

    try {
      // Verificar permiso efectivo
      const [permissions]: any = await req.db.query(
        `SELECT is_granted FROM v_user_effective_permissions
         WHERE user_id = ? AND permission_key = ? AND is_granted = TRUE`,
        [userId, permissionKey]
      );

      if (permissions.length === 0) {
        // Registrar intento denegado
        await req.db.query(
          `INSERT INTO access_audit_log (user_id, action, result, request_path, request_method)
           VALUES (?, ?, 'denied', ?, ?)`,
          [userId, permissionKey, req.path, req.method]
        );

        return res.status(403).json({
          message: "Permiso denegado",
          required_permission: permissionKey
        });
      }

      next();
    } catch (error) {
      console.error('Error verificando permiso:', error);
      res.status(500).json({ message: "Error de autorización" });
    }
  };
}

/**
 * Helper: verificar permiso sin bloquear (retorna booleano)
 */
export async function hasPermission(
  db: any,
  userId: number,
  permissionKey: string
): Promise<boolean> {
  const [result]: any = await db.query(
    `SELECT is_granted FROM v_user_effective_permissions
     WHERE user_id = ? AND permission_key = ? AND is_granted = TRUE`,
    [userId, permissionKey]
  );
  return result.length > 0;
}
```

### 3. Controller de Roles y Permisos

```typescript
// controllers/roles-permissions.controller.ts

import { RequestHandler } from 'express';

/**
 * GET /api/roles
 * Listar todos los roles
 */
export const listRoles: RequestHandler = async (req: any, res: any) => {
  try {
    const [roles]: any = await req.db.query(`
      SELECT
        r.*,
        COUNT(DISTINCT rp.permission_id) as permissions_count,
        COUNT(DISTINCT ur.user_id) as users_count
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN user_roles ur ON ur.role_id = r.id AND ur.is_active = TRUE
      WHERE r.is_active = TRUE
      GROUP BY r.id
      ORDER BY r.is_system_role DESC, r.role_name ASC
    `);

    res.json({ roles });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener roles' });
  }
};

/**
 * POST /api/roles
 * Crear nuevo rol
 */
export const createRole: RequestHandler = async (req: any, res: any) => {
  const { role_key, role_name, description, permissions = [] } = req.body;

  if (!role_key || !role_name) {
    return res.status(400).json({ message: 'role_key y role_name requeridos' });
  }

  try {
    // Verificar unicidad
    const [existing]: any = await req.db.query(
      'SELECT id FROM roles WHERE role_key = ?',
      [role_key]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'role_key ya existe' });
    }

    // Crear rol
    const [result]: any = await req.db.query(
      `INSERT INTO roles (role_key, role_name, description, is_system_role)
       VALUES (?, ?, ?, FALSE)`,
      [role_key, role_name, description || null]
    );

    const newRoleId = result.insertId;

    // Asignar permisos
    for (const permissionId of permissions) {
      await req.db.query(
        `INSERT INTO role_permissions (role_id, permission_id, granted, created_by)
         VALUES (?, ?, TRUE, ?)`,
        [newRoleId, permissionId, req.user.sub]
      );
    }

    res.status(201).json({
      message: 'Rol creado',
      role_id: newRoleId
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear rol' });
  }
};

/**
 * PUT /api/roles/:id
 * Actualizar rol
 */
export const updateRole: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const { role_name, description, is_active } = req.body;

  try {
    // Verificar que existe y no es del sistema
    const [roles]: any = await req.db.query(
      'SELECT is_system_role FROM roles WHERE id = ?',
      [id]
    );

    if (roles.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    if (roles[0].is_system_role) {
      return res.status(400).json({ message: 'No se puede editar rol del sistema' });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (role_name !== undefined) {
      updates.push('role_name = ?');
      params.push(role_name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Nada que actualizar' });
    }

    params.push(id);
    await req.db.query(
      `UPDATE roles SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    res.json({ message: 'Rol actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar rol' });
  }
};

/**
 * DELETE /api/roles/:id
 * Eliminar rol
 */
export const deleteRole: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const [roles]: any = await req.db.query(
      'SELECT is_system_role FROM roles WHERE id = ?',
      [id]
    );

    if (roles.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    if (roles[0].is_system_role) {
      return res.status(400).json({ message: 'No se puede eliminar rol del sistema' });
    }

    await req.db.query('DELETE FROM roles WHERE id = ?', [id]);
    res.json({ message: 'Rol eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar rol' });
  }
};

/**
 * GET /api/permissions
 * Listar permisos agrupados por página
 */
export const listPermissions: RequestHandler = async (req: any, res: any) => {
  try {
    const [permissions]: any = await req.db.query(`
      SELECT
        p.id,
        p.permission_key,
        sp.page_key,
        sp.page_name,
        sa.action_key,
        sa.action_name
      FROM permissions p
      JOIN system_pages sp ON sp.id = p.page_id
      JOIN system_actions sa ON sa.id = p.action_id
      WHERE p.is_active = TRUE
      ORDER BY sp.display_order, sp.page_name, sa.action_name
    `);

    // Agrupar por página
    const grouped: Record<string, any> = {};
    permissions.forEach((p: any) => {
      if (!grouped[p.page_key]) {
        grouped[p.page_key] = {
          page_key: p.page_key,
          page_name: p.page_name,
          permissions: []
        };
      }
      grouped[p.page_key].permissions.push({
        id: p.id,
        permission_key: p.permission_key,
        action_key: p.action_key,
        action_name: p.action_name
      });
    });

    res.json({ permissions: Object.values(grouped) });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener permisos' });
  }
};

/**
 * GET /api/roles/:id/matrix
 * Obtener matriz de permisos para un rol
 */
export const getRolePermissionMatrix: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const [roles]: any = await req.db.query(
      'SELECT id, role_name FROM roles WHERE id = ?',
      [id]
    );

    if (roles.length === 0) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    const [pages]: any = await req.db.query(`
      SELECT id, page_key, page_name FROM system_pages
      WHERE is_active = TRUE ORDER BY display_order
    `);

    const [actions]: any = await req.db.query(`
      SELECT id, action_key, action_name FROM system_actions
      WHERE is_active = TRUE ORDER BY action_name
    `);

    const [rolePermissions]: any = await req.db.query(`
      SELECT p.id, p.page_id, p.action_id, COALESCE(rp.granted, FALSE) as granted
      FROM permissions p
      LEFT JOIN role_permissions rp ON rp.permission_id = p.id AND rp.role_id = ?
      WHERE p.is_active = TRUE
    `, [id]);

    // Crear mapa de permisos
    const permMap: Record<string, any> = {};
    rolePermissions.forEach((rp: any) => {
      permMap[`${rp.page_id}:${rp.action_id}`] = {
        permission_id: rp.id,
        granted: rp.granted === 1 || rp.granted === true
      };
    });

    // Construir matriz
    const matrix = pages.map((page: any) => ({
      page_id: page.id,
      page_key: page.page_key,
      page_name: page.page_name,
      actions: actions.map((action: any) => {
        const perm = permMap[`${page.id}:${action.id}`];
        return {
          action_id: action.id,
          action_key: action.action_key,
          action_name: action.action_name,
          permission_id: perm?.permission_id || null,
          granted: perm?.granted || false
        };
      })
    }));

    res.json({ role: roles[0], matrix, actions });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener matriz' });
  }
};

/**
 * PUT /api/roles/:id/matrix
 * Actualizar matriz de permisos
 */
export const updateRolePermissionMatrix: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const { permissions } = req.body; // [{ permission_id, granted }]

  if (!Array.isArray(permissions)) {
    return res.status(400).json({ message: 'permissions debe ser array' });
  }

  try {
    // Eliminar permisos anteriores
    await req.db.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

    // Insertar nuevos (solo granted = true)
    const granted = permissions.filter((p: any) => p.granted && p.permission_id);

    for (const perm of granted) {
      await req.db.query(
        `INSERT INTO role_permissions (role_id, permission_id, granted, created_by)
         VALUES (?, ?, TRUE, ?)`,
        [id, perm.permission_id, req.user.sub]
      );
    }

    res.json({
      message: 'Permisos actualizados',
      updated_count: granted.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar permisos' });
  }
};

/**
 * POST /api/users/:userId/roles
 * Asignar rol a usuario
 */
export const assignRoleToUser: RequestHandler = async (req: any, res: any) => {
  const { userId } = req.params;
  const { role_id, expires_at, notes } = req.body;

  try {
    await req.db.query(
      `INSERT INTO user_roles (user_id, role_id, granted_by, expires_at, notes, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE
         granted_by = VALUES(granted_by),
         expires_at = VALUES(expires_at),
         notes = VALUES(notes),
         is_active = TRUE`,
      [userId, role_id, req.user.sub, expires_at || null, notes || null]
    );

    res.json({ message: 'Rol asignado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al asignar rol' });
  }
};

/**
 * GET /api/users/:userId/effective-permissions
 * Obtener permisos efectivos de usuario
 */
export const getUserEffectivePermissions: RequestHandler = async (req: any, res: any) => {
  const { userId } = req.params;

  try {
    const [permissions]: any = await req.db.query(
      `SELECT * FROM v_user_effective_permissions
       WHERE user_id = ? ORDER BY page_name, action_name`,
      [userId]
    );

    // Agrupar por página
    const grouped: Record<string, any> = {};
    permissions.forEach((p: any) => {
      const pageKey = p.permission_key.split(':')[0];
      if (!grouped[pageKey]) {
        grouped[pageKey] = { page_name: p.page_name, permissions: [] };
      }
      grouped[pageKey].permissions.push({
        permission_key: p.permission_key,
        action_name: p.action_name,
        is_granted: p.is_granted,
        grant_source: p.grant_source,
        source_role: p.source_role
      });
    });

    res.json({ user_id: parseInt(userId), permissions: grouped });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener permisos' });
  }
};
```

### 4. Rutas

```typescript
// routes/roles-permissions.routes.ts

import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import * as ctrl from "../controllers/roles-permissions.controller";

const router = Router();
router.use(authenticateToken);
router.use(requireRoles("admin", "superadmin"));

// Roles
router.get("/roles", ctrl.listRoles);
router.post("/roles", ctrl.createRole);
router.put("/roles/:id", ctrl.updateRole);
router.delete("/roles/:id", ctrl.deleteRole);

// Permisos
router.get("/permissions", ctrl.listPermissions);

// Matriz de permisos por rol
router.get("/roles/:id/matrix", ctrl.getRolePermissionMatrix);
router.put("/roles/:id/matrix", ctrl.updateRolePermissionMatrix);

// Asignación de roles a usuarios
router.post("/users/:userId/roles", ctrl.assignRoleToUser);
router.get("/users/:userId/effective-permissions", ctrl.getUserEffectivePermissions);

export default router;
```

---

## Uso en Rutas Protegidas

```typescript
// Ejemplo: proteger endpoint con permiso específico
import { requirePermission } from '../middleware/rbac';

router.get('/clients',
  requirePermission('clients:list'),
  listClients
);

router.post('/clients',
  requirePermission('clients:create'),
  createClient
);

router.delete('/clients/:id',
  requirePermission('clients:delete'),
  deleteClient
);
```

---

## Componente Frontend (React)

```tsx
// components/PermissionMatrix.tsx
import { useState } from 'react';

interface MatrixProps {
  roleId: number;
  matrix: Array<{
    page_id: number;
    page_name: string;
    actions: Array<{
      action_id: number;
      action_name: string;
      permission_id: number;
      granted: boolean;
    }>;
  }>;
  actions: Array<{ action_id: number; action_name: string }>;
  onSave: (permissions: Array<{ permission_id: number; granted: boolean }>) => void;
}

export function PermissionMatrix({ roleId, matrix, actions, onSave }: MatrixProps) {
  const [permissions, setPermissions] = useState(() => {
    const map: Record<number, boolean> = {};
    matrix.forEach(page => {
      page.actions.forEach(action => {
        if (action.permission_id) {
          map[action.permission_id] = action.granted;
        }
      });
    });
    return map;
  });

  const toggle = (permissionId: number) => {
    setPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  const handleSave = () => {
    const perms = Object.entries(permissions).map(([id, granted]) => ({
      permission_id: parseInt(id),
      granted
    }));
    onSave(perms);
  };

  return (
    <div>
      <table className="permission-matrix">
        <thead>
          <tr>
            <th>Página</th>
            {actions.map(a => (
              <th key={a.action_id}>{a.action_name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map(page => (
            <tr key={page.page_id}>
              <td>{page.page_name}</td>
              {page.actions.map(action => (
                <td key={action.action_id}>
                  {action.permission_id ? (
                    <input
                      type="checkbox"
                      checked={permissions[action.permission_id] || false}
                      onChange={() => toggle(action.permission_id)}
                    />
                  ) : (
                    <span>-</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleSave}>Guardar Permisos</button>
    </div>
  );
}
```

---

## Checklist de Implementación

- [ ] Crear tablas: system_pages, system_actions, permissions
- [ ] Crear tablas: roles, role_permissions
- [ ] Crear tablas: user_roles, user_permissions
- [ ] Crear tabla: access_audit_log (opcional)
- [ ] Crear vista: v_user_effective_permissions
- [ ] Insertar páginas y acciones iniciales
- [ ] Generar permisos (combinaciones página × acción)
- [ ] Crear roles del sistema (admin, employee, etc.)
- [ ] Copiar middleware rbac.ts
- [ ] Copiar controller y rutas
- [ ] Implementar matriz de permisos en frontend
- [ ] Probar asignación de roles y permisos

---

## Notas para Claude

**Para implementar en otro proyecto:**

1. Identificar las páginas/módulos del sistema
2. Definir las acciones posibles (view, create, edit, delete, etc.)
3. Ejecutar migración SQL adaptada
4. Copiar middleware y controller
5. Adaptar las páginas en `system_pages` a tu aplicación
6. Crear los roles iniciales según necesidad

**Consideraciones:**
- Superadmin siempre tiene acceso total (hardcodeado en middleware)
- Los permisos directos de usuario sobrescriben los de rol
- Los roles del sistema (`is_system_role = TRUE`) no se pueden eliminar
- La vista `v_user_effective_permissions` calcula permisos en tiempo real
