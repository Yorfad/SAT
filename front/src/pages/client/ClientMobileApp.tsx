import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";

interface Task {
  id: number;
  task_name: string;
  status: string;
  file_path: string | null;
  client_approved: boolean | null;
  client_approved_at: string | null;
  client_rejection_reason: string | null;
  service_name?: string;
}

interface Service {
  id: number;
  service_name: string;
  description: string;
  default_price: number;
  custom_price: number | null;
}

type ViewType = 'services' | 'task-detail' | 'request-service' | 'menu';

export default function ClientMobileApp() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState<ViewType>('services');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Obtener datos del usuario
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  // Obtener tareas del cliente
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["client-tasks"],
    queryFn: async () => (await api.get("/clients/my-tasks")).data
  });

  // Obtener servicios disponibles para solicitar
  const { data: availableServicesData } = useQuery({
    queryKey: ["available-services"],
    queryFn: async () => (await api.get("/clients/available-services")).data,
    enabled: currentView === 'request-service'
  });
  const availableServices = availableServicesData?.services ?? [];

  // Mutación para aprobar tarea
  const approveMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return api.post(`/clients/tasks/${taskId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-tasks"] });
      setSelectedTask(null);
      setCurrentView('services');
    }
  });

  // Mutación para rechazar tarea
  const rejectMutation = useMutation({
    mutationFn: async ({ taskId, reason }: { taskId: number; reason: string }) => {
      return api.post(`/clients/tasks/${taskId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-tasks"] });
      setSelectedTask(null);
      setCurrentView('services');
      setShowRejectModal(false);
      setRejectionReason("");
    }
  });

  // Mutación para solicitar servicio
  const requestServiceMutation = useMutation({
    mutationFn: async (data: { service_id?: number; description: string }) => {
      return api.post("/clients/request-service", data);
    },
    onSuccess: () => {
      setCurrentView('services');
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tenant");
    navigate("/client/login");
  };

  const tasks: Task[] = tasksData?.tasks ?? [];
  const pendingTasks = tasks.filter(t => t.status === 'completed' && t.client_approved === null);
  const approvedTasks = tasks.filter(t => t.client_approved === true);
  const pendingWorkTasks = tasks.filter(t => t.status === 'pending');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
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

  // Vista de detalle de tarea
  if (currentView === 'task-detail' && selectedTask) {
    return (
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setCurrentView('services'); setSelectedTask(null); }}
              className="p-2 text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-slate-100">{selectedTask.task_name}</h1>
          </div>
        </header>

        <main className="p-4 space-y-4">
          {/* Archivo adjunto */}
          {selectedTask.file_path ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Archivo adjunto</h3>
              <div className="bg-slate-900 rounded-lg p-4 flex items-center gap-3">
                <div className="p-3 bg-blue-900/30 rounded-lg">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-slate-200 font-medium">Documento</p>
                  <p className="text-xs text-slate-400">Toca para ver</p>
                </div>
                <a
                  href={`${api.defaults.baseURL}/files/${selectedTask.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-600 rounded-lg text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center">
              <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-400">Trabajo en proceso</p>
              <p className="text-xs text-slate-500 mt-1">Aún no se han subido archivos</p>
            </div>
          )}

          {/* Botones de acción */}
          {selectedTask.status === 'completed' && selectedTask.client_approved === null && (
            <div className="space-y-3">
              <button
                onClick={() => approveMutation.mutate(selectedTask.id)}
                disabled={approveMutation.isPending}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Aprobar Trabajo
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="w-full py-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold rounded-xl border border-red-800 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Reportar Problema
              </button>
            </div>
          )}

          {/* Estado de aprobación */}
          {selectedTask.client_approved === true && (
            <div className="bg-green-900/30 border border-green-800 rounded-xl p-4 flex items-center gap-3">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-300">Trabajo aprobado</span>
            </div>
          )}

          {selectedTask.client_approved === false && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-300">Problema reportado</span>
              </div>
              {selectedTask.client_rejection_reason && (
                <p className="text-sm text-red-200/70 ml-9">{selectedTask.client_rejection_reason}</p>
              )}
            </div>
          )}
        </main>

        {/* Modal de rechazo */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/70 flex items-end z-50">
            <div className="bg-slate-800 w-full rounded-t-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Reportar problema</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Describe el problema encontrado..."
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 h-32"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectionReason(""); }}
                  className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => rejectMutation.mutate({ taskId: selectedTask.id, reason: rejectionReason })}
                  disabled={!rejectionReason.trim() || rejectMutation.isPending}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista de solicitar servicio
  if (currentView === 'request-service') {
    return (
      <div className="min-h-screen bg-slate-900">
        <header className="bg-slate-800 border-b border-slate-700 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('menu')}
              className="p-2 text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-slate-100">Solicitar Servicio</h1>
          </div>
        </header>

        <main className="p-4 space-y-4">
          <p className="text-slate-400 text-sm">Selecciona un servicio o describe lo que necesitas</p>

          {availableServices?.map((service: Service) => (
            <button
              key={service.id}
              onClick={() => requestServiceMutation.mutate({ service_id: service.id, description: '' })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-left hover:border-orange-600 transition-colors"
            >
              <p className="font-medium text-slate-200">{service.service_name}</p>
              {service.description && (
                <p className="text-sm text-slate-400 mt-1">{service.description}</p>
              )}
            </button>
          ))}
        </main>
      </div>
    );
  }

  // Vista de menú
  if (currentView === 'menu') {
    return (
      <div className="min-h-screen bg-slate-900">
        <header className="bg-slate-800 border-b border-slate-700 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('services')}
              className="p-2 text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-slate-100">Menú</h1>
          </div>
        </header>

        <main className="p-4 space-y-3">
          <button
            onClick={() => setCurrentView('request-service')}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4 hover:border-orange-600 transition-colors"
          >
            <div className="p-3 bg-orange-900/30 rounded-lg">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-200">Solicitar Servicio</p>
              <p className="text-sm text-slate-400">Pide servicios adicionales</p>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-red-900/20 border border-red-800/50 rounded-xl p-4 flex items-center gap-4 hover:bg-red-900/30 transition-colors"
          >
            <div className="p-3 bg-red-900/30 rounded-lg">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-red-400">Cerrar Sesión</p>
            </div>
          </button>
        </main>
      </div>
    );
  }

  // Vista principal - Lista de servicios/tareas
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.full_name?.charAt(0) || 'C'}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-100">{user?.full_name || 'Cliente'}</h1>
              <p className="text-xs text-slate-400">Mis Servicios</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('menu')}
            className="p-2 text-slate-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Pendientes de aprobación */}
        {pendingTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
              Pendientes de tu revisión ({pendingTasks.length})
            </h2>
            <div className="space-y-2">
              {pendingTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => { setSelectedTask(task); setCurrentView('task-detail'); }}
                  className="w-full bg-slate-800 border border-orange-800/50 rounded-xl p-4 flex items-center justify-between hover:border-orange-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-900/30 rounded-lg">
                      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-200">{task.task_name}</p>
                      <p className="text-xs text-orange-400">Listo para revisar</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* En proceso */}
        {pendingWorkTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-blue-400 mb-3">En proceso ({pendingWorkTasks.length})</h2>
            <div className="space-y-2">
              {pendingWorkTasks.map(task => (
                <div
                  key={task.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="p-2 bg-blue-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">{task.task_name}</p>
                    <p className="text-xs text-slate-400">Trabajando en ello...</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Completados */}
        {approvedTasks.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-green-400 mb-3">Completados ({approvedTasks.length})</h2>
            <div className="space-y-2">
              {approvedTasks.map(task => (
                <div
                  key={task.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3 opacity-70"
                >
                  <div className="p-2 bg-green-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">{task.task_name}</p>
                    <p className="text-xs text-green-400">Aprobado</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sin tareas */}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-slate-400">No tienes servicios activos</p>
            <button
              onClick={() => setCurrentView('menu')}
              className="mt-4 text-orange-400 font-medium"
            >
              Solicitar un servicio
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
