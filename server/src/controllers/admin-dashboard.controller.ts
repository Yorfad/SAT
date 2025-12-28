import { RequestHandler } from "express";
import { WorkspaceService } from "../services/workspace.service";

/**
 * Helper para construir filtro de workspace para queries
 */
function getWorkspaceFilterSQL(
  isConsolidated: boolean | undefined,
  workspaceId: number | null | undefined,
  accessibleIds: number[] | undefined,
  tableAlias: string = '',
  includeShared: boolean = false
): { sql: string; params: any[] } {
  const prefix = tableAlias ? `${tableAlias}.` : '';

  if (!isConsolidated && workspaceId) {
    if (includeShared) {
      // Incluir items del workspace actual + items compartidos (is_shared = TRUE)
      return { sql: `AND (${prefix}workspace_id = ? OR ${prefix}is_shared = TRUE)`, params: [workspaceId] };
    }
    return { sql: `AND ${prefix}workspace_id = ?`, params: [workspaceId] };
  }

  if (isConsolidated && accessibleIds && accessibleIds.length > 0) {
    const placeholders = accessibleIds.map(() => '?').join(',');
    if (includeShared) {
      return { sql: `AND (${prefix}workspace_id IN (${placeholders}) OR ${prefix}is_shared = TRUE)`, params: accessibleIds };
    }
    return { sql: `AND ${prefix}workspace_id IN (${placeholders})`, params: accessibleIds };
  }

  return { sql: '', params: [] };
}

/**
 * GET /api/admin/dashboard/summary
 * Obtener resumen completo del dashboard con ganancias reales
 */
