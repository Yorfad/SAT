import { Router } from "express";
import { resolveTenant } from "../middleware/resolveTenant";
import { getBranding } from "../controllers/public.controller";


const router = Router();
router.use(resolveTenant);
router.get("/branding", getBranding);
export default router;