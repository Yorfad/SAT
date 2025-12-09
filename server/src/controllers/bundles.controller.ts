import { RequestHandler } from "express";

/**
 * GET /api/clients/:clientId/bundles
 * Obtener todos los bundles de un cliente
 */
export const getClientBundles: RequestHandler = async (req: any, res: any) => {
  const { clientId } = req.params;

  try {
    const [bundles] = await req.db.query(
      `SELECT
        sb.*,
        COUNT(cs.id) as services_count
       FROM service_bundles sb
       LEFT JOIN client_services cs ON cs.bundle_id = sb.id
       WHERE sb.client_user_id = ?
       GROUP BY sb.id
       ORDER BY sb.created_at DESC`,
      [clientId]
    );

    res.json(bundles);
  } catch (error) {
    console.error('Error obteniendo bundles:', error);
    res.status(500).json({ error: 'Error al obtener bundles' });
  }
};

/**
 * GET /api/bundles/:bundleId/services
 * Obtener servicios de un bundle
 */
export const getBundleServices: RequestHandler = async (req: any, res: any) => {
  const { bundleId } = req.params;

  try {
    const [services] = await req.db.query(
      `SELECT
        cs.*,
        s.service_name,
        s.default_price
       FROM client_services cs
       INNER JOIN services s ON s.id = cs.service_id
       WHERE cs.bundle_id = ?`,
      [bundleId]
    );

    res.json(services);
  } catch (error) {
    console.error('Error obteniendo servicios del bundle:', error);
    res.status(500).json({ error: 'Error al obtener servicios del bundle' });
  }
};

/**
 * POST /api/clients/:clientId/bundles
 * Crear un nuevo bundle
 */
export const createBundle: RequestHandler = async (req: any, res: any) => {
  const { clientId } = req.params;
  const { name, description, totalPrice, operationalCost, serviceIds } = req.body;

  try {
    // Crear el bundle
    const [result] = await req.db.query(
      `INSERT INTO service_bundles (client_user_id, name, description, total_price, operational_cost)
       VALUES (?, ?, ?, ?, ?)`,
      [clientId, name, description || null, totalPrice, operationalCost || 0]
    );

    const bundleId = (result as any).insertId;

    // Si hay servicios para agregar al bundle
    if (serviceIds && serviceIds.length > 0) {
      await req.db.query(
        `UPDATE client_services
         SET bundle_id = ?
         WHERE id IN (?) AND client_user_id = ?`,
        [bundleId, serviceIds, clientId]
      );
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
 * PATCH /api/bundles/:bundleId
 * Actualizar un bundle
 */
export const updateBundle: RequestHandler = async (req: any, res: any) => {
  const { bundleId } = req.params;
  const { name, description, totalPrice, operationalCost, isActive } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (totalPrice !== undefined) {
      updates.push('total_price = ?');
      params.push(totalPrice);
    }

    if (operationalCost !== undefined) {
      updates.push('operational_cost = ?');
      params.push(operationalCost);
    }

    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(bundleId);

    await req.db.query(
      `UPDATE service_bundles SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Bundle actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando bundle:', error);
    res.status(500).json({ error: 'Error al actualizar bundle' });
  }
};

/**
 * DELETE /api/bundles/:bundleId
 * Eliminar un bundle (desvincula servicios pero no los elimina)
 */
export const deleteBundle: RequestHandler = async (req: any, res: any) => {
  const { bundleId } = req.params;

  try {
    // Primero, desvincular todos los servicios del bundle
    await req.db.query(
      `UPDATE client_services SET bundle_id = NULL WHERE bundle_id = ?`,
      [bundleId]
    );

    // Luego eliminar el bundle
    await req.db.query(
      `DELETE FROM service_bundles WHERE id = ?`,
      [bundleId]
    );

    res.json({ success: true, message: 'Bundle eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando bundle:', error);
    res.status(500).json({ error: 'Error al eliminar bundle' });
  }
};

/**
 * POST /api/bundles/:bundleId/add-service
 * Agregar un servicio a un bundle
 */
export const addServiceToBundle: RequestHandler = async (req: any, res: any) => {
  const { bundleId } = req.params;
  const { serviceId } = req.body;

  try {
    await req.db.query(
      `UPDATE client_services SET bundle_id = ? WHERE id = ?`,
      [bundleId, serviceId]
    );

    res.json({ success: true, message: 'Servicio agregado al bundle' });
  } catch (error) {
    console.error('Error agregando servicio al bundle:', error);
    res.status(500).json({ error: 'Error al agregar servicio' });
  }
};

/**
 * POST /api/bundles/:bundleId/remove-service
 * Quitar un servicio de un bundle
 */
export const removeServiceFromBundle: RequestHandler = async (req: any, res: any) => {
  const { bundleId } = req.params;
  const { serviceId } = req.body;

  try {
    await req.db.query(
      `UPDATE client_services SET bundle_id = NULL WHERE id = ? AND bundle_id = ?`,
      [serviceId, bundleId]
    );

    res.json({ success: true, message: 'Servicio removido del bundle' });
  } catch (error) {
    console.error('Error removiendo servicio del bundle:', error);
    res.status(500).json({ error: 'Error al remover servicio' });
  }
};
