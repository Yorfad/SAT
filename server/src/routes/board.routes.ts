import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import { getBrigadeBoard, toggleChecklistItem, updateInvoiceObservations } from "../controllers/board.controller";

const router = Router();
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

// Solo empleados y admin
router.get("/", requireRoles("employee","admin"), getBrigadeBoard);
router.patch("/invoice/:invoiceId/observations", requireRoles("employee","admin"), updateInvoiceObservations);
router.patch("/checklist/:id", requireRoles("employee","admin"), toggleChecklistItem);

export default router;
