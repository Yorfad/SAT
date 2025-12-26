import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";


export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Sin token" });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as any;

    if (!req.tenantSlug || payload.tenant !== req.tenantSlug) {
      console.warn(`[AUTH] Token/tenant mismatch: token=${payload.tenant}, request=${req.tenantSlug}`);
      return res.status(403).json({ message: "Token/tenant no coincide" });
    }

    // Map 'sub' to 'id' for easier access in controllers
    (req as any).user = { ...payload, id: payload.sub };
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      console.warn(`[AUTH] Token expirado: user=${req.headers['x-tenant'] || 'unknown'}, exp=${err.expiredAt}`);
      return res.status(401).json({ message: "Token expirado", code: "TOKEN_EXPIRED" });
    }
    if (err instanceof JsonWebTokenError) {
      console.warn(`[AUTH] Token inválido: ${err.message}`);
      return res.status(401).json({ message: "Token inválido", code: "TOKEN_INVALID" });
    }
    console.error(`[AUTH] Error inesperado:`, err);
    res.status(401).json({ message: "Error de autenticación" });
  }
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthenticated" });
    if (!roles.includes(user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}