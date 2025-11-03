// src/pages/admin/TasksPage.tsx
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'

export default function TasksPage() {
  const navigate = useNavigate()
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      try {
        const response = await api.get('/services/checklist/pending');
        return response.data || [];
      } catch (err: any) {
        console.error('Error fetching tasks:', err);
        throw err;
      }
    }
  })
  
  if (isLoading) return <div className="p-6"><div className="text-slate-300">Cargando…</div></div>

  if (isError) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4 text-slate-100">Tareas pendientes</h1>
        <div className="text-red-300 bg-red-900/30 border border-red-800 p-4 rounded">
          Error al cargar las tareas: {(error as any)?.response?.data?.message || (error as any)?.message || 'Error desconocido'}
        </div>
      </div>
    );
  }

  const tasks = data || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6 text-slate-100">Tareas Pendientes</h1>
      {tasks.length === 0 ? (
        <div className="bg-slate-700 border border-slate-600 p-8 rounded-lg text-center">
          <p className="text-lg mb-2 text-slate-200">No hay tareas pendientes</p>
          <p className="text-sm text-slate-400">Todas las tareas están completadas o no hay tareas registradas.</p>
        </div>
      ) : (
        <div className="bg-slate-700 border border-slate-600 rounded-lg shadow-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-600">
              <tr>
                <th className="p-3 text-left text-slate-300 font-medium">Mes/Año</th>
                <th className="p-3 text-left text-slate-300 font-medium">Cliente</th>
                <th className="p-3 text-left text-slate-300 font-medium">Tarea</th>
                <th className="p-3 text-left text-slate-300 font-medium">Próximo Pago</th>
                <th className="p-3 text-left text-slate-300 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-600">
              {tasks.map((t:any)=>{
                const isOmiso = t.task_name?.toLowerCase().includes('omisos');
                return (
                  <tr
                    key={t.id}
                    className={`cursor-pointer transition-colors ${
                      isOmiso
                        ? 'bg-red-900/20 hover:bg-red-900/30 border-red-800'
                        : 'hover:bg-slate-600'
                    }`}
                    onClick={() => navigate(`/admin/tasks/${t.id}`)}
                  >
                    <td className="p-3 text-slate-200">{t.invoice_month}/{t.invoice_year}</td>
                    <td className="p-3 text-slate-200">{t.client_name}</td>
                    <td className="p-3 text-slate-200">
                      <div className="flex items-center gap-2">
                        {t.task_name}
                        {isOmiso && (
                          <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">
                            OMISO
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-slate-300">
                      {t.activation_range || 'N/A'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${
                        t.status === 'completed' ? 'bg-green-900/30 text-green-400 border-green-800' :
                        t.status === 'todo' ? 'bg-amber-900/30 text-amber-400 border-amber-800' :
                        'bg-slate-600 text-slate-300 border-slate-500'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
