import { RequestHandler } from "express";

/**
 * GET /api/cash-payments/clients
 * Obtener todos los clientes con sus deudas y saldos
 */
export const getClientsWithBalances: RequestHandler = async (req: any, res: any) => {
  const workspaceId = req.workspaceId;
  const isConsolidated = req.isConsolidatedView;
  const accessibleIds = req.accessibleWorkspaceIds || [];

  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Construir filtro de workspace
    let workspaceFilter = '';
    let workspaceJoin = '';
    const params: any[] = [];

    if (!isConsolidated && workspaceId) {
      workspaceJoin = 'JOIN user_workspaces uw ON uw.user_id = u.id';
      workspaceFilter = 'AND uw.workspace_id = ?';
      params.push(workspaceId);
    } else if (isConsolidated && accessibleIds.length > 0) {
      workspaceJoin = 'JOIN user_workspaces uw ON uw.user_id = u.id';
      const placeholders = accessibleIds.map(() => '?').join(',');
      workspaceFilter = `AND uw.workspace_id IN (${placeholders})`;
      params.push(...accessibleIds);
    }

    // Obtener clientes con sus saldos y deudas (TODOS los clientes, con o sin deuda)
    const [clients]: any = await req.db.query(`
      SELECT DISTINCT
        u.id,
        u.full_name,
        u.email,
        u.is_active,
        cp.phone_number as phone,
        COALESCE(cp.account_balance, 0) as account_balance,
        COALESCE(cp.active_infractions_count, 0) as active_infractions_count,
        w.name as workspace_name,
        w.id as workspace_id
      FROM users u
      LEFT JOIN clients_profiles cp ON cp.user_id = u.id
      ${workspaceJoin}
      LEFT JOIN user_workspaces uw2 ON uw2.user_id = u.id
      LEFT JOIN workspaces w ON w.id = uw2.workspace_id
      WHERE u.role = 'client' ${workspaceFilter}
      ORDER BY u.full_name ASC
    `, params);

    // Para cada cliente, calcular deuda del mes y deuda total
    const clientsWithDebts = await Promise.all(clients.map(async (client: any) => {
      // Deuda del mes actual (facturas pendientes)
      const [monthlyDebt]: any = await req.db.query(`
        SELECT COALESCE(SUM(total_due - COALESCE(amount_paid, 0)), 0) as debt
        FROM monthly_invoices
        WHERE client_user_id = ?
          AND invoice_year = ?
          AND invoice_month = ?
          AND payment_status IN ('pending', 'partial', 'overdue')
      `, [client.id, currentYear, currentMonth]);

      // Deuda total (todas las facturas pendientes)
      const [totalDebt]: any = await req.db.query(`
        SELECT COALESCE(SUM(total_due - COALESCE(amount_paid, 0)), 0) as debt
        FROM monthly_invoices
        WHERE client_user_id = ?
          AND payment_status IN ('pending', 'partial', 'overdue')
      `, [client.id]);

      // Último pago registrado
      const [lastPayment]: any = await req.db.query(`
        SELECT amount, payment_date, payment_method
        FROM client_payments
        WHERE client_user_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `, [client.id]);

      return {
        ...client,
        monthlyDebt: parseFloat(monthlyDebt[0]?.debt || 0),
        totalDebt: parseFloat(totalDebt[0]?.debt || 0),
        accountBalance: parseFloat(client.account_balance || 0),
        lastPayment: lastPayment[0] || null
      };
    }));

    res.json(clientsWithDebts);
  } catch (error: any) {
    console.error('Error getting clients with balances:', error);
    res.status(500).json({ error: 'Error al obtener clientes', details: error.message });
  }
};

/**
 * POST /api/cash-payments
 * Registrar un pago en efectivo
 */
