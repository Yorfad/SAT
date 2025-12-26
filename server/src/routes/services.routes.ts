import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { z } from "zod";
import { upload, resolveUploadPath } from "../config/upload";
import { decrypt } from "../utils/encryption";
import { listServices, createService } from "../controllers/service.controller";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import path from "path";
import fs from "fs";
import mime from "mime-types";


const router = Router();
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);
router.get("/checklist/pending", requireRoles("admin","employee"), async (req, res) => {
  try {
    const userId = (req as any).user.sub;
    const workspaceId = req.workspaceId;
    const isConsolidated = req.isConsolidatedView;
    const accessibleIds = req.accessibleWorkspaceIds || [];

    // Construir filtro de workspace
    let workspaceFilter = '';
    const params: any[] = [userId];

    if (!isConsolidated && workspaceId) {
      workspaceFilter = 'AND cp.workspace_id = ?';
      params.push(workspaceId);
    } else if (isConsolidated && accessibleIds.length > 0) {
      workspaceFilter = `AND cp.workspace_id IN (${accessibleIds.map(() => '?').join(',')})`;
      params.push(...accessibleIds);
    }

    // Filtrar tareas SOLO de clientes asignados al usuario logueado Y del workspace
    const [rows]: any = await req.db!.query(`
      SELECT
        msc.id,
        msc.task_name,
        msc.status,
        msc.next_payment_date,
        mi.invoice_month,
        mi.invoice_year,
        u.full_name AS client_name,
        s.activation_day,
        s.activation_window_days,
        s.completion_determines_next,
        -- Calcular rango de activación
        CASE
          WHEN s.completion_determines_next = TRUE AND msc.next_payment_date IS NOT NULL THEN
            -- Para libros: mostrar la fecha específica
            DATE_FORMAT(msc.next_payment_date, '%d/%m/%Y')
          WHEN s.activation_day IS NOT NULL THEN
            -- Para servicios mensuales: calcular rango
            CONCAT(
              -- Inicio: activation_day - activation_window_days del mes actual
              LPAD(GREATEST(1, s.activation_day - s.activation_window_days), 2, '0'), '/',
              LPAD(mi.invoice_month, 2, '0'), '/', mi.invoice_year,
              ' - ',
              -- Fin: primeros días del mes siguiente
              '05/',
              LPAD(IF(mi.invoice_month = 12, 1, mi.invoice_month + 1), 2, '0'), '/',
              IF(mi.invoice_month = 12, mi.invoice_year + 1, mi.invoice_year)
            )
          ELSE NULL
        END AS activation_range
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.invoice_id
      JOIN users u ON u.id = mi.client_user_id
      JOIN clients_profiles cp ON cp.user_id = u.id
      LEFT JOIN services s ON s.id = msc.service_id
      WHERE msc.status <> 'completed'
        AND msc.status IS NOT NULL
        AND u.assigned_to_user_id = ?
        AND u.is_active = 1
        ${workspaceFilter}
      ORDER BY mi.invoice_year DESC, mi.invoice_month DESC, msc.id DESC
      LIMIT 50
    `, params);

    console.log(`[PENDING-TASKS] Usuario ${userId} tiene ${rows.length} tareas pendientes de sus clientes asignados`);
    res.json(rows || []);
  } catch (error: any) {
    console.error('Error fetching pending checklist:', error);
    res.status(500).json({ message: 'Error al obtener tareas pendientes', error: error.message });
  }
});

