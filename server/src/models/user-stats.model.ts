import { RowDataPacket } from 'mysql2';

// ========================================
// INTERFACES DE ESTADÍSTICAS DE USUARIOS
// ========================================

export interface UserActivityStats extends RowDataPacket {
  id: number;
  user_id: number;
  stat_date: Date;
  tasks_completed: number;
  clients_managed: number;
  services_completed: number;
  login_count: number;
  actions_performed: number;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

// Vista agregada desde la base de datos
export interface UserStats extends RowDataPacket {
  user_id: number;
  email: string;
  full_name: string;
  system_role: string;
  roles_count: number;
  roles: string; // Lista separada por comas
  total_tasks_completed: number;
  total_logins: number;
  last_login_date?: Date;
  tasks_completed_count: number;
  clients_managed_count: number;
  is_active: boolean;
}

// ========================================
// TIPOS PARA CONSULTAS Y FILTROS
// ========================================

export interface UserStatsFilter {
  user_id?: number;
  start_date?: Date;
  end_date?: Date;
  min_tasks_completed?: number;
  min_logins?: number;
  is_active?: boolean;
}

export interface UserActivitySummary {
  user_id: number;
  email: string;
  full_name: string;
  period_start: Date;
  period_end: Date;
  total_tasks_completed: number;
  total_clients_managed: number;
  total_services_completed: number;
  total_logins: number;
  total_actions_performed: number;
  last_login?: Date;
  avg_tasks_per_day: number;
  avg_actions_per_day: number;
}

export interface GlobalStats extends RowDataPacket {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_tasks_completed: number;
  total_clients_managed: number;
  total_logins_today: number;
  total_logins_this_week: number;
  total_logins_this_month: number;
}

export interface UserRanking {
  user_id: number;
  email: string;
  full_name: string;
  metric_value: number;
  rank: number;
}

// ========================================
// TIPOS PARA CREACIÓN Y ACTUALIZACIÓN
// ========================================

export interface IncrementUserStats {
  user_id: number;
  stat_date?: Date; // Si no se proporciona, usa la fecha actual
  tasks_completed?: number;
  clients_managed?: number;
  services_completed?: number;
  login_count?: number;
  actions_performed?: number;
  last_login?: Date;
}

export interface RecordUserLogin {
  user_id: number;
  login_timestamp?: Date;
}

export interface RecordTaskCompletion {
  user_id: number;
  task_id: number;
  completion_date?: Date;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Calcula el promedio de una métrica por día
 */
export function calculateDailyAverage(total: number, days: number): number {
  if (days <= 0) return 0;
  return Math.round((total / days) * 100) / 100; // Redondea a 2 decimales
}

/**
 * Obtiene el rango de fechas para un período
 */
export function getDateRangeForPeriod(period: 'today' | 'week' | 'month' | 'year'): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
  }

  return { start, end };
}

/**
 * Formatea las estadísticas para mostrar
 */
export function formatUserStats(stats: UserActivityStats[]): UserActivitySummary | null {
  if (stats.length === 0) return null;

  const firstStat = stats[0];
  const lastStat = stats[stats.length - 1];

  const totals = stats.reduce(
    (acc, stat) => ({
      tasks_completed: acc.tasks_completed + stat.tasks_completed,
      clients_managed: acc.clients_managed + stat.clients_managed,
      services_completed: acc.services_completed + stat.services_completed,
      logins: acc.logins + stat.login_count,
      actions: acc.actions + stat.actions_performed,
    }),
    { tasks_completed: 0, clients_managed: 0, services_completed: 0, logins: 0, actions: 0 }
  );

  const days = stats.length;

  return {
    user_id: firstStat.user_id,
    email: '', // Debe llenarse con un JOIN
    full_name: '', // Debe llenarse con un JOIN
    period_start: new Date(firstStat.stat_date),
    period_end: new Date(lastStat.stat_date),
    total_tasks_completed: totals.tasks_completed,
    total_clients_managed: totals.clients_managed,
    total_services_completed: totals.services_completed,
    total_logins: totals.logins,
    total_actions_performed: totals.actions,
    last_login: lastStat.last_login,
    avg_tasks_per_day: calculateDailyAverage(totals.tasks_completed, days),
    avg_actions_per_day: calculateDailyAverage(totals.actions, days),
  };
}

/**
 * Compara dos usuarios por una métrica específica
 */
export function compareUsersByMetric(
  metric: keyof Pick<
    UserStats,
    'total_tasks_completed' | 'total_logins' | 'tasks_completed_count' | 'clients_managed_count'
  >
): (a: UserStats, b: UserStats) => number {
  return (a, b) => (b[metric] as number) - (a[metric] as number);
}

/**
 * Genera un ranking de usuarios por una métrica
 */
export function generateUserRanking(
  users: UserStats[],
  metric: keyof Pick<
    UserStats,
    'total_tasks_completed' | 'total_logins' | 'tasks_completed_count' | 'clients_managed_count'
  >
): UserRanking[] {
  const sorted = [...users].sort(compareUsersByMetric(metric));

  return sorted.map((user, index) => ({
    user_id: user.user_id,
    email: user.email,
    full_name: user.full_name,
    metric_value: user[metric] as number,
    rank: index + 1,
  }));
}
