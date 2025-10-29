import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { resolveUploadPath } from "../config/upload";

function computeStatus(totalDue: number, paid: number): "paid"|"pending"|"overdue"|"partial" {
if (paid >= totalDue) return "paid";
if (paid > 0) return "partial";
return "pending";
}

export async function listInvoicesByClient(req: Request, res: Response) {
const { clientId } = req.params;
const me = (req as any).user;
if (me.role === "client" && Number(me.sub) !== Number(clientId)) return res.status(403).json({ message: "No autorizado" });


const [rows] = await req.db!.query(
`SELECT id, invoice_year, invoice_month, previous_debt, monthly_fee, extras_fee, total_due, amount_paid, balance, payment_status, services_status, due_date, created_at
FROM monthly_invoices WHERE client_user_id=? ORDER BY invoice_year DESC, invoice_month DESC`,
[clientId]
);
res.json(rows);
}

export async function createMonthlyInvoice(req: any, res: any) {
  const { clientId } = req.params;
  const {
    invoice_year, invoice_month,
    previous_debt = 0, extras_fee = 0, extras_description = null, due_date = null
  } = req.body;

  // 1) Servicios activos del cliente (precio efectivo)
  const [svc]: any = await req.db!.query(
    `SELECT s.id AS service_id, s.service_name,
            COALESCE(cs.custom_price, s.default_price) AS unit_price
       FROM client_services cs
       JOIN services s ON s.id=cs.service_id
      WHERE cs.client_user_id=? AND cs.status='active'`,
    [clientId]
  );

  // 2) Inserta factura (monthly_fee se calcula con items)
  const monthly_fee = svc.reduce((sum: number, r: any) => sum + Number(r.unit_price), 0);
  const total_due = Number(previous_debt) + Number(monthly_fee) + Number(extras_fee);
  const amount_paid = 0;
  const balance = total_due;

  const [r] = await req.db!.query(
    `INSERT INTO monthly_invoices
     (client_user_id, invoice_year, invoice_month, previous_debt, monthly_fee, extras_fee, extras_description,
      total_due, amount_paid, balance, payment_status, services_status, due_date)
     VALUES (?,?,?,?,?,?,?, ?,?,?, 'pending','pending', ?)`,
    [clientId, invoice_year, invoice_month, previous_debt, monthly_fee, extras_fee, extras_description,
     total_due, amount_paid, balance, due_date]
  );
  const invoiceId = (r as any).insertId;

  // 3) Items por servicio
  for (const r of svc) {
    await req.db!.query(
      `INSERT INTO invoice_service_items (invoice_id, service_id, description, quantity, unit_price)
       VALUES (?,?,?,?,?)`,
      [invoiceId, r.service_id, r.service_name, 1, r.unit_price]
    );
  }

  // 4) Instanciar requerimientos de archivos (slots) desde la plantilla
  const [arts]: any = await req.db!.query(
    `SELECT sa.id FROM service_artifacts sa
      WHERE sa.service_id IN (${svc.map(()=>'?').join(',')})`,
    svc.map((r:any)=>r.service_id)
  );
  for (const a of arts) {
    await req.db!.query(
      `INSERT INTO invoice_artifacts (invoice_id, service_artifact_id) VALUES (?,?)`,
      [invoiceId, a.id]
    );
  }

  res.status(201).json({ id: invoiceId, monthly_fee, itemsCreated: svc.length, artifactsCreated: arts.length });
}


export async function updateInvoicePayments(req: Request, res: Response) {
const { invoiceId } = req.params;
const { amount_paid } = req.body;


const [[row]]: any = await req.db!.query(`SELECT total_due FROM monthly_invoices WHERE id=?`, [invoiceId]);
if (!row) return res.status(404).json({ message: "Factura no encontrada" });


const balance = Number(row.total_due) - Number(amount_paid);
const payment_status = computeStatus(Number(row.total_due), Number(amount_paid));


await req.db!.query(`UPDATE monthly_invoices SET amount_paid=?, balance=?, payment_status=? WHERE id=?`, [amount_paid, balance, payment_status, invoiceId]);
res.json({ ok: true });
}

export async function uploadInvoiceFile(req: any, res: any) {
  const { invoiceId } = req.params;
  const slot = req.query.slot as string | undefined; // id de invoice_artifacts opcional
  const f = req.file as Express.Multer.File;
  if (!f) return res.status(400).json({ message: "Archivo requerido" });

  const [r] = await req.db!.query(
    `INSERT INTO invoice_files (invoice_id, uploaded_by_user_id, file_name, file_path, file_type)
     VALUES (?,?,?,?,?)`,
     [invoiceId, req.user.sub, f.originalname, f.filename, f.mimetype]
  );
  const fileId = (r as any).insertId;

  if (slot) {
    await req.db!.query(
      `UPDATE invoice_artifacts SET uploaded_file_id=?, status='uploaded' WHERE id=? AND invoice_id=?`,
      [fileId, slot, invoiceId]
    );
  }
  res.status(201).json({ ok:true, fileId });
}


export async function downloadInvoiceFile(req: Request, res: Response) {
const { fileId } = req.params;
const [[file]]: any = await req.db!.query(
`SELECT f.file_name, f.file_path, i.client_user_id FROM invoice_files f JOIN monthly_invoices i ON i.id=f.invoice_id WHERE f.id=?`,
[fileId]
);
if (!file) return res.status(404).json({ message: "Archivo no encontrado" });
const me = (req as any).user;
if (me.role === "client" && Number(me.sub) !== Number(file.client_user_id)) return res.status(403).json({ message: "No autorizado" });


const abs = resolveUploadPath(file.file_path);
if (!fs.existsSync(abs)) return res.status(410).json({ message: "Archivo no disponible" });
res.setHeader("Content-Disposition", `attachment; filename="${file.file_name}"`);
fs.createReadStream(abs).pipe(res);
}