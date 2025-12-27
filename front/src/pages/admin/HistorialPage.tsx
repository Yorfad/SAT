// src/pages/admin/HistorialPage.tsx
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

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

export default function HistorialPage() {
  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  const [debouncedSearch, setDebouncedSearch] = useState('')
  useMemo(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Obtener lista de servicios
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
    params.set('filter', 'completed');
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (serviceFilter) params.set('serviceId', serviceFilter);
    if (monthFilter) params.set('month', monthFilter);
    if (yearFilter) params.set('year', yearFilter);
    return params.toString();
  }, [debouncedSearch, serviceFilter, monthFilter, yearFilter]);

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['historial', queryParams],
    queryFn: async () => {
      const response = await api.get(`/services/checklist/my-tasks?${queryParams}`);
      return response.data || [];
    }
  });

  const handleDownload = async (filePath: string, taskName: string) => {
    try {
      const response = await api.get(`/uploads/${filePath}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filePath.split('/').pop() || `${taskName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando archivo:', err);
      alert('Error al descargar el archivo');
    }
  };

  if (isLoading) return <div className="p-6"><div className="text-slate-300">Cargando historial...</div></div>

  if (isError) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4 text-slate-100">Historial de Tareas</h1>
        <div className="text-red-300 bg-red-900/30 border border-red-800 p-4 rounded">
          Error al cargar el historial: {(error as any)?.message || 'Error desconocido'}
        </div>
      </div>
    );
  }

  const tasks = data || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-slate-100">Historial de Tareas Completadas</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
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

        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {MONTHS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

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

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{tasks.length}</div>
          <div className="text-sm text-slate-400">Tareas completadas</div>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">
            {tasks.filter((t: any) => t.file_path).length}
          </div>
          <div className="text-sm text-slate-400">Con archivo adjunto</div>
        </div>
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-400">
            {new Set(tasks.map((t: any) => t.client_name)).size}
          </div>
          <div className="text-sm text-slate-400">Clientes distintos</div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-slate-700 border border-slate-600 p-8 rounded-lg text-center">
          <p className="text-lg mb-2 text-slate-200">No hay tareas completadas</p>
          <p className="text-sm text-slate-400">Las tareas completadas aparecerán aquí.</p>
        </div>
      ) : (
        <div className="bg-slate-700 border border-slate-600 rounded-lg shadow-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-600">
              <tr>
                <th className="p-3 text-left text-slate-300 font-medium">Período</th>
                <th className="p-3 text-left text-slate-300 font-medium">Cliente</th>
                <th className="p-3 text-left text-slate-300 font-medium">Servicio</th>
                <th className="p-3 text-left text-slate-300 font-medium">Fecha Completado</th>
                <th className="p-3 text-left text-slate-300 font-medium">Archivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-600">
              {tasks.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-600 transition-colors">
                  <td className="p-3 text-slate-200">{t.invoice_month}/{t.invoice_year}</td>
                  <td className="p-3 text-slate-200">{t.client_name}</td>
                  <td className="p-3 text-slate-200">{t.task_name}</td>
                  <td className="p-3 text-slate-300 text-xs">
                    {t.completion_date
                      ? new Date(t.completion_date).toLocaleDateString('es-GT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'
                    }
                  </td>
                  <td className="p-3">
                    {t.file_path ? (
                      <button
                        onClick={() => handleDownload(t.file_path, t.task_name)}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Descargar
                      </button>
                    ) : (
                      <span className="text-slate-500 text-xs">Sin archivo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
