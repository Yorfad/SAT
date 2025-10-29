import { Request, Response } from "express";


export async function createDefaultChecklist(req: Request, res: Response) {
const { invoiceId } = req.params;
const [[cli]]: any = await req.db!.query(`SELECT client_user_id FROM monthly_invoices WHERE id=?`, [invoiceId]);
if (!cli) return res.status(404).json({ message: "Factura no encontrada" });


const [svc]: any = await req.db!.query(
`SELECT s.service_name FROM client_services cs JOIN services s ON s.id=cs.service_id WHERE cs.client_user_id=? AND cs.status='active'`,
[cli.client_user_id]
);
const baseTasks = new Set<string>(["Factura del mes"]);
for (const r of svc) {
if (/iva/i.test(r.service_name)) baseTasks.add("Declaración de IVA");
if (/libro/i.test(r.service_name)) baseTasks.add("Libros al día");
}
for (const t of baseTasks) {
await req.db!.query(`INSERT INTO monthly_service_checklist (invoice_id, task_name) VALUES (?,?)`, [invoiceId, t]);
}
res.json({ created: baseTasks.size });
}


export async function markChecklistTask(req: Request, res: Response) {
const { taskId } = req.params;
await req.db!.query(
`UPDATE monthly_service_checklist SET status='completed', completed_by_user_id=?, completion_date=NOW() WHERE id=?`,
[(req as any).user.sub, taskId]
);
res.json({ ok: true });
}