import { RequestHandler } from "express";

/**
 * GET /api/operational-costs
 * Listar costos operativos con filtros
 */
export const listOperationalCosts: RequestHandler = async (req: any, res: any) => {
  const { serviceId, clientId, year, month } = req.query;

  try {
    let query = `
      SELECT
        soc.id,
        soc.service_id,
        s.service_name,
        soc.invoice_id,
        soc.client_user_id,
        u.full_name as client_name,
        soc.cost_amount,
        soc.revenue_amount,
        soc.profit_amount,
        soc.description,
        soc.cost_date,
        soc.created_at,
        creator.full_name as created_by_name
       FROM service_operational_costs soc
       JOIN services s ON s.id = soc.service_id
       JOIN users u ON u.id = soc.client_user_id
       JOIN users creator ON creator.id = soc.created_by_user_id
       WHERE 1=1
    `;

    const params: any[] = [];

    if (serviceId) {
      query += ` AND soc.service_id = ?`;
      params.push(serviceId);
    }

    if (clientId) {
      query += ` AND soc.client_user_id = ?`;
      params.push(clientId);
    }

    if (year) {
      query += ` AND YEAR(soc.cost_date) = ?`;
      params.push(year);
    }

    if (month) {
      query += ` AND MONTH(soc.cost_date) = ?`;
      params.push(month);
    }

    query += ` ORDER BY soc.cost_date DESC`;

    const [rows] = await req.db.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Error listando costos operativos:', error);
    res.status(500).json({ error: 'Error al listar costos operativos' });
  }
};

/**
 * POST /api/operational-costs
 * Registrar un nuevo costo operativo
 */
export const createOperationalCost: RequestHandler = async (req: any, res: any) => {
  const { serviceId, invoiceId, clientUserId, costAmount, revenueAmount, description, costDate } = req.body;
  const createdByUserId = req.user.id;

  try {
    const [result]: any = await req.db.query(
      `INSERT INTO service_operational_costs
       (service_id, invoice_id, client_user_id, cost_amount, revenue_amount, description, cost_date, created_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [serviceId, invoiceId || null, clientUserId, costAmount, revenueAmount, description || null, costDate, createdByUserId]
    );

    res.json({
      success: true,
      costId: result.insertId,
      message: "Costo operativo registrado correctamente"
    });
  } catch (error) {
    console.error('Error creando costo operativo:', error);
    res.status(500).json({ error: 'Error al crear costo operativo' });
  }
};

/**
 * PATCH /api/operational-costs/:id
 * Actualizar un costo operativo existente
 */
export const updateOperationalCost: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const { costAmount, revenueAmount, description, costDate } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (costAmount !== undefined) {
      updates.push('cost_amount = ?');
      params.push(costAmount);
    }

    if (revenueAmount !== undefined) {
      updates.push('revenue_amount = ?');
      params.push(revenueAmount);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (costDate !== undefined) {
      updates.push('cost_date = ?');
      params.push(costDate);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(id);

    await req.db.query(
      `UPDATE service_operational_costs SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: "Costo operativo actualizado correctamente" });
  } catch (error) {
    console.error('Error actualizando costo operativo:', error);
    res.status(500).json({ error: 'Error al actualizar costo operativo' });
  }
};

/**
 * DELETE /api/operational-costs/:id
 * Eliminar un costo operativo
 */
export const deleteOperationalCost: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    await req.db.query(`DELETE FROM service_operational_costs WHERE id = ?`, [id]);

    res.json({ success: true, message: "Costo operativo eliminado correctamente" });
  } catch (error) {
    console.error('Error eliminando costo operativo:', error);
    res.status(500).json({ error: 'Error al eliminar costo operativo' });
  }
};

/**
 * GET /api/operational-costs/summary
 * Obtener resumen de costos operativos
 */
export const getOperationalCostsSummary: RequestHandler = async (req: any, res: any) => {
  const { year, month } = req.query;

  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (year) {
      whereClause += ` AND YEAR(soc.cost_date) = ?`;
      params.push(year);
    }

    if (month) {
      whereClause += ` AND MONTH(soc.cost_date) = ?`;
      params.push(month);
    }

    // Totales generales
    const [totals]: any = await req.db.query(
      `SELECT
        SUM(cost_amount) as total_costs,
        SUM(revenue_amount) as total_revenue,
        SUM(profit_amount) as total_profit,
        COUNT(*) as total_records
       FROM service_operational_costs soc
       ${whereClause}`,
      params
    );

    // Resumen por servicio
    const [byService] = await req.db.query(
      `SELECT
        s.id as service_id,
        s.service_name,
        SUM(soc.cost_amount) as total_costs,
        SUM(soc.revenue_amount) as total_revenue,
        SUM(soc.profit_amount) as total_profit,
        COUNT(*) as count
       FROM service_operational_costs soc
       JOIN services s ON s.id = soc.service_id
       ${whereClause}
       GROUP BY s.id, s.service_name
       ORDER BY total_profit DESC`,
      params
    );

    res.json({
      summary: totals[0],
      byService
    });
  } catch (error) {
    console.error('Error obteniendo resumen de costos operativos:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

/**
 * GET /api/operational-costs/service/:serviceId
 * Obtener costos operativos de un servicio específico
 */
export const getServiceOperationalCosts: RequestHandler = async (req: any, res: any) => {
  const { serviceId } = req.params;
  const { limit = 50 } = req.query;

  try {
    const [rows] = await req.db.query(
      `SELECT
        soc.id,
        soc.client_user_id,
        u.full_name as client_name,
        soc.cost_amount,
        soc.revenue_amount,
        soc.profit_amount,
        soc.description,
        soc.cost_date,
        creator.full_name as created_by_name
       FROM service_operational_costs soc
       JOIN users u ON u.id = soc.client_user_id
       JOIN users creator ON creator.id = soc.created_by_user_id
       WHERE soc.service_id = ?
       ORDER BY soc.cost_date DESC
       LIMIT ?`,
      [serviceId, parseInt(limit as string)]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo costos del servicio:', error);
    res.status(500).json({ error: 'Error al obtener costos' });
  }
};
