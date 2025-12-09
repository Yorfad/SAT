import { RequestHandler } from "express";
import { WorkspaceService } from "../services/workspace.service";

/**
 * Helper para construir filtro de workspace para queries
 */
function getWorkspaceFilterSQL(
  isConsolidated: boolean | undefined,
  workspaceId: number | null | undefined,
  accessibleIds: number[] | undefined,
  tableAlias: string = ''
): { sql: string; params: any[] } {
  const prefix = tableAlias ? `${tableAlias}.` : '';

  if (!isConsolidated && workspaceId) {
    return { sql: `AND ${prefix}workspace_id = ?`, params: [workspaceId] };
  }

  if (isConsolidated && accessibleIds && accessibleIds.length > 0) {
    const placeholders = accessibleIds.map(() => '?').join(',');
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
  const wsFilterExpenses = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, '');
  const wsFilterSOC = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'soc');
  const wsFilterUsers = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, 'cp');
  const wsFilterInfractions = getWorkspaceFilterSQL(isConsolidated, workspaceId, accessibleIds, '');

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

    const totalActivos = Number(paidServices[0].total_paid || 0) + Number(operationalProfits[0].total_profit || 0);

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
        clientesAlDia: Number(clientsUpToDate[0].count || 0),
        clientes: Number(totalClients[0].count || 0),
        infraccionesActivas: Number(activeInfractions[0].count || 0)
      },
      breakdown: {
        activos: {
          serviciosPagados: Number(paidServices[0].total_paid || 0),
          gananciaOperacional: Number(operationalProfits[0].total_profit || 0)
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

  try {
    // ========== INGRESOS PROYECTADOS ==========

    // 1. Ingresos de servicios individuales activos (sin bundle)
    const [individualServices]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(cs.price), 0) as total_income
       FROM client_services cs
       INNER JOIN users u ON u.id = cs.client_user_id
       WHERE cs.is_active = TRUE
       AND cs.bundle_id IS NULL
       AND u.is_active = TRUE
       AND u.services_disabled_by_infractions = FALSE`
    );

    // 2. Ingresos de bundles activos
    const [bundleIncome]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(sb.total_price), 0) as total_income
       FROM service_bundles sb
       INNER JOIN users u ON u.id = sb.client_user_id
       WHERE sb.is_active = TRUE
       AND u.is_active = TRUE
       AND u.services_disabled_by_infractions = FALSE`
    );

    const totalIngresosProyectados = Number(individualServices[0].total_income || 0) + Number(bundleIncome[0].total_income || 0);

    // ========== GASTOS PROYECTADOS ==========

    // 1. Gastos operativos de bundles
    const [bundleOperationalCosts]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(sb.operational_cost), 0) as total_costs
       FROM service_bundles sb
       INNER JOIN users u ON u.id = sb.client_user_id
       WHERE sb.is_active = TRUE
       AND u.is_active = TRUE
       AND u.services_disabled_by_infractions = FALSE`
    );

    // 2. Gastos recurrentes mensuales activos
    const [recurringExpenses]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE expense_type = 'monthly_recurring'
       AND is_active = TRUE
       AND (expense_year < ? OR (expense_year = ? AND expense_month <= ?))`,
      [currentYear, currentYear, currentMonth]
    );

    // 3. Gastos únicos del mes
    const [oneTimeExpenses]: any = await req.db.query(
      `SELECT
        COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE expense_year = ? AND expense_month = ?
       AND expense_type = 'one_time'
       AND is_active = TRUE`,
      [currentYear, currentMonth]
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
        COUNT(DISTINCT sb.id) as bundles_count,
        COALESCE(SUM(CASE WHEN cs.bundle_id IS NULL THEN cs.price ELSE 0 END), 0) as individual_services_income,
        COALESCE(SUM(DISTINCT sb.total_price), 0) as bundle_income,
        COALESCE(SUM(DISTINCT sb.operational_cost), 0) as bundle_costs
       FROM users u
       LEFT JOIN client_services cs ON cs.client_user_id = u.id AND cs.is_active = TRUE
       LEFT JOIN service_bundles sb ON sb.client_user_id = u.id AND sb.is_active = TRUE
       WHERE u.role = 'client'
       AND u.is_active = TRUE
       AND u.services_disabled_by_infractions = FALSE
       GROUP BY u.id, u.full_name
       ORDER BY u.full_name ASC`
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
       GROUP BY mi.invoice_year, mi.invoice_month
       ORDER BY mi.invoice_year ASC, mi.invoice_month ASC`,
      [sYear, sYear, sMonth, eYear, eYear, eMonth]
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
       GROUP BY expense_year, expense_month
       ORDER BY expense_year ASC, expense_month ASC`,
      [sYear, sYear, sMonth, eYear, eYear, eMonth]
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
