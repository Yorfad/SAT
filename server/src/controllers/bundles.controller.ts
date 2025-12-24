import { RequestHandler } from "express";

// Tipos para la configuración de servicios en bundles
interface BundleServiceConfig {
  serviceId: number;
  includeInBasePrice: boolean;  // ¿Está incluido en el precio base?
  addWhenDue: boolean;          // ¿Se suma cuando toca por recurrencia?
  customPrice?: number;         // Precio personalizado (null = usar default)
  assignmentType: 'all_clients' | 'selected_clients';
}

// ================== PLANTILLAS DE BUNDLES ==================

/**
 * GET /api/bundles
 * Listar todas las plantillas de bundles (con sus servicios y configuración)
 */
export const listBundles: RequestHandler = async (req: any, res: any) => {
  const workspaceId = req.workspaceId;

  try {
    // Obtener bundles
    const [bundles] = await req.db.query(
      `SELECT
        sb.*,
        COUNT(bs.id) as services_count
       FROM service_bundles sb
       LEFT JOIN bundle_services bs ON bs.bundle_id = sb.id
       WHERE sb.workspace_id = ? OR sb.workspace_id IS NULL
       GROUP BY sb.id
       ORDER BY sb.bundle_name ASC`,
      [workspaceId]
    );

    // Para cada bundle, obtener los nombres de servicios agrupados por tipo
    for (const bundle of bundles as any[]) {
      const [services] = await req.db.query(
        `SELECT
          s.service_name,
          bs.include_in_base_price,
          bs.add_when_due,
          COALESCE(bs.custom_price, s.default_price) as price
         FROM bundle_services bs
         INNER JOIN services s ON s.id = bs.service_id
         WHERE bs.bundle_id = ?`,
        [bundle.id]
      );

      const svcList = services as any[];
      bundle.base_services = svcList.filter(s => s.include_in_base_price).map(s => s.service_name).join(', ');
      bundle.extra_services = svcList.filter(s => s.add_when_due && !s.include_in_base_price).map(s => `${s.service_name} (+Q${s.price})`).join(', ');
    }

    res.json(bundles);
  } catch (error) {
    console.error('Error listando bundles:', error);
    res.status(500).json({ error: 'Error al listar bundles' });
  }
};

/**
 * GET /api/bundles/:id
 * Obtener un bundle con sus servicios y configuración completa
 */
export const getBundleById: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    // Obtener el bundle
    const [bundles] = await req.db.query(
      `SELECT * FROM service_bundles WHERE id = ?`,
      [id]
    );

    if (!bundles || (bundles as any[]).length === 0) {
      return res.status(404).json({ error: 'Bundle no encontrado' });
    }

    const bundle = (bundles as any[])[0];

    // Obtener servicios del bundle con su configuración
    const [services] = await req.db.query(
      `SELECT
        s.id,
        s.service_name,
        s.description,
        s.default_price,
        s.recurrence_type,
        s.recurrence_type_extended,
        bs.include_in_base_price,
        bs.add_when_due,
        bs.custom_price,
        bs.assignment_type,
        COALESCE(bs.custom_price, s.default_price) as effective_price
       FROM bundle_services bs
       INNER JOIN services s ON s.id = bs.service_id
       WHERE bs.bundle_id = ?`,
      [id]
    );

    // Calcular precio base (suma de servicios incluidos en base)
    const svcList = services as any[];
    const calculatedBasePrice = svcList
      .filter(s => s.include_in_base_price)
      .reduce((sum, s) => sum + parseFloat(s.effective_price), 0);

    res.json({
      ...bundle,
      services,
      calculated_base_price: calculatedBasePrice
    });
  } catch (error) {
    console.error('Error obteniendo bundle:', error);
    res.status(500).json({ error: 'Error al obtener bundle' });
  }
};

/**
 * POST /api/bundles
 * Crear una nueva plantilla de bundle con configuración de servicios
 */
