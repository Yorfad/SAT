import { Request, Response } from "express";


export async function listServices(_req: Request, res: Response) {
const [rows] = await _req.db!.query(`SELECT id, service_name, description, default_price FROM services ORDER BY service_name`);
res.json(rows);
}


export async function createService(req: Request, res: Response) {
const { service_name, description = null, default_price } = req.body;
const [r] = await req.db!.query(
`INSERT INTO services (service_name, description, default_price) VALUES (?,?,?)`,
[service_name, description, default_price]
);
res.status(201).json({ id: (r as any).insertId });
}