# Sistema de Servicios Configurables con Recurrencia

## Resumen

Sistema completo para gestionar servicios/productos con:
- Configuración de recurrencia flexible (mensual, bimestral, trimestral, anual, personalizado)
- Generación automática de tareas/facturas
- Asignación de servicios a clientes con precios personalizados
- Soporte para servicios globales (disponibles en todos los workspaces)
- Gestión de archivos requeridos por servicio
- Notas separadas para empleados y clientes

## Casos de Uso

- Empresas de servicios contables/fiscales con obligaciones periódicas
- Sistemas de suscripciones con diferentes planes
- Gestión de mantenimientos preventivos programados
- Cualquier sistema que requiera tareas recurrentes configurables

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONFIGURACIÓN DE SERVICIO                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Servicio: "Declaración IVA"                            │   │
│  │  Precio: $100                                           │   │
│  │  Recurrencia: Mensual                                   │   │
│  │  Día de activación: 25                                  │   │
│  │  Requiere archivo: Sí (PDF de declaración)              │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ASIGNACIÓN A CLIENTES                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Cliente: "Empresa ABC"                                 │   │
│  │  Servicios:                                             │   │
│  │    - Declaración IVA ($100/mes)                         │   │
│  │    - Declaración ISR ($150/mes) ← precio custom         │   │
│  │    - Contabilidad ($200/mes)                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬─────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                GENERACIÓN AUTOMÁTICA (SCHEDULER)                │
│                                                                 │
│  Cada inicio de mes:                                            │
│  1. Obtener clientes con servicios activos                      │
│  2. Crear factura mensual para cada cliente                     │
│  3. Crear tareas (checklist) por cada servicio                  │
│  4. Las tareas aparecen en el board de los empleados            │
└─────────────────────────────────────────────────────────────────┘
```

## Modelo de Datos

```
┌──────────────────────────┐
│        services          │
├──────────────────────────┤
│ id                       │
│ workspace_id             │ ← NULL = global
│ service_name             │
│ description              │
│ default_price            │
│ operational_cost         │
│ recurrence_type          │ ← monthly, bimonthly, quarterly, etc.
│ recurrence_type_extended │ ← variable, on_demand, custom
│ recurrence_days          │ ← para recurrencia custom (JSON)
│ activation_day           │ ← día del mes que se activa (1-31)
│ activation_window_days   │ ← días de margen
│ requires_file            │
│ file_config              │ ← required, optional, not_needed
│ completion_determines_next│ ← próxima tarea basada en completar anterior
│ is_on_request            │ ← servicio bajo demanda
│ is_active                │
│ is_global                │ ← visible en todos los workspaces
│ employee_notes           │ ← notas internas para empleados
│ client_notes             │ ← notas visibles para el cliente
│ assignment_type          │ ← all_clients, selected_clients
│ visible_to_clients       │
│ allow_subscription       │
└──────────────────────────┘
            │
            │ 1:N
            ▼
┌──────────────────────────┐     ┌──────────────────────────┐
│     client_services      │     │    monthly_invoices      │
├──────────────────────────┤     ├──────────────────────────┤
│ id                       │     │ id                       │
│ client_user_id      ─────┼────►│ client_user_id           │
│ service_id               │     │ invoice_year             │
│ custom_price             │ ← precio personalizado        │ invoice_month            │
│ status                   │     │ total_due                │
│ start_date               │     │ amount_paid              │
│ end_date                 │     │ payment_status           │
└──────────────────────────┘     └──────────────────────────┘
                                              │
                                              │ 1:N
                                              ▼
                                 ┌──────────────────────────┐
                                 │ monthly_service_checklist│
                                 ├──────────────────────────┤
                                 │ id                       │
                                 │ invoice_id               │
                                 │ service_id               │
                                 │ task_name                │
                                 │ status                   │ ← pending, in_progress, completed
                                 │ assigned_to              │
                                 │ due_date                 │
                                 │ completed_at             │
                                 │ completed_by             │
                                 │ file_url                 │
                                 │ notes                    │
                                 └──────────────────────────┘
