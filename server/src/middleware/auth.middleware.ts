import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó un token' });
  }

  jwt.verify(token, authConfig.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    (req as any).user = user;
    next();
  });
};