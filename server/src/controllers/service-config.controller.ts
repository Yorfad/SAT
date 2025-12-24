import { Request, Response } from "express";

// ============================================
// ACTIVIDADES DE SERVICIO
// ============================================

/**
 * GET /services/:id/activities
 * Lista actividades de un servicio
 */
export async function getServiceActivities(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [rows] = await req.db!.query(
      `SELECT id, activity_name, description, display_order, is_required, created_at
       FROM service_activities
       WHERE service_id = ?
       ORDER BY display_order ASC`,
      [id]
    );

    res.json(rows);
  } catch (error: any) {
    console.error('Error getting service activities:', error);
    res.status(500).json({ message: 'Error al obtener actividades', error: error.message });
  }
}

/**
 * POST /services/:id/activities
 * Crea una actividad para un servicio
 */
export async function createServiceActivity(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { activity_name, description = null, is_required = true } = req.body;

    if (!activity_name) {
      return res.status(400).json({ message: 'activity_name es requerido' });
    }

    // Obtener el máximo display_order
    const [maxOrder]: any = await req.db!.query(
      'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM service_activities WHERE service_id = ?',
      [id]
    );

    const [result] = await req.db!.query(
      `INSERT INTO service_activities (service_id, activity_name, description, display_order, is_required)
       VALUES (?, ?, ?, ?, ?)`,
      [id, activity_name, description, maxOrder[0].next_order, is_required]
    );

    res.status(201).json({
      id: (result as any).insertId,
      message: 'Actividad creada exitosamente'
    });
  } catch (error: any) {
    console.error('Error creating activity:', error);
    res.status(500).json({ message: 'Error al crear actividad', error: error.message });
  }
}

/**
 * PUT /services/:serviceId/activities/:activityId
 * Actualiza una actividad
 */