```

---

## Implementación

### 1. Migración SQL

```sql
-- =====================================================
-- Sistema de Servicios Configurables con Recurrencia
-- =====================================================

-- Tabla principal de servicios
CREATE TABLE IF NOT EXISTS services (
  id INT PRIMARY KEY AUTO_INCREMENT,

  -- Workspace (NULL = global, visible en todos)
  workspace_id INT NULL,

  -- Información básica
  service_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Precios
  default_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  operational_cost DECIMAL(10,2) DEFAULT 0,

  -- Recurrencia
  recurrence_type ENUM('monthly', 'bimonthly', 'quarterly', 'biannual', 'annual', 'custom') DEFAULT 'monthly',
  recurrence_type_extended ENUM('variable', 'on_demand', 'custom') NULL,
  recurrence_days JSON NULL COMMENT 'Para custom: [1, 15] = día 1 y 15 de cada mes',

  -- Activación
  activation_day TINYINT NULL DEFAULT 25 COMMENT 'Día del mes (1-31), NULL si completion_determines_next',
  activation_window_days TINYINT DEFAULT 7 COMMENT 'Días antes/después para completar',
  completion_determines_next BOOLEAN DEFAULT FALSE COMMENT 'Próxima tarea se crea al completar anterior',

  -- Archivos
  requires_file BOOLEAN DEFAULT TRUE,
  file_config ENUM('required', 'optional', 'not_needed') DEFAULT 'required',

  -- Opciones
  is_on_request BOOLEAN DEFAULT FALSE COMMENT 'Servicio bajo demanda (no recurrente)',
  is_active BOOLEAN DEFAULT TRUE,
  is_global BOOLEAN DEFAULT FALSE COMMENT 'Visible en todos los workspaces',

  -- Notas
  employee_notes TEXT COMMENT 'Instrucciones internas para empleados',
  client_notes TEXT COMMENT 'Descripción visible para el cliente',

  -- Asignación
  assignment_type ENUM('all_clients', 'selected_clients') DEFAULT 'selected_clients',
  visible_to_clients BOOLEAN DEFAULT TRUE,
  allow_subscription BOOLEAN DEFAULT FALSE COMMENT 'Cliente puede suscribirse solo',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_workspace (workspace_id),
  INDEX idx_active (is_active),
  INDEX idx_global (is_global),
  INDEX idx_recurrence (recurrence_type)
);

-- Servicios asignados a clientes
CREATE TABLE IF NOT EXISTS client_services (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_user_id INT NOT NULL,
  service_id INT NOT NULL,
  custom_price DECIMAL(10,2) NULL COMMENT 'Precio personalizado, NULL = usar default_price',
  status ENUM('active', 'paused', 'cancelled') DEFAULT 'active',
  start_date DATE NULL,
  end_date DATE NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_client_service (client_user_id, service_id),
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_client (client_user_id),
  INDEX idx_service (service_id),
  INDEX idx_status (status)
);

-- Facturas mensuales
CREATE TABLE IF NOT EXISTS monthly_invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_user_id INT NOT NULL,
  invoice_year SMALLINT NOT NULL,
  invoice_month TINYINT NOT NULL,
  previous_debt DECIMAL(10,2) DEFAULT 0,
  monthly_fee DECIMAL(10,2) DEFAULT 0,
  extras_fee DECIMAL(10,2) DEFAULT 0,
  total_due DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,
  payment_status ENUM('pending', 'partial', 'paid', 'overdue') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_client_month (client_user_id, invoice_year, invoice_month),
  FOREIGN KEY (client_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_client (client_user_id),
  INDEX idx_period (invoice_year, invoice_month),
  INDEX idx_status (payment_status)
);

-- Checklist de tareas mensuales
CREATE TABLE IF NOT EXISTS monthly_service_checklist (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  service_id INT NULL,
  task_name VARCHAR(255) NOT NULL,
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  assigned_to INT NULL COMMENT 'Empleado asignado',
  due_date DATE NULL,
  completed_at TIMESTAMP NULL,
  completed_by INT NULL,
  file_url VARCHAR(500) NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (invoice_id) REFERENCES monthly_invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_invoice (invoice_id),
  INDEX idx_service (service_id),
  INDEX idx_status (status),
  INDEX idx_assigned (assigned_to),
  INDEX idx_due_date (due_date)
);

