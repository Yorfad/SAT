import { RequestHandler } from 'express';

/**
 * GET /api/bulk-assignment/fields
 * Obtiene los campos disponibles para filtrar clientes (incluye campos personalizados)
 */
export const getFilterableFields: RequestHandler = async (req: any, res: any) => {
  try {
    const workspaceId = req.workspaceId || null;

    // Campos base del sistema
    const baseFields = [
      { key: 'full_name', label: 'Nombre', type: 'text', source: 'users' },
      { key: 'email', label: 'Email', type: 'text', source: 'users' },
      { key: 'nit', label: 'NIT', type: 'text', source: 'users' },
      { key: 'phone_number', label: 'Teléfono', type: 'text', source: 'users' },
      { key: 'is_active', label: 'Estado', type: 'select', source: 'users', options: ['Activo', 'Inactivo'] },
    ];

    // Obtener campos personalizados activos
    const [customFields]: any = await req.db.query(
      `SELECT id, field_key, field_label, field_type, select_options
       FROM client_profile_fields
       WHERE is_active = TRUE
       AND (workspace_id IS NULL OR workspace_id = ?)
       ORDER BY display_order ASC`,
      [workspaceId]
    );

    // Formatear campos personalizados
    // Tipos que se muestran como select: select, checkbox (sí/no)
    // Tipos que se muestran como texto: text, number, email, phone, textarea, date
    const formattedCustomFields = customFields.map((f: any) => {
      let fieldType: 'text' | 'select' = 'text';
      let options: any = null;

      if (f.field_type === 'select') {
        fieldType = 'select';
        options = f.select_options ? JSON.parse(f.select_options) : [];
      } else if (f.field_type === 'checkbox') {
        fieldType = 'select';
        options = ['Sí', 'No'];
      }

      return {
        key: `custom_${f.field_key}`,
        label: f.field_label,
        type: fieldType,
        source: 'custom',
        fieldId: f.id,
        originalType: f.field_type, // Para referencia
        options,
      };
    });

    // Obtener servicios para filtrar por servicio contratado
    const [services]: any = await req.db.query(
      `SELECT id, service_name FROM services WHERE is_active = TRUE ORDER BY service_name`
    );

    const serviceField = {
      key: 'has_service',
      label: 'Tiene Servicio',
      type: 'select',
      source: 'services',
      options: services.map((s: any) => ({ id: s.id, name: s.service_name })),
    };

    res.json({
      fields: [...baseFields, serviceField, ...formattedCustomFields],
    });
  } catch (error) {
    console.error('Error getting filterable fields:', error);
    res.status(500).json({ message: 'Error al obtener campos filtrables' });
  }
};

/**
 * POST /api/bulk-assignment/filter-clients
 * Filtra clientes según los criterios especificados
 */
