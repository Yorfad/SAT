import { Request, Response } from "express";


export async function getBranding(req: Request, res: Response) {
const db = req.db!;
const [[row]]: any = await db.query(`SELECT display_name, logo_url, theme_json, features_json FROM settings LIMIT 1`);
if (!row) return res.json({ display_name: "Sin configurar", logo_url: null, theme: {}, features: [] });
res.json({ display_name: row.display_name, logo_url: row.logo_url, theme: row.theme_json || {}, features: row.features_json || [] });
}