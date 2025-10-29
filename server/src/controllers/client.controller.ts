import { Request, Response } from "express";
import { encrypt } from "../utils/encryption";

export async function listClients(req: Request, res: Response) {
const [rows] = await req.db!.query(
`SELECT id, full_name, email, phone_number, nit, role, is_active FROM users WHERE role='client' ORDER BY full_name`
);
res.json(rows);
}

export async function getClientById(req: Request, res: Response) {
const { id } = req.params;
const me = (req as any).user;
if (me.role === "client" && Number(me.sub) !== Number(id)) return res.status(403).json({ message: "No autorizado" });


const [[client]]: any = await req.db!.query(
`SELECT id, full_name, email, phone_number, nit, role, is_active FROM users WHERE id=? AND role='client'`, [id]
);
if (!client) return res.status(404).json({ message: "Cliente no encontrado" });


const [[profile]]: any = await req.db!.query(
`SELECT contract_number, overall_rating, notes FROM clients_profiles WHERE user_id=?`, [id]
);


const [invoices] = await req.db!.query(
`SELECT id, invoice_year, invoice_month, previous_debt, monthly_fee, extras_fee, total_due, amount_paid, balance, payment_status, services_status, due_date, created_at
FROM monthly_invoices WHERE client_user_id=? ORDER BY invoice_year DESC, invoice_month DESC LIMIT 24`,
[id]
);
res.json({ client, profile: profile || null, invoices });
}

export async function upsertClientProfile(req: Request, res: Response) {
const { id } = req.params;
const { contract_number = null, sat_password, overall_rating = null, notes = null } = req.body;


const [[exists]]: any = await req.db!.query(`SELECT user_id FROM clients_profiles WHERE user_id=?`, [id]);
const satEnc = sat_password ? encrypt(sat_password) : null;


if (exists) {
await req.db!.query(
`UPDATE clients_profiles
SET contract_number=COALESCE(?, contract_number),
${satEnc ? "sat_password_encrypted=?" : "sat_password_encrypted=sat_password_encrypted"},
overall_rating=COALESCE(?, overall_rating),
notes=COALESCE(?, notes)
WHERE user_id=?`,
satEnc ? [contract_number, satEnc, overall_rating, notes, id] : [contract_number, overall_rating, notes, id]
);
} else {
await req.db!.query(
`INSERT INTO clients_profiles (user_id, contract_number, sat_password_encrypted, overall_rating, notes) VALUES (?,?,?,?,?)`,
[id, contract_number, satEnc, overall_rating, notes]
);
}
res.json({ ok: true });
}

export async function listClientServices(req: Request, res: Response) {
const { id } = req.params;
const [rows] = await req.db!.query(
`SELECT cs.id, s.service_name, s.description, COALESCE(cs.custom_price, s.default_price) AS price, cs.status, cs.start_date
FROM client_services cs JOIN services s ON s.id=cs.service_id
WHERE cs.client_user_id=? ORDER BY s.service_name`,
[id]
);
res.json(rows);
}

export async function addClientService(req: Request, res: Response) {
const { id } = req.params;
const { service_id, custom_price = null, start_date } = req.body;
const [r] = await req.db!.query(
`INSERT INTO client_services (client_user_id, service_id, custom_price, start_date) VALUES (?,?,?,?)`,
[id, service_id, custom_price, start_date]
);
res.status(201).json({ id: (r as any).insertId });
}

export async function deactivateClientService(req: Request, res: Response) {
const { csId } = req.params;
await req.db!.query(`UPDATE client_services SET status='cancelled' WHERE id=?`, [csId]);
res.json({ ok: true });
}