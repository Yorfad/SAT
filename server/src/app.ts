import "./config/env"; // carga .env
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";

import publicRoutes from "./routes/public.routes";
import authRoutes from "./routes/auth.routes";
import { mobileClientLogin } from "./controllers/auth.controller";
import { publicValidateCode, publicRegisterWithCode } from "./controllers/invitation.controller";
import clientsRoutes from "./routes/clients.routes";
import servicesRoutes from "./routes/services.routes";
import invoicesRoutes from "./routes/invoices.routes";
import boardRoutes from "./routes/board.routes";
import myClientsRoutes from "./routes/my-clients.routes";
import observationsRoutes from "./routes/observations.routes";
import paymentsRoutes from "./routes/payments.routes";
import infractionsRoutes from "./routes/infractions.routes";
import expensesRoutes from "./routes/expenses.routes";
import bundlesRoutes from "./routes/bundles.routes";
import operationalCostsRoutes from "./routes/operational-costs.routes";
import adminRoutes from "./routes/admin.routes";
import clientManagementRoutes from "./routes/client-management.routes";
import clientPoolRoutes from "./routes/client-pool.routes";
import clientPrioritiesRoutes from "./routes/client-priorities.routes";
import userManagementRoutes from "./routes/user-management.routes";
import rolesPermissionsRoutes from "./routes/roles-permissions.routes";
import workspaceRoutes from "./routes/workspace.routes";
import invitationsRoutes from "./routes/invitations.routes";
import clientFieldsRoutes from "./routes/client-fields.routes";
import bulkAssignmentRoutes from "./routes/bulk-assignment.routes";


import { resolveTenant } from "./middleware/resolveTenant";
import { resolveWorkspace, loadWorkspaceId } from "./middleware/resolveWorkspace";
import { errorHandler } from "./middleware/error";


const app = express();
app.use(helmet());
// CORS: permitir orígenes configurados + apps móviles Capacitor
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (apps móviles, Postman, curl)
    if (!origin) return callback(null, true);
    // Permitir orígenes de Capacitor
    if (origin.startsWith('capacitor://') || origin.startsWith('http://localhost')) {
      return callback(null, true);
    }
    // Permitir orígenes configurados
    if (env.corsOrigin.includes(origin)) {
      return callback(null, true);
    }
    // En desarrollo, permitir todo
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(new Error('CORS no permitido'));
  },
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));


// Health check (sin tenant, para Docker healthcheck)
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Login móvil de clientes: NO requiere tenant (busca en todos los tenants)
const mobileAuthLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.post("/api/auth/mobile/login", mobileAuthLimiter, mobileClientLogin);

// Registro con código de invitación: NO requiere tenant (busca el código en todos los tenants)
// IMPORTANTE: Registrar ANTES de publicRoutes para evitar conflicto con resolveTenant
const registerLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.post("/api/public/validate-code", registerLimiter, publicValidateCode);
app.post("/api/public/register-with-code", registerLimiter, publicRegisterWithCode);

// Público: rutas que requieren tenant para branding (DESPUÉS de las rutas sin tenant)
app.use("/api/public", publicRoutes);


// Resolver tenant antes de auth y rutas privadas
app.use("/api", resolveTenant);


// Auth (rate limit en login)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/auth", authLimiter, authRoutes);


// Rutas privadas (requieren JWT dentro de cada router)
app.use("/api/clients", clientsRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/board", boardRoutes);
app.use("/api/my-clients", myClientsRoutes);
app.use("/api/observations", observationsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/infractions", infractionsRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/bundles", bundlesRoutes);
app.use("/api/operational-costs", operationalCostsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/client-management", clientManagementRoutes);
app.use("/api/pool", clientPoolRoutes);
app.use("/api/priorities", clientPrioritiesRoutes);
app.use("/api/user-management", userManagementRoutes);
app.use("/api/roles-permissions", rolesPermissionsRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/invitations", invitationsRoutes);
app.use("/api/client-fields", clientFieldsRoutes);
app.use("/api/bulk-assignment", bulkAssignmentRoutes);


app.use(errorHandler);

// Iniciar scheduler de tareas (solo si no estamos en modo test)
if (process.env.NODE_ENV !== 'test') {
  import('./jobs/start-scheduler').catch((err) => {
    console.warn('No se pudo iniciar el scheduler:', err.message);
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));

export default app;