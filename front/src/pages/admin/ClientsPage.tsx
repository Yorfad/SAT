import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import type { Client } from '../../types';
import { Link } from "react-router-dom";

export default function ClientsPage(){
  const { data, isLoading } = useQuery({
    queryKey:["clients"],
    queryFn: async ()=> (await api.get<Client[]>("/admin/clients")).data
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Clientes</h1>
      {isLoading ? "Cargando..." : (
        <table className="w-full bg-white rounded-xl shadow text-sm">
          <thead><tr className="text-left text-slate-500">
            <th className="p-3">Nombre</th><th>NIT</th><th>Email</th><th>Estado</th><th></th>
          </tr></thead>
          <tbody>
            {data?.map(c=>(
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.full_name}</td>
                <td>{c.nit}</td>
                <td>{c.email}</td>
                <td>{c.is_active ? "Activo" : "Inactivo"}</td>
                <td><Link className="text-brand" to={`/admin/clients/${c.id}`}>Ver</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