// Obtener TODAS las tareas del usuario (pendientes Y completadas) con campo is_editable
router.get("/checklist/my-tasks", requireRoles("admin","employee"), async (req, res) => {
  try {
    const userId = (req as any).user.sub;
    const { filter } = req.query; // 'all' | 'pending' | 'completed'

    // Query con campo is_editable calculado
    // Una tarea es editable si:
    // 1. Está pendiente (siempre editable)
    // 2. Está completada Y no existe una tarea más reciente del mismo servicio/cliente
    let statusFilter = '';
    if (filter === 'pending') {
      statusFilter = "AND msc.status <> 'completed'";
    } else if (filter === 'completed') {
      statusFilter = "AND msc.status = 'completed'";
    }

    const [rows]: any = await req.db!.query(`
      SELECT
        msc.id,
        msc.task_name,
        msc.status,
        msc.next_payment_date,
        msc.file_path,
        msc.file_type,
        msc.completion_date,
        msc.service_id,
        mi.invoice_month,
        mi.invoice_year,
        mi.client_user_id,
        u.full_name AS client_name,
        s.activation_day,
        s.activation_window_days,
        s.completion_determines_next,
        -- Calcular is_editable
        CASE
          WHEN msc.status <> 'completed' THEN TRUE
          WHEN NOT EXISTS (
            SELECT 1 FROM monthly_service_checklist newer
            JOIN monthly_invoices newer_mi ON newer_mi.id = newer.invoice_id
            WHERE newer.service_id = msc.service_id
              AND newer_mi.client_user_id = mi.client_user_id
              AND newer.id <> msc.id
              AND (newer_mi.invoice_year > mi.invoice_year
                   OR (newer_mi.invoice_year = mi.invoice_year
                       AND newer_mi.invoice_month > mi.invoice_month))
          ) THEN TRUE
          ELSE FALSE
        END AS is_editable,
        -- Calcular rango de activación
        CASE
          WHEN s.completion_determines_next = TRUE AND msc.next_payment_date IS NOT NULL THEN
            DATE_FORMAT(msc.next_payment_date, '%d/%m/%Y')
          WHEN s.activation_day IS NOT NULL THEN
            CONCAT(
              LPAD(GREATEST(1, s.activation_day - s.activation_window_days), 2, '0'), '/',
              LPAD(mi.invoice_month, 2, '0'), '/', mi.invoice_year,
              ' - ',
              '05/',
              LPAD(IF(mi.invoice_month = 12, 1, mi.invoice_month + 1), 2, '0'), '/',
              IF(mi.invoice_month = 12, mi.invoice_year + 1, mi.invoice_year)
            )
          ELSE NULL
        END AS activation_range
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.invoice_id
      JOIN users u ON u.id = mi.client_user_id
      LEFT JOIN services s ON s.id = msc.service_id
      WHERE msc.status IS NOT NULL
        AND u.assigned_to_user_id = ?
        AND u.is_active = 1
        ${statusFilter}
      ORDER BY
        msc.status = 'completed' ASC,
        mi.invoice_year DESC,
        mi.invoice_month DESC,
        msc.id DESC
      LIMIT 100
    `, [userId]);

    console.log(`[MY-TASKS] Usuario ${userId} tiene ${rows.length} tareas (filter: ${filter || 'all'})`);
    res.json(rows || []);
  } catch (error: any) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
});


