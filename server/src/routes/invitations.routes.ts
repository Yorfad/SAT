import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { resolveTenant } from "../middleware/resolveTenant";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import {
  listInvitationCodes,
  getInvitationCode,
  createInvitationCode,
  updateInvitationCode,
  deleteInvitationCode,
  validateInvitationCode
} from "../controllers/invitation.controller";

const router = Router();

// Ruta pública para validar código (usada por el formulario de registro)
router.get("/validate/:code", resolveTenant, validateInvitationCode);

// Rutas protegidas para administrar códigos
router.use(authenticateToken);
router.use(resolveTenant);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

router.get("/", requireRoles("admin"), listInvitationCodes);
router.get("/:id", requireRoles("admin"), getInvitationCode);
router.post("/", requireRoles("admin"), createInvitationCode);
router.put("/:id", requireRoles("admin"), updateInvitationCode);
router.delete("/:id", requireRoles("admin"), deleteInvitationCode);

export default router;
