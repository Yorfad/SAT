import { Request, Response, NextFunction } from "express";
import { getPoolForTenantSlug } from "../config/database";


function subdomain(host: string) {
const parts = (host || "").split(".");
return parts.length > 2 ? parts[0] : null; // cliente1.miapp.com → "cliente1"
}


declare global {
namespace Express {
interface Request {
db?: ReturnType<typeof getPoolForTenantSlug>;
tenantSlug?: string;
tenantSettings?: { branding: any; features: string[] };
}
}
}


export function resolveTenant(req: Request, res: Response, next: NextFunction) {
const fromHeader = (req.headers["x-tenant"] as string)?.trim();
const fromQuery = (req.query.tenant as string)?.trim();
const fromSub = subdomain(req.hostname);
const slug = fromHeader || fromQuery || fromSub;
if (!slug) return res.status(400).json({ message: "Falta tenant (X-Tenant o subdominio)" });


try {
req.db = getPoolForTenantSlug(slug);
req.tenantSlug = slug;
next();
} catch (e: any) {
res.status(e.statusCode || 500).json({ message: e.message || "Error tenant" });
}
}