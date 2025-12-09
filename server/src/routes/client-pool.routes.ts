import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { z } from "zod";
import {
  listPoolItems,
  addToPool,
  takePoolItem,
  completePoolItem,
  cancelPoolItem,
  getPoolStats
} from "../controllers/client-pool.controller";

const router = Router();
router.use(authenticateToken);

// Listar items del pool
router.get(
  "/",
  requireRoles("admin", "employee"),
  listPoolItems
);

// Agregar item al pool
router.post(
  "/",
  requireRoles("admin", "employee"),
  validate(z.object({
    body: z.object({
      clientUserId: z.number(),
      invoiceId: z.number().optional(),
      taskId: z.number().optional(),
      serviceId: z.number().optional(),
      description: z.string().min(1),
      priority: z.enum(['baja', 'normal', 'alta', 'urgente']).optional(),
      notes: z.string().optional()
    })
  })),
  addToPool
);

// Tomar un item del pool
router.patch(
  "/:id/take",
  requireRoles("admin", "employee"),
  takePoolItem
);

// Completar un item del pool
router.patch(
  "/:id/complete",
  requireRoles("admin", "employee"),
  validate(z.object({
    body: z.object({
      notes: z.string().optional()
    })
  })),
  completePoolItem
);

// Cancelar un item del pool
router.patch(
  "/:id/cancel",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      notes: z.string().optional()
    })
  })),
  cancelPoolItem
);

// Obtener estadísticas del pool
router.get(
  "/stats",
  requireRoles("admin", "employee"),
  getPoolStats
);

export default router;
