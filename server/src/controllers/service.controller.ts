import { Request, Response } from "express";

/**
 * GET /services
 * Lista todos los servicios
 */
export async function listServices(_req: Request, res: Response) {
  try {
    const [rows] = await _req.db!.query(`
      SELECT
        id,
        service_name,
        description,
        default_price,
        recurrence_type,
        recurrence_days,
        activation_day,
        activation_window_days,
        requires_file,
        completion_determines_next,
        is_active,
        created_at
      FROM services
      ORDER BY service_name
    `);
    res.json(rows);
  } catch (error: any) {
    console.error('Error listing services:', error);
    res.status(500).json({ message: 'Error al listar servicios', error: error.message });
  }
}

/**
 * GET /services/:id
 * Obtiene un servicio específico por ID
 */
export async function getService(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [rows]: any = await req.db!.query(`
      SELECT
        id,
        service_name,
        description,
        default_price,
        recurrence_type,
        recurrence_days,
        activation_day,
        activation_window_days,
        requires_file,
        completion_determines_next,
        is_active,
        created_at
      FROM services
      WHERE id = ?
    `, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error getting service:', error);
    res.status(500).json({ message: 'Error al obtener servicio', error: error.message });
  }
}

/**
 * POST /services
 * Crea un nuevo servicio
 */
export async function createService(req: Request, res: Response) {
  try {
    const {
      service_name,
      description = null,
      default_price,
      recurrence_type = 'monthly',
      recurrence_days = null,
      activation_day = 25,
      activation_window_days = 7,
      requires_file = true,
      completion_determines_next = false,
      is_active = true
    } = req.body;

    // Validaciones
    if (!service_name || !default_price) {
      return res.status(400).json({ message: 'service_name y default_price son requeridos' });
    }

    if (completion_determines_next && activation_day !== null) {
      return res.status(400).json({
        message: 'Si completion_determines_next es true, activation_day debe ser null'
      });
    }

    if (recurrence_type === 'custom' && !recurrence_days) {
      return res.status(400).json({
        message: 'Para recurrence_type "custom", recurrence_days es requerido'
      });
    }

    const [result] = await req.db!.query(
      `INSERT INTO services (
        service_name,
        description,
        default_price,
        recurrence_type,
        recurrence_days,
        activation_day,
        activation_window_days,
        requires_file,
        completion_determines_next,
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        service_name,
        description,
        default_price,
        recurrence_type,
        recurrence_days,
        activation_day,
        activation_window_days,
        requires_file,
        completion_determines_next,
        is_active
      ]
    );

    res.status(201).json({ id: (result as any).insertId, message: 'Servicio creado exitosamente' });
  } catch (error: any) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Error al crear servicio', error: error.message });
  }
}

/**
 * PUT /services/:id
 * Actualiza un servicio completo
 */
export async function updateService(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      service_name,
      description,
      default_price,
      recurrence_type,
      recurrence_days,
      activation_day,
      activation_window_days,
      requires_file,
      completion_determines_next,
      is_active
    } = req.body;

    // Verificar que el servicio existe
    const [existing]: any = await req.db!.query('SELECT id FROM services WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    // Validaciones
    if (completion_determines_next && activation_day !== null) {
      return res.status(400).json({
        message: 'Si completion_determines_next es true, activation_day debe ser null'
      });
    }

    if (recurrence_type === 'custom' && !recurrence_days) {
      return res.status(400).json({
        message: 'Para recurrence_type "custom", recurrence_days es requerido'
      });
    }

    await req.db!.query(
      `UPDATE services SET
        service_name = ?,
        description = ?,
        default_price = ?,
        recurrence_type = ?,
        recurrence_days = ?,
        activation_day = ?,
        activation_window_days = ?,
        requires_file = ?,
        completion_determines_next = ?,
        is_active = ?
      WHERE id = ?`,
      [
        service_name,
        description,
        default_price,
        recurrence_type,
        recurrence_days,
        activation_day,
        activation_window_days,
        requires_file,
        completion_determines_next,
        is_active,
        id
      ]
    );

    res.json({ message: 'Servicio actualizado exitosamente' });
  } catch (error: any) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Error al actualizar servicio', error: error.message });
  }
}

/**
 * PATCH /services/:id/status
 * Activa o desactiva un servicio
 */
export async function toggleServiceStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active debe ser boolean' });
    }

    const [result]: any = await req.db!.query(
      'UPDATE services SET is_active = ? WHERE id = ?',
      [is_active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    res.json({
      message: is_active ? 'Servicio activado exitosamente' : 'Servicio desactivado exitosamente'
    });
  } catch (error: any) {
    console.error('Error toggling service status:', error);
    res.status(500).json({ message: 'Error al cambiar estado del servicio', error: error.message });
  }
}

/**
 * DELETE /services/:id
 * Elimina un servicio (solo si no tiene tareas asociadas)
 */
export async function deleteService(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Verificar si hay tareas asociadas
    const [tasks]: any = await req.db!.query(
      'SELECT COUNT(*) as count FROM monthly_service_checklist WHERE service_id = ?',
      [id]
    );

    if (tasks[0].count > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar el servicio porque tiene tareas asociadas. Desactívalo en su lugar.'
      });
    }

    // Verificar si hay clientes con este servicio
    const [clients]: any = await req.db!.query(
      'SELECT COUNT(*) as count FROM client_services WHERE service_id = ?',
      [id]
    );

    if (clients[0].count > 0) {
      return res.status(400).json({
        message: 'No se puede eliminar el servicio porque hay clientes que lo tienen asignado. Desactívalo en su lugar.'
      });
    }

    const [result]: any = await req.db!.query('DELETE FROM services WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    res.json({ message: 'Servicio eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Error al eliminar servicio', error: error.message });
  }
}