export const registerCashPayment: RequestHandler = async (req: any, res: any) => {
  const { clientId, amount, paymentMethod, paymentType, notes, referenceNumber, paymentDate } = req.body;
  const userId = req.user.id;
  const workspaceId = req.workspaceId || req.body.workspaceId;

  if (!clientId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Cliente y monto son requeridos' });
  }

  try {
    // Obtener saldo actual del cliente
    const [clientProfile]: any = await req.db.query(`
      SELECT account_balance FROM clients_profiles WHERE user_id = ?
    `, [clientId]);

    if (!clientProfile || clientProfile.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const balanceBefore = parseFloat(clientProfile[0].account_balance || 0);
    const balanceAfter = balanceBefore + parseFloat(amount);

    // Registrar el pago
    const [result]: any = await req.db.query(`
      INSERT INTO client_payments
        (client_user_id, workspace_id, amount, payment_method, payment_type, notes, reference_number, registered_by_user_id, balance_before, balance_after, payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      clientId,
      workspaceId || 1,
      amount,
      paymentMethod || 'cash',
      paymentType || 'regular',
      notes || null,
      referenceNumber || null,
      userId,
      balanceBefore,
      balanceAfter,
      paymentDate || new Date().toISOString().split('T')[0]
    ]);

    // Si hay deudas y el pago NO es anticipo, aplicar a facturas pendientes
    let remainingPayment = parseFloat(amount);
    let appliedToInvoices = 0;

    if (paymentType !== 'advance') {
      // Obtener facturas pendientes ordenadas por fecha
      const [pendingInvoices]: any = await req.db.query(`
        SELECT id, total_due, amount_paid, balance
        FROM monthly_invoices
        WHERE client_user_id = ?
          AND payment_status IN ('pending', 'partial', 'overdue')
        ORDER BY invoice_year ASC, invoice_month ASC
      `, [clientId]);

      for (const invoice of pendingInvoices) {
        if (remainingPayment <= 0) break;

        const invoiceBalance = parseFloat(invoice.total_due) - parseFloat(invoice.amount_paid || 0);

        if (remainingPayment >= invoiceBalance) {
          // Pago completo de esta factura
          await req.db.query(`
            UPDATE monthly_invoices
            SET amount_paid = total_due,
                balance = 0,
                payment_status = 'paid',
                payment_registered_by_user_id = ?,
                payment_registered_at = NOW()
            WHERE id = ?
          `, [userId, invoice.id]);
          remainingPayment -= invoiceBalance;
          appliedToInvoices += invoiceBalance;
        } else {
          // Pago parcial
          const newAmountPaid = parseFloat(invoice.amount_paid || 0) + remainingPayment;
          await req.db.query(`
            UPDATE monthly_invoices
            SET amount_paid = ?,
                balance = total_due - ?,
                payment_status = 'partial',
                payment_registered_by_user_id = ?,
                payment_registered_at = NOW()
            WHERE id = ?
          `, [newAmountPaid, newAmountPaid, userId, invoice.id]);
          appliedToInvoices += remainingPayment;
          remainingPayment = 0;
        }
      }
    }

    // El saldo final es: saldo anterior + lo que quedó después de pagar facturas
    const finalBalance = balanceBefore + remainingPayment;

    // Actualizar saldo del cliente con el monto restante (después de aplicar a facturas)
    await req.db.query(`
      UPDATE clients_profiles SET account_balance = ? WHERE user_id = ?
    `, [finalBalance, clientId]);

    res.json({
      success: true,
      message: 'Pago registrado correctamente',
      paymentId: result.insertId,
      newBalance: finalBalance,
      appliedToInvoices,
      remainingAsCredit: remainingPayment
    });
  } catch (error: any) {
    console.error('Error registering cash payment:', error);
    res.status(500).json({ error: 'Error al registrar pago', details: error.message });
  }
};

/**
 * GET /api/cash-payments/history/:clientId
 * Obtener historial de pagos de un cliente
 */
export const getPaymentHistory: RequestHandler = async (req: any, res: any) => {
  const { clientId } = req.params;
  const { limit = 50 } = req.query;

  try {
    const [payments]: any = await req.db.query(`
      SELECT
        cp.id,
        cp.amount,
        cp.payment_method,
        cp.payment_type,
        cp.notes,
        cp.reference_number,
        cp.balance_before,
        cp.balance_after,
        cp.payment_date,
        cp.created_at,
        u.full_name as registered_by_name,
        w.name as workspace_name
      FROM client_payments cp
      JOIN users u ON u.id = cp.registered_by_user_id
      LEFT JOIN workspaces w ON w.id = cp.workspace_id
      WHERE cp.client_user_id = ?
      ORDER BY cp.created_at DESC
      LIMIT ?
    `, [clientId, parseInt(limit as string)]);

    // También obtener historial de facturas
    const [invoices]: any = await req.db.query(`
      SELECT
        id,
        invoice_year,
        invoice_month,
        total_due,
        amount_paid,
        balance,
        payment_status,
        payment_registered_at,
        created_at
      FROM monthly_invoices
      WHERE client_user_id = ?
      ORDER BY invoice_year DESC, invoice_month DESC
      LIMIT ?
    `, [clientId, parseInt(limit as string)]);

    res.json({ payments, invoices });
  } catch (error: any) {
    console.error('Error getting payment history:', error);
    res.status(500).json({ error: 'Error al obtener historial', details: error.message });
  }
};

/**
 * GET /api/cash-payments/summary
 * Resumen de pagos del período actual
 */
export const getPaymentsSummary: RequestHandler = async (req: any, res: any) => {
  const workspaceId = req.workspaceId;
  const isConsolidated = req.isConsolidatedView;
  const accessibleIds = req.accessibleWorkspaceIds || [];
  const { startDate, endDate } = req.query;

  try {
    // Construir filtro de workspace
    let workspaceFilter = '';
    const params: any[] = [];

    if (!isConsolidated && workspaceId) {
      workspaceFilter = 'AND cp.workspace_id = ?';
      params.push(workspaceId);
    } else if (isConsolidated && accessibleIds.length > 0) {
      const placeholders = accessibleIds.map(() => '?').join(',');
      workspaceFilter = `AND cp.workspace_id IN (${placeholders})`;
      params.push(...accessibleIds);
    }

    // Filtro de fechas
    let dateFilter = '';
    if (startDate) {
      dateFilter += ' AND cp.payment_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ' AND cp.payment_date <= ?';
      params.push(endDate);
    } else {
      // Por defecto, mes actual
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      dateFilter += ' AND cp.payment_date >= ?';
      params.push(firstDay);
    }

    const [summary]: any = await req.db.query(`
      SELECT
        COUNT(*) as total_payments,
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(DISTINCT client_user_id) as unique_clients
      FROM client_payments cp
      WHERE 1=1 ${workspaceFilter} ${dateFilter}
    `, params);

    // Pagos por método
    const [byMethod]: any = await req.db.query(`
      SELECT
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total
      FROM client_payments cp
      WHERE 1=1 ${workspaceFilter} ${dateFilter}
      GROUP BY payment_method
    `, params);

    res.json({
      totalPayments: summary[0]?.total_payments || 0,
      totalAmount: parseFloat(summary[0]?.total_amount || 0),
      uniqueClients: summary[0]?.unique_clients || 0,
      byMethod
    });
  } catch (error: any) {
    console.error('Error getting payments summary:', error);
    res.status(500).json({ error: 'Error al obtener resumen', details: error.message });
  }
};
