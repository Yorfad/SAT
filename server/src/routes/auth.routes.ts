import { Router } from "express";
import { resolveTenant } from "../middleware/resolveTenant";
import { authenticateToken } from "../middleware/auth";
import {
  register,
  login,
  clientLogin,
  clientRegister,
  changePassword,
  forgotPassword,
  resetPasswordWithToken,
  verifyResetToken
} from "../controllers/auth.controller";
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

// DTOs para clientes (login con NIT)
const ClientLoginDTO = z.object({ body: z.object({
  nit: z.string().min(4, "NIT debe tener al menos 4 caracteres"),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres")
})});

const ClientRegisterDTO = z.object({ body: z.object({
  invitation_code: z.string().min(4, "Código de invitación requerido"),
  // Campos dinámicos - se validan en el controlador según el código
  nit: z.string().optional(),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),
  full_name: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  birth_date: z.string().optional(),
  business_name: z.string().optional(),
  tax_regime: z.string().optional()
})});


router.post("/register", validate(RegisterDTO), register);
router.post("/login", validate(LoginDTO), login);

// Endpoints para clientes móviles (login con NIT)
router.post("/client/login", validate(ClientLoginDTO), clientLogin);
router.post("/client/register", validate(ClientRegisterDTO), clientRegister);

// ==========================================
// ENDPOINTS DE GESTIÓN DE CONTRASEÑAS
// ==========================================

// Cambiar contraseña (requiere autenticación)
const ChangePasswordDTO = z.object({ body: z.object({
  currentPassword: z.string().optional(), // Opcional si es cambio obligatorio
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6)
})});
router.post("/change-password", authenticateToken, validate(ChangePasswordDTO), changePassword);

// Olvidé mi contraseña (público)
const ForgotPasswordDTO = z.object({ body: z.object({
  email: z.string().email().optional(),
  nit: z.string().min(4).optional()
}).refine(data => data.email || data.nit, {
  message: "Debe proporcionar email o NIT"
})});
router.post("/forgot-password", validate(ForgotPasswordDTO), forgotPassword);

// Restablecer con token (público)
const ResetWithTokenDTO = z.object({ body: z.object({
  token: z.string().min(1, "Token requerido"),
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6)
})});
router.post("/reset-password-with-token", validate(ResetWithTokenDTO), resetPasswordWithToken);

// Verificar token (público)
router.get("/verify-reset-token", verifyResetToken);


export default router;