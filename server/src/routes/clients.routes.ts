import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { z } from "zod";
import { resolveWorkspace, loadWorkspaceId } from "../middleware/resolveWorkspace";
import {
  listClients,
  getClientById,
  upsertClientProfile,
  listClientServices,
  addClientService,
  cancelClientServiceById,
  getClientDashboard,
  deactivateClient,
  activateClient,
  deactivateClientService,
  activateClientService,
  getClientTasks,
  approveTask,
  rejectTask,
  requestService,
  getAvailableServices,
  getClientHistory,
  resetClientPassword
} from "../controllers/client.controller";


const router = Router();
router.use(authenticateToken);
router.use(resolveWorkspace);
router.use(loadWorkspaceId);

router.get("/dashboard", requireRoles("client"), getClientDashboard);

// Endpoints para cliente móvil
router.get("/my-tasks", requireRoles("client"), getClientTasks);
router.get("/available-services", requireRoles("client"), getAvailableServices);
router.post("/tasks/:id/approve", requireRoles("client"), approveTask);
router.post("/tasks/:id/reject", requireRoles("client"), validate(z.object({ body: z.object({
  reason: z.string().min(1, "El motivo es requerido")
}) })), rejectTask);
router.post("/request-service", requireRoles("client"), requestService);

router.get("/", requireRoles("admin","employee"), listClients);
router.get("/:id", requireRoles("admin","employee","client"), getClientById);


router.put("/:id/profile", requireRoles("admin","employee"), validate(z.object({ body: z.object({
contract_number: z.string().optional(),
sat_password: z.string().optional(),
overall_rating: z.number().min(0).max(5).optional(),
notes: z.string().optional()
}) })), upsertClientProfile);


router.get("/:id/services", requireRoles("admin","employee"), listClientServices);
router.get("/:id/history", requireRoles("admin","employee"), getClientHistory);
router.post("/:id/services", requireRoles("admin","employee"), validate(z.object({ body: z.object({
service_id: z.number(),
custom_price: z.number().optional(),
start_date: z.string()
}) })), addClientService);


router.patch("/client-services/:csId/deactivate", requireRoles("admin","employee"), cancelClientServiceById);

// Desactivación/Activación de clientes completos
router.post("/:id/deactivate", requireRoles("admin"), validate(z.object({ body: z.object({
  reason: z.string().min(5, "El motivo debe tener al menos 5 caracteres")
}) })), deactivateClient);

router.post("/:id/activate", requireRoles("admin"), activateClient);

// Desactivación/Activación de servicios específicos
router.post("/:id/services/:serviceId/deactivate", requireRoles("admin"), validate(z.object({ body: z.object({
  reason: z.string().min(5, "El motivo debe tener al menos 5 caracteres")
}) })), deactivateClientService);

router.post("/:id/services/:serviceId/activate", requireRoles("admin"), activateClientService);

// Restablecer contraseña de cliente
router.post("/:id/reset-password", requireRoles("admin"), validate(z.object({ body: z.object({
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
  generateRandom: z.boolean().optional()
}) })), resetClientPassword);


export default router;