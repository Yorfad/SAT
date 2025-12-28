import { RequestHandler } from "express";
import bcrypt from "bcryptjs";

// Columnas del sistema que NO se pueden modificar ni eliminar
// Incluye PKs, FKs, campos calculados y campos default obligatorios
const SYSTEM_COLUMNS = [
  // Campos de la tabla users (siempre requeridos)
  'full_name',                  // Nombre completo del usuario
  'email',                      // Email del usuario (login)
  'nit',                        // NIT del cliente
  // Campos de clients_profiles
  'user_id',                    // PK - relación con users
  'workspace_id',               // FK - workspace del cliente
  'sat_password',               // Contraseña SAT (en client_profile_fields)
  'sat_password_encrypted',     // Contraseña SAT (columna real encriptada)
  'firma_electronica',          // Firma electrónica del cliente
  'phone_number',               // Teléfono del cliente (migrado de users)
  'birth_date',                 // Fecha de nacimiento (migrado de users)
  'overall_rating',             // Calculado automáticamente
  'active_infractions_count',   // Calculado automáticamente
  'ratings_count',              // Calculado automáticamente
  'account_balance'             // Saldo del cliente
];

// Campos editables/eliminables por el admin
const EDITABLE_FIELDS = [
  'company_name',     // Empresa
  'contract_number',  // Número de contrato
  'sede',             // Sede
  'grupo',            // Grupo
  'address',          // Dirección
  'notes'             // Notas
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

/**
 * Obtener todas las columnas actuales de clients_profiles
 */
async function getExistingColumns(db: any): Promise<string[]> {
  const [columns]: any = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients_profiles'`
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
 * GET /api/client-fields
 * Obtener campos activos para el workspace actual (con herencia)
 */
export const getClientFields: RequestHandler = async (req: any, res: any) => {
  try {
    const workspaceId = req.workspaceId || null;

    // Obtener campos base (workspace_id IS NULL) y específicos del workspace
    const [fields] = await req.db.query(
      `SELECT
        cpf.*,
        COALESCE(ws_override.is_required, cpf.is_required) as effective_required,
        COALESCE(ws_override.show_in_registration, cpf.show_in_registration) as effective_show_registration,
        COALESCE(ws_override.is_active, cpf.is_active) as effective_active,
        ws_override.id as override_id
       FROM client_profile_fields cpf
       LEFT JOIN client_profile_fields ws_override
         ON ws_override.field_key = cpf.field_key
         AND ws_override.workspace_id = ?
       WHERE cpf.workspace_id IS NULL
         AND COALESCE(ws_override.is_active, cpf.is_active) = TRUE
       ORDER BY COALESCE(ws_override.display_order, cpf.display_order) ASC`,
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
 * Obtener campos para admin - filtra por workspace actual a menos que sea vista consolidada
 */
export const getAllClientFields: RequestHandler = async (req: any, res: any) => {
  try {
    const workspaceId = req.workspaceId || null;
    const isConsolidated = req.isConsolidatedView;
    const existingColumns = await getExistingColumns(req.db);

    // En vista consolidada: todos los campos base
    // En workspace específico: solo campos activos para ese workspace
    let query: string;
    let params: any[];

    if (isConsolidated) {
      // Vista consolidada: mostrar todos los campos base
      query = `
        SELECT cpf.*,
          NULL as override_id,
          NULL as ws_required,
          NULL as ws_show_registration,
          NULL as ws_active,
          NULL as ws_display_order
        FROM client_profile_fields cpf
        WHERE cpf.workspace_id IS NULL
        ORDER BY cpf.display_order ASC`;
      params = [];
    } else {
      // Workspace específico: solo campos activos para este workspace
      query = `
        SELECT
          cpf.*,
          ws_override.id as override_id,
          ws_override.is_required as ws_required,
          ws_override.show_in_registration as ws_show_registration,
          ws_override.is_active as ws_active,
          ws_override.display_order as ws_display_order
        FROM client_profile_fields cpf
        LEFT JOIN client_profile_fields ws_override
          ON ws_override.field_key = cpf.field_key
          AND ws_override.workspace_id = ?
        WHERE cpf.workspace_id IS NULL
          AND COALESCE(ws_override.is_active, cpf.is_active) = TRUE
        ORDER BY COALESCE(ws_override.display_order, cpf.display_order) ASC`;
      params = [workspaceId];
    }

    const [fields] = await req.db.query(query, params);

    // Agregar info de si la columna existe realmente
    // Campos de la tabla users (source_table='users') siempre son protegidos
    const enrichedFields = (fields as any[]).map(f => ({
      ...f,
      column_exists: f.source_table === 'users' || existingColumns.includes(f.field_key.toLowerCase()),
      is_protected: SYSTEM_COLUMNS.includes(f.field_key) || f.source_table === 'users'
    }));

    res.json(enrichedFields);
  } catch (error) {
    console.error('Error obteniendo campos:', error);
    res.status(500).json({ error: 'Error al obtener campos' });
  }
};

/**
 * POST /api/client-fields
 * Crear nuevo campo - crea columna real y configura visibilidad
 */
export const createClientField: RequestHandler = async (req: any, res: any) => {
  const {
    fieldKey, fieldLabel, fieldType, placeholder,
    isRequired, showInRegistration,
    selectOptions, validationPattern,
    applyToAllWorkspaces  // Si es false, solo se activa en el workspace actual
  } = req.body;

  const workspaceId = req.workspaceId;
  const isGlobal = !workspaceId || req.isConsolidatedView || applyToAllWorkspaces;

  // Validar nombre de columna (generado automáticamente desde fieldLabel)
  const columnName = (fieldKey || fieldLabel).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // Quitar acentos
    .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  if (!isValidColumnName(columnName)) {
    return res.status(400).json({
      error: 'Nombre de campo inválido. Use solo letras minúsculas, números y guión bajo. Debe empezar con letra.'
    });
  }

  // Verificar que no sea una columna del sistema
  if (SYSTEM_COLUMNS.includes(columnName)) {
    return res.status(400).json({
      error: 'No se puede crear un campo con ese nombre, es una columna del sistema.'
    });
  }

  try {
    // Verificar si la columna ya existe
    const existingColumns = await getExistingColumns(req.db);
    if (existingColumns.includes(columnName)) {
      return res.status(400).json({
        error: 'Ya existe una columna con ese nombre en la tabla.'
      });
    }

    // Determinar tipo SQL
    const sqlType = FIELD_TYPE_TO_SQL[fieldType] || 'VARCHAR(255)';

    // 1. Crear la columna real en clients_profiles
    await req.db.query(
      `ALTER TABLE clients_profiles ADD COLUMN \`${columnName}\` ${sqlType} NULL`
    );

    console.log(`[CLIENT-FIELDS] Columna creada: ${columnName} (${sqlType})`);

    // 2. Obtener el orden máximo actual
    const [[maxOrder]]: any = await req.db.query(
      `SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM client_profile_fields WHERE workspace_id IS NULL`
    );

    // 3. Registrar en client_profile_fields (configuración base)
    // Si NO es global, el campo base se crea inactivo y luego se activa solo en el workspace actual
    const baseIsActive = isGlobal;

    const [result]: any = await req.db.query(
      `INSERT INTO client_profile_fields
       (workspace_id, field_key, field_label, field_type, placeholder,
        is_required, show_in_registration, is_active,
        select_options, validation_pattern, display_order, column_type, column_exists)
       VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        columnName,
        fieldLabel,
        fieldType || 'text',
        placeholder || null,
        isGlobal ? (isRequired || false) : false,           // Si no es global, base no es requerido
        isGlobal ? (showInRegistration !== false) : false,  // Si no es global, base no muestra en registro
        baseIsActive,
        selectOptions ? JSON.stringify(selectOptions) : null,
        validationPattern || null,
        maxOrder.next_order,
        sqlType
      ]
    );

    // 4. Si NO es global, crear override para el workspace actual con la configuración especificada
    if (!isGlobal && workspaceId) {
      await req.db.query(
        `INSERT INTO client_profile_fields
         (workspace_id, field_key, field_label, field_type, placeholder,
          is_required, show_in_registration, is_active, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
        [
          workspaceId,
          columnName,
          fieldLabel,
          fieldType || 'text',
          placeholder || null,
          isRequired || false,
          showInRegistration !== false,
          maxOrder.next_order
        ]
      );
      console.log(`[CLIENT-FIELDS] Campo ${columnName} activado solo en workspace ${workspaceId}`);
    }

    // 5. Registrar en tabla de columnas
    await req.db.query(
      `INSERT IGNORE INTO client_profile_columns (column_name, column_type, is_system, created_by_user_id)
       VALUES (?, ?, 0, ?)`,
      [columnName, sqlType, req.user?.sub || null]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      columnName,
      message: isGlobal
        ? `Campo "${fieldLabel}" creado y activado en todos los workspaces.`
        : `Campo "${fieldLabel}" creado y activado solo en el workspace actual.`
    });
  } catch (error: any) {
    console.error('Error creando campo:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un campo con ese nombre' });
    }
    if (error.code === 'ER_DUP_FIELDNAME') {
      return res.status(400).json({ error: 'Ya existe una columna con ese nombre en la tabla' });
    }
    res.status(500).json({ error: 'Error al crear campo: ' + error.message });
  }
};

/**
 * PATCH /api/client-fields/:id
 * Actualizar campo - comportamiento diferente según contexto
 */
export const updateClientField: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const updates = req.body;
  const workspaceId = req.workspaceId;
  const isGlobal = !workspaceId || req.isConsolidatedView;

  try {
    // Obtener el campo actual
    const [[field]]: any = await req.db.query(
      `SELECT * FROM client_profile_fields WHERE id = ?`,
      [id]
    );

    if (!field) {
      return res.status(404).json({ error: 'Campo no encontrado' });
    }

    // Si es un campo del sistema, solo permitir cambios de visibilidad (NO de requerido - siempre son requeridos)
    if (SYSTEM_COLUMNS.includes(field.field_key)) {
      const allowedUpdates = ['showInRegistration', 'displayOrder', 'isActive'];
      const hasDisallowedUpdates = Object.keys(updates).some(k => !allowedUpdates.includes(k));
      if (hasDisallowedUpdates) {
        return res.status(403).json({
          error: 'Este es un campo del sistema. Solo se puede modificar visibilidad en registro y estado.'
        });
      }
      // Forzar is_required = true para campos del sistema
      updates.isRequired = true;
    }

    // Si estamos en un workspace específico, crear/actualizar override
    if (!isGlobal && field.workspace_id === null) {
      // Verificar si ya existe un override para este workspace
      const [[existingOverride]]: any = await req.db.query(
        `SELECT id FROM client_profile_fields
         WHERE field_key = ? AND workspace_id = ?`,
        [field.field_key, workspaceId]
      );

      if (existingOverride) {
        // Actualizar override existente
        await updateFieldRecord(req.db, existingOverride.id, updates);
      } else {
        // Crear nuevo override copiando configuración base
        await req.db.query(
          `INSERT INTO client_profile_fields
           (workspace_id, field_key, field_label, field_type, placeholder,
            is_required, show_in_registration,
            select_options, validation_pattern, display_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            workspaceId,
            field.field_key,
            updates.fieldLabel ?? field.field_label,
            field.field_type,
            updates.placeholder ?? field.placeholder,
            updates.isRequired ?? field.is_required,
            updates.showInRegistration ?? field.show_in_registration,
            field.select_options,
            field.validation_pattern,
            updates.displayOrder ?? field.display_order
          ]
        );
      }

      return res.json({
        success: true,
        message: 'Configuración del workspace actualizada'
      });
    }

    // Si estamos en vista global, actualizar el campo base
    // Y si cambia el tipo, modificar la columna
    if (updates.fieldType && updates.fieldType !== field.field_type) {
      const newSqlType = FIELD_TYPE_TO_SQL[updates.fieldType] || 'VARCHAR(255)';
      try {
        await req.db.query(
          `ALTER TABLE clients_profiles MODIFY COLUMN \`${field.field_key}\` ${newSqlType}`
        );
        console.log(`[CLIENT-FIELDS] Columna modificada: ${field.field_key} → ${newSqlType}`);
      } catch (alterError: any) {
        console.error('Error modificando columna:', alterError);
        return res.status(400).json({
          error: 'No se puede cambiar el tipo de dato. Puede haber datos incompatibles.'
        });
      }
    }

    await updateFieldRecord(req.db, id, updates);
    res.json({ success: true, message: 'Campo actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando campo:', error);
    res.status(500).json({ error: 'Error al actualizar campo' });
  }
};

/**
 * Helper para actualizar registro en client_profile_fields
 */
async function updateFieldRecord(db: any, id: number, updates: any) {
  const fields: string[] = [];
  const params: any[] = [];

  const fieldMap: Record<string, string> = {
    fieldLabel: 'field_label',
    fieldType: 'field_type',
    placeholder: 'placeholder',
    isRequired: 'is_required',
    isActive: 'is_active',
    showInRegistration: 'show_in_registration',
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

  if (fields.length > 0) {
    params.push(id);
    await db.query(
      `UPDATE client_profile_fields SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
  }
}

/**
 * DELETE /api/client-fields/:id
 * Eliminar campo - SOLO desde vista global (elimina columna real)
 */
export const deleteClientField: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const workspaceId = req.workspaceId;
  const isGlobal = !workspaceId || req.isConsolidatedView;

  try {
    // Obtener el campo
    const [[field]]: any = await req.db.query(
      `SELECT * FROM client_profile_fields WHERE id = ?`,
      [id]
    );

    if (!field) {
      return res.status(404).json({ error: 'Campo no encontrado' });
    }

    // Si es un campo del sistema, no se puede eliminar
    if (SYSTEM_COLUMNS.includes(field.field_key)) {
      return res.status(403).json({
        error: 'Este es un campo del sistema y no se puede eliminar.'
      });
    }

    // Si es un override de workspace, solo eliminar el override
    if (field.workspace_id !== null) {
      await req.db.query(`DELETE FROM client_profile_fields WHERE id = ?`, [id]);
      return res.json({
        success: true,
        message: 'Configuración del workspace restaurada a valores por defecto'
      });
    }

    // Si es un campo base y no estamos en vista global, no permitir
    if (!isGlobal) {
      return res.status(403).json({
        error: 'Los campos solo se pueden eliminar desde la vista General.'
      });
    }

    // Eliminar columna de la tabla
    try {
      await req.db.query(
        `ALTER TABLE clients_profiles DROP COLUMN \`${field.field_key}\``
      );
      console.log(`[CLIENT-FIELDS] Columna eliminada: ${field.field_key}`);
    } catch (alterError: any) {
      console.error('Error eliminando columna:', alterError);
      // Continuar de todos modos para limpiar metadatos
    }

    // Eliminar todos los registros relacionados (base + overrides)
    await req.db.query(
      `DELETE FROM client_profile_fields WHERE field_key = ?`,
      [field.field_key]
    );

    // Eliminar de tabla de columnas
    await req.db.query(
      `DELETE FROM client_profile_columns WHERE column_name = ?`,
      [field.field_key]
    );

    res.json({
      success: true,
      message: `Campo "${field.field_label}" eliminado. Columna ${field.field_key} removida de la tabla.`
    });
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
  const workspaceId = req.workspaceId;

  try {
    for (let i = 0; i < orderedIds.length; i++) {
      // Si hay workspace, actualizar el display_order del override o crearlo
      if (workspaceId) {
        const [[field]]: any = await req.db.query(
          `SELECT field_key FROM client_profile_fields WHERE id = ?`,
          [orderedIds[i]]
        );

        if (field) {
          await req.db.query(
            `INSERT INTO client_profile_fields (workspace_id, field_key, display_order, field_label, field_type)
             SELECT ?, field_key, ?, field_label, field_type
             FROM client_profile_fields WHERE id = ?
             ON DUPLICATE KEY UPDATE display_order = VALUES(display_order)`,
            [workspaceId, i, orderedIds[i]]
          );
        }
      } else {
        await req.db.query(
          `UPDATE client_profile_fields SET display_order = ? WHERE id = ?`,
          [i, orderedIds[i]]
        );
      }
    }

    res.json({ success: true, message: 'Campos reordenados correctamente' });
  } catch (error) {
    console.error('Error reordenando campos:', error);
    res.status(500).json({ error: 'Error al reordenar campos' });
  }
};

/**
 * GET /api/client-fields/columns
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
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'clients_profiles'
       ORDER BY ORDINAL_POSITION`
    );

    // Marcar columnas del sistema
    const enriched = columns.map((col: any) => ({
      ...col,
      isSystem: SYSTEM_COLUMNS.includes(col.name.toLowerCase()),
      isProtected: ['user_id', 'workspace_id'].includes(col.name.toLowerCase())
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Error obteniendo columnas:', error);
    res.status(500).json({ error: 'Error al obtener columnas' });
  }
};

/**
 * POST /api/client-fields/sync
 * Sincronizar campos con columnas existentes (para campos que existen pero no tienen registro)
 */
export const syncFieldsWithColumns: RequestHandler = async (req: any, res: any) => {
  try {
    const existingColumns = await getExistingColumns(req.db);

    // Obtener campos registrados
    const [registeredFields]: any = await req.db.query(
      `SELECT field_key FROM client_profile_fields WHERE workspace_id IS NULL`
    );
    const registeredKeys = registeredFields.map((f: any) => f.field_key.toLowerCase());

    // Columnas que existen pero no están registradas
    const unregistered = existingColumns.filter(
      col => !registeredKeys.includes(col) && !SYSTEM_COLUMNS.includes(col)
    );

    let created = 0;
    for (const colName of unregistered) {
      // Obtener tipo de la columna
      const [[colInfo]]: any = await req.db.query(
        `SELECT DATA_TYPE, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients_profiles' AND COLUMN_NAME = ?`,
        [colName]
      );

      if (colInfo) {
        await req.db.query(
          `INSERT IGNORE INTO client_profile_fields
           (workspace_id, field_key, field_label, field_type, column_type, column_exists)
           VALUES (NULL, ?, ?, 'text', ?, TRUE)`,
          [colName, colName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()), colInfo.COLUMN_TYPE]
        );
        created++;
      }
    }

    res.json({
      success: true,
      message: `Sincronización completada. ${created} campos nuevos registrados.`,
      newFields: unregistered
    });
  } catch (error) {
    console.error('Error sincronizando:', error);
    res.status(500).json({ error: 'Error al sincronizar campos' });
  }
};

// ============ Funciones existentes que se mantienen ============

/**
 * GET /api/clients/:id/custom-values
 * Obtener valores de campos dinámicos de un cliente
 */
export const getClientCustomValues: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    // Obtener campos dinámicos definidos
    const [fields]: any = await req.db.query(
      `SELECT field_key FROM client_profile_fields WHERE workspace_id IS NULL AND column_exists = TRUE`
    );

    if (fields.length === 0) {
      return res.json({});
    }

    // Construir query para obtener valores de columnas dinámicas
    const columnNames = fields.map((f: any) => `\`${f.field_key}\``).join(', ');

    const [[values]]: any = await req.db.query(
      `SELECT ${columnNames} FROM clients_profiles WHERE user_id = ?`,
      [id]
    );

    res.json(values || {});
  } catch (error) {
    console.error('Error obteniendo valores:', error);
    res.status(500).json({ error: 'Error al obtener valores' });
  }
};

