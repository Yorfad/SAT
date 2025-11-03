import { Request, Response } from "express";

/**
 * Devuelve el tablero de trabajo por mes/año (para empleados y admin).
 * Agrega:
 *  - datos básicos del cliente
 *  - invoice del mes (id, estado, totales)
 *  - si ya se subieron factura/rectificador
 *  - checklist dinámico de servicios del mes
 */
export async function getBrigadeBoard(req: Request, res: Response) {
  const db = req.db!;
  const year = Number(req.query.year) || new Date().getFullYear();
  const month = Number(req.query.month) || (new Date().getMonth() + 1);

  // 1) clientes activos
  const [clients]: any = await db.query(`
    SELECT c.id as client_id, u.name as client_name, cp.nit, cp.sat_password
    FROM clients c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN clients_profiles cp ON cp.client_id = c.id
    WHERE c.is_active = 1
    ORDER BY u.name ASC
  `);

  // 2) invoices del mes
  const [invoices]: any = await db.query(`
    SELECT mi.id as invoice_id, mi.client_id,
           mi.invoice_year, mi.invoice_month,
           mi.total_due, mi.amount_paid, mi.balance, mi.payment_status,
           mi.observations
    FROM monthly_invoices mi
    WHERE mi.invoice_year = ? AND mi.invoice_month = ?
  `, [year, month]);

  // 3) artefactos de factura / rectificador por invoice
  const [artifacts]: any = await db.query(`
    SELECT ia.invoice_id, ia.kind
    FROM invoice_artifacts ia
    JOIN monthly_invoices mi ON mi.id = ia.invoice_id
    WHERE mi.invoice_year = ? AND mi.invoice_month = ?
  `, [year, month]);

  // 4) checklist de servicios del mes
  const [checklist]: any = await db.query(`
    SELECT msc.id, msc.client_id, msc.service_id, msc.status, s.name AS service_name
    FROM monthly_service_checklist msc
    JOIN services s ON s.id = msc.service_id
    WHERE msc.year = ? AND msc.month = ?
    ORDER BY s.name
  `, [year, month]);

  // Indexaciones rápidas
  const invByClient = new Map<number, any>();
  for (const inv of invoices) invByClient.set(inv.client_id, inv);

  const artByInvoice = new Map<number, { factura: boolean; rectificador: boolean }>();
  for (const a of artifacts) {
    const item = artByInvoice.get(a.invoice_id) ?? { factura: false, rectificador: false };
    if ((a.kind || "").toUpperCase() === "FACTURA") item.factura = true;
    if ((a.kind || "").toUpperCase() === "RECTIFICADOR") item.rectificador = true;
    artByInvoice.set(a.invoice_id, item);
  }

  const checklistByClient = new Map<number, any[]>();
  for (const it of checklist) {
    const arr = checklistByClient.get(it.client_id) ?? [];
    arr.push({ id: it.id, service_id: it.service_id, name: it.service_name, status: it.status });
    checklistByClient.set(it.client_id, arr);
  }

  const rows = clients.map((c: any) => {
    const inv = invByClient.get(c.client_id) || null;
    const arts = inv ? artByInvoice.get(inv.invoice_id) ?? { factura: false, rectificador: false } : { factura: false, rectificador: false };
    const cl = checklistByClient.get(c.client_id) ?? [];

    const checklist_done = cl.filter(x => x.status === 'done').length;
    const checklist_total = cl.length;
    const checklist_ok = checklist_total > 0 && checklist_done === checklist_total && arts.factura && arts.rectificador;

    return {
      client_id: c.client_id,
      name: c.client_name,
      nit: c.nit,
      sat_password: c.sat_password ?? null,
      invoice: inv ? {
        id: inv.invoice_id,
        year: inv.invoice_year,
        month: inv.invoice_month,
        total_due: inv.total_due,
        amount_paid: inv.amount_paid,
        balance: inv.balance,
        payment_status: inv.payment_status,
        observations: inv.observations ?? ""
      } : null,
      artifacts: arts,
      checklist: cl,
      checklist_progress: { done: checklist_done, total: checklist_total, ok: checklist_ok }
    };
  });

  res.json({ year, month, rows });
}

/** PATCH observaciones del invoice */
export async function updateInvoiceObservations(req: Request, res: Response) {
  const db = req.db!;
  const invoiceId = Number(req.params.invoiceId);
  const { observations } = req.body as { observations: string };

  await db.query(`UPDATE monthly_invoices SET observations = ? WHERE id = ?`, [observations ?? "", invoiceId]);
  res.json({ ok: true });
}

/** PATCH un item del checklist (done|todo) */
export async function toggleChecklistItem(req: Request, res: Response) {
  const db = req.db!;
  const id = Number(req.params.id);
  const { status } = req.body as { status: 'done'|'todo' };

  await db.query(`UPDATE monthly_service_checklist SET status=? WHERE id=?`, [status, id]);
  res.json({ ok: true });
}
