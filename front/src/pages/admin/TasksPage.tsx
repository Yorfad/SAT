// src/pages/admin/TasksPage.tsx
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'

type FilterType = 'all' | 'pending' | 'completed';

const TABS: { id: FilterType; label: string }[] = [
  { id: 'pending', label: 'Pendientes' },
  { id: 'completed', label: 'Completadas' },
  { id: 'all', label: 'Todas' },
];

// Meses para el filtro
const MONTHS = [
  { value: '', label: 'Todos los meses' },
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export default function TasksPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterType>('pending')
  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  // Debounce para búsqueda
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useMemo(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Obtener lista de servicios para el dropdown
  const { data: services } = useQuery({
    queryKey: ['services-list'],
    queryFn: async () => {
      const response = await api.get('/services');
      return response.data || [];
    }
  });

  // Construir query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('filter', filter);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (serviceFilter) params.set('serviceId', serviceFilter);
    if (monthFilter) params.set('month', monthFilter);
    if (yearFilter) params.set('year', yearFilter);
    return params.toString();
  }, [filter, debouncedSearch, serviceFilter, monthFilter, yearFilter]);

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['my-tasks', queryParams],
    queryFn: async () => {
      try {
        const response = await api.get(`/services/checklist/my-tasks?${queryParams}`);
        return response.data || [];
      } catch (err: any) {
        console.error('Error fetching tasks:', err);
        throw err;
      }
    }
  })

  if (isLoading) return <div className="p-6"><div className="text-slate-300">Cargando...</div></div>

  if (isError) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4 text-slate-100">Mis Tareas</h1>
        <div className="text-red-300 bg-red-900/30 border border-red-800 p-4 rounded">
          Error al cargar las tareas: {(error as any)?.response?.data?.message || (error as any)?.message || 'Error desconocido'}
        </div>
      </div>
    );
  }

  const tasks = data || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-slate-100">Mis Tareas</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-800 p-1 rounded-lg w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === tab.id
                ? 'bg-orange-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros avanzados */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Búsqueda por cliente */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              ×
            </button>
          )}
        </div>

        {/* Filtro por servicio */}
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Todos los servicios</option>
          {services?.map((s: any) => (
            <option key={s.id} value={s.id}>{s.service_name}</option>
          ))}
        </select>

        {/* Filtro por mes */}
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {MONTHS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {/* Filtro por año */}
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Todos los años</option>
          {[2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Botón limpiar filtros */}
        {(search || serviceFilter || monthFilter || yearFilter) && (
          <button
            onClick={() => {
              setSearch('');
              setServiceFilter('');
              setMonthFilter('');
              setYearFilter('');
            }}
            className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-slate-300 text-sm transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="bg-slate-700 border border-slate-600 p-8 rounded-lg text-center">
          <p className="text-lg mb-2 text-slate-200">
            {filter === 'pending' ? 'No hay tareas pendientes' :
             filter === 'completed' ? 'No hay tareas completadas' :
             'No hay tareas'}
          </p>
          <p className="text-sm text-slate-400">
            {filter === 'pending' ? 'Todas las tareas están completadas.' :
             filter === 'completed' ? 'Aún no has completado ninguna tarea.' :
             'No hay tareas registradas.'}
          </p>
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
                const isCompleted = t.status === 'completed';
                return (
                  <tr
                    key={t.id}
                    className={`cursor-pointer transition-colors ${
                      isOmiso
                        ? 'bg-red-900/20 hover:bg-red-900/30 border-red-800'
                        : isCompleted
                          ? 'bg-green-900/10 hover:bg-green-900/20'
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
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${
                          t.status === 'completed' ? 'bg-green-900/30 text-green-400 border-green-800' :
                          t.status === 'todo' ? 'bg-amber-900/30 text-amber-400 border-amber-800' :
                          'bg-slate-600 text-slate-300 border-slate-500'
                        }`}>
                          {t.status === 'completed' ? 'Completada' : t.status}
                        </span>
                        {/* Badge de editable */}
                        {isCompleted && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            t.is_editable
                              ? 'bg-orange-900/30 text-orange-400 border border-orange-800'
                              : 'bg-slate-600 text-slate-400 border border-slate-500'
                          }`}>
                            {t.is_editable ? 'Editable' : 'Bloqueada'}
                          </span>
                        )}
                      </div>
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
