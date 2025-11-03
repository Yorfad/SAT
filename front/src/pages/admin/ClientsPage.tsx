import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";


export default function ClientsPage(){
  const { data, isLoading, error } = useQuery({
    queryKey:["clients"],
    queryFn: async () => (await api.get('/clients')).data
  });

  if (isLoading) return <div className="p-6">Cargando…</div>
  if (error) return <div className="p-6 text-red-600">Error: {(error as any)?.response?.data?.message || 'algo salió mal'}</div>

    return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Clientes</h1>
      <table className="w-full text-sm">
        <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Estado</th></tr></thead>
        <tbody>
          {data?.map((c: any) => (
            <tr key={c.id} className={c.is_active === 0 ? 'bg-red-50' : ''}>
              <td>{c.id}</td>
              <td>
                <a className="underline" href={`/admin/clients/${c.id}`}>{c.full_name}</a>
              </td>
              <td>{c.email}</td>
              <td>
                {c.is_active === 0 ? (
                  <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    Inactivo
                  </span>
                ) : (
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Activo
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}