export async function updateServiceActivity(req: Request, res: Response) {
  try {
    const { activityId } = req.params;
    const { activity_name, description, is_required } = req.body;

    const [result]: any = await req.db!.query(
      `UPDATE service_activities
       SET activity_name = ?, description = ?, is_required = ?
       WHERE id = ?`,
      [activity_name, description, is_required, activityId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Actividad no encontrada' });
    }

    res.json({ message: 'Actividad actualizada exitosamente' });
  } catch (error: any) {
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Error al actualizar actividad', error: error.message });
  }
}

/**
 * DELETE /services/:serviceId/activities/:activityId
 * Elimina una actividad
 */
export async function deleteServiceActivity(req: Request, res: Response) {
  try {
    const { activityId } = req.params;

    const [result]: any = await req.db!.query(
      'DELETE FROM service_activities WHERE id = ?',
      [activityId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Actividad no encontrada' });
    }

    res.json({ message: 'Actividad eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'Error al eliminar actividad', error: error.message });
  }
}

/**
 * PUT /services/:id/activities/reorder
 * Reordena actividades
 */
export async function reorderServiceActivities(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { order } = req.body; // Array de IDs en nuevo orden

    if (!Array.isArray(order)) {
      return res.status(400).json({ message: 'order debe ser un array de IDs' });
    }

    // Actualizar orden de cada actividad
    for (let i = 0; i < order.length; i++) {
      await req.db!.query(
        'UPDATE service_activities SET display_order = ? WHERE id = ? AND service_id = ?',
        [i, order[i], id]
      );
    }

    res.json({ message: 'Orden actualizado exitosamente' });
  } catch (error: any) {
    console.error('Error reordering activities:', error);
    res.status(500).json({ message: 'Error al reordenar actividades', error: error.message });
  }
}

// ============================================
// ESPACIOS DE CARGA (UPLOAD SLOTS)
// ============================================

/**
 * GET /services/:id/upload-slots
 * Lista espacios de carga de un servicio
 */
export async function getServiceUploadSlots(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [rows] = await req.db!.query(
      `SELECT id, slot_name, slot_label, description, display_order,
              is_required, allowed_file_types, max_file_size_mb,
              visibility, send_via_whatsapp, created_at
       FROM service_upload_slots
       WHERE service_id = ?
       ORDER BY display_order ASC`,
      [id]
    );

    res.json(rows);
  } catch (error: any) {
    console.error('Error getting upload slots:', error);
    res.status(500).json({ message: 'Error al obtener espacios de carga', error: error.message });
  }
}

/**
 * POST /services/:id/upload-slots
 * Crea un espacio de carga
 */
export async function createUploadSlot(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      slot_name,
      slot_label,
      description = null,
      is_required = true,
      allowed_file_types = '*',
      max_file_size_mb = 10,
      visibility = 'both',
      send_via_whatsapp = false
    } = req.body;

    if (!slot_name || !slot_label) {
      return res.status(400).json({ message: 'slot_name y slot_label son requeridos' });
    }

    // Obtener el máximo display_order
    const [maxOrder]: any = await req.db!.query(
      'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM service_upload_slots WHERE service_id = ?',
      [id]
    );

    const [result] = await req.db!.query(
      `INSERT INTO service_upload_slots
       (service_id, slot_name, slot_label, description, display_order, is_required,
        allowed_file_types, max_file_size_mb, visibility, send_via_whatsapp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, slot_name, slot_label, description, maxOrder[0].next_order, is_required,
       allowed_file_types, max_file_size_mb, visibility, send_via_whatsapp]
    );

    res.status(201).json({
      id: (result as any).insertId,
      message: 'Espacio de carga creado exitosamente'
    });
  } catch (error: any) {
    console.error('Error creating upload slot:', error);
    res.status(500).json({ message: 'Error al crear espacio de carga', error: error.message });
  }
}

/**
 * PUT /services/:serviceId/upload-slots/:slotId
 * Actualiza un espacio de carga
 */
export async function updateUploadSlot(req: Request, res: Response) {
  try {
    const { slotId } = req.params;
    const {
      slot_name, slot_label, description, is_required,
      allowed_file_types, max_file_size_mb, visibility, send_via_whatsapp
    } = req.body;

    const [result]: any = await req.db!.query(
      `UPDATE service_upload_slots
       SET slot_name = ?, slot_label = ?, description = ?, is_required = ?,
           allowed_file_types = ?, max_file_size_mb = ?, visibility = ?, send_via_whatsapp = ?
       WHERE id = ?`,
      [slot_name, slot_label, description, is_required,
       allowed_file_types, max_file_size_mb, visibility, send_via_whatsapp, slotId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Espacio de carga no encontrado' });
    }

    res.json({ message: 'Espacio de carga actualizado exitosamente' });
  } catch (error: any) {
    console.error('Error updating upload slot:', error);
    res.status(500).json({ message: 'Error al actualizar espacio de carga', error: error.message });
  }
}

/**
 * DELETE /services/:serviceId/upload-slots/:slotId
 * Elimina un espacio de carga
 */
export async function deleteUploadSlot(req: Request, res: Response) {
  try {
    const { slotId } = req.params;

    const [result]: any = await req.db!.query(
      'DELETE FROM service_upload_slots WHERE id = ?',
      [slotId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Espacio de carga no encontrado' });
    }

    res.json({ message: 'Espacio de carga eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error deleting upload slot:', error);
    res.status(500).json({ message: 'Error al eliminar espacio de carga', error: error.message });
  }
}

// ============================================
// CAMPOS DE FORMULARIO PARA CLIENTES
// ============================================

/**
 * GET /services/:id/form-fields
 * Lista campos de formulario de un servicio
 */
export async function getServiceFormFields(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [rows] = await req.db!.query(
      `SELECT id, field_name, field_label, field_type, placeholder, default_value,
              is_required, validation_rules, select_options, display_order, help_text, created_at
       FROM service_client_form_fields
       WHERE service_id = ?
       ORDER BY display_order ASC`,
      [id]
    );

    res.json(rows);
  } catch (error: any) {
    console.error('Error getting form fields:', error);
    res.status(500).json({ message: 'Error al obtener campos de formulario', error: error.message });
  }
}

/**
 * POST /services/:id/form-fields
 * Crea un campo de formulario
 */
export async function createFormField(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      field_name,
      field_label,
      field_type,
      placeholder = null,
      default_value = null,
      is_required = false,
      validation_rules = null,
      select_options = null,
      help_text = null
    } = req.body;

    if (!field_name || !field_label || !field_type) {
      return res.status(400).json({ message: 'field_name, field_label y field_type son requeridos' });
    }

    const validTypes = ['text', 'number', 'date', 'select', 'multiselect', 'file', 'textarea', 'email', 'phone', 'checkbox'];
    if (!validTypes.includes(field_type)) {
      return res.status(400).json({ message: `field_type debe ser uno de: ${validTypes.join(', ')}` });
    }

    // Obtener el máximo display_order
    const [maxOrder]: any = await req.db!.query(
      'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM service_client_form_fields WHERE service_id = ?',
      [id]
    );

    const [result] = await req.db!.query(
      `INSERT INTO service_client_form_fields
       (service_id, field_name, field_label, field_type, placeholder, default_value,
        is_required, validation_rules, select_options, display_order, help_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, field_name, field_label, field_type, placeholder, default_value,
       is_required, JSON.stringify(validation_rules), JSON.stringify(select_options),
       maxOrder[0].next_order, help_text]
    );

    res.status(201).json({
      id: (result as any).insertId,
      message: 'Campo de formulario creado exitosamente'
    });
  } catch (error: any) {
    console.error('Error creating form field:', error);
    res.status(500).json({ message: 'Error al crear campo de formulario', error: error.message });
  }
}

/**
 * PUT /services/:serviceId/form-fields/:fieldId
 * Actualiza un campo de formulario
 */
