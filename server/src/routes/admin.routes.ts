import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import {
  getDashboardSummary,
  getFinancialOverview,
  getFinancialProjections,
  getCajaPersonal,
  getBalanceGeneral,
  getMetricasFinancieras
} from "../controllers/admin-dashboard.controller";

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

// Caja Personal: efectivo disponible, comprometido, por cobrar
router.get(
  "/dashboard/caja-personal",
  requireRoles("admin", "employee"),
  getCajaPersonal
);

// Balance General Simplificado
router.get(
  "/dashboard/balance-general",
  requireRoles("admin", "employee"),
  getBalanceGeneral
);

// Métricas de Salud Financiera
router.get(
  "/dashboard/metricas-financieras",
  requireRoles("admin", "employee"),
  getMetricasFinancieras
);

export default router;
