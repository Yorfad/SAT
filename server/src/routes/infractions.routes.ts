import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import { validate } from "../middleware/validate";
import { z } from "zod";
import {
  listInfractions,
  createInfraction,
  resolveInfraction,
  deleteInfraction,
  getInfractionSummary,
  getClientInfractions
} from "../controllers/infractions.controller";

const router = Router();
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

// Listar infracciones
router.get(
  "/",
  requireRoles("admin", "employee"),
  listInfractions
);

// Crear nueva infracción manual
router.post(
  "/",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      clientUserId: z.number().int().positive(),
      reason: z.string().min(1),
      relatedInvoiceId: z.number().int().positive().optional().nullable(),
      confirmDeactivation: z.boolean().optional()
    })
  })),
  createInfraction
);

// Resolver/cancelar infracción
router.patch(
  "/:id/resolve",
  requireRoles("admin", "employee"),
  validate(z.object({
    body: z.object({
      resolutionNotes: z.string().optional()
    })
  })),
  resolveInfraction
);

// Eliminar infracción (solo admins)
router.delete(
  "/:id",
  requireRoles("admin"),
  deleteInfraction
);

// Obtener resumen de infracciones de un cliente
router.get(
  "/summary/:clientId",
  requireRoles("admin", "employee"),
  getInfractionSummary
);

// Obtener historial completo de infracciones de un cliente
router.get(
  "/client/:clientId",
  requireRoles("admin", "employee"),
  getClientInfractions
);

export default router;
