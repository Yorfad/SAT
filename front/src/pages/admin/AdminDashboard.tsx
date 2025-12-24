import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { money } from "../../utils/format";

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
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const { data } = useQuery({
    queryKey:["admin-summary", selectedYear, selectedMonth],
    queryFn: async ()=> {
      const params = new URLSearchParams();
      params.append("year", String(selectedYear));
      params.append("month", String(selectedMonth));
      return (await api.get<Summary>(`/admin/dashboard/summary?${params}`)).data;
    }
  });

  // Proyecciones financieras
  const { data: projections } = useQuery({
    queryKey:["admin-projections", selectedYear, selectedMonth],
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-white">Dashboard Financiero</h1>

        {/* Filtros de Fecha */}
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
