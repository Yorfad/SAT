import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { z } from "zod";
import {
  createObservation,
  getClientObservations,
  getPrimaryObservation,
  togglePrimaryObservation,
  deleteObservation
} from "../controllers/observation.controller";

const router = Router();
router.use(authenticateToken);

// POST /observations - Crear observación
router.post(
  "/",
  requireRoles("admin", "employee"),
  validate(
    z.object({
      body: z.object({
        task_id: z.number(),
        client_user_id: z.number(),
        observation_text: z.string().optional().nullable(),
        rating: z.number().min(1).max(5).optional().nullable()
      })
    })
  ),
  createObservation
);

// GET /clients/:id/observations - Obtener observaciones de un cliente
router.get(
  "/clients/:id/observations",
  requireRoles("admin", "employee"),
  getClientObservations
);

// GET /clients/:id/primary-observation - Obtener observación primordial
router.get(
  "/clients/:id/primary-observation",
  requireRoles("admin", "employee"),
  getPrimaryObservation
);

// PATCH /observations/:id/primary - Marcar como primordial
router.patch(
  "/:id/primary",
  requireRoles("admin"),
  validate(
    z.object({
      body: z.object({
        is_primary: z.boolean()
      })
    })
  ),
  togglePrimaryObservation
);

// DELETE /observations/:id - Eliminar observación
router.delete("/:id", requireRoles("admin", "employee"), deleteObservation);

export default router;
