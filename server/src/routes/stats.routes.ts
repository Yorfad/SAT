import { Router } from "express";
import { getStats } from "../controllers/stats.controller";
import { authenticateToken, requireRoles } from "../middleware/auth";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";

const router = Router();

// Middleware de autenticación y workspace
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

// GET /stats - Obtener estadísticas generales
router.get("/", requireRoles("admin", "employee"), getStats);

export default router;
