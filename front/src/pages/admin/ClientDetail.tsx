import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import type { Invoice } from '../../types';
import { money, ym } from "../../utils/format";
import UploadArtifact from "../../ui/UploadArtifact";

export default function ClientDetail(){
  const { id } = useParams();
  const { data } = useQuery({
    queryKey:["client-detail", id],
    queryFn: async ()=> (await api.get(`/admin/clients/${id}`)).data
  });

  const invoices: Invoice[] = data?.invoices ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{data?.client?.full_name}</h1>

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-medium">Facturas</h2>
        <table className="w-full text-sm mt-2">
          <thead><tr className="text-left text-slate-500">
            <th>Mes</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th><th>Archivos</th>
          </tr></thead>
          <tbody>
            {invoices.map(inv=>(
              <tr key={inv.id} className="border-t">
                <td className="py-2">{ym(inv.invoice_year, inv.invoice_month)}</td>
                <td>{money(inv.total_due)}</td>
                <td>{money(inv.amount_paid)}</td>
                <td>{money(inv.balance)}</td>
                <td className="capitalize">{inv.payment_status}</td>
                <td><UploadArtifact invoiceId={inv.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
