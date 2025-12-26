import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import { validate } from "../middleware/validate";
import { z } from "zod";
import { registerPayment, getPendingPayments, getPaymentHistory } from "../controllers/payments.controller";

const router = Router();
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

// Registrar pago de una factura
router.post(
  "/register/:invoiceId",
  requireRoles("admin", "employee"),
  validate(z.object({
    body: z.object({
      paymentStatus: z.enum(['paid', 'partial', 'pending', 'overdue', 'deferred_next_month', 'unpaid_auto']),
      amountPaid: z.number().nonnegative(),
      notes: z.string().optional()
    })
  })),
  registerPayment
);

// Obtener facturas pendientes de pago
router.get(
  "/pending",
  requireRoles("admin", "employee"),
  getPendingPayments
);

// Obtener historial de pagos de un cliente
router.get(
  "/history/:clientId",
  requireRoles("admin", "employee"),
  getPaymentHistory
);

export default router;
