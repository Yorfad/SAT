// src/app.ts
import express from "express";
import cors from "cors";
import { config } from "dotenv"; config();

import authRoutes from "./modules/auth/auth.routes";
import clientsRoutes from "./modules/clients/clients.routes";
import invoicesRoutes from "./modules/invoices/invoices.routes";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/admin/clients", clientsRoutes);
app.use("/api/admin/invoices", invoicesRoutes);

// Si usas storage local y quieres exponerlo:
import path from "path";
app.use("/media", express.static(path.join(__dirname, "..", "storage")));

app.listen(process.env.PORT || 4000, () => {
  console.log(`API lista en http://localhost:${process.env.PORT || 4000}`);
});