export async function updateFormField(req: Request, res: Response) {
  try {
    const { fieldId } = req.params;
    const {
      field_name, field_label, field_type, placeholder, default_value,
      is_required, validation_rules, select_options, help_text
    } = req.body;

    const [result]: any = await req.db!.query(
      `UPDATE service_client_form_fields
       SET field_name = ?, field_label = ?, field_type = ?, placeholder = ?, default_value = ?,
           is_required = ?, validation_rules = ?, select_options = ?, help_text = ?
       WHERE id = ?`,
      [field_name, field_label, field_type, placeholder, default_value,
       is_required, JSON.stringify(validation_rules), JSON.stringify(select_options),
       help_text, fieldId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Campo de formulario no encontrado' });
    }

    res.json({ message: 'Campo de formulario actualizado exitosamente' });
  } catch (error: any) {
    console.error('Error updating form field:', error);
    res.status(500).json({ message: 'Error al actualizar campo de formulario', error: error.message });
  }
}

/**
 * DELETE /services/:serviceId/form-fields/:fieldId
 * Elimina un campo de formulario
 */
export async function deleteFormField(req: Request, res: Response) {
  try {
    const { fieldId } = req.params;

    const [result]: any = await req.db!.query(
      'DELETE FROM service_client_form_fields WHERE id = ?',
      [fieldId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Campo de formulario no encontrado' });
    }

    res.json({ message: 'Campo de formulario eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error deleting form field:', error);
    res.status(500).json({ message: 'Error al eliminar campo de formulario', error: error.message });
  }
}

// ============================================
// REGLAS DE RECURRENCIA
// ============================================

/**
 * GET /services/:id/recurrence-rules
 * Obtiene reglas de recurrencia de un servicio
 */
export async function getRecurrenceRules(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [rows]: any = await req.db!.query(
      `SELECT id, variable_pattern, completion_days, activation_days_before, day_of_week
       FROM service_recurrence_rules
       WHERE service_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.json(null);
    }

    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error getting recurrence rules:', error);
    res.status(500).json({ message: 'Error al obtener reglas de recurrencia', error: error.message });
  }
}

/**
 * PUT /services/:id/recurrence-rules
 * Crea o actualiza reglas de recurrencia
 */
export async function saveRecurrenceRules(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      variable_pattern = null,
      completion_days = null,
      activation_days_before = 7,
      day_of_week = null
    } = req.body;

    // Upsert (insert o update)
    await req.db!.query(
      `INSERT INTO service_recurrence_rules
       (service_id, variable_pattern, completion_days, activation_days_before, day_of_week)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       variable_pattern = VALUES(variable_pattern),
       completion_days = VALUES(completion_days),
       activation_days_before = VALUES(activation_days_before),
       day_of_week = VALUES(day_of_week)`,
      [id, JSON.stringify(variable_pattern), JSON.stringify(completion_days),
       activation_days_before, day_of_week]
    );

    res.json({ message: 'Reglas de recurrencia guardadas exitosamente' });
  } catch (error: any) {
    console.error('Error saving recurrence rules:', error);
    res.status(500).json({ message: 'Error al guardar reglas de recurrencia', error: error.message });
  }
}

// ============================================
// OBTENER CONFIGURACIÓN COMPLETA
// ============================================

/**
 * GET /services/:id/full-config
 * Obtiene toda la configuración de un servicio (actividades, slots, campos, reglas)
 */
export async function getServiceFullConfig(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Obtener todo en paralelo
    const [activitiesResult, slotsResult, fieldsResult, rulesResult] = await Promise.all([
      req.db!.query(
        `SELECT id, activity_name, description, display_order, is_required
         FROM service_activities WHERE service_id = ? ORDER BY display_order`,
        [id]
      ),
      req.db!.query(
        `SELECT id, slot_name, slot_label, description, display_order, is_required,
                allowed_file_types, max_file_size_mb, visibility, send_via_whatsapp
         FROM service_upload_slots WHERE service_id = ? ORDER BY display_order`,
        [id]
      ),
      req.db!.query(
        `SELECT id, field_name, field_label, field_type, placeholder, default_value,
                is_required, validation_rules, select_options, display_order, help_text
         FROM service_client_form_fields WHERE service_id = ? ORDER BY display_order`,
        [id]
      ),
      req.db!.query(
        `SELECT variable_pattern, completion_days, activation_days_before, day_of_week
         FROM service_recurrence_rules WHERE service_id = ?`,
        [id]
      )
    ]);

    res.json({
      activities: (activitiesResult as any)[0],
      uploadSlots: (slotsResult as any)[0],
      formFields: (fieldsResult as any)[0],
      recurrenceRules: (rulesResult as any)[0][0] || null
    });
  } catch (error: any) {
    console.error('Error getting full config:', error);
    res.status(500).json({ message: 'Error al obtener configuración completa', error: error.message });
  }
}
