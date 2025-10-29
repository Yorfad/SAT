import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";


export async function register(req: Request, res: Response) {
const db = req.db!;
const { email, password, full_name, nit, role = "client", birth_date = null, phone_number = null } = req.body;
const hash = await bcrypt.hash(password, 10);
try {
const [r] = await db.query(
`INSERT INTO users (email,password_hash,full_name,nit,role,birth_date,phone_number) VALUES (?,?,?,?,?,?,?)`,
[email, hash, full_name, nit, role, birth_date, phone_number]
);
res.status(201).json({ id: (r as any).insertId });
} catch (e: any) {
if (e.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email o NIT ya existe" });
throw e;
}
}


export async function login(req: Request, res: Response) {
const db = req.db!;
const { email, password } = req.body;
const [rows] = await db.query(
`SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email=? LIMIT 1`,
[email]
);
const u = (rows as any[])[0];
if (!u || !u.is_active) return res.status(401).json({ message: "Credenciales inválidas" });
const ok = await bcrypt.compare(password, u.password_hash);
if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

const secret: Secret = env.jwtSecret;           // string seguro
const opts: SignOptions = { expiresIn: env.jwtExpiresIn };

const token = jwt.sign(
  { sub: u.id, role: u.role, name: u.full_name, tenant: req.tenantSlug },
  secret,
  opts
);
res.json({ token, user: { id: u.id, name: u.full_name, email: u.email, role: u.role }, tenant: req.tenantSlug });
}