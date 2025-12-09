import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { z } from "zod";
import {
  listClients,
  assignClient,
  bulkAssignClients,
  updateClientProfile,
  getFilterOptions
} from "../controllers/client-management.controller";

const router = Router();
router.use(authenticateToken);

// Listar clientes con filtros
router.get(
  "/",
  requireRoles("admin", "employee"),
  listClients
);

// Asignar un cliente a un empleado
router.patch(
  "/:id/assign",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      assignedToUserId: z.number().nullable().optional()
    })
  })),
  assignClient
);

// Asignación masiva de clientes
router.post(
  "/bulk-assign",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      clientIds: z.array(z.number()).min(1),
      assignedToUserId: z.number().nullable().optional()
    })
  })),
  bulkAssignClients
);

// Actualizar perfil de cliente (sede, grupo, etc.)
router.patch(
  "/:id/profile",
  requireRoles("admin"),
  validate(z.object({
    body: z.object({
      sede: z.string().optional(),
      grupo: z.string().optional(),
      contractNumber: z.string().optional(),
      notes: z.string().optional()
    })
  })),
  updateClientProfile
);

// Obtener opciones de filtros
router.get(
  "/filter-options",
  requireRoles("admin", "employee"),
  getFilterOptions
);

export default router;