// Obtener detalles de una tarea específica
router.get("/checklist/:taskId", requireRoles("admin","employee"), async (req, res) => {
  try {
    const { taskId } = req.params;

    // Debug: verificar si la tarea existe primero
    const [checkTask]: any = await req.db!.query(
      `SELECT id FROM monthly_service_checklist WHERE id = ?`,
      [taskId]
    );

    if (!checkTask || checkTask.length === 0) {
      console.log(`[DEBUG] Tarea ${taskId} no existe en tenant ${(req as any).tenantSlug}`);
      return res.status(404).json({
        message: 'Tarea no encontrada',
        debug: { taskId, tenant: (req as any).tenantSlug, exists: false }
      });
    }

    const [rows]: any = await req.db!.query(`
      SELECT
        msc.id, msc.task_name, msc.status, msc.file_path, msc.file_type, msc.omiso_id,
        mi.invoice_month, mi.invoice_year, mi.id as invoice_id, mi.client_user_id,
        u.full_name AS client_name, u.email AS client_email, u.nit AS client_nit,
        cp.sat_password_encrypted
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.invoice_id
      JOIN users u ON u.id = mi.client_user_id
      LEFT JOIN clients_profiles cp ON cp.user_id = u.id
      WHERE msc.id = ?
    `, [taskId]);

    if (!rows || rows.length === 0) {
      console.log(`[DEBUG] Tarea ${taskId} existe pero JOIN falló en tenant ${(req as any).tenantSlug}`);
      return res.status(404).json({
        message: 'Tarea no encontrada - problema con relaciones',
        debug: { taskId, tenant: (req as any).tenantSlug, taskExists: true, joinFailed: true }
      });
    }

    const task = rows[0];

    // Calcular is_editable
    const [editableCheck]: any = await req.db!.query(`
      SELECT CASE
        WHEN msc.status <> 'completed' THEN TRUE
        WHEN NOT EXISTS (
          SELECT 1 FROM monthly_service_checklist newer
          JOIN monthly_invoices newer_mi ON newer_mi.id = newer.invoice_id
          WHERE newer.service_id = msc.service_id
            AND newer_mi.client_user_id = ?
            AND newer.id <> msc.id
            AND (newer_mi.invoice_year > ? OR (newer_mi.invoice_year = ? AND newer_mi.invoice_month > ?))
        ) THEN TRUE
        ELSE FALSE
      END AS is_editable
      FROM monthly_service_checklist msc
      WHERE msc.id = ?
    `, [task.client_user_id, task.invoice_year, task.invoice_year, task.invoice_month, taskId]);

    const isEditable = editableCheck[0]?.is_editable === 1;

    // Si es una tarea de omiso, obtener información del omiso
    let omisoInfo = null;
    if (task.task_name?.toLowerCase() === 'omisos' && task.omiso_id) {
      try {
        const [omisoRows]: any = await req.db!.query(`
          SELECT id, motivo, archivo_path, estado, created_at
          FROM client_omisos
          WHERE id = ?
        `, [task.omiso_id]);

        if (omisoRows && omisoRows.length > 0) {
          omisoInfo = omisoRows[0];
        }
      } catch (e) {
        console.warn('Error al obtener información del omiso:', e);
      }
    }

    // Verificar próxima fecha de pago (para libros)
    const [nextPayment]: any = await req.db!.query(`
      SELECT next_payment_date FROM monthly_service_checklist WHERE id = ?
    `, [taskId]).catch(() => [[]]);

    // Descifrar contraseña SAT si existe
    let satPassword: string | null = null;
    if (task.sat_password_encrypted) {
      try {
        satPassword = decrypt(task.sat_password_encrypted) || null;
      } catch (e) {
        console.warn('No se pudo descifrar contraseña SAT para tarea', taskId);
        satPassword = null;
      }
    }

    res.json({
      id: task.id,
      task_name: task.task_name,
      status: task.status,
      invoice_month: task.invoice_month,
      invoice_year: task.invoice_year,
      invoice_id: task.invoice_id,
      client_id: task.client_user_id,
      client_name: task.client_name,
      client_email: task.client_email,
      client_nit: task.client_nit,
      client_sat_password: satPassword,
      file_path: task.file_path || null,
      file_type: task.file_type || null,
      omiso_info: omisoInfo,
      next_payment_date: nextPayment[0]?.next_payment_date || null,
      is_editable: isEditable
    });
  } catch (error: any) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ message: 'Error al obtener detalles de la tarea', error: error.message });
  }
});

// Importar función para actualizar rating
import { updateClientOverallRating } from "../controllers/observation.controller";

// Importar función para generar siguiente tarea variable
import { generateNextVariableTask } from "../jobs/tasks-scheduler";