/**
 * PATCH /api/clients/:id/custom-values
 * Guardar valores de campos dinámicos de un cliente
 */
export const saveClientCustomValues: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const values = req.body;

  try {
    // Obtener columnas existentes para validar
    const existingColumns = await getExistingColumns(req.db);

    const updates: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(values)) {
      const colName = key.toLowerCase();
      if (existingColumns.includes(colName) && !SYSTEM_COLUMNS.includes(colName)) {
        updates.push(`\`${colName}\` = ?`);
        params.push(value ?? null);
      }
    }

    if (updates.length === 0) {
      return res.json({ success: true, message: 'No hay campos para actualizar' });
    }

    params.push(id);
    await req.db.query(
      `UPDATE clients_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
      params
    );

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
    customFields, ...dynamicFields
  } = req.body;

  const workspaceId = req.workspaceId;

  // Validación de campos requeridos
  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    return res.status(400).json({ error: 'El nombre completo es requerido' });
  }

  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ error: 'El email es requerido' });
  }

  try {
    // Verificar que el email no exista
    const [[existing]]: any = await req.db.query(
      `SELECT id FROM users WHERE email = ?`,
      [email]
    );

    if (existing) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password || 'Cliente123!', 10);

    // Crear usuario (solo datos esenciales: id, nit, nombre, email, FK, auditoría)
    const [userResult]: any = await req.db.query(
      `INSERT INTO users (email, password_hash, full_name, nit, role, is_active)
       VALUES (?, ?, ?, ?, 'client', TRUE)`,
      [email, hashedPassword, fullName, nit || null]
    );

    const userId = userResult.insertId;

    // Preparar columnas dinámicas para el perfil
    const existingColumns = await getExistingColumns(req.db);
    const profileUpdates: string[] = ['user_id', 'workspace_id'];
    const profileValues: any[] = [userId, workspaceId || null];

    // Agregar phone_number al perfil si existe
    if (phoneNumber && existingColumns.includes('phone_number')) {
      profileUpdates.push('`phone_number`');
      profileValues.push(phoneNumber);
    }

    // Agregar campos del body que correspondan a columnas existentes
    const allFields = { ...customFields, ...dynamicFields };
    for (const [key, value] of Object.entries(allFields)) {
      const colName = key.toLowerCase();
      if (existingColumns.includes(colName) && !['user_id', 'workspace_id', 'phone_number'].includes(colName)) {
        profileUpdates.push(`\`${colName}\``);
        profileValues.push(value ?? null);
      }
    }

    // Crear perfil de cliente
    const placeholders = profileValues.map(() => '?').join(', ');
    await req.db.query(
      `INSERT INTO clients_profiles (${profileUpdates.join(', ')}) VALUES (${placeholders})`,
      profileValues
    );

    // Asignar al workspace actual si existe
    if (workspaceId) {
      await req.db.query(
        `INSERT INTO user_workspaces (user_id, workspace_id, role_in_workspace)
         VALUES (?, ?, 'member')`,
        [userId, workspaceId]
      );
    }

    res.status(201).json({
      success: true,
      id: userId,
      message: 'Cliente creado correctamente'
    });
  } catch (error: any) {
    console.error('Error creando cliente:', error);
    res.status(500).json({ error: 'Error al crear cliente: ' + error.message });
  }
};