-- Datos de ejemplo
INSERT INTO services (service_name, description, default_price, recurrence_type, activation_day)
VALUES
  ('Declaración IVA', 'Declaración mensual de IVA', 100.00, 'monthly', 25),
  ('Declaración ISR', 'Declaración mensual de ISR', 150.00, 'monthly', 20),
  ('Contabilidad General', 'Registro contable mensual', 200.00, 'monthly', 5),
  ('Declaración Anual', 'Declaración anual de impuestos', 500.00, 'annual', 1);
```

### 2. Controller de Servicios

```typescript
// controllers/service.controller.ts

import { Request, Response } from "express";

/**
 * GET /services
 * Lista servicios (globales + del workspace actual)
 */
export async function listServices(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspaceId;
    const isConsolidated = (req as any).isConsolidatedView;

    let query = `
      SELECT * FROM services
      WHERE is_active = TRUE
    `;
    const params: any[] = [];

    // Filtrar: mostrar globales + del workspace actual
    if (!isConsolidated && workspaceId) {
      query += ` AND (is_global = TRUE OR workspace_id = ?)`;
      params.push(workspaceId);
    }

    query += ` ORDER BY is_global DESC, service_name ASC`;

    const [rows] = await req.db!.query(query, params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al listar servicios' });
  }
}

/**
 * POST /services
 * Crear nuevo servicio
 */
export async function createService(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspaceId;
    const {
      service_name,
      description = null,
      default_price,
      operational_cost = 0,
      recurrence_type = 'monthly',
      recurrence_type_extended = null,
      recurrence_days = null,
      activation_day = 25,
      activation_window_days = 7,
      requires_file = true,
      file_config = 'required',
      completion_determines_next = false,
      is_on_request = false,
      is_active = true,
      is_global = false,
      employee_notes = null,
      client_notes = null,
      assignment_type = 'selected_clients',
      visible_to_clients = true,
      allow_subscription = false
    } = req.body;

    // Validaciones
    if (!service_name || default_price === undefined) {
      return res.status(400).json({
        message: 'service_name y default_price son requeridos'
      });
    }

    // Si completion_determines_next, activation_day debe ser null
    if (completion_determines_next && activation_day !== null) {
      return res.status(400).json({
        message: 'Si completion_determines_next es true, activation_day debe ser null'
      });
    }

    // Si recurrence_type es custom, recurrence_days es requerido
    if (recurrence_type === 'custom' && !recurrence_days) {
      return res.status(400).json({
        message: 'Para recurrence_type "custom", recurrence_days es requerido'
      });
    }

    const [result] = await req.db!.query(
      `INSERT INTO services (
        workspace_id, service_name, description, default_price,
        operational_cost, recurrence_type, recurrence_type_extended,
        recurrence_days, activation_day, activation_window_days,
        requires_file, file_config, completion_determines_next,
        is_on_request, is_active, is_global, employee_notes,
        client_notes, assignment_type, visible_to_clients, allow_subscription
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        is_global ? null : workspaceId,
        service_name, description, default_price, operational_cost,
        recurrence_type, recurrence_type_extended, recurrence_days,
        activation_day, activation_window_days, requires_file, file_config,
        completion_determines_next, is_on_request, is_active, is_global,
        employee_notes, client_notes, assignment_type, visible_to_clients,
        allow_subscription
      ]
    );

    res.status(201).json({
      id: (result as any).insertId,
      message: 'Servicio creado exitosamente'
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al crear servicio' });
  }
}

/**
 * PUT /services/:id
 * Actualizar servicio
 */
export async function updateService(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verificar que existe
    const [existing]: any = await req.db!.query(
      'SELECT id FROM services WHERE id = ?',
      [id]
    );

    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    // Construir UPDATE dinámico
    const fields = [
      'service_name', 'description', 'default_price', 'operational_cost',
      'recurrence_type', 'recurrence_type_extended', 'recurrence_days',
      'activation_day', 'activation_window_days', 'requires_file',
      'file_config', 'completion_determines_next', 'is_on_request',
      'is_active', 'employee_notes', 'client_notes', 'assignment_type',
      'visible_to_clients', 'allow_subscription'
    ];

    const setClauses: string[] = [];
    const params: any[] = [];

    for (const field of fields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ message: 'Nada que actualizar' });
    }

    params.push(id);
    await req.db!.query(
      `UPDATE services SET ${setClauses.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Servicio actualizado' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al actualizar servicio' });
  }
}

