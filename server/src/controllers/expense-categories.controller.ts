import { RequestHandler } from "express";

/**
 * GET /api/expense-categories
 * Lista categorías de gastos (globales + del workspace actual)
 */
export const listExpenseCategories: RequestHandler = async (req: any, res: any) => {
  try {
    const workspaceId = req.workspaceId;
    const isConsolidatedView = req.isConsolidatedView;

    let query: string;
    let params: any[] = [];

    if (isConsolidatedView) {
      // Vista consolidada: todas las categorías globales y de todos los workspaces
      query = `
        SELECT
          ec.*,
          w.name as workspace_name,
          u.full_name as created_by_name
        FROM expense_categories ec
        LEFT JOIN workspaces w ON w.id = ec.workspace_id
        LEFT JOIN users u ON u.id = ec.created_by_user_id
        WHERE ec.is_active = TRUE
        ORDER BY ec.workspace_id IS NULL DESC, ec.name ASC
      `;
    } else {
      // Vista de workspace: categorías globales + del workspace actual
      query = `
        SELECT
          ec.*,
          w.name as workspace_name,
          u.full_name as created_by_name
        FROM expense_categories ec
        LEFT JOIN workspaces w ON w.id = ec.workspace_id
        LEFT JOIN users u ON u.id = ec.created_by_user_id
        WHERE ec.is_active = TRUE
          AND (ec.workspace_id IS NULL OR ec.workspace_id = ?)
        ORDER BY ec.workspace_id IS NULL DESC, ec.name ASC
      `;
      params.push(workspaceId);
    }

    const [rows] = await req.db.query(query, params);
    res.json(rows);
  } catch (error: any) {
    console.error("Error listing expense categories:", error);
    res.status(500).json({ error: "Error al listar categorías", details: error.message });
  }
};

/**
 * GET /api/expense-categories/:id
 * Obtiene una categoría específica
 */
export const getExpenseCategory: RequestHandler = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const [rows]: any = await req.db.query(
      `SELECT ec.*, w.name as workspace_name
       FROM expense_categories ec
       LEFT JOIN workspaces w ON w.id = ec.workspace_id
       WHERE ec.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.json(rows[0]);
  } catch (error: any) {
    console.error("Error getting expense category:", error);
    res.status(500).json({ error: "Error al obtener categoría", details: error.message });
  }
};

/**
 * POST /api/expense-categories
 * Crea una nueva categoría de gastos
 */
export const createExpenseCategory: RequestHandler = async (req: any, res: any) => {
  try {
    const { name, description, color, isGlobal } = req.body;
    const workspaceId = req.workspaceId;
    const userId = req.user.id;
    const isConsolidatedView = req.isConsolidatedView;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "El nombre es requerido" });
    }

    // Determinar workspace_id
    // - Si isGlobal=true y está en vista consolidada: NULL (global)
    // - Si no: workspace actual
    let categoryWorkspaceId: number | null = null;

    if (isGlobal && isConsolidatedView) {
      categoryWorkspaceId = null; // Global
    } else if (!isConsolidatedView && workspaceId) {
      categoryWorkspaceId = isGlobal ? null : workspaceId;
    } else {
      categoryWorkspaceId = workspaceId || null;
    }

    // Verificar que no exista otra categoría con el mismo nombre en el mismo ámbito
    const [existing]: any = await req.db.query(
      `SELECT id FROM expense_categories
       WHERE name = ? AND (workspace_id <=> ?) AND is_active = TRUE`,
      [name.trim(), categoryWorkspaceId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Ya existe una categoría con ese nombre" + (categoryWorkspaceId ? " en este workspace" : " global")
      });
    }

    const [result]: any = await req.db.query(
      `INSERT INTO expense_categories (name, description, color, workspace_id, created_by_user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), description || null, color || '#6B7280', categoryWorkspaceId, userId]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: "Categoría creada correctamente"
    });
  } catch (error: any) {
    console.error("Error creating expense category:", error);
    res.status(500).json({ error: "Error al crear categoría", details: error.message });
  }
};

/**
 * PATCH /api/expense-categories/:id
 * Actualiza una categoría existente
 */
export const updateExpenseCategory: RequestHandler = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    // Verificar que la categoría existe
    const [existing]: any = await req.db.query(
      `SELECT * FROM expense_categories WHERE id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    const category = existing[0];

    // Si se cambia el nombre, verificar que no exista otra con el mismo nombre
    if (name && name.trim() !== category.name) {
      const [duplicate]: any = await req.db.query(
        `SELECT id FROM expense_categories
         WHERE name = ? AND (workspace_id <=> ?) AND is_active = TRUE AND id != ?`,
        [name.trim(), category.workspace_id, id]
      );

      if (duplicate.length > 0) {
        return res.status(400).json({ error: "Ya existe otra categoría con ese nombre" });
      }
    }

    // Construir query de actualización
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name.trim());
    }
    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description);
    }
    if (color !== undefined) {
      updates.push("color = ?");
      params.push(color);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron campos para actualizar" });
    }

    params.push(id);
    await req.db.query(
      `UPDATE expense_categories SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: "Categoría actualizada correctamente" });
  } catch (error: any) {
    console.error("Error updating expense category:", error);
    res.status(500).json({ error: "Error al actualizar categoría", details: error.message });
  }
};

/**
 * DELETE /api/expense-categories/:id
 * Elimina (soft delete) una categoría
 */
export const deleteExpenseCategory: RequestHandler = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Verificar que la categoría existe
    const [existing]: any = await req.db.query(
      `SELECT * FROM expense_categories WHERE id = ? AND is_active = TRUE`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    // Verificar si hay gastos usando esta categoría
    const [usageCount]: any = await req.db.query(
      `SELECT COUNT(*) as count FROM expenses WHERE category_id = ?`,
      [id]
    );

    // Soft delete
    await req.db.query(
      `UPDATE expense_categories SET is_active = FALSE WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Categoría eliminada correctamente",
      expensesAffected: usageCount[0].count
    });
  } catch (error: any) {
    console.error("Error deleting expense category:", error);
    res.status(500).json({ error: "Error al eliminar categoría", details: error.message });
  }
};
