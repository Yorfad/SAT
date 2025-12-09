import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import { getDashboardSummary, getFinancialOverview, getFinancialProjections } from "../controllers/admin-dashboard.controller";

const router = Router();
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

// Dashboard summary con ganancias reales
router.get(
  "/dashboard/summary",
  requireRoles("admin", "employee"),
  getDashboardSummary
);

// Proyecciones financieras basadas en clientes activos
router.get(
  "/dashboard/projections",
  requireRoles("admin", "employee"),
  getFinancialProjections
);

// Vista financiera detallada
router.get(
  "/dashboard/financial-overview",
  requireRoles("admin", "employee"),
  getFinancialOverview
);

export default router;
