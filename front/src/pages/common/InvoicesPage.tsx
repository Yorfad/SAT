import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import type { Invoice } from '../../types';
import { money, ym } from "../../utils/format";

export default function InvoicesPage(){
  const { data } = useQuery({
    queryKey:["my-invoices"],
    queryFn: async ()=> (await api.get<Invoice[]>("/client/invoices")).data
  });
  const invoices = data ?? [];
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-3">Mis facturas</h1>
      <table className="w-full bg-white rounded-xl shadow text-sm">
        <thead><tr className="text-left text-slate-500">
          <th className="p-3">Mes</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th>
        </tr></thead>
        <tbody>
          {invoices.map(inv=>(
            <tr key={inv.id} className="border-t">
              <td className="p-3">{ym(inv.invoice_year, inv.invoice_month)}</td>
              <td>{money(inv.total_due)}</td>
              <td>{money(inv.amount_paid)}</td>
              <td>{money(inv.balance)}</td>
              <td className="capitalize">{inv.payment_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