/**
 * DELETE /services/:id
 * Eliminar servicio (solo si no tiene dependencias)
 */
export async function deleteService(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Verificar dependencias
    const [tasks]: any = await req.db!.query(
      'SELECT COUNT(*) as count FROM monthly_service_checklist WHERE service_id = ?',
      [id]
    );

    if (tasks[0].count > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar: tiene tareas asociadas. Desactívalo.'
      });
    }

    const [clients]: any = await req.db!.query(
      'SELECT COUNT(*) as count FROM client_services WHERE service_id = ?',
      [id]
    );

    if (clients[0].count > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar: hay clientes con este servicio. Desactívalo.'
      });
    }

    await req.db!.query('DELETE FROM services WHERE id = ?', [id]);
    res.json({ message: 'Servicio eliminado' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al eliminar servicio' });
  }
}

/**
 * POST /services/:id/assign
 * Asignar servicio a cliente(s)
 */
export async function assignServiceToClients(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { client_ids, custom_price = null } = req.body;

    if (!Array.isArray(client_ids) || client_ids.length === 0) {
      return res.status(400).json({ message: 'client_ids requerido' });
    }

    let assigned = 0;
    for (const clientId of client_ids) {
      try {
        await req.db!.query(
          `INSERT INTO client_services (client_user_id, service_id, custom_price, status)
           VALUES (?, ?, ?, 'active')
           ON DUPLICATE KEY UPDATE status = 'active', custom_price = VALUES(custom_price)`,
          [clientId, id, custom_price]
        );
        assigned++;
      } catch (e) {
        // Ignorar errores individuales
      }
    }

    res.json({ message: `Servicio asignado a ${assigned} clientes` });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al asignar servicio' });
  }
}

/**
 * GET /clients/:clientId/services
 * Obtener servicios de un cliente
 */
export async function getClientServices(req: Request, res: Response) {
  try {
    const { clientId } = req.params;

    const [services]: any = await req.db!.query(`
      SELECT
        cs.id as assignment_id,
        cs.custom_price,
        cs.status,
        cs.start_date,
        cs.end_date,
        s.id as service_id,
        s.service_name,
        s.default_price,
        s.recurrence_type,
        s.description,
        COALESCE(cs.custom_price, s.default_price) as effective_price
      FROM client_services cs
      JOIN services s ON s.id = cs.service_id
      WHERE cs.client_user_id = ?
      ORDER BY s.service_name
    `, [clientId]);

    res.json(services);
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener servicios del cliente' });
  }
}
```

### 3. Job de Generación Automática de Tareas

```typescript
// jobs/generate-monthly-tasks.ts

interface ClientService {
  client_id: number;
  service_id: number;
  service_name: string;
  custom_price: number | null;
  default_price: number;
  recurrence_type: string;
}

/**
 * Genera tareas para un mes específico
 */
