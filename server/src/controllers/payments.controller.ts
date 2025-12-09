import { RequestHandler } from "express";

/**
 * POST /api/payments/register/:invoiceId
 * Registrar el pago de una factura (completo, parcial, diferido, etc.)
 */
export const registerPayment: RequestHandler = async (req: any, res: any) => {
  const { invoiceId } = req.params;
  const { paymentStatus, amountPaid, notes } = req.body;
  const userId = req.user.id;

  try {
    // Actualizar el estado del pago
    await req.db.query(
      `UPDATE monthly_invoices
       SET payment_status = ?,
           amount_paid = ?,
           payment_registered_by_user_id = ?,
           payment_registered_at = NOW(),
           balance = total_due - ?,
           observations = COALESCE(?, observations)
       WHERE id = ?`,
      [paymentStatus, amountPaid, userId, amountPaid, notes, invoiceId]
    );

    // Si el pago es completo, resolver cualquier infracción relacionada
    if (paymentStatus === 'paid') {
      await req.db.query(
        `UPDATE client_infractions
         SET is_active = FALSE,
             resolved_by_user_id = ?,
             resolved_at = NOW(),
             resolution_notes = 'Pago completado'
         WHERE related_invoice_id = ? AND is_active = TRUE`,
        [userId, invoiceId]
      );
    }

    res.json({ success: true, message: "Pago registrado correctamente" });
  } catch (error) {
    console.error('Error registrando pago:', error);
    res.status(500).json({ error: 'Error al registrar el pago' });
  }
};

/**
 * GET /api/payments/pending
 * Obtener facturas pendientes de pago para el mes actual
 */
export const getPendingPayments: RequestHandler = async (req: any, res: any) => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [rows] = await req.db.query(
      `SELECT
        mi.id,
        mi.client_user_id,
        u.full_name as client_name,
        u.email as client_email,
        mi.invoice_year,
        mi.invoice_month,
        mi.total_due,
        mi.amount_paid,
        mi.balance,
        mi.payment_status,
        mi.due_date,
        cp.overall_rating,
        cp.active_infractions_count
       FROM monthly_invoices mi
       JOIN users u ON u.id = mi.client_user_id
       LEFT JOIN clients_profiles cp ON cp.user_id = mi.client_user_id
       WHERE mi.invoice_year = ? AND mi.invoice_month = ?
       AND mi.payment_status IN ('pending', 'partial', 'overdue')
       ORDER BY mi.due_date ASC, u.full_name ASC`,
      [currentYear, currentMonth]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo pagos pendientes:', error);
    res.status(500).json({ error: 'Error al obtener pagos pendientes' });
  }
};

/**
 * GET /api/payments/history/:clientId
 * Obtener historial de pagos de un cliente
 */
export const getPaymentHistory: RequestHandler = async (req: any, res: any) => {
  const { clientId } = req.params;
  const { year, limit = 12 } = req.query;

  try {
    let query = `
      SELECT
        mi.id,
        mi.invoice_year,
        mi.invoice_month,
        mi.total_due,
        mi.amount_paid,
        mi.balance,
        mi.payment_status,
        mi.payment_registered_at,
        u.full_name as registered_by_name
       FROM monthly_invoices mi
       LEFT JOIN users u ON u.id = mi.payment_registered_by_user_id
       WHERE mi.client_user_id = ?
    `;

    const params: any[] = [clientId];

    if (year) {
      query += ` AND mi.invoice_year = ?`;
      params.push(year);
    }

    query += ` ORDER BY mi.invoice_year DESC, mi.invoice_month DESC LIMIT ?`;
    params.push(parseInt(limit as string));

    const [rows] = await req.db.query(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error);
    res.status(500).json({ error: 'Error al obtener historial de pagos' });
  }
};
