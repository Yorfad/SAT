import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import api from "../../lib/api";
import { money } from "../../utils/format";

type ViewMode = 'services' | 'months' | 'detail';

interface Service {
  id: number;
  service_id: number;
  service_name: string;
  description: string;
  price: number;
  status: string;
}

interface Task {
  id: number;
  task_name: string;
  status: string;
  file_path: string | null;
  client_approved: boolean | null;
  client_approved_at: string | null;
  client_rejection_reason: string | null;
  completion_date: string | null;
  files_uploaded_at: string | null;
  service_id: number;
  invoice_month: number;
  invoice_year: number;
  invoice_id: number;
  service_name: string;
  service_description: string;
}

interface MonthData {
  month: number;
  year: number;
  label: string;
  tasks: Task[];
  hasCompletedTasks: boolean;
  hasFiles: boolean;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('services');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);

  // Modals
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [error, setError] = useState("");

  // Obtener datos del cliente con historial
  const { data: historyData, isLoading } = useQuery({
    queryKey: ["client-history", id],
    queryFn: async () => (await api.get(`/clients/${id}/history`)).data,
    enabled: !!id
  });

  // Obtener datos completos del cliente (para deactivation info, etc)
  const { data: clientData } = useQuery({
    queryKey: ["client-detail", id],
    queryFn: async () => (await api.get(`/clients/${id}`)).data,
    enabled: !!id
  });

  const client = historyData?.client || clientData?.client;
  const services: Service[] = historyData?.services || [];
  const allTasks: Task[] = historyData?.tasks || [];
  const isActive = client?.is_active !== 0;

  // Generar los 12 meses hacia atrás
  const last12Months = useMemo(() => {
    const months: { month: number; year: number; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
      });
    }
    return months;
  }, []);

  // Filtrar tareas por servicio seleccionado y organizar por mes
  const monthsWithTasks = useMemo(() => {
    if (!selectedService) return [];

    return last12Months.map(m => {
      const monthTasks = allTasks.filter(
        t => t.service_id === selectedService.service_id &&
          t.invoice_month === m.month &&
          t.invoice_year === m.year
      );

      return {
        ...m,
        tasks: monthTasks,
        hasCompletedTasks: monthTasks.some(t => t.status === 'completed'),
        hasFiles: monthTasks.some(t => t.file_path)
      };
    });
  }, [selectedService, allTasks, last12Months]);

  // Mutations
  const deactivateMutation = useMutation({
    mutationFn: async (reason: string) => {
      return await api.post(`/clients/${id}/deactivate`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-history", id] });
      queryClient.invalidateQueries({ queryKey: ["client-detail", id] });
      setShowDeactivateModal(false);
      setDeactivationReason("");
      setError("");
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || "Error al desactivar cliente");
    }
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      return await api.post(`/clients/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-history", id] });
      queryClient.invalidateQueries({ queryKey: ["client-detail", id] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Error al activar cliente");
    }
  });

  const handleDeactivate = () => {
    if (deactivationReason.trim().length < 5) {
      setError("El motivo debe tener al menos 5 caracteres");
      return;
    }
    deactivateMutation.mutate(deactivationReason);
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setViewMode('months');
  };

  const handleMonthClick = (monthData: MonthData) => {
    setSelectedMonth(monthData);
    setViewMode('detail');
  };

  const handleBack = () => {
    if (viewMode === 'detail') {
      setViewMode('months');
      setSelectedMonth(null);
    } else if (viewMode === 'months') {
      setViewMode('services');
      setSelectedService(null);
    } else {
      navigate('/admin/clients');
    }
  };

  const handleDownload = async (filePath: string, taskName: string) => {
    try {
      const response = await api.get(`/files/${filePath}`, { responseType: 'blob' });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center">
        <div className="text-slate-300 flex items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Cargando...
        </div>
      </div>
    );
  }

  // Vista de servicios (principal)
  if (viewMode === 'services') {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/clients')}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-white">{client?.full_name}</h1>
              <p className="text-sm text-slate-400">Servicios contratados</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isActive && (
              <div className="flex flex-col items-end">
                <span className="inline-block px-3 py-1 bg-red-900/50 text-red-300 text-sm font-medium rounded-full border border-red-700">
                  Cliente Desactivado
                </span>
                {clientData?.client?.deactivation_reason && (
                  <span className="text-xs text-slate-400 mt-1">
                    Motivo: {clientData.client.deactivation_reason}
                  </span>
                )}
              </div>
            )}

            {isActive ? (
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Desactivar
              </button>
            ) : (
              <button
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {activateMutation.isPending ? "Activando..." : "Reactivar"}
              </button>
            )}
          </div>
        </div>

        {/* Lista de servicios */}
        <div className="space-y-3">
          {services.length === 0 ? (
            <div className="bg-slate-900 rounded-xl border border-slate-700 p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-slate-400">No hay servicios activos</p>
            </div>
          ) : (
            services.map(service => {
              // Contar tareas completadas de este servicio
              const serviceTasks = allTasks.filter(t => t.service_id === service.service_id);
              const completedTasks = serviceTasks.filter(t => t.status === 'completed').length;
              const pendingTasks = serviceTasks.filter(t => t.status === 'pending').length;

              return (
                <button
                  key={service.id}
                  onClick={() => handleServiceClick(service)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-center justify-between hover:border-orange-600 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-900/30 rounded-lg">
                      <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{service.service_name}</p>
                      {service.description && (
                        <p className="text-sm text-slate-400 mt-1">{service.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-slate-500">{money(service.price)}/mes</span>
                        {completedTasks > 0 && (
                          <span className="text-green-400">{completedTasks} completadas</span>
                        )}
                        {pendingTasks > 0 && (
                          <span className="text-yellow-400">{pendingTasks} pendientes</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })
          )}
        </div>

        {/* Modal de desactivación */}
        {showDeactivateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 text-white">Desactivar Cliente</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Motivo de desactivación
                </label>
                <textarea
                  value={deactivationReason}
                  onChange={(e) => {
                    setDeactivationReason(e.target.value);
                    setError("");
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  rows={4}
                  placeholder="Ingresa el motivo..."
                />
                {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setDeactivationReason("");
                    setError("");
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeactivate}
                  disabled={deactivateMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deactivateMutation.isPending ? "Desactivando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista de meses
  if (viewMode === 'months' && selectedService) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white">{selectedService.service_name}</h1>
            <p className="text-sm text-slate-400">{client?.full_name}</p>
          </div>
        </div>

        {/* Lista de meses */}
        <div className="space-y-3">
          {monthsWithTasks.map((monthData) => (
            <button
              key={`${monthData.year}-${monthData.month}`}
              onClick={() => handleMonthClick(monthData)}
              className={`w-full bg-slate-900 border rounded-xl p-4 flex items-center justify-between transition-colors text-left ${
                monthData.hasCompletedTasks
                  ? 'border-green-800/50 hover:border-green-600'
                  : monthData.tasks.length > 0
                    ? 'border-yellow-800/50 hover:border-yellow-600'
                    : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  monthData.hasCompletedTasks
                    ? 'bg-green-900/30'
                    : monthData.tasks.length > 0
                      ? 'bg-yellow-900/30'
                      : 'bg-slate-800'
                }`}>
                  <svg className={`w-6 h-6 ${
                    monthData.hasCompletedTasks
                      ? 'text-green-400'
                      : monthData.tasks.length > 0
                        ? 'text-yellow-400'
                        : 'text-slate-500'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-200">{monthData.label}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    {monthData.tasks.length === 0 ? (
                      <span className="text-slate-500">Sin tareas</span>
                    ) : (
                      <>
                        <span className={monthData.hasCompletedTasks ? 'text-green-400' : 'text-yellow-400'}>
                          {monthData.tasks.filter(t => t.status === 'completed').length} completadas
                        </span>
                        {monthData.hasFiles && (
                          <span className="text-blue-400 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            Archivos
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Vista de detalle del mes
  if (viewMode === 'detail' && selectedMonth && selectedService) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-white">{selectedMonth.label}</h1>
            <p className="text-sm text-slate-400">{selectedService.service_name} - {client?.full_name}</p>
          </div>
        </div>

        {/* Tareas del mes */}
        {selectedMonth.tasks.length === 0 ? (
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-400">No hay tareas para este mes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedMonth.tasks.map(task => (
              <div
                key={task.id}
                className={`bg-slate-900 rounded-xl border p-4 ${
                  task.status === 'completed'
                    ? task.client_approved === true
                      ? 'border-green-800/50'
                      : task.client_approved === false
                        ? 'border-red-800/50'
                        : 'border-blue-800/50'
                    : 'border-yellow-800/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-slate-200">{task.task_name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.status === 'completed'
                          ? task.client_approved === true
                            ? 'bg-green-900/50 text-green-300 border border-green-800'
                            : task.client_approved === false
                              ? 'bg-red-900/50 text-red-300 border border-red-800'
                              : 'bg-blue-900/50 text-blue-300 border border-blue-800'
                          : 'bg-yellow-900/50 text-yellow-300 border border-yellow-800'
                      }`}>
                        {task.status === 'completed'
                          ? task.client_approved === true
                            ? 'Aprobado'
                            : task.client_approved === false
                              ? 'Rechazado'
                              : 'Completado'
                          : 'Pendiente'
                        }
                      </span>
                    </div>

                    {task.completion_date && (
                      <p className="text-xs text-slate-400">
                        Completado: {new Date(task.completion_date).toLocaleDateString('es-GT', {
                          day: '2-digit', month: 'long', year: 'numeric'
                        })}
                      </p>
                    )}

                    {task.client_rejection_reason && (
                      <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded text-sm text-red-300">
                        <span className="font-medium">Motivo de rechazo:</span> {task.client_rejection_reason}
                      </div>
                    )}
                  </div>

                  {task.file_path && (
                    <div className="flex gap-2">
                      <a
                        href={`${api.defaults.baseURL}/files/${task.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="Ver archivo"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      <button
                        onClick={() => handleDownload(task.file_path!, task.task_name)}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        title="Descargar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