export async function generateMonthlyTasks(
  db: any,
  targetYear?: number,
  targetMonth?: number
) {
  const now = new Date();
  const year = targetYear || now.getFullYear();
  const month = targetMonth || (now.getMonth() + 1);

  console.log(`Generando tareas para ${month}/${year}...`);

  // 1. Obtener clientes con servicios activos (excluir on_demand y variable)
  const [clientServices]: any = await db.query(`
    SELECT
      cs.client_user_id as client_id,
      cs.service_id,
      cs.custom_price,
      s.service_name,
      s.default_price,
      s.recurrence_type
    FROM client_services cs
    JOIN services s ON s.id = cs.service_id
    JOIN users u ON u.id = cs.client_user_id
    WHERE cs.status = 'active'
      AND u.is_active = 1
      AND s.is_active = TRUE
      AND (s.recurrence_type_extended IS NULL
           OR s.recurrence_type_extended NOT IN ('variable', 'on_demand'))
    ORDER BY cs.client_user_id
  `);

  if (!clientServices || clientServices.length === 0) {
    console.log('No hay clientes con servicios activos');
    return { invoicesCreated: 0, tasksCreated: 0 };
  }

  // 2. Agrupar por cliente
  const clientsMap = new Map<number, ClientService[]>();
  for (const cs of clientServices) {
    if (!clientsMap.has(cs.client_id)) {
      clientsMap.set(cs.client_id, []);
    }
    clientsMap.get(cs.client_id)!.push(cs);
  }

  let invoicesCreated = 0;
  let tasksCreated = 0;

  // 3. Procesar cada cliente
  for (const [clientId, services] of clientsMap.entries()) {
    // Verificar si ya existe factura
    const [existing]: any = await db.query(`
      SELECT id FROM monthly_invoices
      WHERE client_user_id = ? AND invoice_year = ? AND invoice_month = ?
    `, [clientId, year, month]);

    let invoiceId: number;

    if (existing && existing.length > 0) {
      invoiceId = existing[0].id;
    } else {
      // Crear factura
      const totalDue = services.reduce(
        (sum, s) => sum + (s.custom_price || s.default_price),
        0
      );

      const [result]: any = await db.query(`
        INSERT INTO monthly_invoices (
          client_user_id, invoice_year, invoice_month,
          monthly_fee, total_due, balance, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
      `, [clientId, year, month, totalDue, totalDue, totalDue]);

      invoiceId = result.insertId;
      invoicesCreated++;
    }

    // 4. Crear tarea por cada servicio
    for (const service of services) {
      // Solo si la recurrencia aplica para este mes
      if (!shouldCreateTaskForMonth(service.recurrence_type, month)) {
        continue;
      }

      // Verificar si ya existe la tarea
      const [existingTask]: any = await db.query(`
        SELECT id FROM monthly_service_checklist
        WHERE invoice_id = ? AND service_id = ?
      `, [invoiceId, service.service_id]);

      if (!existingTask || existingTask.length === 0) {
        await db.query(`
          INSERT INTO monthly_service_checklist (
            invoice_id, service_id, task_name, status
          ) VALUES (?, ?, ?, 'pending')
        `, [invoiceId, service.service_id, service.service_name]);

        tasksCreated++;
      }
    }
  }

  console.log(`Facturas: ${invoicesCreated}, Tareas: ${tasksCreated}`);
  return { invoicesCreated, tasksCreated };
}

/**
 * Determina si se debe crear tarea según recurrencia
 */
function shouldCreateTaskForMonth(
  recurrenceType: string,
  month: number
): boolean {
  switch (recurrenceType) {
    case 'monthly':
      return true;
    case 'bimonthly':
      return month % 2 === 1; // Enero, marzo, mayo...
    case 'quarterly':
      return [1, 4, 7, 10].includes(month);
    case 'biannual':
      return [1, 7].includes(month);
    case 'annual':
      return month === 1; // Solo enero
    default:
      return true;
  }
}
```

### 4. Scheduler (Cron Jobs)

```typescript
// jobs/tasks-scheduler.ts

import cron from 'node-cron';
import { generateMonthlyTasks } from './generate-monthly-tasks';

/**
 * Configura los cron jobs para generación de tareas
 */
export function setupTasksScheduler(db: any) {
  // Ejecutar el día 1 de cada mes a las 00:01
  cron.schedule('1 0 1 * *', async () => {
    console.log('[SCHEDULER] Iniciando generación de tareas mensuales...');
    try {
      await generateMonthlyTasks(db);
    } catch (error) {
      console.error('[SCHEDULER] Error:', error);
    }
  });

  // También generar tareas para el próximo mes el día 25
  cron.schedule('0 8 25 * *', async () => {
    console.log('[SCHEDULER] Pre-generando tareas del próximo mes...');
    const now = new Date();
    const nextMonth = now.getMonth() + 2;
    const nextYear = nextMonth > 12 ? now.getFullYear() + 1 : now.getFullYear();

    try {
      await generateMonthlyTasks(db, nextYear, nextMonth > 12 ? 1 : nextMonth);
    } catch (error) {
      console.error('[SCHEDULER] Error:', error);
    }
  });

  console.log('[SCHEDULER] Cron jobs configurados');
}
```

### 5. Rutas

```typescript
// routes/services.routes.ts

