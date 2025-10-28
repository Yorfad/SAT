import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import pool from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// Registro de usuario
export const register = async (req: Request, res: Response) => {
  const { email, password, fullName, nit, tenantId } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, authConfig.bcrypt.saltRounds);
    
    const [result] = await pool.query(
      'INSERT INTO users (tenant_id, email, password_hash, full_name, nit) VALUES (?, ?, ?, ?, ?)',
      [tenantId, email, hashedPassword, fullName, nit]
    );
    
    const userId = (result as ResultSetHeader).insertId;
    
    res.status(201).json({ success: true, message: 'Usuario registrado exitosamente', userId });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ success: false, message: 'Error al registrar usuario' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password, tenantId } = req.body;
  
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE tenant_id = ? AND email = ?', [tenantId, email]);
    const user = rows[0] as RowDataPacket & { password_hash: string; id: number; tenant_id: number; role?: string };
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }
    
    const payload = { userId: user.id, tenantId: user.tenant_id, role: user.role };
    const secret: Secret = authConfig.jwt.secret as Secret;
    const signOptions: SignOptions = {
      expiresIn: authConfig.jwt.expiresIn as unknown as SignOptions['expiresIn']
    };
    const token = jwt.sign(payload, secret, signOptions);
    
    res.json({ success: true, token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ success: false, message: 'Error al iniciar sesión' });
  }
};
