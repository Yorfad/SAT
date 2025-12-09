import { RequestHandler } from "express";

/**
 * GET /api/expenses
 * Listar gastos con filtros opcionales
 */
export const listExpenses: RequestHandler = async (req: any, res: any) => {
  const { year, month, type, category, isActive } = req.query;

  try {
    let query = `
      SELECT
        e.id,
        e.expense_type,
        e.description,
        e.amount,
        e.expense_date,
        e.expense_month,
        e.expense_year,
        e.category,
        e.is_active,
        e.created_at,
        u.full_name as created_by_name
       FROM expenses e
       JOIN users u ON u.id = e.created_by_user_id
       WHERE 1=1
    `;

    const params: any[] = [];

    if (year) {
      query += ` AND e.expense_year = ?`;
      params.push(year);
    }

    if (month) {
      query += ` AND e.expense_month = ?`;
      params.push(month);
    }

    if (type) {
      query += ` AND e.expense_type = ?`;
      params.push(type);
    }

    if (category) {
      query += ` AND e.category = ?`;
      params.push(category);
    }

    if (isActive !== undefined) {
      query += ` AND e.is_active = ?`;
      params.push(isActive === 'true' ? 1 : 0);
    }

    query += ` ORDER BY e.expense_date DESC`;

    const [rows] = await req.db.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Error listando gastos:', error);
    res.status(500).json({ error: 'Error al listar gastos' });
  }
};

/**
 * POST /api/expenses
 * Crear un nuevo gasto
 */
export const createExpense: RequestHandler = async (req: any, res: any) => {
  const { expenseType, description, amount, expenseDate, category } = req.body;
  const createdByUserId = req.user.id;

  try {
    const date = new Date(expenseDate);
    const expenseMonth = date.getMonth() + 1;
    const expenseYear = date.getFullYear();

    const [result]: any = await req.db.query(
      `INSERT INTO expenses
       (expense_type, description, amount, expense_date, expense_month, expense_year, category, created_by_user_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [expenseType, description, amount, expenseDate, expenseMonth, expenseYear, category || null, createdByUserId]
    );

    res.json({
      success: true,
      expenseId: result.insertId,
      message: "Gasto registrado correctamente"
    });
  } catch (error) {
    console.error('Error creando gasto:', error);
    res.status(500).json({ error: 'Error al crear gasto' });
  }
};

/**
 * PATCH /api/expenses/:id
 * Actualizar un gasto existente
 */
export const updateExpense: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;
  const { description, amount, expenseDate, category, isActive } = req.body;

  try {
    const updates: string[] = [];
    const params: any[] = [];

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (amount !== undefined) {
      updates.push('amount = ?');
      params.push(amount);
    }

    if (expenseDate !== undefined) {
      const date = new Date(expenseDate);
      updates.push('expense_date = ?', 'expense_month = ?', 'expense_year = ?');
      params.push(expenseDate, date.getMonth() + 1, date.getFullYear());
    }

    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }

    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(id);

    await req.db.query(
      `UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: "Gasto actualizado correctamente" });
  } catch (error) {
    console.error('Error actualizando gasto:', error);
    res.status(500).json({ error: 'Error al actualizar gasto' });
  }
};

/**
 * DELETE /api/expenses/:id
 * Eliminar un gasto
 */
export const deleteExpense: RequestHandler = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    await req.db.query(`DELETE FROM expenses WHERE id = ?`, [id]);

    res.json({ success: true, message: "Gasto eliminado correctamente" });
  } catch (error) {
    console.error('Error eliminando gasto:', error);
    res.status(500).json({ error: 'Error al eliminar gasto' });
  }
};

/**
 * GET /api/expenses/summary
 * Obtener resumen de gastos por período
 */
export const getExpensesSummary: RequestHandler = async (req: any, res: any) => {
  const { year, month } = req.query;

  try {
    let query = `
      SELECT
        expense_type,
        category,
        SUM(amount) as total,
        COUNT(*) as count
       FROM expenses
       WHERE is_active = TRUE
    `;

    const params: any[] = [];

    if (year) {
      query += ` AND expense_year = ?`;
      params.push(year);
    }

    if (month) {
      query += ` AND expense_month = ?`;
      params.push(month);
    }

    query += ` GROUP BY expense_type, category ORDER BY total DESC`;

    const [rows] = await req.db.query(query, params);

    // Calcular totales generales
    const [totals]: any = await req.db.query(
      `SELECT
        SUM(CASE WHEN expense_type = 'one_time' THEN amount ELSE 0 END) as total_one_time,
        SUM(CASE WHEN expense_type = 'monthly_recurring' THEN amount ELSE 0 END) as total_recurring,
        SUM(amount) as total
       FROM expenses
       WHERE is_active = TRUE ${year ? 'AND expense_year = ?' : ''} ${month ? 'AND expense_month = ?' : ''}`,
      params
    );

    res.json({
      summary: totals[0],
      byCategory: rows
    });
  } catch (error) {
    console.error('Error obteniendo resumen de gastos:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

/**
 * GET /api/expenses/categories
 * Obtener lista de categorías de gastos
 */
export const getExpenseCategories: RequestHandler = async (req: any, res: any) => {
  try {
    const [rows] = await req.db.query(
      `SELECT DISTINCT category
       FROM expenses
       WHERE category IS NOT NULL
       ORDER BY category ASC`
    );

    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};
