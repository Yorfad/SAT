import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";


export function authenticateToken(req: Request, res: Response, next: NextFunction) {
const hdr = req.headers.authorization || "";
const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
if (!token) return res.status(401).json({ message: "Sin token" });


try {
const payload = jwt.verify(token, env.jwtSecret) as any;
if (!req.tenantSlug || payload.tenant !== req.tenantSlug) {
return res.status(403).json({ message: "Token/tenant no coincide" });
}
(req as any).user = payload; // { sub, role, name, tenant }
next();
} catch {
res.status(401).json({ message: "Token inválido/expirado" });
}
}