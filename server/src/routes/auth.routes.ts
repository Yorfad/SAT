import { Router } from "express";
import { resolveTenant } from "../middleware/resolveTenant";
import { register, login } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { z } from "zod";


const router = Router();
router.use(resolveTenant);


const RegisterDTO = z.object({ body: z.object({
email: z.string().email(),
password: z.string().min(8),
full_name: z.string().min(2),
nit: z.string().min(4),
role: z.enum(["client","admin","employee"]).default("client"),
birth_date: z.string().optional(),
phone_number: z.string().optional()
})});
const LoginDTO = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(8) }) });


router.post("/register", validate(RegisterDTO), register);
router.post("/login", validate(LoginDTO), login);


export default router;