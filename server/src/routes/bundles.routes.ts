import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { z } from "zod";
import {
  getClientBundles,
  getBundleServices,
  createBundle,
  updateBundle,
  deleteBundle,
  addServiceToBundle,
  removeServiceFromBundle
} from "../controllers/bundles.controller";

const router = Router();
router.use(authenticateToken);

// Obtener bundles de un cliente
router.get(
  "/clients/:clientId/bundles",
  requireRoles("admin", "employee"),
  getClientBundles
);

// Obtener servicios de un bundle
router.get(
  "/:bundleId/services",
  requireRoles("admin", "employee"),
  getBundleServices
);

// Crear nuevo bundle para un cliente
router.post(
  "/clients/:clientId/bundles",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      totalPrice: z.number().positive(),
      operationalCost: z.number().min(0).optional(),
      serviceIds: z.array(z.number().int().positive()).optional()
    })
  })),
  createBundle
);

// Actualizar bundle
router.patch(
  "/:bundleId",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      totalPrice: z.number().positive().optional(),
      operationalCost: z.number().min(0).optional(),
      isActive: z.boolean().optional()
    })
  })),
  updateBundle
);

// Eliminar bundle
router.delete(
  "/:bundleId",
  requireRoles("admin"),
  deleteBundle
);

// Agregar servicio a bundle
router.post(
  "/:bundleId/add-service",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      serviceId: z.number().int().positive()
    })
  })),
  addServiceToBundle
);

// Quitar servicio de bundle
router.post(
  "/:bundleId/remove-service",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      serviceId: z.number().int().positive()
    })
  })),
  removeServiceFromBundle
);

export default router;
