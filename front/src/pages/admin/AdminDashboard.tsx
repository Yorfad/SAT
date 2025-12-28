import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { money } from "../../utils/format";
import { useWorkspace } from "../../context/WorkspaceContext";

type Summary = {
  period: { year: number; month: number };
  totals: {
    activos: number;
    pasivos: number;
    gananciaNeta: number;
    deudas: number;
    clientesAlDia: number;
    clientes: number;
    infraccionesActivas: number;
  };
  breakdown: {
    activos: {
      serviciosPagados: number;
      gananciaOperacional: number;
    };
    pasivos: {
      gastosUnicos: number;
      gastosRecurrentes: number;
      costosOperacionales: number;
    };
  };
  incomeByMonth: { month: string; income: number }[];
  expensesByCategory: { category: string; total: number }[];
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard(){
  const navigate = useNavigate();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const { workspaces, currentWorkspace, isConsolidatedView, setConsolidatedView, switchWorkspace } = useWorkspace();
  // Usar isConsolidatedView del contexto como fuente de verdad
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(() => {
    // Inicializar desde localStorage para tener el valor correcto inmediatamente
    return localStorage.getItem('consolidatedView') === 'true';
  });
  const queryClient = useQueryClient();

  // Ref para guardar el workspace al que volver y si activamos consolidated
  const previousWorkspaceRef = useRef(currentWorkspace);
  const activatedConsolidatedRef = useRef(false);

  // Sincronizar estado local con el contexto
  useEffect(() => {
    setShowAllWorkspaces(isConsolidatedView);
  }, [isConsolidatedView]);

  // Guardar el workspace actual cuando se monta el componente
  useEffect(() => {
    if (currentWorkspace) {
      previousWorkspaceRef.current = currentWorkspace;
    }
  }, [currentWorkspace]);

  // Al salir de la página, restaurar al workspace anterior si activamos consolidated
  useEffect(() => {
    return () => {
      if (activatedConsolidatedRef.current) {
        setConsolidatedView(false);
        if (previousWorkspaceRef.current) {
          switchWorkspace(previousWorkspaceRef.current);
        }
      }
    };
  }, [setConsolidatedView, switchWorkspace]);

  const handleToggleAllWorkspaces = () => {
    const newValue = !showAllWorkspaces;
    setShowAllWorkspaces(newValue);

    // Actualizar localStorage ANTES de cambiar estado del contexto
    if (newValue) {
      localStorage.setItem('consolidatedView', 'true');
      localStorage.removeItem('currentWorkspace');
    } else {
      localStorage.removeItem('consolidatedView');
      // Restaurar workspace anterior si existe
      if (previousWorkspaceRef.current) {
        localStorage.setItem('currentWorkspace', previousWorkspaceRef.current.slug);
      }
    }

    setConsolidatedView(newValue);
    activatedConsolidatedRef.current = newValue;

    // Usar timeout para asegurar que localStorage está actualizado antes del refetch
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["task-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-projections"] });
    }, 50);
  };

  // Stats generales de tareas
  const { data: taskStats } = useQuery({
    queryKey:["task-stats", showAllWorkspaces],
    queryFn: async ()=> (await api.get('/stats')).data
  });

  const { data } = useQuery({
    queryKey:["admin-summary", selectedYear, selectedMonth, showAllWorkspaces],
    queryFn: async ()=> {
      const params = new URLSearchParams();
      params.append("year", String(selectedYear));
      params.append("month", String(selectedMonth));
      return (await api.get<Summary>(`/admin/dashboard/summary?${params}`)).data;
    }
  });

  // Proyecciones financieras
  const { data: projections } = useQuery({
    queryKey:["admin-projections", selectedYear, selectedMonth, showAllWorkspaces],
    queryFn: async ()=> {
      const params = new URLSearchParams();
      params.append("year", String(selectedYear));
      params.append("month", String(selectedMonth));
      return (await api.get(`/admin/dashboard/projections?${params}`)).data;
    }
  });

  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // Generar años disponibles (últimos 5 años hacia atrás y 1 hacia adelante)
  const availableYears = [];
  for (let i = currentDate.getFullYear() + 1; i >= currentDate.getFullYear() - 5; i--) {
    availableYears.push(i);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Resumen de Tareas */}
      {taskStats && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Estado de Tareas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div
              className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 cursor-pointer hover:border-orange-500 transition-colors"
              onClick={() => navigate('/admin/tasks')}
            >
              <p className="text-2xl font-bold text-orange-400">{taskStats.pendingTasks}</p>
              <p className="text-sm text-slate-400">Pendientes</p>
            </div>
            <div
              className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 cursor-pointer hover:border-green-500 transition-colors"
              onClick={() => navigate('/admin/historial')}
            >
              <p className="text-2xl font-bold text-green-400">{taskStats.completedThisMonth}</p>
              <p className="text-sm text-slate-400">Completadas (mes)</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <p className="text-2xl font-bold text-blue-400">{taskStats.totalThisMonth}</p>
              <p className="text-sm text-slate-400">Total del mes</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <p className={`text-2xl font-bold ${taskStats.overdueTasks > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {taskStats.overdueTasks}
              </p>
              <p className="text-sm text-slate-400">Vencidas</p>
            </div>
            <div
              className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => navigate('/admin/clients')}
            >
              <p className="text-2xl font-bold text-slate-200">{taskStats.totalClients}</p>
              <p className="text-sm text-slate-400">Clientes activos</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <p className="text-2xl font-bold text-purple-400">{taskStats.activeServices}</p>
              <p className="text-sm text-slate-400">Servicios activos</p>
            </div>
          </div>

          {/* Progreso del mes */}
          {taskStats.totalThisMonth > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Progreso del mes</span>
                <span className="text-slate-300">
                  {Math.round((taskStats.completedThisMonth / taskStats.totalThisMonth) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-500"
                  style={{ width: `${(taskStats.completedThisMonth / taskStats.totalThisMonth) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard Financiero</h1>
          {showAllWorkspaces && (
            <p className="text-sm text-purple-400 mt-1 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Vista General - Todos los workspaces
            </p>
          )}
        </div>

        {/* Filtros de Fecha y Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-300">Mes:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {monthNames.map((name, index) => (
                <option key={index} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-300">Año:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setSelectedYear(currentDate.getFullYear());
              setSelectedMonth(currentDate.getMonth() + 1);
            }}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
          >
            Mes Actual
          </button>

          {/* Toggle para ver todos los workspaces */}
          {workspaces.length > 1 && (
            <button
              onClick={handleToggleAllWorkspaces}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                showAllWorkspaces
                  ? 'bg-purple-900/30 border-purple-600 text-purple-300'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-purple-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showAllWorkspaces ? 'Ver solo este workspace' : 'Ver todos'}
            </button>
          )}
        </div>
      </div>

      {/* Proyecciones Financieras */}
      {projections && (
        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Proyección del Mes
            </h2>
            <span className="text-sm text-slate-400">Basado en clientes activos y bundles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Ingresos Proyectados</p>
              <p className="text-2xl font-bold text-green-400">{money(projections.projections?.totalIngresos ?? 0)}</p>
              <p className="text-xs text-slate-500 mt-1">
                Servicios: {money(projections.breakdown?.ingresos?.serviciosIndividuales ?? 0)} •
                Bundles: {money(projections.breakdown?.ingresos?.bundles ?? 0)}
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Gastos Proyectados</p>
              <p className="text-2xl font-bold text-red-400">{money(projections.projections?.totalGastos ?? 0)}</p>
              <p className="text-xs text-slate-500 mt-1">
                Op. Bundles: {money(projections.breakdown?.gastos?.costosOperacionalesBundles ?? 0)} •
                Recurrentes: {money(projections.breakdown?.gastos?.gastosRecurrentes ?? 0)}
              </p>
            </div>

            <div className={`rounded-lg p-4 border ${
              (projections.projections?.gananciaProyectada ?? 0) >= 0
                ? 'bg-green-900/20 border-green-700'
                : 'bg-red-900/20 border-red-700'
            }`}>
              <p className="text-sm text-slate-400 mb-1">Ganancia Proyectada</p>
              <p className={`text-2xl font-bold ${
                (projections.projections?.gananciaProyectada ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {money(projections.projections?.gananciaProyectada ?? 0)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {(projections.projections?.gananciaProyectada ?? 0) >= 0
                  ? '✓ Mes positivo'
                  : '⚠ Números rojos'}
              </p>
            </div>
          </div>

          {/* Desglose de clientes */}
          {projections.clientBreakdown && projections.clientBreakdown.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-purple-300 hover:text-purple-200 font-medium">
                Ver desglose por cliente ({projections.clientBreakdown.length} clientes)
              </summary>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {projections.clientBreakdown.map((client: any) => (
                  <div key={client.id} className="bg-slate-900/30 rounded p-2 border border-slate-700">
                    <p className="text-sm font-medium text-white">{client.full_name}</p>
                    <p className="text-xs text-slate-400">
                      {client.services_count} servicios • {client.bundles_count} bundles
                    </p>
                    <p className="text-xs text-green-400">
                      +{money(Number(client.individual_services_income) + Number(client.bundle_income))}
                    </p>
                    {Number(client.bundle_costs) > 0 && (
                      <p className="text-xs text-red-400">
                        -{money(client.bundle_costs)} (costos op.)
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      <div className="border-t border-slate-700 pt-4">
        <h2 className="text-lg font-semibold text-white mb-4">Datos Históricos (Reales)</h2>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Ganancia Neta"
          value={money(data?.totals.gananciaNeta ?? 0)}
          trend={data?.totals.gananciaNeta && data.totals.gananciaNeta > 0 ? "positive" : "negative"}
        />
        <Stat label="Activos" value={money(data?.totals.activos ?? 0)} variant="success" />
        <Stat label="Pasivos" value={money(data?.totals.pasivos ?? 0)} variant="warning" />
        <Stat label="Deudas Pendientes" value={money(data?.totals.deudas ?? 0)} variant="danger" />
      </div>

      {/* Métricas de Clientes */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat label="Clientes Totales" value={String(data?.totals.clientes ?? 0)} />
        <Stat label="Clientes al Día" value={String(data?.totals.clientesAlDia ?? 0)} />
        <Stat
          label="Infracciones Activas"
          value={String(data?.totals.infraccionesActivas ?? 0)}
          variant={data?.totals.infraccionesActivas && data.totals.infraccionesActivas > 0 ? "warning" : "default"}
        />
      </div>

      {/* Breakdown de Activos y Pasivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-green-400">Desglose de Activos</h3>
          <div className="space-y-2">
            <BreakdownItem
              label="Servicios Pagados"
              value={money(data?.breakdown.activos.serviciosPagados ?? 0)}
            />
            <BreakdownItem
              label="Ganancia Operacional"
              value={money(data?.breakdown.activos.gananciaOperacional ?? 0)}
            />
            <div className="pt-2 border-t border-slate-700">
              <BreakdownItem
                label="Total Activos"
                value={money(data?.totals.activos ?? 0)}
                bold
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-red-400">Desglose de Pasivos</h3>
          <div className="space-y-2">
            <BreakdownItem
              label="Gastos Únicos"
              value={money(data?.breakdown.pasivos.gastosUnicos ?? 0)}
            />
            <BreakdownItem
              label="Gastos Recurrentes"
              value={money(data?.breakdown.pasivos.gastosRecurrentes ?? 0)}
            />
            <BreakdownItem
              label="Costos Operacionales"
              value={money(data?.breakdown.pasivos.costosOperacionales ?? 0)}
            />
            <div className="pt-2 border-t border-slate-700">
              <BreakdownItem
                label="Total Pasivos"
                value={money(data?.totals.pasivos ?? 0)}
                bold
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfica de Ingresos por Mes */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-white">Ingresos por Mes (Últimos 12 meses)</h3>
          <div className="h-64">
            {data?.incomeByMonth && data.incomeByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.incomeByMonth.map((item: any) => ({
                      name: item.month,
                      value: Number(item.income)
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(props: any) => {
                      const { name, value } = props;
                      if (value > 0) {
                        return `${name}: ${money(value)}`;
                      }
                      return null;
                    }}
                  >
                    {data.incomeByMonth.map((_: any, index: number) => (
                      <Cell key={`cell-income-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v)=>money(Number(v))}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No hay datos de ingresos para mostrar
              </div>
            )}
          </div>
        </div>

        {/* Gráfica de Gastos por Categoría */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-white">Gastos por Categoría</h3>
          <div className="h-64">
            {data?.expensesByCategory && data.expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.expensesByCategory.map((item: any) => ({
                      name: item.category,
                      value: Number(item.total)
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(props: any) => {
                      const { name, value } = props;
                      if (value > 0) {
                        return `${name}: ${money(value)}`;
                      }
                      return null;
                    }}
                  >
                    {data.expensesByCategory.map((_: any, index: number) => (
                      <Cell key={`cell-expense-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v)=>money(Number(v))}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No hay gastos registrados para este mes
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
type StatProps = {
  label: string;
  value: string;
  variant?: "default" | "success" | "warning" | "danger";
  trend?: "positive" | "negative";
};

function Stat({ label, value, variant = "default", trend }: StatProps) {
  const variantClasses = {
    default: "bg-slate-900 border border-slate-700",
    success: "bg-green-950/20 border border-green-800",
    warning: "bg-yellow-950/20 border border-yellow-800",
    danger: "bg-red-950/20 border border-red-800"
  };

  const valueClasses = {
    default: "text-white",
    success: "text-green-400",
    warning: "text-yellow-400",
    danger: "text-red-400"
  };

  return (
    <div className={`rounded-xl shadow-lg p-4 ${variantClasses[variant]}`}>
      <p className="text-sm text-slate-400">{label}</p>
      <div className="flex items-center gap-2">
        <p className={`text-xl font-semibold ${valueClasses[variant]}`}>{value}</p>
        {trend === "positive" && <span className="text-green-400 text-sm">↑</span>}
        {trend === "negative" && <span className="text-red-400 text-sm">↓</span>}
      </div>
    </div>
  );
}

type BreakdownItemProps = {
  label: string;
  value: string;
  bold?: boolean;
};

function BreakdownItem({ label, value, bold }: BreakdownItemProps) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? "font-semibold text-white" : "text-slate-400"}`}>{label}</span>
      <span className={`${bold ? "font-semibold text-lg text-white" : "text-slate-300"}`}>{value}</span>
    </div>
  );
}