export const getDashboardSummary: RequestHandler = async (req: any, res: any) => {
  const { year, month } = req.query;
  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

  // Obtener filtro de workspace
  const isConsolidated = req.isConsolidatedView;
  const workspaceId = req.workspaceId;
  let accessibleIds: number[] = [];

  if (isConsolidated) {
    const workspaceService = new WorkspaceService(req.db);
    accessibleIds = await workspaceService.getAccessibleWorkspaceIds(req.user.id);
  }

  const wsFilter = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'mi');
  const wsFilterExpenses = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, '', true); // Incluir gastos globales
  const wsFilterSOC = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'soc');
  const wsFilterUsers = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'cp');
  const wsFilterInfractions = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, '');
  const wsFilterExternal = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'ei');

  try {
    // ========== ACTIVOS (INGRESOS REALES) ==========

    // 1. Ingresos por servicios pagados en el mes
    const [paidServices]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(mi.amount_paid), 0) as total_paid
       FROM monthly_invoices mi
       WHERE mi.invoice_year = ? AND mi.invoice_month = ?
       AND mi.payment_status IN ('paid', 'partial')
       ${wsFilter.sql}`,
      [currentYear, currentMonth, ...wsFilter.params]
    );

    // 2. Ingresos por costos operativos con ganancia (ej: libros, omisos)
    const [operationalProfits]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(soc.profit_amount), 0) as total_profit
       FROM service_operational_costs soc
       WHERE YEAR(soc.cost_date) = ? AND MONTH(soc.cost_date) = ?
       ${wsFilterSOC.sql}`,
      [currentYear, currentMonth, ...wsFilterSOC.params]
    );

    // 3. Ingresos externos (otros negocios, inversiones, etc.)
    const [externalIncomes]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(ei.amount), 0) as total_external
       FROM external_incomes ei
       WHERE YEAR(ei.income_date) = ? AND MONTH(ei.income_date) = ?
       ${wsFilterExternal.sql}`,
      [currentYear, currentMonth, ...wsFilterExternal.params]
    );

    const totalActivos = Number(paidServices[0].total_paid || 0) + Number(operationalProfits[0].total_profit || 0) + Number(externalIncomes[0].total_external || 0);

    // ========== PASIVOS (GASTOS) ==========

    // 1. Gastos únicos del mes
    const [oneTimeExpenses]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE expense_year = ? AND expense_month = ?
       AND expense_type = 'one_time'
       AND is_active = TRUE
       ${wsFilterExpenses.sql}`,
      [currentYear, currentMonth, ...wsFilterExpenses.params]
    );

    // 2. Gastos recurrentes activos (se cuentan cada mes)
    const [recurringExpenses]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE expense_type = 'monthly_recurring'
       AND is_active = TRUE
       AND (expense_year < ? OR (expense_year = ? AND expense_month <= ?))
       ${wsFilterExpenses.sql}`,
      [currentYear, currentYear, currentMonth, ...wsFilterExpenses.params]
    );

    // 3. Costos operativos de servicios (gastos en omisos, libros, etc.)
    const [operationalCosts]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(soc.cost_amount), 0) as total_costs
       FROM service_operational_costs soc
       WHERE YEAR(soc.cost_date) = ? AND MONTH(soc.cost_date) = ?
       ${wsFilterSOC.sql}`,
      [currentYear, currentMonth, ...wsFilterSOC.params]
    );

    const totalPasivos = Number(oneTimeExpenses[0].total || 0) + Number(recurringExpenses[0].total || 0) + Number(operationalCosts[0].total_costs || 0);

    // ========== GANANCIA NETA ==========
    const gananciaNeta = totalActivos - totalPasivos;

    // ========== DEUDAS PENDIENTES ==========
    const [pendingDebts]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(mi.balance), 0) as total_debt
       FROM monthly_invoices mi
       WHERE mi.payment_status IN ('pending', 'partial', 'overdue', 'deferred_next_month')
       ${wsFilter.sql}`,
      [...wsFilter.params]
    );

    // ========== CLIENTES AL DÍA ==========
    const [clientsUpToDate]: any = await req.db.query(
      `SELECT
        COUNT(DISTINCT mi.client_user_id) as count
       FROM monthly_invoices mi
       WHERE mi.invoice_year = ? AND mi.invoice_month = ?
       AND mi.payment_status = 'paid'
       ${wsFilter.sql}`,
      [currentYear, currentMonth, ...wsFilter.params]
    );

    // ========== TOTAL CLIENTES ACTIVOS ==========
    const [totalClients]: any = await req.db.query(
      `SELECT
        COUNT(*) as count
       FROM users u
       LEFT JOIN clients_profiles cp ON cp.user_id = u.id
       WHERE u.role = 'client'
       AND u.is_active = TRUE
       AND u.services_disabled_by_infractions = FALSE
       ${wsFilterUsers.sql}`,
      [...wsFilterUsers.params]
    );

    // ========== INFRACCIONES ACTIVAS ==========
    const [activeInfractions]: any = await req.db.query(
      `SELECT
        COUNT(*) as count
       FROM client_infractions
       WHERE is_active = TRUE
       ${wsFilterInfractions.sql}`,
      [...wsFilterInfractions.params]
    );

    // ========== SALDOS A FAVOR DE CLIENTES (CAPITAL COMPROMETIDO) ==========
    const [clientBalances]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(cp.account_balance), 0) as total_balances
       FROM clients_profiles cp
       JOIN users u ON u.id = cp.user_id
       WHERE u.role = 'client'
       AND u.is_active = TRUE
       AND cp.account_balance > 0
       ${wsFilterUsers.sql}`,
      [...wsFilterUsers.params]
    );

    // ========== INGRESOS POR MES (últimos 12 meses) ==========
    const [incomeByMonth] = await req.db.query(
      `SELECT
        CONCAT(mi.invoice_year, '-', LPAD(mi.invoice_month, 2, '0')) as month,
        COALESCE(SUM(mi.amount_paid), 0) as income
       FROM monthly_invoices mi
       WHERE mi.invoice_year >= ? - 1
       AND mi.payment_status IN ('paid', 'partial')
       ${wsFilter.sql}
       GROUP BY mi.invoice_year, mi.invoice_month
       ORDER BY mi.invoice_year ASC, mi.invoice_month ASC
       LIMIT 12`,
      [currentYear, ...wsFilter.params]
    );

    // ========== RESUMEN POR CATEGORÍA DE GASTOS ==========
    const [expensesByCategory] = await req.db.query(
      `SELECT
        COALESCE(category, 'Sin categoría') as category,
        SUM(amount) as total
       FROM expenses
       WHERE expense_year = ? AND expense_month = ?
       AND is_active = TRUE
       ${wsFilterExpenses.sql}
       GROUP BY category
       ORDER BY total DESC
       LIMIT 5`,
      [currentYear, currentMonth, ...wsFilterExpenses.params]
    );

    // ========== RESPUESTA ==========
    res.json({
      period: {
        year: currentYear,
        month: currentMonth
      },
      totals: {
        activos: parseFloat(totalActivos.toFixed(2)),
        pasivos: parseFloat(totalPasivos.toFixed(2)),
        gananciaNeta: parseFloat(gananciaNeta.toFixed(2)),
        deudas: parseFloat(Number(pendingDebts[0].total_debt || 0).toFixed(2)),
        saldosClientes: parseFloat(Number(clientBalances[0].total_balances || 0).toFixed(2)),
        clientesAlDia: Number(clientsUpToDate[0].count || 0),
        clientes: Number(totalClients[0].count || 0),
        infraccionesActivas: Number(activeInfractions[0].count || 0)
      },
      breakdown: {
        activos: {
          serviciosPagados: Number(paidServices[0].total_paid || 0),
          gananciaOperacional: Number(operationalProfits[0].total_profit || 0),
          ingresosExternos: Number(externalIncomes[0].total_external || 0)
        },
        pasivos: {
          gastosUnicos: Number(oneTimeExpenses[0].total || 0),
          gastosRecurrentes: Number(recurringExpenses[0].total || 0),
          costosOperacionales: Number(operationalCosts[0].total_costs || 0)
        }
      },
      incomeByMonth,
      expensesByCategory
    });
  } catch (error) {
    console.error('Error obteniendo resumen del dashboard:', error);
    res.status(500).json({ error: 'Error al obtener resumen del dashboard' });
  }
};

