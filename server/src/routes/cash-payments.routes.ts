import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import {
  getClientsWithBalances,
  registerCashPayment,
  getPaymentHistory,
  getPaymentsSummary
} from "../controllers/cash-payments.controller";

const router = Router();
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

// GET /api/cash-payments/clients - Obtener clientes con sus saldos y deudas
router.get("/clients", requireRoles("admin", "employee"), getClientsWithBalances);

// GET /api/cash-payments/summary - Resumen de pagos
router.get("/summary", requireRoles("admin", "employee"), getPaymentsSummary);

// GET /api/cash-payments/history/:clientId - Historial de pagos de un cliente
router.get("/history/:clientId", requireRoles("admin", "employee"), getPaymentHistory);

// POST /api/cash-payments - Registrar un pago en efectivo
router.post("/", requireRoles("admin", "employee"), registerCashPayment);

export default router;
