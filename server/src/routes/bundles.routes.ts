import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import { validate } from "../middleware/validate";
import { z } from "zod";
import {
  listBundles,
  getBundleById,
  createBundle,
  updateBundle,
  deleteBundle,
  getBundleServices,
  addServiceToBundle,
  updateBundleService,
  removeServiceFromBundle,
  getClientBundles,
  assignBundleToClient,
  updateClientBundle,
  unassignBundleFromClient,
  calculateBundlePrice
} from "../controllers/bundles.controller";

const router = Router();
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

// ================== PLANTILLAS DE BUNDLES ==================

// Listar todos los bundles
router.get(
  "/",
  requireRoles("admin", "employee"),
  listBundles
);

// Obtener un bundle específico
router.get(
  "/:id",
  requireRoles("admin", "employee"),
  getBundleById
);

// Crear nuevo bundle
router.post(
  "/",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      bundleName: z.string().min(1, "El nombre es requerido"),
      description: z.string().optional(),
      bundlePrice: z.number().min(0).optional(),
      serviceIds: z.array(z.number().int().positive()).optional(),
      isGlobal: z.boolean().optional()
    })
  })),
  createBundle
);

// Actualizar bundle
router.patch(
  "/:id",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      bundleName: z.string().optional(),
      description: z.string().optional(),
      bundlePrice: z.number().min(0).optional(),
      isActive: z.boolean().optional(),
      serviceIds: z.array(z.number().int().positive()).optional()
    })
  })),
  updateBundle
);

// Eliminar bundle
router.delete(
  "/:id",
  requireRoles("admin"),
  deleteBundle
);

// ================== SERVICIOS EN BUNDLES ==================

// Obtener servicios de un bundle
router.get(
  "/:id/services",
  requireRoles("admin", "employee"),
  getBundleServices
);

// Agregar servicio a bundle
router.post(
  "/:id/services",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      serviceId: z.number().int().positive()
    })
  })),
  addServiceToBundle
);

// Actualizar configuración de servicio en bundle
router.patch(
  "/:id/services/:serviceId",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      includeInBasePrice: z.boolean().optional(),
      addWhenDue: z.boolean().optional(),
      customPrice: z.number().min(0).optional(),
      assignmentType: z.enum(["all_clients", "selected_clients"]).optional()
    })
  })),
  updateBundleService
);

// Quitar servicio de bundle
router.delete(
  "/:id/services/:serviceId",
  requireRoles("admin"),
  removeServiceFromBundle
);

// Calcular precio del bundle para un mes
router.get(
  "/calculate-price/:bundleId",
  requireRoles("admin", "employee"),
  calculateBundlePrice
);

// ================== BUNDLES DE CLIENTES ==================

// Obtener bundles de un cliente
router.get(
  "/clients/:clientId",
  requireRoles("admin", "employee"),
  getClientBundles
);

// Asignar bundle a un cliente
router.post(
  "/clients/:clientId/assign",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      bundleId: z.number().int().positive(),
      customPrice: z.number().min(0).optional(),
      startDate: z.string().optional()
    })
  })),
  assignBundleToClient
);

// Actualizar asignación de bundle
router.patch(
  "/client-bundles/:id",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      customPrice: z.number().min(0).optional(),
      status: z.enum(["active", "paused", "cancelled"]).optional()
    })
  })),
  updateClientBundle
);

// Desasignar bundle de cliente
router.delete(
  "/client-bundles/:id",
  requireRoles("admin"),
  unassignBundleFromClient
);

export default router;
