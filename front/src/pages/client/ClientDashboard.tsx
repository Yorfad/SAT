import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import type { Invoice } from '../../types';
import { money, ym } from "../../utils/format";

export default function ClientDashboard(){
  const { data } = useQuery({
    queryKey:["client-dashboard"],
    queryFn: async ()=> (await api.get("/clients/dashboard")).data
  });

  const invoices: Invoice[] = data?.invoices ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mi Panel</h1>
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-medium mb-2">Facturas recientes</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-500">
            <th className="py-2">Mes</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th>
          </tr></thead>
          <tbody>
            {invoices.map(inv=>(
              <tr key={inv.id} className="border-t">
                <td className="py-2">{ym(inv.invoice_year, inv.invoice_month)}</td>
                <td>{money(inv.total_due)}</td>
                <td>{money(inv.amount_paid)}</td>
                <td>{money(inv.balance)}</td>
                <td><span className="capitalize">{inv.payment_status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
