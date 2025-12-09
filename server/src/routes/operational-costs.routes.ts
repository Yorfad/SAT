import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { z } from "zod";
import {
  listOperationalCosts,
  createOperationalCost,
  updateOperationalCost,
  deleteOperationalCost,
  getOperationalCostsSummary,
  getServiceOperationalCosts
} from "../controllers/operational-costs.controller";

const router = Router();
router.use(authenticateToken);

// Listar costos operativos
router.get(
  "/",
  requireRoles("admin", "employee"),
  listOperationalCosts
);

// Crear nuevo costo operativo
router.post(
  "/",
  requireRoles("admin", "employee"),
  validate(z.object({
    body: z.object({
      serviceId: z.number().int().positive(),
      invoiceId: z.number().int().positive().optional(),
      clientUserId: z.number().int().positive(),
      costAmount: z.number().nonnegative(),
      revenueAmount: z.number().positive(),
      description: z.string().optional(),
      costDate: z.string() // ISO date string
    })
  })),
  createOperationalCost
);

// Actualizar costo operativo
router.patch(
  "/:id",
  requireRoles("admin", "employee"),
  validate(z.object({
    body: z.object({
      costAmount: z.number().nonnegative().optional(),
      revenueAmount: z.number().positive().optional(),
      description: z.string().optional(),
      costDate: z.string().optional()
    })
  })),
  updateOperationalCost
);

// Eliminar costo operativo
router.delete(
  "/:id",
  requireRoles("admin"),
  deleteOperationalCost
);

// Obtener resumen de costos operativos
router.get(
  "/summary",
  requireRoles("admin", "employee"),
  getOperationalCostsSummary
);

// Obtener costos de un servicio específico
router.get(
  "/service/:serviceId",
  requireRoles("admin", "employee"),
  getServiceOperationalCosts
);

export default router;
