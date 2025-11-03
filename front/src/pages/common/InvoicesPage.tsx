import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import type { Invoice } from '../../types';
import { money, ym } from "../../utils/format";
import { useAuth } from "../../context/AuthContext";

export default function InvoicesPage(){
  const { user } = useAuth();
  
  // Para client, usar /clients/dashboard que devuelve { invoices }
  // Para admin/employee, mostrar mensaje indicando que deben ver facturas por cliente
  const { data, isLoading } = useQuery({
    queryKey:["my-invoices", user?.role, user?.id],
    queryFn: async () => {
      if (user?.role === "client") {
        const resp = await api.get<{ invoices: Invoice[] }>("/clients/dashboard");
        return resp.data.invoices;
      }
      // Para admin/employee, no hay endpoint de "todas las invoices"
      // Devuelve array vacío por ahora
      return [];
    },
    enabled: !!user // Solo ejecutar si hay usuario
  });
  
  const invoices = data ?? [];
  
  if (isLoading) return <div className="p-6">Cargando…</div>;
  
  // Si es admin/employee, mostrar mensaje
  if (user?.role === "admin" || user?.role === "employee") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-3">Facturas</h1>
        <p className="text-slate-600">
          Para ver las facturas de un cliente, visita el detalle del cliente desde la página de <a href="/admin/clients" className="underline">Clientes</a>.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-3">Mis facturas</h1>
      <table className="w-full bg-white rounded-xl shadow text-sm">
        <thead><tr className="text-left text-slate-500">
          <th className="p-3">Mes</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th>
        </tr></thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr><td colSpan={5} className="p-3 text-center text-slate-500">No hay facturas disponibles</td></tr>
          ) : (
            invoices.map(inv=>(
              <tr key={inv.id} className="border-t">
                <td className="p-3">{ym(inv.invoice_year, inv.invoice_month)}</td>
                <td>{money(inv.total_due)}</td>
                <td>{money(inv.amount_paid)}</td>
                <td>{money(inv.balance)}</td>
                <td className="capitalize">{inv.payment_status}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
