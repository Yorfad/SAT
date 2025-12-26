# Sistema de Columnas Dinámicas para Entidades

## Resumen

Sistema que permite a administradores crear, modificar y eliminar campos personalizados en una tabla de base de datos **sin intervención del programador**. Los campos se convierten en columnas reales de la tabla (no EAV), lo que mantiene el rendimiento y permite queries directas.

## Casos de Uso

- Paneles de administración donde el cliente necesita agregar campos a formularios
- Sistemas multi-tenant donde cada tenant puede tener campos diferentes
- CRMs, sistemas de gestión de clientes, inventarios, etc.
- Cualquier entidad que requiera campos personalizables por el usuario final

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Lista de Campos │  │ Crear Campo     │  │ Editar Campo    │  │
│  │ (drag & drop)   │  │ (nombre, tipo)  │  │ (config)        │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼─────────────────────┼─────────────────────┼──────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API REST                                 │
│  GET /fields      POST /fields      PATCH /fields/:id           │
│  GET /fields/all  DELETE /fields/:id  POST /fields/reorder      │
│  GET /columns     POST /sync                                     │
└───────────┬─────────────────────┬─────────────────────┬──────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CONTROLLER                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  CREATE → ALTER TABLE ADD COLUMN                         │    │
│  │  DELETE → ALTER TABLE DROP COLUMN                        │    │
│  │  UPDATE → ALTER TABLE MODIFY COLUMN (si cambia tipo)     │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────┬─────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BASE DE DATOS                             │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐   │
│  │ entity_table        │  │ entity_field_config             │   │
│  │ (columnas reales)   │  │ (metadata: label, required...)  │   │
│  └─────────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Ventajas sobre EAV (Entity-Attribute-Value)

| Aspecto | Este Sistema | EAV Tradicional |
|---------|--------------|-----------------|
| Queries | `SELECT campo FROM tabla` | JOINs complejos |
| Índices | Soportados nativamente | Difícil/imposible |
| Tipos de dato | Nativos (INT, DATE, etc.) | Todo es VARCHAR |
| Rendimiento | Excelente | Degrada con volumen |
| Validación | A nivel de BD | Solo en aplicación |

---

## Implementación

### 1. Migración SQL

```sql
-- =====================================================
-- Migración: Sistema de columnas dinámicas
-- Adaptar: Cambiar 'entity' por el nombre de tu entidad
-- =====================================================

-- Tabla de configuración de campos (metadata)
CREATE TABLE IF NOT EXISTS entity_field_config (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Para sistemas multi-tenant/workspace (opcional, puede ser NULL)
    workspace_id INT NULL,

    -- Identificador único del campo (será el nombre de la columna)
    field_key VARCHAR(50) NOT NULL,

    -- Configuración de visualización
    field_label VARCHAR(100) NOT NULL,
    field_type ENUM('text','number','email','phone','date','select','textarea','checkbox','decimal') DEFAULT 'text',
    placeholder VARCHAR(200) NULL,

    -- Reglas
    is_required TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    show_in_form TINYINT(1) DEFAULT 1,
    show_in_list TINYINT(1) DEFAULT 0,

    -- Para campos tipo 'select'
    select_options JSON NULL,

    -- Validación regex (opcional)
    validation_pattern VARCHAR(200) NULL,

    -- Orden de visualización
    display_order INT DEFAULT 0,

    -- Tracking de columna real
    column_type VARCHAR(50) DEFAULT 'VARCHAR(255)',
    column_exists TINYINT(1) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Índices
    INDEX idx_workspace_key (workspace_id, field_key),
    INDEX idx_display_order (display_order),

    -- Constraint: field_key único por workspace (NULL = global)
    UNIQUE KEY unique_field_per_workspace (workspace_id, field_key)
);

-- Tabla para tracking de columnas (opcional, útil para auditoría)
CREATE TABLE IF NOT EXISTS entity_columns_registry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    column_name VARCHAR(50) NOT NULL UNIQUE,
    column_type VARCHAR(100) NOT NULL DEFAULT 'VARCHAR(255)',
    is_system TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_user_id INT NULL
);

-- Registrar columnas del sistema que NO se pueden eliminar
INSERT INTO entity_columns_registry (column_name, column_type, is_system) VALUES
('id', 'INT AUTO_INCREMENT', 1),
('created_at', 'TIMESTAMP', 1),
('updated_at', 'TIMESTAMP', 1);
-- Agregar aquí otras columnas que deben ser protegidas
```

