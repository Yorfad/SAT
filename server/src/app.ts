import "./config/env"; // carga .env
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";


import publicRoutes from "./routes/public.routes";
import authRoutes from "./routes/auth.routes";
import clientsRoutes from "./routes/clients.routes";
import servicesRoutes from "./routes/services.routes";
import invoicesRoutes from "./routes/invoices.routes";


import { resolveTenant } from "./middleware/resolveTenant";
import { errorHandler } from "./middleware/error";


const app = express();
app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));


// Público: solo requiere tenant para branding
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


app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));


app.use(errorHandler);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
export default app;