/**
 * GET /api/admin/dashboard/projections
 * Obtener proyecciones financieras basadas en clientes activos y sus servicios
 */
export const getFinancialProjections: RequestHandler = async (req: any, res: any) => {
  const { year, month } = req.query;
  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

  // Obtener filtro de workspace
  const isConsolidated = req.isConsolidatedView;
  const workspaceId = req.workspaceId;
  let accessibleIds: number[] = [];

  if (isConsolidated) {
    const workspaceService = new WorkspaceService(req.db);
    accessibleIds = await workspaceService.getAccessibleWorkspaceIds(req.user.id);
  }

  // Filtros para diferentes tablas
  const wsFilterCP = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'cp');
  const wsFilterExpenses = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, '');

  try {
    // ========== INGRESOS PROYECTADOS ==========

    // 1. Ingresos de servicios individuales activos
    const [individualServices]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(COALESCE(cs.custom_price, s.default_price)), 0) as total_income
       FROM client_services cs
       INNER JOIN services s ON s.id = cs.service_id
       INNER JOIN users u ON u.id = cs.client_user_id
       LEFT JOIN clients_profiles cp ON cp.user_id = u.id
       WHERE cs.status = 'active'
       AND u.is_active = TRUE
       AND u.services_disabled_by_infractions = FALSE
       ${wsFilterCP.sql}`,
      [...wsFilterCP.params]
    );

    // 2. Ingresos de bundles activos (clientes con bundles asignados)
    const [bundleIncome]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(COALESCE(cb.custom_price, sb.bundle_price)), 0) as total_income
       FROM client_bundles cb
       INNER JOIN service_bundles sb ON sb.id = cb.bundle_id
       INNER JOIN users u ON u.id = cb.client_user_id
       LEFT JOIN clients_profiles cp ON cp.user_id = u.id
       WHERE cb.status = 'active'
       AND sb.is_active = TRUE
       AND u.is_active = TRUE
       AND u.services_disabled_by_infractions = FALSE
       ${wsFilterCP.sql}`,
      [...wsFilterCP.params]
    );

    const totalIngresosProyectados = Number(individualServices[0].total_income || 0) + Number(bundleIncome[0].total_income || 0);

    // ========== GASTOS PROYECTADOS ==========

    // 1. Gastos operativos de servicios con costos operativos
    const [bundleOperationalCosts]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(s.operational_cost_amount), 0) as total_costs
       FROM client_services cs
       INNER JOIN services s ON s.id = cs.service_id
       INNER JOIN users u ON u.id = cs.client_user_id
       LEFT JOIN clients_profiles cp ON cp.user_id = u.id
       WHERE cs.status = 'active'
       AND s.has_operational_cost = TRUE
       AND u.is_active = TRUE
       AND u.services_disabled_by_infractions = FALSE
       ${wsFilterCP.sql}`,
      [...wsFilterCP.params]
    );

    // 2. Gastos recurrentes mensuales activos
    const [recurringExpenses]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE expense_type = 'monthly_recurring'
       AND is_active = TRUE
       AND (expense_year < ? OR (expense_year = ? AND expense_month <= ?))
       ${wsFilterExpenses.sql}`,
      [currentYear, currentYear, currentMonth, ...wsFilterExpenses.params]
    );

    // 3. Gastos únicos del mes
    const [oneTimeExpenses]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE expense_year = ? AND expense_month = ?
       AND expense_type = 'one_time'
       AND is_active = TRUE
       ${wsFilterExpenses.sql}`,
      [currentYear, currentMonth, ...wsFilterExpenses.params]
    );

    const totalGastosProyectados =
      Number(bundleOperationalCosts[0].total_costs || 0) +
      Number(recurringExpenses[0].total || 0) +
      Number(oneTimeExpenses[0].total || 0);

    // ========== GANANCIA PROYECTADA ==========
    const gananciaProyectada = totalIngresosProyectados - totalGastosProyectados;

    // ========== DESGLOSE DE CLIENTES Y SERVICIOS ==========
    const [clientBreakdown] = await req.db.query(
      `SELECT
        u.id,
        u.full_name,
        COUNT(DISTINCT cs.id) as services_count,
        COUNT(DISTINCT cb.id) as bundles_count,
        COALESCE(SUM(COALESCE(cs.custom_price, s.default_price)), 0) as individual_services_income,
        COALESCE(SUM(DISTINCT COALESCE(cb.custom_price, sb.bundle_price)), 0) as bundle_income,
        COALESCE(SUM(DISTINCT s2.operational_cost_amount), 0) as bundle_costs
       FROM users u
       LEFT JOIN clients_profiles cp ON cp.user_id = u.id
       LEFT JOIN client_services cs ON cs.client_user_id = u.id AND cs.status = 'active'
       LEFT JOIN services s ON s.id = cs.service_id
       LEFT JOIN client_bundles cb ON cb.client_user_id = u.id AND cb.status = 'active'
       LEFT JOIN service_bundles sb ON sb.id = cb.bundle_id AND sb.is_active = TRUE
       LEFT JOIN services s2 ON s2.id = cs.service_id AND s2.has_operational_cost = TRUE
       WHERE u.role = 'client'
       AND u.is_active = TRUE
       AND u.services_disabled_by_infractions = FALSE
       ${wsFilterCP.sql}
       GROUP BY u.id, u.full_name
       ORDER BY u.full_name ASC`,
      [...wsFilterCP.params]
    );

    res.json({
      period: {
        year: currentYear,
        month: currentMonth
      },
      projections: {
        totalIngresos: parseFloat(totalIngresosProyectados.toFixed(2)),
        totalGastos: parseFloat(totalGastosProyectados.toFixed(2)),
        gananciaProyectada: parseFloat(gananciaProyectada.toFixed(2))
      },
      breakdown: {
        ingresos: {
          serviciosIndividuales: Number(individualServices[0].total_income || 0),
          bundles: Number(bundleIncome[0].total_income || 0)
        },
        gastos: {
          costosOperacionalesBundles: Number(bundleOperationalCosts[0].total_costs || 0),
          gastosRecurrentes: Number(recurringExpenses[0].total || 0),
          gastosUnicos: Number(oneTimeExpenses[0].total || 0)
        }
      },
      clientBreakdown
    });
  } catch (error) {
    console.error('Error obteniendo proyecciones financieras:', error);
    res.status(500).json({ error: 'Error al obtener proyecciones financieras' });
  }
};

/**
 * GET /api/admin/dashboard/financial-overview
 * Vista financiera más detallada para el dashboard
 */
export const getFinancialOverview: RequestHandler = async (req: any, res: any) => {
  const { startYear, startMonth, endYear, endMonth } = req.query;

  // Obtener filtro de workspace
  const isConsolidated = req.isConsolidatedView;
  const workspaceId = req.workspaceId;
  let accessibleIds: number[] = [];

  if (isConsolidated) {
    const workspaceService = new WorkspaceService(req.db);
    accessibleIds = await workspaceService.getAccessibleWorkspaceIds(req.user.id);
  }

  const wsFilterInvoices = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'mi');
  const wsFilterExpenses = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, '', true);

  try {
    // Por defecto, últimos 12 meses
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - 11, 1);

    const sYear = startYear ? parseInt(startYear) : start.getFullYear();
    const sMonth = startMonth ? parseInt(startMonth) : start.getMonth() + 1;
    const eYear = endYear ? parseInt(endYear) : end.getFullYear();
    const eMonth = endMonth ? parseInt(endMonth) : end.getMonth() + 1;

    // Ingresos por mes en el rango
    const [monthlyIncome] = await req.db.query(
      `SELECT
        mi.invoice_year as year,
        mi.invoice_month as month,
        COALESCE(SUM(mi.amount_paid), 0) as income
       FROM monthly_invoices mi
       WHERE (mi.invoice_year > ? OR (mi.invoice_year = ? AND mi.invoice_month >= ?))
       AND (mi.invoice_year < ? OR (mi.invoice_year = ? AND mi.invoice_month <= ?))
       AND mi.payment_status IN ('paid', 'partial')
       ${wsFilterInvoices.sql}
       GROUP BY mi.invoice_year, mi.invoice_month
       ORDER BY mi.invoice_year ASC, mi.invoice_month ASC`,
      [sYear, sYear, sMonth, eYear, eYear, eMonth, ...wsFilterInvoices.params]
    );

    // Gastos por mes en el rango
    const [monthlyExpenses] = await req.db.query(
      `SELECT
        expense_year as year,
        expense_month as month,
        COALESCE(SUM(amount), 0) as expenses
       FROM expenses
       WHERE (expense_year > ? OR (expense_year = ? AND expense_month >= ?))
       AND (expense_year < ? OR (expense_year = ? AND expense_month <= ?))
       AND is_active = TRUE
       ${wsFilterExpenses.sql}
       GROUP BY expense_year, expense_month
       ORDER BY expense_year ASC, expense_month ASC`,
      [sYear, sYear, sMonth, eYear, eYear, eMonth, ...wsFilterExpenses.params]
    );

    res.json({
      period: {
        start: { year: sYear, month: sMonth },
        end: { year: eYear, month: eMonth }
      },
      monthlyIncome,
      monthlyExpenses
    });
  } catch (error) {
    console.error('Error obteniendo vista financiera:', error);
    res.status(500).json({ error: 'Error al obtener vista financiera' });
  }
};

/**
 * GET /api/admin/dashboard/caja-personal
 * Vista de Caja Personal: efectivo disponible, comprometido y por cobrar
 */
export const getCajaPersonal: RequestHandler = async (req: any, res: any) => {
  const isConsolidated = req.isConsolidatedView;
  const workspaceId = req.workspaceId;
  let accessibleIds: number[] = [];

  if (isConsolidated) {
    const workspaceService = new WorkspaceService(req.db);
    accessibleIds = await workspaceService.getAccessibleWorkspaceIds(req.user.id);
  }

  const wsFilterPayments = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'cp');
  const wsFilterExpenses = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, '', true);
  const wsFilterInvoices = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'mi');
  const wsFilterBalances = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'cp');
  const wsFilterExternal = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'ei');

  try {
    // ========== ENTRADAS DE EFECTIVO (histórico total) ==========

    // 1. Total pagos de clientes recibidos
    const [totalPayments]: any = await req.db.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM client_payments cp
      WHERE 1=1 ${wsFilterPayments.sql}
    `, [...wsFilterPayments.params]);

    // 2. Total ingresos externos
    const [totalExternalIncomes]: any = await req.db.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM external_incomes ei
      WHERE 1=1 ${wsFilterExternal.sql}
    `, [...wsFilterExternal.params]);

    // ========== SALIDAS DE EFECTIVO ==========

    // 3. Total gastos pagados
    const [totalExpenses]: any = await req.db.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE is_active = TRUE ${wsFilterExpenses.sql}
    `, [...wsFilterExpenses.params]);

    // ========== COMPROMETIDO (saldos a favor de clientes) ==========
    const [clientBalances]: any = await req.db.query(`
      SELECT COALESCE(SUM(cp.account_balance), 0) as total
      FROM clients_profiles cp
      JOIN users u ON u.id = cp.user_id
      WHERE u.role = 'client' AND cp.account_balance > 0
      ${wsFilterBalances.sql}
    `, [...wsFilterBalances.params]);

    // ========== POR COBRAR (facturas pendientes) ==========
    const [pendingInvoices]: any = await req.db.query(`
      SELECT
        COALESCE(SUM(mi.balance), 0) as total,
        COUNT(*) as count
      FROM monthly_invoices mi
      WHERE mi.payment_status IN ('pending', 'partial', 'overdue')
      ${wsFilterInvoices.sql}
    `, [...wsFilterInvoices.params]);

    // ========== CÁLCULOS ==========
    const entradas = Number(totalPayments[0].total) + Number(totalExternalIncomes[0].total);
    const salidas = Number(totalExpenses[0].total);
    const comprometido = Number(clientBalances[0].total);
    const porCobrar = Number(pendingInvoices[0].total);

    // Efectivo disponible = Entradas - Salidas - Comprometido
    const efectivoDisponible = entradas - salidas - comprometido;

    // Efectivo total = Disponible + Comprometido (lo que físicamente tienes)
    const efectivoTotal = entradas - salidas;

    res.json({
      resumen: {
        efectivoTotal: parseFloat(efectivoTotal.toFixed(2)),
        efectivoDisponible: parseFloat(efectivoDisponible.toFixed(2)),
        comprometido: parseFloat(comprometido.toFixed(2)),
        porCobrar: parseFloat(porCobrar.toFixed(2)),
        facturasPendientes: Number(pendingInvoices[0].count)
      },
      detalle: {
        entradas: {
          pagosClientes: parseFloat(Number(totalPayments[0].total).toFixed(2)),
          ingresosExternos: parseFloat(Number(totalExternalIncomes[0].total).toFixed(2)),
          total: parseFloat(entradas.toFixed(2))
        },
        salidas: {
          gastos: parseFloat(Number(totalExpenses[0].total).toFixed(2)),
          total: parseFloat(salidas.toFixed(2))
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo caja personal:', error);
    res.status(500).json({ error: 'Error al obtener caja personal' });
  }
};

/**
 * GET /api/admin/dashboard/balance-general
 * Balance General Simplificado: Activos - Pasivos = Patrimonio
 */
export const getBalanceGeneral: RequestHandler = async (req: any, res: any) => {
  const isConsolidated = req.isConsolidatedView;
  const workspaceId = req.workspaceId;
  let accessibleIds: number[] = [];

  if (isConsolidated) {
    const workspaceService = new WorkspaceService(req.db);
    accessibleIds = await workspaceService.getAccessibleWorkspaceIds(req.user.id);
  }

  const wsFilterPayments = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'cp');
  const wsFilterExpenses = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, '', true);
  const wsFilterInvoices = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'mi');
  const wsFilterBalances = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'cp');
  const wsFilterExternal = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'ei');

  try {
    // ========== ACTIVOS ==========

    // 1. Efectivo (pagos recibidos + ingresos externos - gastos)
    const [payments]: any = await req.db.query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM client_payments cp WHERE 1=1 ${wsFilterPayments.sql}
    `, [...wsFilterPayments.params]);

    const [externalInc]: any = await req.db.query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM external_incomes ei WHERE 1=1 ${wsFilterExternal.sql}
    `, [...wsFilterExternal.params]);

    const [expenses]: any = await req.db.query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE is_active = TRUE ${wsFilterExpenses.sql}
    `, [...wsFilterExpenses.params]);

    const efectivo = Number(payments[0].total) + Number(externalInc[0].total) - Number(expenses[0].total);

    // 2. Cuentas por cobrar (facturas pendientes)
    const [receivables]: any = await req.db.query(`
      SELECT COALESCE(SUM(balance), 0) as total FROM monthly_invoices mi
      WHERE payment_status IN ('pending', 'partial', 'overdue') ${wsFilterInvoices.sql}
    `, [...wsFilterInvoices.params]);

    const cuentasPorCobrar = Number(receivables[0].total);
    const totalActivos = efectivo + cuentasPorCobrar;

    // ========== PASIVOS ==========

    // 1. Saldos a favor de clientes (obligación de prestar servicio o devolver)
    const [clientBal]: any = await req.db.query(`
      SELECT COALESCE(SUM(cp.account_balance), 0) as total
      FROM clients_profiles cp
      JOIN users u ON u.id = cp.user_id
      WHERE u.role = 'client' AND cp.account_balance > 0 ${wsFilterBalances.sql}
    `, [...wsFilterBalances.params]);

    const saldosClientes = Number(clientBal[0].total);
    const totalPasivos = saldosClientes;

    // ========== PATRIMONIO ==========
    const patrimonio = totalActivos - totalPasivos;

    res.json({
      activos: {
        efectivo: parseFloat(efectivo.toFixed(2)),
        cuentasPorCobrar: parseFloat(cuentasPorCobrar.toFixed(2)),
        total: parseFloat(totalActivos.toFixed(2))
      },
      pasivos: {
        saldosClientesPrepagados: parseFloat(saldosClientes.toFixed(2)),
        total: parseFloat(totalPasivos.toFixed(2))
      },
      patrimonio: parseFloat(patrimonio.toFixed(2)),
      ecuacion: `Activos (${totalActivos.toFixed(2)}) - Pasivos (${totalPasivos.toFixed(2)}) = Patrimonio (${patrimonio.toFixed(2)})`
    });
  } catch (error) {
    console.error('Error obteniendo balance general:', error);
    res.status(500).json({ error: 'Error al obtener balance general' });
  }
};

/**
 * GET /api/admin/dashboard/metricas-financieras
 * Métricas de Salud Financiera
 */
export const getMetricasFinancieras: RequestHandler = async (req: any, res: any) => {
  const { months = 3 } = req.query; // Últimos N meses para promedios
  const isConsolidated = req.isConsolidatedView;
  const workspaceId = req.workspaceId;
  let accessibleIds: number[] = [];

  if (isConsolidated) {
    const workspaceService = new WorkspaceService(req.db);
    accessibleIds = await workspaceService.getAccessibleWorkspaceIds(req.user.id);
  }

  const wsFilterInvoices = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'mi');
  const wsFilterPayments = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'cp');
  const wsFilterExpenses = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, '', true);

  try {
    // ========== RATIO DE COBRANZA ==========
    // (Total cobrado / Total facturado) * 100
    const [invoiceTotals]: any = await req.db.query(`
      SELECT
        COALESCE(SUM(total_due), 0) as facturado,
        COALESCE(SUM(amount_paid), 0) as cobrado
      FROM monthly_invoices mi
      WHERE 1=1 ${wsFilterInvoices.sql}
    `, [...wsFilterInvoices.params]);

    const facturado = Number(invoiceTotals[0].facturado);
    const cobrado = Number(invoiceTotals[0].cobrado);
    const ratioCobranza = facturado > 0 ? (cobrado / facturado) * 100 : 0;

    // ========== DÍAS PROMEDIO DE COBRO ==========
    // Promedio de días entre creación de factura y pago completo
    const [avgDays]: any = await req.db.query(`
      SELECT AVG(DATEDIFF(payment_registered_at, created_at)) as promedio
      FROM monthly_invoices mi
      WHERE payment_status = 'paid'
      AND payment_registered_at IS NOT NULL
      ${wsFilterInvoices.sql}
    `, [...wsFilterInvoices.params]);

    const diasPromedioCobro = Math.round(Number(avgDays[0].promedio || 0));

    // ========== CLIENTES MOROSOS VS AL DÍA ==========
    const [clientStatus]: any = await req.db.query(`
      SELECT
        COUNT(DISTINCT CASE WHEN mi.payment_status IN ('pending', 'partial', 'overdue') THEN mi.client_user_id END) as morosos,
        COUNT(DISTINCT CASE WHEN mi.payment_status = 'paid' THEN mi.client_user_id END) as al_dia
      FROM monthly_invoices mi
      WHERE mi.invoice_year = YEAR(CURDATE()) AND mi.invoice_month = MONTH(CURDATE())
      ${wsFilterInvoices.sql}
    `, [...wsFilterInvoices.params]);

    // ========== MARGEN DE GANANCIA ==========
    // (Ingresos - Gastos) / Ingresos * 100
    const [income]: any = await req.db.query(`
      SELECT COALESCE(SUM(amount_paid), 0) as total
      FROM monthly_invoices mi
      WHERE payment_status IN ('paid', 'partial')
      ${wsFilterInvoices.sql}
    `, [...wsFilterInvoices.params]);

    const [expense]: any = await req.db.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses WHERE is_active = TRUE ${wsFilterExpenses.sql}
    `, [...wsFilterExpenses.params]);

    const ingresos = Number(income[0].total);
    const gastos = Number(expense[0].total);
    const margenGanancia = ingresos > 0 ? ((ingresos - gastos) / ingresos) * 100 : 0;

    // ========== TASA DE RETENCIÓN (clientes que pagan vs total) ==========
    const [retention]: any = await req.db.query(`
      SELECT
        COUNT(DISTINCT mi.client_user_id) as clientes_con_facturas,
        COUNT(DISTINCT CASE WHEN mi.payment_status = 'paid' THEN mi.client_user_id END) as clientes_que_pagan
      FROM monthly_invoices mi
      WHERE mi.invoice_year >= YEAR(CURDATE()) - 1
      ${wsFilterInvoices.sql}
    `, [...wsFilterInvoices.params]);

    const clientesConFacturas = Number(retention[0].clientes_con_facturas);
    const clientesQuePagan = Number(retention[0].clientes_que_pagan);
    const tasaRetencion = clientesConFacturas > 0 ? (clientesQuePagan / clientesConFacturas) * 100 : 0;

    // ========== AGING DE CUENTAS POR COBRAR ==========
    const [aging]: any = await req.db.query(`
      SELECT
        SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) <= 30 THEN balance ELSE 0 END) as dias_0_30,
        SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 31 AND 60 THEN balance ELSE 0 END) as dias_31_60,
        SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 61 AND 90 THEN balance ELSE 0 END) as dias_61_90,
        SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) > 90 THEN balance ELSE 0 END) as dias_90_plus
      FROM monthly_invoices mi
      WHERE payment_status IN ('pending', 'partial', 'overdue')
      ${wsFilterInvoices.sql}
    `, [...wsFilterInvoices.params]);

    res.json({
      cobranza: {
        ratioCobranza: parseFloat(ratioCobranza.toFixed(1)),
        diasPromedioCobro,
        totalFacturado: parseFloat(facturado.toFixed(2)),
        totalCobrado: parseFloat(cobrado.toFixed(2)),
        pendiente: parseFloat((facturado - cobrado).toFixed(2))
      },
      clientes: {
        morosos: Number(clientStatus[0].morosos || 0),
        alDia: Number(clientStatus[0].al_dia || 0),
        tasaRetencion: parseFloat(tasaRetencion.toFixed(1))
      },
      rentabilidad: {
        ingresos: parseFloat(ingresos.toFixed(2)),
        gastos: parseFloat(gastos.toFixed(2)),
        ganancia: parseFloat((ingresos - gastos).toFixed(2)),
        margenGanancia: parseFloat(margenGanancia.toFixed(1))
      },
      agingCuentasPorCobrar: {
        dias_0_30: parseFloat(Number(aging[0].dias_0_30 || 0).toFixed(2)),
        dias_31_60: parseFloat(Number(aging[0].dias_31_60 || 0).toFixed(2)),
        dias_61_90: parseFloat(Number(aging[0].dias_61_90 || 0).toFixed(2)),
        dias_90_plus: parseFloat(Number(aging[0].dias_90_plus || 0).toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error obteniendo métricas financieras:', error);
    res.status(500).json({ error: 'Error al obtener métricas financieras' });
  }
};
