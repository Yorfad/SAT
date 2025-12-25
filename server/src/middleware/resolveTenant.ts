import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPoolForTenantSlug } from "../config/database";
import { env } from "../config/env";
import { PermissionService } from "../services/permission.service";


function subdomain(host: string) {
  const parts = (host || "").split(".");
  return parts.length > 2 ? parts[0] : null; // cliente1.miapp.com → "cliente1"
}

// Extrae el tenant del JWT si existe
function getTenantFromJWT(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.jwtSecret) as any;
    return decoded.tenant || null;
  } catch {
    return null;
  }
}


declare global {
  namespace Express {
    interface Request {
      db?: ReturnType<typeof getPoolForTenantSlug>;
      tenantSlug?: string;
      tenantSettings?: { branding: any; features: string[] };
      permissionService?: PermissionService;
    }
  }
}


export function resolveTenant(req: Request, res: Response, next: NextFunction) {
  const fromHeader = (req.headers["x-tenant"] as string)?.trim();
  const fromQuery = (req.query.tenant as string)?.trim();
  const fromSub = subdomain(req.hostname);
  const fromJWT = getTenantFromJWT(req); // Fallback: extraer del JWT

  const slug = fromHeader || fromQuery || fromSub || fromJWT;
  if (!slug) return res.status(400).json({ message: "Falta tenant (X-Tenant o subdominio)" });

  try {
    const db = getPoolForTenantSlug(slug);
    req.db = db;
    req.tenantSlug = slug;
    req.permissionService = new PermissionService(db);
    next();
  } catch (e: any) {
    res.status(e.statusCode || 500).json({ message: e.message || "Error tenant" });
  }
}