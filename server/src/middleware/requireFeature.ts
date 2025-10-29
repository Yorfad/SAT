import { Request, Response, NextFunction } from "express";


export function requireFeature(flag: string) {
return async (req: Request, res: Response, next: NextFunction) => {
// cache ligera en req
if (!req.tenantSettings) {
const [[row]]: any = await req.db!.query(`SELECT features_json FROM settings LIMIT 1`);
req.tenantSettings = { branding: null, features: row?.features_json || [] };
}
if (!req.tenantSettings.features.includes(flag)) {
return res.status(404).json({ message: "No disponible" });
}
next();
};
}
