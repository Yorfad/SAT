import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import {
  listExternalIncomes,
  getExternalIncomesSummary,
  createExternalIncome,
  deleteExternalIncome
} from "../controllers/external-incomes.controller";

const router = Router();
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

// Listar ingresos externos
router.get("/", requireRoles("admin"), listExternalIncomes);

// Obtener resumen de ingresos
router.get("/summary", requireRoles("admin"), getExternalIncomesSummary);

// Crear nuevo ingreso
router.post("/", requireRoles("admin"), createExternalIncome);

// Eliminar ingreso
router.delete("/:id", requireRoles("admin"), deleteExternalIncome);

export default router;
