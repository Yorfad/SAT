import { RequestHandler } from "express";

/**
 * GET /api/infractions
 * Listar todas las infracciones
 */
export const listInfractions: RequestHandler = async (req: any, res: any) => {
  const { clientId, isActive } = req.query;
  const workspaceId = req.workspaceId;
  const isConsolidated = req.isConsolidatedView;
  const accessibleIds = req.accessibleWorkspaceIds || [];

  try {
    let query = `
      SELECT
        ci.id,
        ci.client_user_id,
        u.full_name as client_name,
        u.email as client_email,
        ci.infraction_type,
        ci.reason,
        ci.related_invoice_id,
        mi.invoice_year,
        mi.invoice_month,
        ci.is_active,
        ci.created_at,
        creator.full_name as created_by_name,
        resolver.full_name as resolved_by_name,
        ci.resolved_at,
        ci.resolution_notes
       FROM client_infractions ci
       JOIN users u ON u.id = ci.client_user_id
       JOIN clients_profiles cp ON cp.user_id = ci.client_user_id
       LEFT JOIN monthly_invoices mi ON mi.id = ci.related_invoice_id
       LEFT JOIN users creator ON creator.id = ci.created_by_user_id
       LEFT JOIN users resolver ON resolver.id = ci.resolved_by_user_id
       WHERE 1=1
    `;

    const params: any[] = [];

    // Filtrado por workspace
    if (!isConsolidated && workspaceId) {
      query += ` AND cp.workspace_id = ?`;
      params.push(workspaceId);
    } else if (isConsolidated && accessibleIds.length > 0) {
      query += ` AND cp.workspace_id IN (${accessibleIds.map(() => '?').join(',')})`;
      params.push(...accessibleIds);
    }

    if (clientId) {
      query += ` AND ci.client_user_id = ?`;
      params.push(clientId);
    }

    if (isActive !== undefined) {
      query += ` AND ci.is_active = ?`;
      params.push(isActive === 'true' ? 1 : 0);
    }

    query += ` ORDER BY ci.created_at DESC`;

    const [rows] = await req.db.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Error listando infracciones:', error);
    res.status(500).json({ error: 'Error al listar infracciones' });
  }
};

/**
 * POST /api/infractions
 * Crear una nueva infracción manual
 */
export const createInfraction: RequestHandler = async (req: any, res: any) => {
  const { clientUserId, reason, relatedInvoiceId, confirmDeactivation } = req.body;
  const createdByUserId = req.user.id;
  const workspaceId = req.workspaceId;

  try {
    // Obtener configuración del workspace
    let maxInfractions = 3;
    let autoDeactivate = true;

    if (workspaceId) {
      const [wsRows]: any = await req.db.query(
        'SELECT max_infractions, auto_deactivate_on_limit FROM workspaces WHERE id = ?',
        [workspaceId]
      );
      maxInfractions = wsRows[0]?.max_infractions || 3;
      // La BD devuelve 0 o 1, convertimos a boolean (0 = false, 1 = true)
      autoDeactivate = wsRows[0]?.auto_deactivate_on_limit === 1 || wsRows[0]?.auto_deactivate_on_limit === true;
    }

    // Contar infracciones activas del cliente
    const [activeInfractions]: any = await req.db.query(
      `SELECT COUNT(*) as count FROM client_infractions
       WHERE client_user_id = ? AND is_active = TRUE`,
      [clientUserId]
    );

    const activeCount = activeInfractions[0].count;

    // Si ya alcanzó el límite, no permitir agregar más infracciones
    if (activeCount >= maxInfractions) {
      return res.status(400).json({
        error: 'limit_reached',
        message: `El cliente ya tiene ${activeCount} infracciones activas (límite: ${maxInfractions}). No se pueden agregar más infracciones.`,
        activeInfractions: activeCount,
        maxInfractions
      });
    }

    // Si está a una infracción del límite y auto_deactivate está activo, mostrar advertencia
    if (activeCount === maxInfractions - 1 && autoDeactivate && !confirmDeactivation) {
      return res.status(400).json({
        error: 'warning_third_infraction',
        message: `⚠️ ADVERTENCIA: Este cliente ya tiene ${activeCount} infracciones activas. Al agregar una más alcanzará el límite de ${maxInfractions} y será DESACTIVADO AUTOMÁTICAMENTE.`,
        activeInfractions: activeCount,
        maxInfractions,
        requiresConfirmation: true
      });
    }

    // Crear la infracción
    const [result]: any = await req.db.query(
      `INSERT INTO client_infractions
       (client_user_id, workspace_id, infraction_type, reason, related_invoice_id, created_by_user_id, is_active)
       VALUES (?, ?, 'manual', ?, ?, ?, TRUE)`,
      [clientUserId, workspaceId || null, reason, relatedInvoiceId || null, createdByUserId]
    );

    // Actualizar contador en clients_profiles
    await req.db.query(
      `UPDATE clients_profiles
       SET active_infractions_count = (
         SELECT COUNT(*) FROM client_infractions WHERE client_user_id = ? AND is_active = TRUE
       )
       WHERE user_id = ?`,
      [clientUserId, clientUserId]
    );

    // Si con esta infracción alcanza el límite
    if (activeCount >= maxInfractions - 1) {
      // Solo desactivar si auto_deactivate está activo
      if (autoDeactivate) {
        await req.db.query(
          `UPDATE users
           SET is_active = FALSE,
               deactivation_reason = ?,
               deactivated_at = NOW()
           WHERE id = ?`,
          [`Desactivado automáticamente por alcanzar ${maxInfractions} infracciones activas`, clientUserId]
        );

        return res.json({
          success: true,
          infractionId: result.insertId,
          message: `Infracción creada. El cliente ha sido desactivado por alcanzar el límite de ${maxInfractions} infracciones.`,
          clientDeactivated: true,
          limitReached: true
        });
      } else {
        // Si auto_deactivate está desactivado, solo notificar que alcanzó el límite
        return res.json({
          success: true,
          infractionId: result.insertId,
          message: `Infracción creada. El cliente ha alcanzado el límite de ${maxInfractions} infracciones.`,
          clientDeactivated: false,
          limitReached: true
        });
      }
    }

    res.json({
      success: true,
      infractionId: result.insertId,
      message: "Infracción creada correctamente",
      activeInfractions: activeCount + 1
    });
  } catch (error) {
    console.error('Error creando infracción:', error);
    res.status(500).json({ error: 'Error al crear infracción' });
  }
};