import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { resolveWorkspace } from "../middleware/resolveWorkspace";
import * as ctrl from "../controllers/service.controller";

const router = Router();
router.use(authenticateToken);
router.use(resolveWorkspace);

// Lectura
router.get("/", ctrl.listServices);
router.get("/:id", ctrl.getService);

// Escritura (solo admin)
router.post("/", requireRoles("admin"), ctrl.createService);
router.put("/:id", requireRoles("admin"), ctrl.updateService);
router.delete("/:id", requireRoles("admin"), ctrl.deleteService);
router.patch("/:id/status", requireRoles("admin"), ctrl.toggleServiceStatus);

// Asignación
router.post("/:id/assign", requireRoles("admin"), ctrl.assignServiceToClients);

export default router;
```

---

## Tipos de Recurrencia

| Tipo | Descripción | Meses |
|------|-------------|-------|
| `monthly` | Cada mes | Todos |
| `bimonthly` | Cada 2 meses | Ene, Mar, May, Jul, Sep, Nov |
| `quarterly` | Cada 3 meses | Ene, Abr, Jul, Oct |
| `biannual` | Cada 6 meses | Ene, Jul |
| `annual` | Una vez al año | Enero |
| `custom` | Días específicos | Definido en `recurrence_days` |
| `on_demand` | Bajo solicitud | N/A |
| `variable` | Variable según cliente | N/A |

---

## Componente Frontend

```tsx
// pages/admin/ServicesPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

export function ServicesPage() {
  const queryClient = useQueryClient();
  const [editingService, setEditingService] = useState(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then(r => r.data)
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/services', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    }
  });

  return (
    <div className="services-page">
      <h1>Servicios</h1>

      <button onClick={() => setEditingService({})}>
        + Nuevo Servicio
      </button>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Recurrencia</th>
            <th>Día Activación</th>
            <th>Global</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s: any) => (
            <tr key={s.id}>
              <td>{s.service_name}</td>
              <td>${s.default_price}</td>
              <td>{s.recurrence_type}</td>
              <td>{s.activation_day || 'Al completar'}</td>
              <td>{s.is_global ? '✓' : ''}</td>
              <td>
                <button onClick={() => setEditingService(s)}>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingService && (
        <ServiceFormModal
          service={editingService}
          onSave={createMutation.mutate}
          onClose={() => setEditingService(null)}
        />
      )}
    </div>
  );
}
```

---

## Checklist de Implementación

- [ ] Crear tabla `services` con todos los campos
- [ ] Crear tabla `client_services` (asignaciones)
- [ ] Crear tabla `monthly_invoices` (facturas)
- [ ] Crear tabla `monthly_service_checklist` (tareas)
- [ ] Copiar controller de servicios
- [ ] Configurar rutas
- [ ] Implementar job de generación de tareas
- [ ] Configurar cron jobs
- [ ] Crear página de administración de servicios
- [ ] Implementar asignación de servicios a clientes
- [ ] Probar generación automática de tareas

---

## Notas para Claude

**Para implementar en otro proyecto:**

1. Adaptar el modelo de recurrencia según necesidad
2. Modificar la lógica de `shouldCreateTaskForMonth` si se requiere otra lógica
3. Ajustar los campos de `services` según el dominio
4. Configurar los cron jobs según el timezone del servidor
5. La generación de tareas es idempotente (puede ejecutarse múltiples veces)

**Consideraciones:**
- Los servicios globales (`is_global = TRUE`) aparecen en todos los workspaces
- `custom_price` en `client_services` sobrescribe `default_price`
- `completion_determines_next` es útil para servicios donde la próxima tarea depende de completar la anterior
- `on_demand` y `variable` no generan tareas automáticamente