### 2. Controller (TypeScript/Express)

```typescript
// =====================================================
// Controller: Sistema de Columnas Dinámicas
// Archivo: controllers/dynamic-fields.controller.ts
// =====================================================

import { RequestHandler } from "express";

// ============ CONFIGURACIÓN ============

// Nombre de la tabla donde se crearán las columnas
const TARGET_TABLE = 'your_entity_table';

// Tabla de configuración de campos
const CONFIG_TABLE = 'entity_field_config';

// Columnas que NO se pueden modificar ni eliminar
const SYSTEM_COLUMNS = [
  'id',           // PK
  'user_id',      // FK (si aplica)
  'workspace_id', // FK (si aplica)
  'created_at',
  'updated_at'
];

// Mapeo de tipos de campo a tipos SQL
const FIELD_TYPE_TO_SQL: Record<string, string> = {
  'text': 'VARCHAR(255)',
  'number': 'INT',
  'email': 'VARCHAR(255)',
  'phone': 'VARCHAR(50)',
  'date': 'DATE',
  'select': 'VARCHAR(100)',
  'textarea': 'TEXT',
  'checkbox': 'TINYINT(1)',
  'decimal': 'DECIMAL(10,2)'
};

// ============ HELPERS ============

/**
 * Obtener columnas existentes de la tabla target
 */
async function getExistingColumns(db: any): Promise<string[]> {
  const [columns]: any = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [TARGET_TABLE]
  );
  return columns.map((c: any) => c.COLUMN_NAME.toLowerCase());
}

/**
 * Validar nombre de columna (solo letras, números y guión bajo)
 */
function isValidColumnName(name: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(name) && name.length <= 50;
}

/**
 * Sanitizar nombre para usarlo como columna
 */
function sanitizeColumnName(name: string): string {
  return name.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 50);
}

// ============ ENDPOINTS ============

/**
 * GET /api/fields
 * Obtener campos activos (para formularios)
 */
export const getFields: RequestHandler = async (req: any, res: any) => {
  try {
    const workspaceId = req.workspaceId || null;

    const [fields] = await req.db.query(
      `SELECT * FROM ${CONFIG_TABLE}
       WHERE (workspace_id IS NULL OR workspace_id = ?)
         AND is_active = TRUE
       ORDER BY display_order ASC`,
      [workspaceId]
    );

    res.json(fields);
  } catch (error) {
    console.error('Error obteniendo campos:', error);
    res.status(500).json({ error: 'Error al obtener campos' });
  }
};

/**
 * GET /api/fields/all
 * Obtener todos los campos (para admin, incluye inactivos)
 */
export const getAllFields: RequestHandler = async (req: any, res: any) => {
  try {
    const existingColumns = await getExistingColumns(req.db);

    const [fields] = await req.db.query(
      `SELECT * FROM ${CONFIG_TABLE}
       WHERE workspace_id IS NULL
       ORDER BY display_order ASC`
    );

    // Enriquecer con info de columna
    const enriched = (fields as any[]).map(f => ({
      ...f,
      column_exists: existingColumns.includes(f.field_key.toLowerCase()),
      is_protected: SYSTEM_COLUMNS.includes(f.field_key)
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Error obteniendo campos:', error);
    res.status(500).json({ error: 'Error al obtener campos' });
  }
};

/**
 * POST /api/fields
 * Crear nuevo campo (crea columna real en la tabla)
 */
export const createField: RequestHandler = async (req: any, res: any) => {
  const {
    fieldKey, fieldLabel, fieldType, placeholder,
    isRequired, showInForm, showInList,
    selectOptions, validationPattern
  } = req.body;

  // Sanitizar nombre de columna
  const columnName = sanitizeColumnName(fieldKey);

  if (!isValidColumnName(columnName)) {
    return res.status(400).json({
      error: 'Nombre inválido. Use solo letras, números y guión bajo.'
    });
  }

  if (SYSTEM_COLUMNS.includes(columnName)) {
    return res.status(400).json({
      error: 'No se puede usar ese nombre, es una columna del sistema.'
    });
  }

  try {
    // Verificar si la columna ya existe
    const existingColumns = await getExistingColumns(req.db);
    if (existingColumns.includes(columnName)) {
      return res.status(400).json({
        error: 'Ya existe una columna con ese nombre.'
      });
    }

    // Determinar tipo SQL
    const sqlType = FIELD_TYPE_TO_SQL[fieldType] || 'VARCHAR(255)';

    // 1. Crear la columna real
    await req.db.query(
      `ALTER TABLE ${TARGET_TABLE} ADD COLUMN \`${columnName}\` ${sqlType} NULL`
    );

    console.log(`[DYNAMIC-FIELDS] Columna creada: ${columnName} (${sqlType})`);

    // 2. Obtener orden máximo
    const [[maxOrder]]: any = await req.db.query(
      `SELECT COALESCE(MAX(display_order), 0) + 1 as next_order
       FROM ${CONFIG_TABLE} WHERE workspace_id IS NULL`
    );

    // 3. Registrar configuración
    const [result]: any = await req.db.query(
      `INSERT INTO ${CONFIG_TABLE}
       (workspace_id, field_key, field_label, field_type, placeholder,
        is_required, show_in_form, show_in_list,
        select_options, validation_pattern, display_order, column_type, column_exists)
       VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        columnName, fieldLabel, fieldType || 'text', placeholder || null,
        isRequired || false, showInForm !== false, showInList || false,
        selectOptions ? JSON.stringify(selectOptions) : null,
        validationPattern || null, maxOrder.next_order, sqlType
      ]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      columnName,
      message: `Campo "${fieldLabel}" creado. Columna agregada a la tabla.`
    });
  } catch (error: any) {
    console.error('Error creando campo:', error);
    res.status(500).json({ error: 'Error al crear campo: ' + error.message });
  }
};

/**
 * PATCH /api/fields/:id
 * Actualizar configuración de campo
 */
export const updateField: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const [[field]]: any = await req.db.query(
      `SELECT * FROM ${CONFIG_TABLE} WHERE id = ?`,
      [id]
    );

    if (!field) {
      return res.status(404).json({ error: 'Campo no encontrado' });
    }

    if (SYSTEM_COLUMNS.includes(field.field_key)) {
      // Solo permitir cambios de visualización en campos del sistema
      const allowed = ['showInList', 'showInForm', 'displayOrder', 'isActive'];
      const hasDisallowed = Object.keys(updates).some(k => !allowed.includes(k));
      if (hasDisallowed) {
        return res.status(403).json({
          error: 'Campo del sistema. Solo se puede modificar visibilidad.'
        });
      }
    }

    // Si cambia el tipo, modificar la columna
    if (updates.fieldType && updates.fieldType !== field.field_type) {
      const newSqlType = FIELD_TYPE_TO_SQL[updates.fieldType] || 'VARCHAR(255)';
      try {
        await req.db.query(
          `ALTER TABLE ${TARGET_TABLE} MODIFY COLUMN \`${field.field_key}\` ${newSqlType}`
        );
      } catch (alterError) {
        return res.status(400).json({
          error: 'No se puede cambiar el tipo. Puede haber datos incompatibles.'
        });
      }
    }

    // Construir UPDATE dinámico
    const fieldMap: Record<string, string> = {
      fieldLabel: 'field_label',
      fieldType: 'field_type',
      placeholder: 'placeholder',
      isRequired: 'is_required',
      isActive: 'is_active',
      showInForm: 'show_in_form',
      showInList: 'show_in_list',
      selectOptions: 'select_options',
      validationPattern: 'validation_pattern',
      displayOrder: 'display_order'
    };

    const setClauses: string[] = [];
    const params: any[] = [];

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        setClauses.push(`${dbField} = ?`);
        params.push(key === 'selectOptions'
          ? JSON.stringify(updates[key])
          : updates[key]);
      }
    }

    if (setClauses.length > 0) {
      params.push(id);
      await req.db.query(
        `UPDATE ${CONFIG_TABLE} SET ${setClauses.join(', ')} WHERE id = ?`,
        params
      );
    }

    res.json({ success: true, message: 'Campo actualizado' });
  } catch (error) {
    console.error('Error actualizando campo:', error);
    res.status(500).json({ error: 'Error al actualizar campo' });
  }
};

