import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRoles } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { z } from "zod";
import { listServices, createService } from "../controllers/service.controller";


const router = Router();
router.use(authenticateToken);


router.get("/", requireRoles("admin","employee"), listServices);
router.post("/", requireRoles("admin","employee"), validate(z.object({ body: z.object({
service_name: z.string().min(2),
description: z.string().optional(),
default_price: z.number().nonnegative()
}) })), createService);


export default router;