import { RequestHandler } from "express";
import bcrypt from "bcryptjs";

/**
 * GET /api/client-fields
 * Obtener todos los campos personalizados activos
 */
export const getClientFields: RequestHandler = async (req: any, res: any) => {
  try {
    const workspaceId = req.workspaceId || null;

    const [fields] = await req.db.query(
      `SELECT * FROM client_profile_fields
       WHERE is_active = TRUE
       AND (workspace_id IS NULL OR workspace_id = ?)
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
 * GET /api/client-fields/all
 * Obtener todos los campos (incluyendo inactivos) - solo admin
 */
export const getAllClientFields: RequestHandler = async (req: any, res: any) => {
  try {
    const workspaceId = req.workspaceId || null;

    const [fields] = await req.db.query(
      `SELECT * FROM client_profile_fields
       WHERE (workspace_id IS NULL OR workspace_id = ?)
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
 * POST /api/client-fields
 * Crear nuevo campo personalizado
 */
export const createClientField: RequestHandler = async (req: any, res: any) => {
  const {
    fieldKey, fieldLabel, fieldType, placeholder,
    isRequired, showInRegistration, showInList,
    selectOptions, validationPattern
  } = req.body;

  try {
    const workspaceId = req.workspaceId || null;

    // Obtener el orden máximo actual
    const [[maxOrder]] = await req.db.query(
      `SELECT COALESCE(MAX(display_order), 0) + 1 as next_order
       FROM client_profile_fields
       WHERE (workspace_id IS NULL OR workspace_id = ?)`,
      [workspaceId]
    );

    const [result] = await req.db.query(
      `INSERT INTO client_profile_fields
       (workspace_id, field_key, field_label, field_type, placeholder,
        is_required, show_in_registration, show_in_list,
        select_options, validation_pattern, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workspaceId,
        fieldKey,
        fieldLabel,
        fieldType || 'text',
        placeholder || null,
        isRequired || false,
        showInRegistration !== false,
        showInList || false,
        selectOptions ? JSON.stringify(selectOptions) : null,
        validationPattern || null,
        maxOrder.next_order
      ]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Campo creado correctamente'
    });
  } catch (error: any) {
    console.error('Error creando campo:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un campo con ese nombre interno' });
    }
    res.status(500).json({ error: 'Error al crear campo' });
  }
};

/**
 * PATCH /api/client-fields/:id
 * Actualizar campo personalizado
 */
export const updateClientField: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const fields: string[] = [];
    const params: any[] = [];

    const fieldMap: Record<string, string> = {
      fieldLabel: 'field_label',
      fieldType: 'field_type',
      placeholder: 'placeholder',
      isRequired: 'is_required',
      isActive: 'is_active',
      showInRegistration: 'show_in_registration',
      showInList: 'show_in_list',
      selectOptions: 'select_options',
      validationPattern: 'validation_pattern',
      displayOrder: 'display_order'
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbField} = ?`);
        if (key === 'selectOptions') {
          params.push(updates[key] ? JSON.stringify(updates[key]) : null);
        } else {
          params.push(updates[key]);
        }
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(id);
    await req.db.query(
      `UPDATE client_profile_fields SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Campo actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando campo:', error);
    res.status(500).json({ error: 'Error al actualizar campo' });
  }
};

/**
 * DELETE /api/client-fields/:id
 * Eliminar campo personalizado
 */
export const deleteClientField: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    // Verificar si es un campo del sistema (los primeros 5)
    const [[field]] = await req.db.query(
      `SELECT id FROM client_profile_fields WHERE id = ?`,
      [id]
    );

    if (!field) {
      return res.status(404).json({ error: 'Campo no encontrado' });
    }

    await req.db.query(`DELETE FROM client_profile_fields WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Campo eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando campo:', error);
    res.status(500).json({ error: 'Error al eliminar campo' });
  }
};

/**
 * POST /api/client-fields/reorder
 * Reordenar campos
 */
export const reorderClientFields: RequestHandler = async (req: any, res: any) => {
  const { orderedIds } = req.body;

  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await req.db.query(
        `UPDATE client_profile_fields SET display_order = ? WHERE id = ?`,
        [i, orderedIds[i]]
      );
    }

    res.json({ success: true, message: 'Campos reordenados correctamente' });
  } catch (error) {
    console.error('Error reordenando campos:', error);
    res.status(500).json({ error: 'Error al reordenar campos' });
  }
};

/**
 * GET /api/clients/:id/custom-values
 * Obtener valores personalizados de un cliente
 */
export const getClientCustomValues: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const [values] = await req.db.query(
      `SELECT ccv.field_id, ccv.field_value, cpf.field_key
       FROM client_custom_values ccv
       JOIN client_profile_fields cpf ON cpf.id = ccv.field_id
       WHERE ccv.client_user_id = ?`,
      [id]
    );

    // Convertir a objeto key-value
    const result: Record<string, string> = {};
    for (const v of values as any[]) {
      result[v.field_key] = v.field_value;
    }

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo valores:', error);
    res.status(500).json({ error: 'Error al obtener valores' });
  }
};