export const createBundle: RequestHandler = async (req: any, res: any) => {
  const {
    bundleName,
    description,
    clientDescription,
    bundlePrice,
    basePrice,
    billingType,
    services,  // Array de BundleServiceConfig
    isGlobal
  } = req.body;
  const workspaceId = isGlobal ? null : req.workspaceId;

  try {
    // Crear el bundle
    const [result] = await req.db.query(
      `INSERT INTO service_bundles
        (workspace_id, bundle_name, description, client_description, bundle_price, base_price, billing_type, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [
        workspaceId,
        bundleName,
        description || null,
        clientDescription || null,
        bundlePrice || 0,
        basePrice || 0,
        billingType || 'dynamic'
      ]
    );

    const bundleId = (result as any).insertId;

    // Agregar servicios al bundle con su configuración
    if (services && services.length > 0) {
      for (const svc of services as BundleServiceConfig[]) {
        await req.db.query(
          `INSERT INTO bundle_services
            (bundle_id, service_id, include_in_base_price, add_when_due, custom_price, assignment_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            bundleId,
            svc.serviceId,
            svc.includeInBasePrice ?? true,
            svc.addWhenDue ?? false,
            svc.customPrice ?? null,
            svc.assignmentType || 'all_clients'
          ]
        );
      }
    }

    res.json({
      success: true,
      bundleId,
      message: 'Bundle creado exitosamente'
    });
  } catch (error) {
    console.error('Error creando bundle:', error);
    res.status(500).json({ error: 'Error al crear bundle' });
  }
};

/**
 * PATCH /api/bundles/:id
 * Actualizar un bundle y su configuración de servicios
 */
export const updateBundle: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const {
    bundleName,
    description,
    clientDescription,
    bundlePrice,
    basePrice,
    billingType,
    isActive,
    services  // Array de BundleServiceConfig
  } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (bundleName !== undefined) {
      updates.push('bundle_name = ?');
      params.push(bundleName);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (clientDescription !== undefined) {
      updates.push('client_description = ?');
      params.push(clientDescription);
    }

    if (bundlePrice !== undefined) {
      updates.push('bundle_price = ?');
      params.push(bundlePrice);
    }

    if (basePrice !== undefined) {
      updates.push('base_price = ?');
      params.push(basePrice);
    }

    if (billingType !== undefined) {
      updates.push('billing_type = ?');
      params.push(billingType);
    }

    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive);
    }

    if (updates.length > 0) {
      params.push(id);
      await req.db.query(
        `UPDATE service_bundles SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Actualizar servicios si se proporcionaron
    if (services !== undefined) {
      // Eliminar servicios actuales
      await req.db.query(`DELETE FROM bundle_services WHERE bundle_id = ?`, [id]);

      // Agregar nuevos servicios con configuración
      if (services.length > 0) {
        for (const svc of services as BundleServiceConfig[]) {
          await req.db.query(
            `INSERT INTO bundle_services
              (bundle_id, service_id, include_in_base_price, add_when_due, custom_price, assignment_type)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              id,
              svc.serviceId,
              svc.includeInBasePrice ?? true,
              svc.addWhenDue ?? false,
              svc.customPrice ?? null,
              svc.assignmentType || 'all_clients'
            ]
          );
        }
      }
    }

    res.json({ success: true, message: 'Bundle actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando bundle:', error);
    res.status(500).json({ error: 'Error al actualizar bundle' });
  }
};

/**
 * DELETE /api/bundles/:id
 * Eliminar un bundle
 */
export const deleteBundle: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    // Primero eliminar relaciones
    await req.db.query(`DELETE FROM bundle_services WHERE bundle_id = ?`, [id]);
    await req.db.query(`DELETE FROM client_bundles WHERE bundle_id = ?`, [id]);

    // Luego eliminar el bundle
    await req.db.query(`DELETE FROM service_bundles WHERE id = ?`, [id]);

    res.json({ success: true, message: 'Bundle eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando bundle:', error);
    res.status(500).json({ error: 'Error al eliminar bundle' });
  }
};

