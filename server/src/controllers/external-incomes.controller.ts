import { RequestHandler } from "express";

/**
 * GET /api/external-incomes
 * Listar ingresos externos con filtros opcionales
 */
export const listExternalIncomes: RequestHandler = async (req: any, res: any) => {
  const { year, month, source } = req.query;
  const workspaceId = req.workspaceId;
  const isConsolidated = req.isConsolidatedView;
  const accessibleIds = req.accessibleWorkspaceIds || [];

  try {
    let query = `
      SELECT
        ei.id,
        ei.description,
        ei.amount,
        ei.income_date,
        ei.source,
        ei.notes,
        ei.workspace_id,
        ei.created_at,
        u.full_name as created_by_name
       FROM external_incomes ei
       JOIN users u ON u.id = ei.created_by
       WHERE ei.tenant = ?
    `;

    const params: any[] = [req.tenantSlug];

    // Filtrado por workspace
    if (!isConsolidated && workspaceId) {
      query += ` AND ei.workspace_id = ?`;
      params.push(workspaceId);
    } else if (isConsolidated && accessibleIds.length > 0) {
      query += ` AND ei.workspace_id IN (${accessibleIds.map(() => '?').join(',')})`;
      params.push(...accessibleIds);
    }

    if (year) {
      query += ` AND YEAR(ei.income_date) = ?`;
      params.push(year);
    }

    if (month) {
      query += ` AND MONTH(ei.income_date) = ?`;
      params.push(month);
    }

    if (source) {
      query += ` AND ei.source = ?`;
      params.push(source);
    }

    query += ` ORDER BY ei.income_date DESC`;

    const [rows] = await req.db.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Error listando ingresos externos:', error);
    res.status(500).json({ error: 'Error al listar ingresos externos' });
  }
};

/**
 * GET /api/external-incomes/summary
 * Obtener resumen de ingresos del mes
 */
export const getExternalIncomesSummary: RequestHandler = async (req: any, res: any) => {
  const { year, month } = req.query;
  const workspaceId = req.workspaceId;
  const isConsolidated = req.isConsolidatedView;
  const accessibleIds = req.accessibleWorkspaceIds || [];

  try {
    let query = `
      SELECT
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
       FROM external_incomes
       WHERE tenant = ?
    `;

    const params: any[] = [req.tenantSlug];

    // Filtrado por workspace
    if (!isConsolidated && workspaceId) {
      query += ` AND workspace_id = ?`;
      params.push(workspaceId);
    } else if (isConsolidated && accessibleIds.length > 0) {
      query += ` AND workspace_id IN (${accessibleIds.map(() => '?').join(',')})`;
      params.push(...accessibleIds);
    }

    if (year) {
      query += ` AND YEAR(income_date) = ?`;
      params.push(year);
    }

    if (month) {
      query += ` AND MONTH(income_date) = ?`;
      params.push(month);
    }

    const [rows]: any = await req.db.query(query, params);

    res.json(rows[0] || { total: 0, count: 0 });
  } catch (error) {
    console.error('Error obteniendo resumen de ingresos:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

/**
 * POST /api/external-incomes
 * Crear un nuevo ingreso externo
 */
export const createExternalIncome: RequestHandler = async (req: any, res: any) => {
  const { description, amount, incomeDate, source, notes } = req.body;
  const createdBy = req.user.id;
  const workspaceId = req.workspaceId;

  if (!description || !amount || !incomeDate) {
    return res.status(400).json({ error: 'Descripción, monto y fecha son requeridos' });
  }

  try {
    const [result]: any = await req.db.query(
      `INSERT INTO external_incomes
       (tenant, workspace_id, description, amount, income_date, source, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.tenantSlug, workspaceId, description, amount, incomeDate, source || 'other', notes || null, createdBy]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Ingreso registrado correctamente'
    });
  } catch (error) {
    console.error('Error creando ingreso externo:', error);
    res.status(500).json({ error: 'Error al crear ingreso' });
  }
};

/**
 * DELETE /api/external-incomes/:id
 * Eliminar un ingreso externo
 */
export const deleteExternalIncome: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const workspaceId = req.workspaceId;

  try {
    // Verificar que existe y pertenece al tenant/workspace
    const [existing]: any = await req.db.query(
      `SELECT id FROM external_incomes WHERE id = ? AND tenant = ? AND workspace_id = ?`,
      [id, req.tenantSlug, workspaceId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }

    await req.db.query(`DELETE FROM external_incomes WHERE id = ?`, [id]);

    res.json({ message: 'Ingreso eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando ingreso externo:', error);
    res.status(500).json({ error: 'Error al eliminar ingreso' });
  }
};
