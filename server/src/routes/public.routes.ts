import { Router } from "express";
import { resolveTenant } from "../middleware/resolveTenant";
import { getBranding, getPublicSettings } from "../controllers/public.controller";


const router = Router();
router.use(resolveTenant);
router.get("/branding", getBranding);
router.get("/settings", getPublicSettings);
export default router;