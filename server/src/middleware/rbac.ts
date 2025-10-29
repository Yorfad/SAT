import { Request, Response, NextFunction } from "express";
export function requireRoles(...roles: Array<"admin"|"employee"|"client">) {
return (req: Request, res: Response, next: NextFunction) => {
const role = (req as any).user?.role;
if (!role || !roles.includes(role)) return res.status(403).json({ message: "Acceso denegado" });
next();
};
}