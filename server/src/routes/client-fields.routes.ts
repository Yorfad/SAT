import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import {
  getClientFields,
  getAllClientFields,
  createClientField,
  updateClientField,
  deleteClientField,
  reorderClientFields,
  getClientCustomValues,
  saveClientCustomValues,
  createClient
} from "../controllers/client-fields.controller";

const router = Router();
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

// ================== CAMPOS PERSONALIZADOS ==================

// Obtener campos activos (para formularios)
router.get(
  "/",
  requireRoles("admin", "employee"),
  getClientFields
);

// Obtener todos los campos (incluyendo inactivos)
router.get(
  "/all",
  requireRoles("admin"),
  getAllClientFields
);

// Crear campo
router.post(
  "/",
  requireRoles("admin"),
  createClientField
);

// Actualizar campo
router.patch(
  "/:id",
  requireRoles("admin"),
  updateClientField
);

// Eliminar campo
router.delete(
  "/:id",
  requireRoles("admin"),
  deleteClientField
);

// Reordenar campos
router.post(
  "/reorder",
  requireRoles("admin"),
  reorderClientFields
);

// ================== VALORES DE CLIENTE ==================

// Obtener valores de un cliente
router.get(
  "/values/:id",
  requireRoles("admin", "employee"),
  getClientCustomValues
);

// Guardar valores de un cliente
router.patch(
  "/values/:id",
  requireRoles("admin", "employee"),
  saveClientCustomValues
);

// ================== CREAR CLIENTE ==================

// Crear nuevo cliente
router.post(
  "/create-client",
  requireRoles("admin"),
  createClient
);

export default router;
