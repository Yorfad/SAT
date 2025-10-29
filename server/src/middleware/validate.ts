import { AnyZodObject } from "zod";
import { Request, Response, NextFunction } from "express";
export const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
try { schema.parse({ body: req.body, params: req.params, query: req.query }); next(); }
catch (e: any) { res.status(400).json({ message: "Datos inválidos", issues: e.errors }); }
};