import { Request, Response } from "express";

/**
 * GET /stats
 * Retorna estadísticas generales del workspace actual
 */
export async function getStats(req: Request, res: Response) {
  try {
    const workspaceId = (req as any).workspaceId;
    const isConsolidated = (req as any).isConsolidatedView;
    const accessibleIds = (req as any).accessibleWorkspaceIds || [];

    // Construir filtros de workspace usando user_workspaces
    let workspaceJoin = '';
    let workspaceFilter = '';
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

    // 1. Total de clientes activos
    const [clientsResult]: any = await req.db!.query(`
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      ${workspaceJoin}
      WHERE u.role = 'client' AND u.is_active = 1 ${workspaceFilter}
    `, params);
    const totalClients = clientsResult[0]?.total || 0;

    // 2. Tareas pendientes
    const [pendingResult]: any = await req.db!.query(`
      SELECT COUNT(*) as total
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.invoice_id
      JOIN users u ON u.id = mi.client_user_id
      ${workspaceJoin}
      WHERE msc.status <> 'completed'
        AND u.is_active = 1
        ${workspaceFilter}
    `, params);
    const pendingTasks = pendingResult[0]?.total || 0;

    // 3. Tareas completadas este mes
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const [completedMonthResult]: any = await req.db!.query(`
      SELECT COUNT(*) as total
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.invoice_id
      JOIN users u ON u.id = mi.client_user_id
      ${workspaceJoin}
      WHERE msc.status = 'completed'
        AND mi.invoice_year = ?
        AND mi.invoice_month = ?
        AND u.is_active = 1
        ${workspaceFilter}
    `, [currentYear, currentMonth, ...params]);
    const completedThisMonth = completedMonthResult[0]?.total || 0;

    // 4. Total de tareas este mes
    const [totalMonthResult]: any = await req.db!.query(`
      SELECT COUNT(*) as total
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.invoice_id
      JOIN users u ON u.id = mi.client_user_id
      ${workspaceJoin}
      WHERE mi.invoice_year = ?
        AND mi.invoice_month = ?
        AND u.is_active = 1
        ${workspaceFilter}
    `, [currentYear, currentMonth, ...params]);
    const totalThisMonth = totalMonthResult[0]?.total || 0;

    // 5. Servicios activos
    const [servicesResult]: any = await req.db!.query(`
      SELECT COUNT(*) as total
      FROM services
      WHERE is_active = TRUE
    `);
    const activeServices = servicesResult[0]?.total || 0;

    // 6. Ingresos del mes (suma de facturas pagadas)
    const [revenueResult]: any = await req.db!.query(`
      SELECT COALESCE(SUM(amount_paid), 0) as total
      FROM monthly_invoices mi
      JOIN users u ON u.id = mi.client_user_id
      ${workspaceJoin}
      WHERE mi.invoice_year = ?
        AND mi.invoice_month = ?
        AND u.is_active = 1
        ${workspaceFilter}
    `, [currentYear, currentMonth, ...params]);
    const revenueThisMonth = parseFloat(revenueResult[0]?.total || 0);

    // 7. Tareas vencidas (pendientes de meses anteriores)
    const [overdueResult]: any = await req.db!.query(`
      SELECT COUNT(*) as total
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.invoice_id
      JOIN users u ON u.id = mi.client_user_id
      ${workspaceJoin}
      WHERE msc.status <> 'completed'
        AND (mi.invoice_year < ? OR (mi.invoice_year = ? AND mi.invoice_month < ?))
        AND u.is_active = 1
        ${workspaceFilter}
    `, [currentYear, currentYear, currentMonth, ...params]);
    const overdueTasks = overdueResult[0]?.total || 0;

    // 8. Tareas por servicio (top 5)
    const [tasksByServiceResult]: any = await req.db!.query(`
      SELECT
        s.service_name,
        SUM(CASE WHEN msc.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN msc.status <> 'completed' THEN 1 ELSE 0 END) as pending,
        COUNT(*) as total
      FROM monthly_service_checklist msc
      JOIN monthly_invoices mi ON mi.id = msc.invoice_id
      JOIN users u ON u.id = mi.client_user_id
      ${workspaceJoin}
      LEFT JOIN services s ON s.id = msc.service_id
      WHERE mi.invoice_year = ?
        AND mi.invoice_month = ?
        AND u.is_active = 1
        ${workspaceFilter}
      GROUP BY s.id, s.service_name
      ORDER BY total DESC
      LIMIT 5
    `, [currentYear, currentMonth, ...params]);

    res.json({
      totalClients,
      pendingTasks,
      completedThisMonth,
      totalThisMonth,
      activeServices,
      revenueThisMonth,
      overdueTasks,
      tasksByService: tasksByServiceResult || [],
      period: {
        month: currentMonth,
        year: currentYear
      }
    });

  } catch (error: any) {
    console.error('Error getting stats:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
}