// Actualizar una tarea completada (solo si is_editable = true)
router.put("/checklist/:taskId/update", requireRoles("admin","employee"), upload.single('file'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const file = req.file;
    const { observation_text, rating, is_primary, nextPaymentDate } = req.body;
    const userId = (req as any).user.sub;

    // Obtener la tarea
    const [taskRows]: any = await req.db!.query(`
      SELECT msc.*, mi.id as invoice_id, mi.client_user_id, mi.invoice_year, mi.invoice_month
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.invoice_id
      WHERE msc.id = ?
    `, [taskId]);

    if (!taskRows || taskRows.length === 0) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const task = taskRows[0];

    // Verificar que la tarea esté completada
    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Esta tarea no está completada. Usa el endpoint /complete en su lugar.' });
    }

    // Verificar is_editable
    const [editableCheck]: any = await req.db!.query(`
      SELECT CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM monthly_service_checklist newer
          JOIN monthly_invoices newer_mi ON newer_mi.id = newer.invoice_id
          WHERE newer.service_id = msc.service_id
            AND newer_mi.client_user_id = ?
            AND newer.id <> msc.id
            AND (newer_mi.invoice_year > ? OR (newer_mi.invoice_year = ? AND newer_mi.invoice_month > ?))
        ) THEN TRUE
        ELSE FALSE
      END AS is_editable
      FROM monthly_service_checklist msc
      WHERE msc.id = ?
    `, [task.client_user_id, task.invoice_year, task.invoice_year, task.invoice_month, taskId]);

    if (editableCheck[0]?.is_editable !== 1) {
      return res.status(403).json({
        message: 'Esta tarea ya no es editable. Existe una tarea más reciente para este servicio.'
      });
    }

    // Actualizar archivo si se proporciona uno nuevo
    if (file) {
      // Registrar el nuevo archivo
      await req.db!.query(`
        INSERT INTO invoice_files (invoice_id, uploaded_by_user_id, file_name, file_path, file_type)
        VALUES (?, ?, ?, ?, ?)
      `, [task.invoice_id, userId, file.originalname, file.filename, file.mimetype]);

      // Actualizar la ruta en la tarea
      await req.db!.query(`
        UPDATE monthly_service_checklist
        SET file_path = ?, file_type = ?
        WHERE id = ?
      `, [file.filename, file.mimetype, taskId]);
    }

    // Si es libros y tiene próxima fecha, actualizarla
    if (nextPaymentDate && task.task_name?.toLowerCase().includes('libro')) {
      await req.db!.query(`
        UPDATE monthly_service_checklist
        SET next_payment_date = ?
        WHERE id = ?
      `, [nextPaymentDate, taskId]);
    }

    // Actualizar o crear observación si se proporciona
    if (observation_text !== undefined || rating !== undefined) {
      // Verificar si ya existe una observación para esta tarea
      const [existingObs]: any = await req.db!.query(`
        SELECT id FROM task_observations WHERE task_id = ?
      `, [taskId]);

      const isPrimaryValue = (is_primary === 'true' || is_primary === true) ? true : false;

      if (existingObs && existingObs.length > 0) {
        // Actualizar observación existente
        if (isPrimaryValue) {
          await req.db!.query(`
            UPDATE task_observations SET is_primary = FALSE
            WHERE client_user_id = ? AND is_primary = TRUE AND task_id <> ?
          `, [task.client_user_id, taskId]);
        }

        await req.db!.query(`
          UPDATE task_observations
          SET observation_text = COALESCE(?, observation_text),
              rating = COALESCE(?, rating),
              is_primary = ?
          WHERE task_id = ?
        `, [observation_text, rating, isPrimaryValue, taskId]);
      } else if (observation_text || rating) {
        // Crear nueva observación
        if (isPrimaryValue) {
          await req.db!.query(`
            UPDATE task_observations SET is_primary = FALSE
            WHERE client_user_id = ? AND is_primary = TRUE
          `, [task.client_user_id]);
        }

        await req.db!.query(`
          INSERT INTO task_observations
          (task_id, client_user_id, created_by_user_id, observation_text, rating, is_primary)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [taskId, task.client_user_id, userId, observation_text || null, rating || null, isPrimaryValue]);
      }
    }

    console.log(`[TASK-UPDATE] Tarea ${taskId} actualizada por usuario ${userId}`);
    res.json({ ok: true, message: 'Tarea actualizada exitosamente' });
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error al actualizar la tarea', error: error.message });
  }
});

// Completar una tarea con archivo
router.post("/checklist/:taskId/complete", requireRoles("admin","employee"), upload.single('file'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const file = req.file;
    const { nextPaymentDate, observation_text, rating, is_primary } = req.body;
    const userId = (req as any).user.sub;
    const userRole = (req as any).user.role;

    // Obtener la tarea
    const [taskRows]: any = await req.db!.query(`
      SELECT msc.*, mi.id as invoice_id, mi.client_user_id
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.invoice_id
      WHERE msc.id = ?
    `, [taskId]);

    if (!taskRows || taskRows.length === 0) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    const task = taskRows[0];

    // VALIDACIÓN: Los omisos SIEMPRE REQUIEREN archivo de resolución
    // No importa si ya existe file_path (archivo de prueba), siempre se requiere uno nuevo
    const isOmiso = task.task_name?.toLowerCase() === 'omisos';
    if (isOmiso && !file) {
      return res.status(400).json({
        message: 'Los omisos requieren un archivo de resolución obligatorio. Por favor sube el archivo de resolución antes de completar la tarea.'
      });
    }

    // Subir archivo si existe
    if (file) {
      await req.db!.query(`
        INSERT INTO invoice_files (invoice_id, uploaded_by_user_id, file_name, file_path, file_type)
        VALUES (?, ?, ?, ?, ?)
      `, [task.invoice_id, userId, file.originalname, file.filename, file.mimetype]);

      // También guardar la ruta del archivo en la tarea
      await req.db!.query(`
        UPDATE monthly_service_checklist
        SET file_path = ?, file_type = ?
        WHERE id = ?
      `, [file.filename, file.mimetype, taskId]);
    }

    // Actualizar estado de la tarea
    await req.db!.query(`
      UPDATE monthly_service_checklist
      SET status = 'completed',
          completed_by_user_id = ?,
          completion_date = NOW()
      WHERE id = ?
    `, [userId, taskId]);

    // Si es una tarea de omiso, marcar el omiso como resuelto
    if (task.task_name?.toLowerCase() === 'omisos' && task.omiso_id) {
      try {
        await req.db!.query(`
          UPDATE client_omisos
          SET estado = 'resuelto',
              resolved_at = NOW(),
              resolved_by_user_id = ?
          WHERE id = ?
        `, [userId, task.omiso_id]);
        console.log(`[OMISO] Omiso ${task.omiso_id} marcado como resuelto por usuario ${userId}`);
      } catch (e: any) {
        console.warn('No se pudo marcar omiso como resuelto:', e.message);
      }
    }

    // Si es libros y tiene próxima fecha, guardarla
    if (nextPaymentDate && task.task_name?.toLowerCase().includes('libro')) {
      try {
        // Intentar agregar la columna si no existe
        await req.db!.query(`
          ALTER TABLE monthly_service_checklist
          ADD COLUMN next_payment_date DATE NULL
        `).catch(() => {}); // Ignorar si ya existe

        await req.db!.query(`
          UPDATE monthly_service_checklist
          SET next_payment_date = ?
          WHERE id = ?
        `, [nextPaymentDate, taskId]);
      } catch (e: any) {
        console.warn('No se pudo guardar próxima fecha de pago:', e.message);
      }
    }

    // Crear observación y/o rating si se proporcionó
    if (observation_text || rating) {
      try {
        // Permitir a admin y employee marcar como primordial
        const isPrimaryValue = (is_primary === 'true' || is_primary === true) ? true : false;

        // Si se marca como primordial, desmarcar todas las demás del cliente
        if (isPrimaryValue) {
          await req.db!.query(`
            UPDATE task_observations
            SET is_primary = FALSE
            WHERE client_user_id = ? AND is_primary = TRUE
          `, [task.client_user_id]);
        }

        await req.db!.query(`
          INSERT INTO task_observations
          (task_id, client_user_id, created_by_user_id, observation_text, rating, is_primary)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [taskId, task.client_user_id, userId, observation_text || null, rating || null, isPrimaryValue]);

        console.log(`[OBSERVATION] Observación creada para tarea ${taskId}${rating ? ` con rating ${rating}` : ''}${isPrimaryValue ? ' (PRIMORDIAL)' : ''}`);
      } catch (e: any) {
        console.warn('No se pudo crear observación:', e.message);
      }
    }

    // Verificar si todas las tareas del invoice están completadas
    const [[counts]]: any = await req.db!.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM monthly_service_checklist
      WHERE invoice_id = ?
    `, [task.invoice_id]);

    // Si todas las tareas están completadas, actualizar overall_rating
    if (counts.total === counts.completed) {
      try {
        await updateClientOverallRating(req.db, task.client_user_id, task.invoice_id);
        console.log(`[RATING] Todas las tareas completadas para invoice ${task.invoice_id}, rating actualizado`);
      } catch (e: any) {
        console.warn('No se pudo actualizar rating general:', e.message);
      }
    }

    // Si es un servicio variable, generar la siguiente tarea
    let nextTaskInfo = null;
    if (task.service_id) {
      try {
        // Verificar si es un servicio variable
        const [serviceCheck]: any = await req.db!.query(`
          SELECT recurrence_type_extended FROM services WHERE id = ?
        `, [task.service_id]);

        if (serviceCheck && serviceCheck.length > 0 &&
            serviceCheck[0].recurrence_type_extended === 'variable') {
          const result = await generateNextVariableTask(
            req.db!,
            parseInt(taskId),
            task.service_id,
            task.client_user_id
          );

          if (result.success) {
            nextTaskInfo = {
              nextTaskId: result.nextTaskId,
              nextDueDate: result.nextDueDate
            };
            console.log(`[VARIABLE-COMPLETE] Siguiente tarea generada: ${result.message}`);
          } else {
            console.warn(`[VARIABLE-COMPLETE] No se pudo generar siguiente tarea: ${result.message}`);
          }
        }
      } catch (e: any) {
        console.warn('Error verificando/generando tarea variable:', e.message);
      }
    }

    res.json({
      ok: true,
      message: 'Tarea completada exitosamente',
      nextTask: nextTaskInfo
    });
  } catch (error: any) {
    console.error('Error completing task:', error);
    res.status(500).json({ message: 'Error al completar la tarea', error: error.message });
  }
});

// Ver/descargar archivo subido
router.get("/files/:filename", requireRoles("admin","employee"), async (req, res) => {
  try {
    const { filename } = req.params;
    const { download } = req.query;

    // Usar path absoluto desde config
    const filePath = resolveUploadPath(filename);

    console.log('[FILE-SERVE] Intentando servir archivo:', filename);
    console.log('[FILE-SERVE] Path completo:', filePath);
    console.log('[FILE-SERVE] Archivo existe:', fs.existsSync(filePath));

    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      console.error('[FILE-SERVE] Archivo no encontrado:', filePath);
      // NO enviar JSON que se descargue como .htm
      return res.status(404).send('Archivo no encontrado');
    }

    // Determinar Content-Type basado en la extensión
    const contentType = mime.lookup(filePath) || 'application/octet-stream';
    console.log('[FILE-SERVE] Content-Type:', contentType);

    res.setHeader('Content-Type', contentType);

    // Si download=true, forzar descarga. Si no, mostrar inline (para vista previa)
    if (download === 'true') {
      // Obtener el nombre original si es posible, o usar el UUID con extensión
      const originalName = path.basename(filePath);
      res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
      console.log('[FILE-SERVE] Descargando como:', originalName);
    } else {
      // Vista previa inline (para imágenes y PDFs)
      res.setHeader('Content-Disposition', 'inline');
      console.log('[FILE-SERVE] Mostrando inline');
    }

    res.sendFile(filePath);
  } catch (error: any) {
    console.error('[FILE-SERVE] Error serving file:', error);
    res.status(500).send('Error al obtener el archivo');
  }
});

// Importar nuevos controllers
import { getService, updateService, toggleServiceStatus, deleteService } from "../controllers/service.controller";
import {
  getServiceActivities, createServiceActivity, updateServiceActivity,
  deleteServiceActivity, reorderServiceActivities,
  getServiceUploadSlots, createUploadSlot, updateUploadSlot, deleteUploadSlot,
  getServiceFormFields, createFormField, updateFormField, deleteFormField,
  getRecurrenceRules, saveRecurrenceRules, getServiceFullConfig
} from "../controllers/service-config.controller";

// GET /services - Listar todos los servicios
router.get("/", requireRoles("admin","employee"), listServices);

// GET /services/:id - Obtener un servicio específico
router.get("/:id", requireRoles("admin"), getService);

// POST /services - Crear nuevo servicio
router.post("/", requireRoles("admin"), validate(z.object({ body: z.object({
  service_name: z.string().min(2),
  description: z.string().optional(),
  default_price: z.number().nonnegative(),
  recurrence_type: z.enum(['monthly', 'bimonthly', 'quarterly', 'annual', 'custom', 'one_time']).optional(),
  recurrence_days: z.number().optional().nullable(),
  activation_day: z.number().min(1).max(31).optional().nullable(),
  activation_window_days: z.number().min(1).max(30).optional(),
  requires_file: z.boolean().optional(),
  completion_determines_next: z.boolean().optional(),
  is_active: z.boolean().optional()
}) })), createService);

// PUT /services/:id - Actualizar servicio completo
router.put("/:id", requireRoles("admin"), validate(z.object({ body: z.object({
  service_name: z.string().min(2),
  description: z.string().optional().nullable(),
  default_price: z.number().nonnegative(),
  recurrence_type: z.enum(['monthly', 'bimonthly', 'quarterly', 'annual', 'custom', 'one_time']),
  recurrence_days: z.number().optional().nullable(),
  activation_day: z.number().min(1).max(31).optional().nullable(),
  activation_window_days: z.number().min(1).max(30),
  requires_file: z.boolean(),
  completion_determines_next: z.boolean(),
  is_active: z.boolean()
}) })), updateService);

// PATCH /services/:id/status - Activar/desactivar servicio
router.patch("/:id/status", requireRoles("admin"), validate(z.object({ body: z.object({
  is_active: z.boolean()
}) })), toggleServiceStatus);

// DELETE /services/:id - Eliminar servicio
router.delete("/:id", requireRoles("admin"), deleteService);

// ============================================
// CONFIGURACIÓN DE SERVICIOS (actividades, slots, formularios, recurrencia)
// ============================================

// Configuración completa
router.get("/:id/full-config", requireRoles("admin"), getServiceFullConfig);

// Actividades
router.get("/:id/activities", requireRoles("admin"), getServiceActivities);
router.post("/:id/activities", requireRoles("admin"), createServiceActivity);
router.put("/:id/activities/reorder", requireRoles("admin"), reorderServiceActivities);
router.put("/:id/activities/:activityId", requireRoles("admin"), updateServiceActivity);
router.delete("/:id/activities/:activityId", requireRoles("admin"), deleteServiceActivity);

// Espacios de carga (upload slots)
router.get("/:id/upload-slots", requireRoles("admin"), getServiceUploadSlots);
router.post("/:id/upload-slots", requireRoles("admin"), createUploadSlot);
router.put("/:id/upload-slots/:slotId", requireRoles("admin"), updateUploadSlot);
router.delete("/:id/upload-slots/:slotId", requireRoles("admin"), deleteUploadSlot);

// Campos de formulario para clientes
router.get("/:id/form-fields", requireRoles("admin"), getServiceFormFields);
router.post("/:id/form-fields", requireRoles("admin"), createFormField);
router.put("/:id/form-fields/:fieldId", requireRoles("admin"), updateFormField);
router.delete("/:id/form-fields/:fieldId", requireRoles("admin"), deleteFormField);

// Reglas de recurrencia
router.get("/:id/recurrence-rules", requireRoles("admin"), getRecurrenceRules);
router.put("/:id/recurrence-rules", requireRoles("admin"), saveRecurrenceRules);


export default router;