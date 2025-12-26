import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import {
  listExpenseCategories,
  getExpenseCategory,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "../controllers/expense-categories.controller";

const router = Router();

// Middleware de autenticación y workspace para todas las rutas
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

// GET /api/expense-categories - Listar categorías (globales + del workspace)
router.get("/", requireRoles("admin", "employee"), listExpenseCategories);

// GET /api/expense-categories/:id - Obtener una categoría
router.get("/:id", requireRoles("admin"), getExpenseCategory);

// POST /api/expense-categories - Crear categoría
router.post("/", requireRoles("admin"), createExpenseCategory);

// PATCH /api/expense-categories/:id - Actualizar categoría
router.patch("/:id", requireRoles("admin"), updateExpenseCategory);

// DELETE /api/expense-categories/:id - Eliminar categoría (soft delete)
router.delete("/:id", requireRoles("admin"), deleteExpenseCategory);

export default router;
