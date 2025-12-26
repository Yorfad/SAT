import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import { getMyAssignedClients, getClientOmisos, activateClientOmiso } from "../controllers/my-clients.controller";
import { upload } from "../config/upload";

const router = Router();

// Todas las rutas requieren autenticación y workspace
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

/**
 * GET /api/my-clients
 * Obtiene todos los clientes asignados al usuario logueado con sus servicios
 * Solo accesible para admin y employee
 */
router.get("/", requireRoles("admin", "employee"), getMyAssignedClients);

/**
 * GET /api/my-clients/:clientId/omisos
 * Obtiene todos los omisos de un cliente específico
 * Solo accesible para admin y employee
 */
router.get("/:clientId/omisos", requireRoles("admin", "employee"), getClientOmisos);

/**
 * POST /api/my-clients/:clientId/omisos
 * Activa un omiso para un cliente (requiere archivo + motivo)
 * Solo accesible para admin y employee
 */
router.post("/:clientId/omisos", requireRoles("admin", "employee"), upload.single('file'), activateClientOmiso);

export default router;
