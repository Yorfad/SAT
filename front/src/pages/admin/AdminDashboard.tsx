import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { money } from "../../utils/format";

type Summary = {
  incomeByMonth: { month: string; income: number }[];
  totals: { ingresos:number; deudas:number; clientesAlDia:number; clientes:number; };
};

export default function AdminDashboard(){
  const { data } = useQuery({
    queryKey:["admin-summary"],
    queryFn: async ()=> (await api.get<Summary>("/admin/dashboard/summary")).data
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Ingresos" value={money(data?.totals.ingresos ?? 0)} />
        <Stat label="Deudas" value={money(data?.totals.deudas ?? 0)} />
        <Stat label="Clientes al día" value={String(data?.totals.clientesAlDia ?? 0)} />
        <Stat label="Clientes" value={String(data?.totals.clientes ?? 0)} />
      </div>
      <div className="h-64 bg-white rounded-xl shadow p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data?.incomeByMonth ?? []}>
            <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopOpacity={0.6}/><stop offset="95%" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month"/><YAxis/><Tooltip formatter={(v)=>money(Number(v))}/>
            <Area type="monotone" dataKey="income" stroke="currentColor" fill="url(#g)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
function Stat({label,value}:{label:string,value:string}){
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