export const filterClients: RequestHandler = async (req: any, res: any) => {
  try {
    const { filters } = req.body; // Array de { field, operator, value }
    const workspaceId = req.workspaceId;
    const isConsolidated = req.isConsolidatedView;

    let query = `
      SELECT DISTINCT
        u.id,
        u.full_name,
        u.email,
        u.nit,
        u.is_active,
        cp.phone_number,
        cp.workspace_id,
        w.name as workspace_name,
        w.color as workspace_color
      FROM users u
      LEFT JOIN clients_profiles cp ON cp.user_id = u.id
      LEFT JOIN workspaces w ON w.id = cp.workspace_id
    `;

    const params: any[] = [];
    const joins: string[] = [];
    const conditions: string[] = [`u.role = 'client'`];

    // Filtrar por workspace si no es vista consolidada
    if (!isConsolidated && workspaceId) {
      conditions.push(`cp.workspace_id = ?`);
      params.push(workspaceId);
    }

    // Procesar cada filtro
    if (filters && Array.isArray(filters)) {
      for (const filter of filters) {
        const { field, operator, value } = filter;

        if (!field || !operator || value === undefined || value === '') continue;

        // Campos de usuario (users table)
        if (['full_name', 'email', 'nit'].includes(field)) {
          switch (operator) {
            case 'contains':
              conditions.push(`u.${field} LIKE ?`);
              params.push(`%${value}%`);
              break;
            case 'equals':
              conditions.push(`u.${field} = ?`);
              params.push(value);
              break;
            case 'starts_with':
              conditions.push(`u.${field} LIKE ?`);
              params.push(`${value}%`);
              break;
          }
        }

        // phone_number está en clients_profiles
        if (field === 'phone_number') {
          switch (operator) {
            case 'contains':
              conditions.push(`cp.phone_number LIKE ?`);
              params.push(`%${value}%`);
              break;
            case 'equals':
              conditions.push(`cp.phone_number = ?`);
              params.push(value);
              break;
            case 'starts_with':
              conditions.push(`cp.phone_number LIKE ?`);
              params.push(`${value}%`);
              break;
          }
        }

        // Estado activo/inactivo
        if (field === 'is_active') {
          conditions.push(`u.is_active = ?`);
          params.push(value === 'Activo' ? true : false);
        }

        // Filtro por servicio
        if (field === 'has_service') {
          joins.push(`
            INNER JOIN client_services cs_filter ON cs_filter.client_user_id = u.id
              AND cs_filter.service_id = ? AND cs_filter.status = 'active'
          `);
          params.push(value);
        }

        // Campos personalizados
        if (field.startsWith('custom_')) {
          const fieldKey = field.replace('custom_', '');
          const aliasName = `ccv_${fieldKey.replace(/[^a-z0-9]/gi, '')}`;

          joins.push(`
            LEFT JOIN client_custom_values ${aliasName} ON ${aliasName}.client_user_id = u.id
            LEFT JOIN client_profile_fields cpf_${aliasName} ON cpf_${aliasName}.id = ${aliasName}.field_id
              AND cpf_${aliasName}.field_key = ?
          `);
          params.push(fieldKey);

          switch (operator) {
            case 'contains':
              conditions.push(`${aliasName}.field_value LIKE ?`);
              params.push(`%${value}%`);
              break;
            case 'equals':
              conditions.push(`${aliasName}.field_value = ?`);
              params.push(value);
              break;
            case 'starts_with':
              conditions.push(`${aliasName}.field_value LIKE ?`);
              params.push(`${value}%`);
              break;
          }
        }
      }
    }

    // Construir query final
    query += joins.join(' ');
    query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY u.full_name`;
    query += ` LIMIT 500`; // Limitar resultados para performance

    const [clients]: any = await req.db.query(query, params);

    // Obtener valores de campos personalizados para los clientes encontrados
    if (clients.length > 0) {
      const clientIds = clients.map((c: any) => c.id);
      const [customValues]: any = await req.db.query(
        `SELECT ccv.client_user_id, cpf.field_key, ccv.field_value
         FROM client_custom_values ccv
         JOIN client_profile_fields cpf ON cpf.id = ccv.field_id
         WHERE ccv.client_user_id IN (?)`,
        [clientIds]
      );

      // Mapear valores a clientes
      const valuesMap: Record<number, Record<string, string>> = {};
      for (const v of customValues) {
        if (!valuesMap[v.client_user_id]) valuesMap[v.client_user_id] = {};
        valuesMap[v.client_user_id][v.field_key] = v.field_value;
      }

      for (const client of clients) {
        client.custom_fields = valuesMap[client.id] || {};
      }
    }

    res.json({
      clients,
      total: clients.length,
    });
  } catch (error) {
    console.error('Error filtering clients:', error);
    res.status(500).json({ message: 'Error al filtrar clientes' });
  }
};

/**
 * POST /api/bulk-assignment/assign-tasks
 * Asigna tareas en masa a los clientes seleccionados
 * Las tareas se crean en monthly_service_checklist asociadas a facturas mensuales
 */
export const bulkAssignTasks: RequestHandler = async (req: any, res: any) => {
  try {
    const { clientIds, serviceId, assigneeId, dueDate, notes, priority } = req.body;
    const workspaceId = req.workspaceId;

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return res.status(400).json({ message: 'Debe seleccionar al menos un cliente' });
    }

    if (!serviceId) {
      return res.status(400).json({ message: 'Debe seleccionar un servicio' });
    }

    // Obtener información del servicio
    const [services]: any = await req.db.query(
      `SELECT id, service_name FROM services WHERE id = ?`,
      [serviceId]
    );

    if (services.length === 0) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    const service = services[0];
    const createdTasks: number[] = [];
    const errors: string[] = [];

    // Año y mes actual para crear/buscar facturas
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Crear tarea para cada cliente
    for (const clientId of clientIds) {
      try {
        // Verificar que el cliente existe
        const [clients]: any = await req.db.query(
          `SELECT u.id, u.full_name, cp.workspace_id
           FROM users u
           LEFT JOIN clients_profiles cp ON cp.user_id = u.id
           WHERE u.id = ? AND u.role = 'client'`,
          [clientId]
        );

        if (clients.length === 0) {
          errors.push(`Cliente ID ${clientId} no encontrado`);
          continue;
        }

        const client = clients[0];
        const clientWorkspaceId = workspaceId || client.workspace_id;

        // Buscar o crear factura mensual para este cliente
        let [invoices]: any = await req.db.query(
          `SELECT id FROM monthly_invoices
           WHERE client_user_id = ? AND invoice_year = ? AND invoice_month = ?`,
          [clientId, currentYear, currentMonth]
        );

        let invoiceId: number;
        if (invoices.length === 0) {
          // Crear factura mensual
          const [invoiceResult]: any = await req.db.query(
            `INSERT INTO monthly_invoices
             (workspace_id, client_user_id, invoice_year, invoice_month,
              previous_debt, monthly_fee, extras_fee, total_due, balance,
              payment_status, due_date)
             VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0, 'pending', ?)`,
            [clientWorkspaceId, clientId, currentYear, currentMonth, dueDate || null]
          );
          invoiceId = invoiceResult.insertId;
        } else {
          invoiceId = invoices[0].id;
        }

        // Crear la tarea en monthly_service_checklist
        const taskName = notes || `${service.service_name} - Asignación masiva`;
        const [result]: any = await req.db.query(
          `INSERT INTO monthly_service_checklist
           (workspace_id, invoice_id, task_name, status, service_id, next_payment_date)
           VALUES (?, ?, ?, 'pending', ?, ?)`,
          [clientWorkspaceId, invoiceId, taskName, serviceId, dueDate || null]
        );

        createdTasks.push(result.insertId);

        // Si hay empleado asignado, actualizar la tarea con completed_by_user_id como "asignado"
        // (El sistema usa completed_by_user_id para mostrar quién completó, no quién está asignado)
        // Para esto usaremos un approach diferente: guardar en las notas
      } catch (err: any) {
        errors.push(`Error con cliente ${clientId}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Se crearon ${createdTasks.length} tareas`,
      created: createdTasks.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in bulk assign tasks:', error);
    res.status(500).json({ message: 'Error al asignar tareas en masa' });
  }
};

/**
 * GET /api/bulk-assignment/services
 * Obtiene los servicios disponibles para asignar
 */
export const getServicesForAssignment: RequestHandler = async (req: any, res: any) => {
  try {
    const [services]: any = await req.db.query(
      `SELECT id, service_name, description, recurrence_type, default_price
       FROM services
       WHERE is_active = TRUE
       ORDER BY service_name`
    );

    res.json({ services });
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({ message: 'Error al obtener servicios' });
  }
};

/**
 * GET /api/bulk-assignment/employees
 * Obtiene los empleados disponibles para asignar tareas
 */
export const getEmployeesForAssignment: RequestHandler = async (req: any, res: any) => {
  try {
    const workspaceId = req.workspaceId;

    let query = `
      SELECT u.id, u.full_name, u.email
      FROM users u
      WHERE u.role IN ('admin', 'employee') AND u.is_active = TRUE
    `;
    const params: any[] = [];

    // Si hay workspace, filtrar por usuarios del workspace
    if (workspaceId) {
      query += `
        AND (
          u.role = 'admin'
          OR EXISTS (
            SELECT 1 FROM user_workspaces uw
            WHERE uw.user_id = u.id AND uw.workspace_id = ?
          )
        )
      `;
      params.push(workspaceId);
    }

    query += ` ORDER BY u.full_name`;

    const [employees]: any = await req.db.query(query, params);

    res.json({ employees });
  } catch (error) {
    console.error('Error getting employees:', error);
    res.status(500).json({ message: 'Error al obtener empleados' });
  }
};
