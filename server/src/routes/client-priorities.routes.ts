import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { z } from "zod";
import {
  listPriorities,
  setPriority,
  deletePriority,
  getClientPriorities
} from "../controllers/client-priorities.controller";

const router = Router();
router.use(authenticateToken);

// Listar prioridades
router.get(
  "/",
  requireRoles("admin", "employee"),
  listPriorities
);

// Establecer prioridad
router.post(
  "/",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      clientUserId: z.number(),
      serviceId: z.number().optional(),
      priority: z.enum(['baja', 'normal', 'alta', 'urgente']),
      notes: z.string().optional()
    })
  })),
  setPriority
);

// Eliminar prioridad
router.delete(
  "/:id",
  requireRoles("admin"),
  deletePriority
);

// Obtener prioridades de un cliente específico
router.get(
  "/client/:clientId",
  requireRoles("admin", "employee"),
  getClientPriorities
);

export default router;