// ================== SERVICIOS EN BUNDLES ==================

/**
 * GET /api/bundles/:id/services
 * Obtener servicios de un bundle con configuración
 */
export const getBundleServices: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const [services] = await req.db.query(
      `SELECT
        s.id,
        s.service_name,
        s.description,
        s.default_price,
        s.recurrence_type,
        s.recurrence_type_extended,
        s.is_active,
        bs.include_in_base_price,
        bs.add_when_due,
        bs.custom_price,
        bs.assignment_type,
        COALESCE(bs.custom_price, s.default_price) as effective_price
       FROM bundle_services bs
       INNER JOIN services s ON s.id = bs.service_id
       WHERE bs.bundle_id = ?`,
      [id]
    );

    res.json(services);
  } catch (error) {
    console.error('Error obteniendo servicios del bundle:', error);
    res.status(500).json({ error: 'Error al obtener servicios del bundle' });
  }
};

/**
 * POST /api/bundles/:id/services
 * Agregar un servicio a un bundle con configuración
 */
export const addServiceToBundle: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const { serviceId, includeInBasePrice, addWhenDue, customPrice, assignmentType } = req.body;

  try {
    // Verificar que no exista ya
    const [existing] = await req.db.query(
      `SELECT id FROM bundle_services WHERE bundle_id = ? AND service_id = ?`,
      [id, serviceId]
    );

    if ((existing as any[]).length > 0) {
      return res.status(400).json({ error: 'El servicio ya está en el bundle' });
    }

    await req.db.query(
      `INSERT INTO bundle_services
        (bundle_id, service_id, include_in_base_price, add_when_due, custom_price, assignment_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        serviceId,
        includeInBasePrice ?? true,
        addWhenDue ?? false,
        customPrice ?? null,
        assignmentType || 'all_clients'
      ]
    );

    res.json({ success: true, message: 'Servicio agregado al bundle' });
  } catch (error) {
    console.error('Error agregando servicio al bundle:', error);
    res.status(500).json({ error: 'Error al agregar servicio' });
  }
};

/**
 * PATCH /api/bundles/:id/services/:serviceId
 * Actualizar configuración de un servicio en el bundle
 */
export const updateBundleService: RequestHandler = async (req: any, res: any) => {
  const { id, serviceId } = req.params;
  const { includeInBasePrice, addWhenDue, customPrice, assignmentType } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (includeInBasePrice !== undefined) {
      updates.push('include_in_base_price = ?');
      params.push(includeInBasePrice);
    }

    if (addWhenDue !== undefined) {
      updates.push('add_when_due = ?');
      params.push(addWhenDue);
    }

    if (customPrice !== undefined) {
      updates.push('custom_price = ?');
      params.push(customPrice);
    }

    if (assignmentType !== undefined) {
      updates.push('assignment_type = ?');
      params.push(assignmentType);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(id, serviceId);
    await req.db.query(
      `UPDATE bundle_services SET ${updates.join(', ')} WHERE bundle_id = ? AND service_id = ?`,
      params
    );

    res.json({ success: true, message: 'Configuración del servicio actualizada' });
  } catch (error) {
    console.error('Error actualizando servicio del bundle:', error);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
};

/**
 * DELETE /api/bundles/:id/services/:serviceId
 * Quitar un servicio de un bundle
 */
export const removeServiceFromBundle: RequestHandler = async (req: any, res: any) => {
  const { id, serviceId } = req.params;

  try {
    await req.db.query(
      `DELETE FROM bundle_services WHERE bundle_id = ? AND service_id = ?`,
      [id, serviceId]
    );

    res.json({ success: true, message: 'Servicio removido del bundle' });
  } catch (error) {
    console.error('Error removiendo servicio del bundle:', error);
    res.status(500).json({ error: 'Error al remover servicio' });
  }
};

// ================== BUNDLES DE CLIENTES ==================

/**
 * GET /api/bundles/clients/:clientId
 * Obtener bundles asignados a un cliente
 */
export const getClientBundles: RequestHandler = async (req: any, res: any) => {
  const { clientId } = req.params;

  try {
    const [bundles] = await req.db.query(
      `SELECT
        cb.*,
        sb.bundle_name,
        sb.description,
        sb.bundle_price,
        sb.base_price,
        sb.billing_type,
        COALESCE(cb.custom_price, sb.bundle_price) as effective_price,
        COUNT(bs.id) as services_count
       FROM client_bundles cb
       INNER JOIN service_bundles sb ON sb.id = cb.bundle_id
       LEFT JOIN bundle_services bs ON bs.bundle_id = sb.id
       WHERE cb.client_user_id = ?
       GROUP BY cb.id
       ORDER BY cb.created_at DESC`,
      [clientId]
    );

    res.json(bundles);
  } catch (error) {
    console.error('Error obteniendo bundles del cliente:', error);
    res.status(500).json({ error: 'Error al obtener bundles del cliente' });
  }
};

/**
 * POST /api/bundles/clients/:clientId/assign
 * Asignar un bundle a un cliente
 */
export const assignBundleToClient: RequestHandler = async (req: any, res: any) => {
  const { clientId } = req.params;
  const { bundleId, customPrice, startDate } = req.body;

  try {
    // Verificar que el bundle existe
    const [bundles] = await req.db.query(
      `SELECT id FROM service_bundles WHERE id = ?`,
      [bundleId]
    );

    if ((bundles as any[]).length === 0) {
      return res.status(404).json({ error: 'Bundle no encontrado' });
    }

    // Verificar que no esté ya asignado
    const [existing] = await req.db.query(
      `SELECT id FROM client_bundles WHERE client_user_id = ? AND bundle_id = ? AND status = 'active'`,
      [clientId, bundleId]
    );

    if ((existing as any[]).length > 0) {
      return res.status(400).json({ error: 'El cliente ya tiene este bundle asignado' });
    }

    // Asignar el bundle
    const [result] = await req.db.query(
      `INSERT INTO client_bundles (client_user_id, bundle_id, custom_price, start_date, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [clientId, bundleId, customPrice || null, startDate || null]
    );

    // Obtener los servicios del bundle que deben asignarse a todos los clientes
    const [bundleServices] = await req.db.query(
      `SELECT service_id, assignment_type, custom_price
       FROM bundle_services
       WHERE bundle_id = ? AND assignment_type = 'all_clients'`,
      [bundleId]
    );

    // Crear client_services para cada servicio que sea all_clients
    let servicesAssigned = 0;
    for (const bs of bundleServices as any[]) {
      // Verificar si ya tiene el servicio
      const [existingService] = await req.db.query(
        `SELECT id FROM client_services WHERE client_user_id = ? AND service_id = ? AND is_active = 1`,
        [clientId, bs.service_id]
      );

      if ((existingService as any[]).length === 0) {
        await req.db.query(
          `INSERT INTO client_services (client_user_id, service_id, custom_price, start_date, is_active)
           VALUES (?, ?, ?, CURDATE(), 1)`,
          [clientId, bs.service_id, bs.custom_price || 0]
        );
        servicesAssigned++;
      }
    }

    res.json({
      success: true,
      clientBundleId: (result as any).insertId,
      message: 'Bundle asignado al cliente',
      servicesAssigned
    });
  } catch (error) {
    console.error('Error asignando bundle al cliente:', error);
    res.status(500).json({ error: 'Error al asignar bundle' });
  }
};