/**
 * PATCH /api/clients/:id/custom-values
 * Guardar valores personalizados de un cliente
 */
export const saveClientCustomValues: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const values = req.body; // { field_key: value, ... }

  try {
    // Obtener IDs de campos por su key
    const [fields] = await req.db.query(
      `SELECT id, field_key FROM client_profile_fields WHERE field_key IN (?)`,
      [Object.keys(values)]
    );

    for (const field of fields as any[]) {
      const value = values[field.field_key];

      await req.db.query(
        `INSERT INTO client_custom_values (client_user_id, field_id, field_value)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE field_value = VALUES(field_value)`,
        [id, field.id, value || null]
      );
    }

    res.json({ success: true, message: 'Valores guardados correctamente' });
  } catch (error) {
    console.error('Error guardando valores:', error);
    res.status(500).json({ error: 'Error al guardar valores' });
  }
};

/**
 * POST /api/clients/create
 * Crear nuevo cliente manualmente (admin)
 */
export const createClient: RequestHandler = async (req: any, res: any) => {
  const {
    fullName, email, password, nit, phoneNumber,
    sede, grupo, contractNumber, customFields
  } = req.body;

  try {
    // Verificar que el email no exista
    const [[existing]] = await req.db.query(
      `SELECT id FROM users WHERE email = ?`,
      [email]
    );

    if (existing) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password || 'Cliente123!', 10);

    // Crear usuario
    const [userResult] = await req.db.query(
      `INSERT INTO users (email, password_hash, full_name, nit, phone_number, role, is_active)
       VALUES (?, ?, ?, ?, ?, 'client', TRUE)`,
      [email, hashedPassword, fullName, nit || null, phoneNumber || null]
    );

    const userId = userResult.insertId;

    // Crear perfil de cliente
    await req.db.query(
      `INSERT INTO clients_profiles (user_id, sede, grupo, contract_number)
       VALUES (?, ?, ?, ?)`,
      [userId, sede || null, grupo || null, contractNumber || null]
    );

    // Asignar al workspace actual si existe
    const workspaceId = req.workspaceId;
    if (workspaceId) {
      await req.db.query(
        `INSERT INTO user_workspaces (user_id, workspace_id, role_in_workspace)
         VALUES (?, ?, 'member')`,
        [userId, workspaceId]
      );
    }

    // Guardar campos personalizados si existen
    if (customFields && typeof customFields === 'object') {
      const [fields] = await req.db.query(
        `SELECT id, field_key FROM client_profile_fields WHERE field_key IN (?)`,
        [Object.keys(customFields)]
      );

      for (const field of fields as any[]) {
        const value = customFields[field.field_key];
        if (value !== undefined && value !== '') {
          await req.db.query(
            `INSERT INTO client_custom_values (client_user_id, field_id, field_value)
             VALUES (?, ?, ?)`,
            [userId, field.id, value]
          );
        }
      }
    }

    res.status(201).json({
      success: true,
      id: userId,
      message: 'Cliente creado correctamente'
    });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};
