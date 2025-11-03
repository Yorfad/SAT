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

export async function cancelClientServiceById(req: Request, res: Response) {
const { csId } = req.params;
await req.db!.query(`UPDATE client_services SET status='cancelled' WHERE id=?`, [csId]);
res.json({ ok: true });
}

export async function getClientDashboard(req: Request, res: Response) {
  const user = (req as any).user || {};
  const clientId = user.sub ?? user.id; // por si tu JWT usa sub o id

  if (!clientId) return res.status(400).json({ message: "No user id in token" });
  
  const [invoices] = await req.db!.query(
    `SELECT id, invoice_year, invoice_month, total_due, amount_paid, balance, payment_status 
     FROM monthly_invoices
     WHERE client_user_id=?
     ORDER BY invoice_year DESC, invoice_month DESC
     LIMIT 5`,
    [clientId]
  );

  res.json({ invoices });
}

/**
 * POST /clients/:id/deactivate
 * Desactiva completamente un cliente
 */
export async function deactivateClient(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user.sub;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'El motivo de desactivación es requerido' });
    }

    // Verificar que el cliente existe
    const [[client]]: any = await req.db!.query(
      'SELECT id, full_name FROM users WHERE id = ? AND role = "client"',
      [id]
    );

    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Desactivar el cliente
    await req.db!.query(
      `UPDATE users
       SET is_active = 0,
           deactivation_reason = ?,
           deactivated_at = NOW(),
           deactivated_by_user_id = ?
       WHERE id = ?`,
      [reason, userId, id]
    );

    console.log(`[DEACTIVATION] Cliente ${client.full_name} (ID: ${id}) desactivado por usuario ${userId}. Motivo: ${reason}`);

    res.json({
      ok: true,
      message: `Cliente ${client.full_name} desactivado exitosamente`
    });
  } catch (error: any) {
    console.error('Error deactivating client:', error);
    res.status(500).json({ message: 'Error al desactivar cliente', error: error.message });
  }
}

/**
 * POST /clients/:id/activate
 * Reactiva un cliente desactivado
 */
export async function activateClient(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user.sub;

    // Verificar que el cliente existe
    const [[client]]: any = await req.db!.query(
      'SELECT id, full_name FROM users WHERE id = ? AND role = "client"',
      [id]
    );

    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Activar el cliente y limpiar campos de desactivación
    await req.db!.query(
      `UPDATE users
       SET is_active = 1,
           deactivation_reason = NULL,
           deactivated_at = NULL,
           deactivated_by_user_id = NULL
       WHERE id = ?`,
      [id]
    );

    console.log(`[ACTIVATION] Cliente ${client.full_name} (ID: ${id}) reactivado por usuario ${userId}`);

    res.json({
      ok: true,
      message: `Cliente ${client.full_name} activado exitosamente`
    });
  } catch (error: any) {
    console.error('Error activating client:', error);
    res.status(500).json({ message: 'Error al activar cliente', error: error.message });
  }
}

/**
 * POST /clients/:id/services/:serviceId/deactivate
 * Desactiva un servicio específico de un cliente
 */
export async function deactivateClientService(req: Request, res: Response) {
  try {
    const { id: clientId, serviceId } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user.sub;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'El motivo de desactivación es requerido' });
    }

    // Verificar que el servicio del cliente existe
    const [[clientService]]: any = await req.db!.query(
      `SELECT cs.id, s.service_name, u.full_name as client_name
       FROM client_services cs
       JOIN services s ON s.id = cs.service_id
       JOIN users u ON u.id = cs.client_user_id
       WHERE cs.client_user_id = ? AND cs.service_id = ?`,
      [clientId, serviceId]
    );

    if (!clientService) {
      return res.status(404).json({ message: 'Servicio del cliente no encontrado' });
    }

    // Desactivar el servicio
    await req.db!.query(
      `UPDATE client_services
       SET status = 'inactive',
           deactivation_reason = ?,
           deactivated_at = NOW(),
           deactivated_by_user_id = ?
       WHERE client_user_id = ? AND service_id = ?`,
      [reason, userId, clientId, serviceId]
    );

    console.log(`[SERVICE-DEACTIVATION] Servicio "${clientService.service_name}" desactivado para cliente ${clientService.client_name}. Motivo: ${reason}`);

    res.json({
      ok: true,
      message: `Servicio "${clientService.service_name}" desactivado exitosamente`
    });
  } catch (error: any) {
    console.error('Error deactivating client service:', error);
    res.status(500).json({ message: 'Error al desactivar servicio', error: error.message });
  }
}

/**
 * POST /clients/:id/services/:serviceId/activate
 * Reactiva un servicio específico de un cliente
 */
export async function activateClientService(req: Request, res: Response) {
  try {
    const { id: clientId, serviceId } = req.params;
    const userId = (req as any).user.sub;

    // Verificar que el servicio del cliente existe
    const [[clientService]]: any = await req.db!.query(
      `SELECT cs.id, s.service_name, u.full_name as client_name
       FROM client_services cs
       JOIN services s ON s.id = cs.service_id
       JOIN users u ON u.id = cs.client_user_id
       WHERE cs.client_user_id = ? AND cs.service_id = ?`,
      [clientId, serviceId]
    );

    if (!clientService) {
      return res.status(404).json({ message: 'Servicio del cliente no encontrado' });
    }

    // Activar el servicio y limpiar campos de desactivación
    await req.db!.query(
      `UPDATE client_services
       SET status = 'active',
           deactivation_reason = NULL,
           deactivated_at = NULL,
           deactivated_by_user_id = NULL
       WHERE client_user_id = ? AND service_id = ?`,
      [clientId, serviceId]
    );

    console.log(`[SERVICE-ACTIVATION] Servicio "${clientService.service_name}" reactivado para cliente ${clientService.client_name} por usuario ${userId}`);

    res.json({
      ok: true,
      message: `Servicio "${clientService.service_name}" activado exitosamente`
    });
  } catch (error: any) {
    console.error('Error activating client service:', error);
    res.status(500).json({ message: 'Error al activar servicio', error: error.message });
  }
}