import { Request, Response, NextFunction } from 'express';

interface User {
  tenantId?: string;
}

interface AuthRequest extends Request {
  user?: User;
  tenantId?: string;
}

export const ensureTenantContext = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json({ message: 'Contexto de tenant inválido' });
  }

  req.tenantId = tenantId;
  next();
};