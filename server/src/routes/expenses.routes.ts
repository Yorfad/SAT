import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import { validate } from "../middleware/validate";
import { z } from "zod";
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesSummary,
  getExpenseCategories
} from "../controllers/expenses.controller";

const router = Router();
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

// Listar gastos
router.get(
  "/",
  requireRoles("admin", "employee"),
  listExpenses
);

// Crear nuevo gasto
router.post(
  "/",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      expenseType: z.enum(['one_time', 'monthly_recurring']),
      description: z.string().min(1),
      amount: z.number().positive(),
      expenseDate: z.string(), // ISO date string
      category: z.string().optional()
    })
  })),
  createExpense
);

// Actualizar gasto
router.patch(
  "/:id",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      description: z.string().optional(),
      amount: z.number().positive().optional(),
      expenseDate: z.string().optional(),
      category: z.string().optional(),
      isActive: z.boolean().optional()
    })
  })),
  updateExpense
);

// Toggle estado activo de un gasto (para simulaciones)
router.patch(
  "/:id/toggle-active",
  requireRoles("admin"),
  async (req: any, res: any) => {
    const { id } = req.params;
    try {
      // Obtener el gasto actual
      const [expense]: any = await req.db.query(
        `SELECT is_active FROM expenses WHERE id = ?`,
        [id]
      );

      if (!expense || expense.length === 0) {
        return res.status(404).json({ error: 'Gasto no encontrado' });
      }

      // Cambiar el estado
      const newState = !expense[0].is_active;
      await req.db.query(
        `UPDATE expenses SET is_active = ? WHERE id = ?`,
        [newState, id]
      );

      res.json({ success: true, is_active: newState });
    } catch (error) {
      console.error('Error cambiando estado del gasto:', error);
      res.status(500).json({ error: 'Error al cambiar estado del gasto' });
    }
  }
);

// Eliminar gasto
router.delete(
  "/:id",
  requireRoles("admin"),
  deleteExpense
);

// Obtener resumen de gastos
router.get(
  "/summary",
  requireRoles("admin", "employee"),
  getExpensesSummary
);

// Obtener categorías de gastos
router.get(
  "/categories",
  requireRoles("admin", "employee"),
  getExpenseCategories
);

export default router;