/**
 * DELETE /api/fields/:id
 * Eliminar campo (elimina columna real de la tabla)
 */
export const deleteField: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const [[field]]: any = await req.db.query(
      `SELECT * FROM ${CONFIG_TABLE} WHERE id = ?`,
      [id]
    );

    if (!field) {
      return res.status(404).json({ error: 'Campo no encontrado' });
    }

    if (SYSTEM_COLUMNS.includes(field.field_key)) {
      return res.status(403).json({
        error: 'Campo del sistema, no se puede eliminar.'
      });
    }

    // 1. Eliminar columna de la tabla
    try {
      await req.db.query(
        `ALTER TABLE ${TARGET_TABLE} DROP COLUMN \`${field.field_key}\``
      );
      console.log(`[DYNAMIC-FIELDS] Columna eliminada: ${field.field_key}`);
    } catch (alterError) {
      console.error('Error eliminando columna:', alterError);
    }

    // 2. Eliminar configuración
    await req.db.query(
      `DELETE FROM ${CONFIG_TABLE} WHERE field_key = ?`,
      [field.field_key]
    );

    res.json({
      success: true,
      message: `Campo "${field.field_label}" eliminado.`
    });
  } catch (error) {
    console.error('Error eliminando campo:', error);
    res.status(500).json({ error: 'Error al eliminar campo' });
  }
};