/**
 * PATCH /api/infractions/:id/resolve
 * Resolver/cancelar una infracción
 */
export const resolveInfraction: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const { resolutionNotes } = req.body;
  const resolvedByUserId = req.user.id;

  try {
    // Obtener el client_user_id antes de actualizar
    const [infraction]: any = await req.db.query(
      `SELECT client_user_id FROM client_infractions WHERE id = ?`,
      [id]
    );

    if (!infraction || infraction.length === 0) {
      return res.status(404).json({ error: 'Infracción no encontrada' });
    }

    const clientUserId = infraction[0].client_user_id;

    await req.db.query(
      `UPDATE client_infractions
       SET is_active = FALSE,
           resolved_by_user_id = ?,
           resolved_at = NOW(),
           resolution_notes = ?
       WHERE id = ?`,
      [resolvedByUserId, resolutionNotes || null, id]
    );

    // Actualizar contador en clients_profiles
    await req.db.query(
      `UPDATE clients_profiles
       SET active_infractions_count = (
         SELECT COUNT(*) FROM client_infractions WHERE client_user_id = ? AND is_active = TRUE
       )
       WHERE user_id = ?`,
      [clientUserId, clientUserId]
    );

    res.json({ success: true, message: "Infracción resuelta correctamente" });
  } catch (error) {
    console.error('Error resolviendo infracción:', error);
    res.status(500).json({ error: 'Error al resolver infracción' });
  }
};

/**
 * DELETE /api/infractions/:id
 * Eliminar una infracción (solo admins)
 */
export const deleteInfraction: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    await req.db.query(`DELETE FROM client_infractions WHERE id = ?`, [id]);

    res.json({ success: true, message: "Infracción eliminada correctamente" });
  } catch (error) {
    console.error('Error eliminando infracción:', error);
    res.status(500).json({ error: 'Error al eliminar infracción' });
  }
};

/**
 * GET /api/infractions/summary/:clientId
 * Obtener resumen de infracciones de un cliente
 */
export const getInfractionSummary: RequestHandler = async (req: any, res: any) => {
  const { clientId } = req.params;

  try {
    const [summary]: any = await req.db.query(
      `SELECT
        COUNT(*) as total_infractions,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_infractions,
        SUM(CASE WHEN infraction_type = 'automatic_unpaid' THEN 1 ELSE 0 END) as automatic_infractions,
        SUM(CASE WHEN infraction_type = 'manual' THEN 1 ELSE 0 END) as manual_infractions
       FROM client_infractions
       WHERE client_user_id = ?`,
      [clientId]
    );

    const [recent]: any = await req.db.query(
      `SELECT
        ci.id,
        ci.infraction_type,
        ci.reason,
        ci.is_active,
        ci.created_at,
        mi.invoice_year,
        mi.invoice_month
       FROM client_infractions ci
       LEFT JOIN monthly_invoices mi ON mi.id = ci.related_invoice_id
       WHERE ci.client_user_id = ?
       ORDER BY ci.created_at DESC
       LIMIT 5`,
      [clientId]
    );

    res.json({
      summary: summary[0],
      recent
    });
  } catch (error) {
    console.error('Error obteniendo resumen de infracciones:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

/**
 * GET /api/infractions/client/:clientId
 * Obtener historial completo de infracciones de un cliente
 */
export const getClientInfractions: RequestHandler = async (req: any, res: any) => {
  const { clientId } = req.params;

  try {
    const [infractions]: any = await req.db.query(
      `SELECT
        ci.id,
        ci.infraction_type,
        ci.reason,
        ci.is_active,
        ci.created_at,
        ci.resolved_at,
        ci.resolution_notes,
        creator.full_name as created_by_name,
        resolver.full_name as resolved_by_name,
        mi.invoice_year,
        mi.invoice_month,
        mi.total_due as invoice_amount
       FROM client_infractions ci
       LEFT JOIN users creator ON creator.id = ci.created_by_user_id
       LEFT JOIN users resolver ON resolver.id = ci.resolved_by_user_id
       LEFT JOIN monthly_invoices mi ON mi.id = ci.related_invoice_id
       WHERE ci.client_user_id = ?
       ORDER BY ci.created_at DESC`,
      [clientId]
    );

    res.json(infractions);
  } catch (error) {
    console.error('Error obteniendo historial de infracciones:', error);
    res.status(500).json({ error: 'Error al obtener historial de infracciones' });
  }
};