/**
 * GET /api/bundles/calculate-price/:bundleId
 * Calcular el precio del bundle para un mes específico
 */
export const calculateBundlePrice: RequestHandler = async (req: any, res: any) => {
  const { bundleId } = req.params;
  const { month, year } = req.query;

  try {
    // Obtener el bundle
    const [bundles] = await req.db.query(
      `SELECT * FROM service_bundles WHERE id = ?`,
      [bundleId]
    );

    if ((bundles as any[]).length === 0) {
      return res.status(404).json({ error: 'Bundle no encontrado' });
    }

    const bundle = (bundles as any[])[0];

    // Si el billing_type es 'fixed', retornar el precio fijo
    if (bundle.billing_type === 'fixed') {
      return res.json({
        bundleId: bundle.id,
        bundleName: bundle.bundle_name,
        billingType: 'fixed',
        basePrice: parseFloat(bundle.bundle_price),
        extraCharges: [],
        totalPrice: parseFloat(bundle.bundle_price)
      });
    }

    // Para dynamic, calcular según servicios
    const [services] = await req.db.query(
      `SELECT
        s.id,
        s.service_name,
        s.recurrence_type,
        s.activation_day,
        bs.include_in_base_price,
        bs.add_when_due,
        COALESCE(bs.custom_price, s.default_price) as price
       FROM bundle_services bs
       INNER JOIN services s ON s.id = bs.service_id
       WHERE bs.bundle_id = ?`,
      [bundleId]
    );

    let basePrice = parseFloat(bundle.base_price) || 0;
    const extraCharges: any[] = [];

    for (const svc of services as any[]) {
      // Servicios incluidos en precio base
      if (svc.include_in_base_price) {
        // Ya están incluidos en base_price
        continue;
      }

      // Servicios que se suman cuando toca
      if (svc.add_when_due) {
        // TODO: Lógica para determinar si el servicio "toca" este mes
        // Por ahora, los servicios anuales se cobran en el mes de activación
        const targetMonth = parseInt(month as string) || new Date().getMonth() + 1;

        // Simplificación: si es anual y el mes coincide con activation_day/month
        if (svc.recurrence_type === 'annual') {
          // Para servicios anuales, se cobra en el mes especificado (activation_day podría representar el mes)
          // Por ahora agregar como potencial cargo extra
          extraCharges.push({
            serviceId: svc.id,
            serviceName: svc.service_name,
            price: parseFloat(svc.price),
            recurrence: svc.recurrence_type
          });
        }
      }
    }

    const totalExtraCharges = extraCharges.reduce((sum, c) => sum + c.price, 0);

    res.json({
      bundleId: bundle.id,
      bundleName: bundle.bundle_name,
      billingType: 'dynamic',
      basePrice,
      extraCharges,
      totalPrice: basePrice + totalExtraCharges
    });
  } catch (error) {
    console.error('Error calculando precio del bundle:', error);
    res.status(500).json({ error: 'Error al calcular precio' });
  }
};

/**
 * PATCH /api/bundles/client-bundles/:id
 * Actualizar la asignación de bundle de un cliente
 */
export const updateClientBundle: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const { customPrice, status } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (customPrice !== undefined) {
      updates.push('custom_price = ?');
      params.push(customPrice);
    }

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(id);
    await req.db.query(
      `UPDATE client_bundles SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Bundle del cliente actualizado' });
  } catch (error) {
    console.error('Error actualizando bundle del cliente:', error);
    res.status(500).json({ error: 'Error al actualizar bundle' });
  }
};

/**
 * DELETE /api/bundles/client-bundles/:id
 * Desasignar un bundle de un cliente
 */
export const unassignBundleFromClient: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    // Marcar como cancelado en lugar de eliminar
    await req.db.query(
      `UPDATE client_bundles SET status = 'cancelled' WHERE id = ?`,
      [id]
    );

    res.json({ success: true, message: 'Bundle desasignado del cliente' });
  } catch (error) {
    console.error('Error desasignando bundle:', error);
    res.status(500).json({ error: 'Error al desasignar bundle' });
  }
};