/**
 * POST /api/fields/reorder
 * Reordenar campos
 */
export const reorderFields: RequestHandler = async (req: any, res: any) => {
  const { orderedIds } = req.body;

  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await req.db.query(
        `UPDATE ${CONFIG_TABLE} SET display_order = ? WHERE id = ?`,
        [i, orderedIds[i]]
      );
    }

    res.json({ success: true, message: 'Campos reordenados' });
  } catch (error) {
    console.error('Error reordenando:', error);
    res.status(500).json({ error: 'Error al reordenar' });
  }
};

/**
 * GET /api/fields/columns
 * Obtener info de columnas reales de la tabla
 */
export const getTableColumns: RequestHandler = async (req: any, res: any) => {
  try {
    const [columns]: any = await req.db.query(
      `SELECT
        COLUMN_NAME as name,
        DATA_TYPE as type,
        IS_NULLABLE as nullable,
        COLUMN_DEFAULT as defaultValue,
        COLUMN_KEY as keyType
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION`,
      [TARGET_TABLE]
    );

    const enriched = columns.map((col: any) => ({
      ...col,
      isSystem: SYSTEM_COLUMNS.includes(col.name.toLowerCase())
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Error obteniendo columnas:', error);
    res.status(500).json({ error: 'Error al obtener columnas' });
  }
};

/**
 * POST /api/fields/sync
 * Sincronizar: detectar columnas sin registro en config
 */
export const syncFieldsWithColumns: RequestHandler = async (req: any, res: any) => {
  try {
    const existingColumns = await getExistingColumns(req.db);

    const [registeredFields]: any = await req.db.query(
      `SELECT field_key FROM ${CONFIG_TABLE} WHERE workspace_id IS NULL`
    );
    const registeredKeys = registeredFields.map((f: any) => f.field_key.toLowerCase());

    // Columnas sin registro
    const unregistered = existingColumns.filter(
      col => !registeredKeys.includes(col) && !SYSTEM_COLUMNS.includes(col)
    );

    let created = 0;
    for (const colName of unregistered) {
      const [[colInfo]]: any = await req.db.query(
        `SELECT DATA_TYPE, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [TARGET_TABLE, colName]
      );

      if (colInfo) {
        await req.db.query(
          `INSERT IGNORE INTO ${CONFIG_TABLE}
           (workspace_id, field_key, field_label, field_type, column_type, column_exists)
           VALUES (NULL, ?, ?, 'text', ?, TRUE)`,
          [colName, colName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), colInfo.COLUMN_TYPE]
        );
        created++;
      }
    }

    res.json({
      success: true,
      message: `${created} campos sincronizados.`,
      newFields: unregistered
    });
  } catch (error) {
    console.error('Error sincronizando:', error);
    res.status(500).json({ error: 'Error al sincronizar' });
  }
};
```

### 3. Rutas (Express)

```typescript
// routes/dynamic-fields.routes.ts
import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import {
  getFields,
  getAllFields,
  createField,
  updateField,
  deleteField,
  reorderFields,
  getTableColumns,
  syncFieldsWithColumns
} from "../controllers/dynamic-fields.controller";

const router = Router();
router.use(authenticateToken);

// Lectura (admin y usuarios)
router.get("/", getFields);
router.get("/all", requireRoles("admin"), getAllFields);
router.get("/columns", requireRoles("admin"), getTableColumns);

// Escritura (solo admin)
router.post("/", requireRoles("admin"), createField);
router.patch("/:id", requireRoles("admin"), updateField);
router.delete("/:id", requireRoles("admin"), deleteField);
router.post("/reorder", requireRoles("admin"), reorderFields);
router.post("/sync", requireRoles("admin"), syncFieldsWithColumns);

export default router;
```

---

## Extensión: Sistema Multi-Workspace

Si necesitas que cada workspace pueda personalizar los campos (herencia):

```typescript
// En createField: Solo permitir desde vista global
if (workspaceId && !req.isConsolidatedView) {
  return res.status(403).json({
    error: 'Campos solo se crean desde vista General.'
  });
}

// En updateField: Crear override por workspace
if (workspaceId && field.workspace_id === null) {
  // Es un campo global, crear override local
  await db.query(
    `INSERT INTO ${CONFIG_TABLE}
     (workspace_id, field_key, ...)
     VALUES (?, ?, ...)
     ON DUPLICATE KEY UPDATE ...`,
    [workspaceId, field.field_key, ...]
  );
}
```

---

## Componente Frontend (React)

```tsx
// components/DynamicFieldsManager.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface Field {
  id: number;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_active: boolean;
  show_in_form: boolean;
  show_in_list: boolean;
  column_exists: boolean;
  is_protected: boolean;
}

export function DynamicFieldsManager() {
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<Field | null>(null);

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['dynamic-fields'],
    queryFn: () => api.get('/fields/all').then(r => r.data)
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/fields', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dynamic-fields'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/fields/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dynamic-fields'] })
  });

  return (
    <div>
      <h2>Campos Personalizados</h2>

      {/* Lista de campos */}
      <table>
        <thead>
          <tr>
            <th>Campo</th>
            <th>Tipo</th>
            <th>Columna</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field: Field) => (
            <tr key={field.id}>
              <td>{field.field_label}</td>
              <td>{field.field_type}</td>
              <td>
                {field.column_exists ? '✅' : '❌'}
                {field.is_protected && ' 🔒'}
              </td>
              <td>
                <button onClick={() => setEditingField(field)}>Editar</button>
                {!field.is_protected && (
                  <button onClick={() => deleteMutation.mutate(field.id)}>
                    Eliminar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Formulario de creación */}
      <CreateFieldForm onSubmit={createMutation.mutate} />
    </div>
  );
}
```

---

## Checklist de Implementación

- [ ] Crear tabla de configuración (`entity_field_config`)
- [ ] Crear tabla de registro de columnas (opcional)
- [ ] Copiar y adaptar controller
- [ ] Configurar `TARGET_TABLE` y `SYSTEM_COLUMNS`
- [ ] Crear rutas
- [ ] Registrar rutas en app principal
- [ ] Crear componente frontend
- [ ] Probar: crear, editar, eliminar campos
- [ ] Verificar que columnas se crean/eliminan en BD

---

## Notas para Claude

**Para implementar en otro proyecto:**

1. Buscar este archivo en `C:\Users\chris\OneDrive\Escritorio\SAT\docs\reusable-modules\`
2. Adaptar nombres de tablas y columnas protegidas
3. Copiar migración SQL y ejecutar
4. Copiar controller, ajustar constantes
5. Crear rutas y registrar en app
6. Implementar frontend según necesidad

**Dependencias:**
- Express + TypeScript
- MySQL/MariaDB
- React + React Query (frontend)
