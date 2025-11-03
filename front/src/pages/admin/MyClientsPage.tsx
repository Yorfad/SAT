import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";

interface Task {
  task_id: number;
  task_name: string;
  status: "pending" | "completed" | "not_applicable";
  completed_by: number | null;
  completion_date: string | null;
  next_payment_date: string | null;
  activation_range?: string | null;
  omisos_value: boolean;
}

interface ClientWithServices {
  client_id: number;
  client_name: string;
  client_email: string;
  client_nit: string;
  contract_number: string;
  sat_password: string | null; // Ya viene descifrada del backend
  overall_rating: number;
  notes: string | null;
  has_active_omisos: boolean;
  active_omisos_count: number;
  invoice: {
    invoice_id: number;
    payment_status: string;
    total_due: number;
    amount_paid: number;
    balance: number;
    observations: string | null;
    file_count: number;
  } | null;
  services: Task[];
  summary: {
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
  };
}

export default function MyClientsPage() {
  const [expandedClient, setExpandedClient] = useState<number | null>(null);
  const [showSatPassword, setShowSatPassword] = useState<number | null>(null);
  const [showOmisoModal, setShowOmisoModal] = useState<number | null>(null);
  const [omisoFile, setOmisoFile] = useState<File | null>(null);
  const [omisoMotivo, setOmisoMotivo] = useState('');
  const [loadingOmiso, setLoadingOmiso] = useState(false);

  const queryClient = useQueryClient();

  // Mutación para activar omiso
  const activateOmisoMutation = useMutation({
    mutationFn: async ({ clientId, file, motivo }: { clientId: number; file: File; motivo: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('motivo', motivo);
      return api.post(`/my-clients/${clientId}/omisos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-clients'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowOmisoModal(null);
      setOmisoFile(null);
      setOmisoMotivo('');
      alert('Omiso activado exitosamente');
    },
    onError: (error: any) => {
      alert(error?.response?.data?.message || 'Error al activar omiso');
    }
  });

  // Fetch clientes asignados (siempre con tareas del mes actual)
  const { data: clients = [], isLoading, error } = useQuery<ClientWithServices[]>({
    queryKey: ["my-clients"],
    queryFn: async () => {
      const res = await api.get("/my-clients");
      return res.data;
    }
  });

  const toggleClient = (clientId: number) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  const toggleSatPassword = (clientId: number) => {
    setShowSatPassword(showSatPassword === clientId ? null : clientId);
  };

  const handleActivateOmiso = async (e: React.FormEvent, clientId: number) => {
    e.preventDefault();

    if (!omisoFile) {
      alert('Debes subir un archivo');
      return;
    }

    if (!omisoMotivo.trim()) {
      alert('Debes especificar el motivo del omiso');
      return;
    }

    setLoadingOmiso(true);
    try {
      await activateOmisoMutation.mutateAsync({
        clientId,
        file: omisoFile,
        motivo: omisoMotivo
      });
    } finally {
      setLoadingOmiso(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-yellow-900/30 text-yellow-400 border-yellow-800",
      completed: "bg-green-900/30 text-green-400 border-green-800",
      not_applicable: "bg-slate-700 text-slate-400 border-slate-600"
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "Pendiente",
      completed: "Completada",
      not_applicable: "No aplica"
    };
    return labels[status as keyof typeof labels] || "Desconocido";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-300">Cargando clientes asignados...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
          <p className="text-red-300">Error al cargar clientes: {(error as any)?.message}</p>
        </div>
      </div>
    );
  }

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString("es", { month: "long", year: "numeric" });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Mis Clientes Asignados</h1>
        <p className="text-sm text-slate-300 mb-4">
          Mostrando tareas del mes actual: <span className="font-semibold text-orange-400">{currentMonth}</span>
        </p>

        <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-300">
              Total de clientes asignados: <span className="font-semibold text-lg text-orange-400">{clients.length}</span>
            </div>
            <div className="text-sm text-slate-400">
              Estos son tus clientes permanentes. Las tareas se actualizan cada mes automáticamente.
            </div>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      {clients.length === 0 ? (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-8 text-center">
          <p className="text-slate-300">No tienes clientes asignados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clients.map((client) => (
            <div key={client.client_id} className={`bg-slate-700 border rounded-lg overflow-hidden ${
              client.has_active_omisos ? 'border-red-500 shadow-lg shadow-red-900/50' : 'border-slate-600'
            }`}>
              {/* Toggle de Omisos */}
              <div className="p-3 bg-slate-800 border-b border-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-200">¿Omisos?</label>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOmisoModal(client.client_id);
                    }}
                    className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                      client.has_active_omisos
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                    }`}
                  >
                    {client.has_active_omisos ? `Activo (${client.active_omisos_count})` : 'Activar Omiso'}
                  </button>

                  {/* Icono de observación prioritaria */}
                  <PrimaryObservationIcon clientId={client.client_id} />
                </div>
                {client.has_active_omisos && (
                  <span className="text-xs text-red-400 font-medium">
                    Este cliente tiene {client.active_omisos_count} omiso(s) activo(s)
                  </span>
                )}
              </div>

              {/* Header del cliente */}
              <div
                className="p-4 cursor-pointer hover:bg-slate-600 transition-colors"
                onClick={() => toggleClient(client.client_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-slate-100">{client.client_name}</h3>
                      <span className="text-sm text-slate-400">NIT: {client.client_nit}</span>
                      {client.has_active_omisos && (
                        <span className="px-2 py-1 bg-red-900/30 text-red-400 text-xs font-bold rounded border border-red-800">
                          EN OMISOS
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-300 mt-1">{client.client_email}</div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Resumen de tareas */}
                    <div className="text-sm">
                      <span className="text-green-400 font-semibold">{client.summary.completed_tasks}</span>
                      <span className="text-slate-500"> / </span>
                      <span className="text-slate-300">{client.summary.total_tasks}</span>
                      <span className="text-slate-400 ml-1">tareas</span>
                    </div>

                    {/* Estado de factura */}
                    {client.invoice && (
                      <div className="text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          client.invoice.payment_status === 'paid' ? 'bg-green-900/30 text-green-400 border border-green-800' :
                          client.invoice.payment_status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' :
                          'bg-red-900/30 text-red-400 border border-red-800'
                        }`}>
                          {client.invoice.payment_status === 'paid' ? 'Pagado' :
                           client.invoice.payment_status === 'pending' ? 'Pendiente' : 'Vencido'}
                        </span>
                      </div>
                    )}

                    {/* Icono expandir/colapsar */}
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        expandedClient === client.client_id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Detalle expandible */}
              {expandedClient === client.client_id && (
                <div className="border-t border-slate-600 bg-slate-800">
                  {/* Información del cliente */}
                  <div className="p-4 border-b border-slate-600 bg-slate-750">
                    <h4 className="font-medium text-slate-100 mb-3">Información del Cliente</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Contrato:</span>
                        <span className="ml-2 font-medium text-slate-200">{client.contract_number || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Rating:</span>
                        <span className="ml-2 font-medium text-slate-200">{client.overall_rating || "N/A"}</span>
                      </div>
                      {client.sat_password && (
                        <div className="col-span-2">
                          <span className="text-slate-400">Contraseña SAT:</span>
                          <button
                            onClick={() => toggleSatPassword(client.client_id)}
                            className="ml-2 text-orange-400 hover:text-orange-300 underline text-sm"
                          >
                            {showSatPassword === client.client_id ? "Ocultar" : "Mostrar"}
                          </button>
                          {showSatPassword === client.client_id && (
                            <div className="mt-2 p-3 rounded border border-orange-800 bg-orange-900/20">
                              <p className="text-xs text-orange-400 mb-2 font-medium">Contraseña SAT (úsala para entrar al sistema):</p>
                              <div className="font-mono text-sm bg-slate-900 p-2 rounded border border-slate-600 select-all text-slate-200">
                                {client.sat_password}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {client.notes && (
                        <div className="col-span-2">
                          <span className="text-slate-400">Notas:</span>
                          <p className="mt-1 text-slate-200">{client.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tabla de servicios/tareas */}
                  <div className="p-4">
                    <h4 className="font-medium text-slate-100 mb-3">Servicios del Mes Actual</h4>
                    {client.services.length === 0 ? (
                      <p className="text-sm text-slate-400">
                        No hay servicios/tareas registrados para este cliente en el mes actual.
                        <br />
                        <span className="text-xs">Las tareas se crean automáticamente al inicio de cada mes.</span>
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-slate-600">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-900 border-b border-slate-600">
                            <tr>
                              <th className="text-left p-3 font-medium text-slate-300">Servicio</th>
                              <th className="text-left p-3 font-medium text-slate-300">Estado</th>
                              <th className="text-left p-3 font-medium text-slate-300">Completado</th>
                              <th className="text-left p-3 font-medium text-slate-300">Próximo Pago</th>
                              <th className="text-right p-3 font-medium text-slate-300">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-600">
                            {client.services.map((task) => (
                              <tr key={task.task_id} className={`hover:bg-slate-600 transition-colors ${
                                task.task_name.toLowerCase().includes('omisos') ? 'bg-red-900/20' : 'bg-slate-700'
                              }`}>
                                <td className="p-3 font-medium text-slate-200">
                                  {task.task_name}
                                  {task.task_name.toLowerCase().includes('omisos') && (
                                    <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded">
                                      OMISO
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(task.status)}`}>
                                    {getStatusLabel(task.status)}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-300">
                                  {task.completion_date
                                    ? new Date(task.completion_date).toLocaleDateString("es-GT")
                                    : "—"}
                                </td>
                                <td className="p-3 text-slate-300 text-xs">
                                  {task.activation_range || "—"}
                                </td>
                                <td className="p-3 text-right">
                                  <a
                                    href={`/admin/tasks/${task.task_id}`}
                                    className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
                                  >
                                    Ver detalles →
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal para activar omiso */}
      {showOmisoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg shadow-2xl max-w-md w-full mx-4 border border-slate-700">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-slate-100">Activar Omiso</h2>
              <p className="text-sm text-slate-300 mb-4">
                Completa la información para activar un omiso para este cliente.
                Se creará automáticamente una tarea de omiso que debe ser resuelta.
              </p>

              <form onSubmit={(e) => handleActivateOmiso(e, showOmisoModal)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Motivo del omiso *
                  </label>
                  <textarea
                    value={omisoMotivo}
                    onChange={(e) => setOmisoMotivo(e.target.value)}
                    required
                    rows={3}
                    placeholder="Ej: Omiso por no pagar placa de moto"
                    className="w-full bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Describe claramente el motivo del omiso
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Archivo del omiso *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setOmisoFile(e.target.files?.[0] || null)}
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded-lg p-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-orange-600 file:text-white file:cursor-pointer hover:file:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Sube el documento o imagen relacionada con el omiso
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loadingOmiso}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {loadingOmiso ? 'Activando...' : 'Activar Omiso'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOmisoModal(null);
                      setOmisoFile(null);
                      setOmisoMotivo('');
                    }}
                    className="flex-1 px-4 py-2 bg-slate-600 text-slate-200 rounded-lg hover:bg-slate-500 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para mostrar icono de observación prioritaria
function PrimaryObservationIcon({ clientId }: { clientId: number }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const { data: primaryObservation, isError, error } = useQuery({
    queryKey: ['primary-observation', clientId],
    queryFn: async () => {
      console.log(`[PrimaryObs] Fetching primary observation for client ${clientId}`);
      const response = await api.get(`/observations/clients/${clientId}/primary-observation`);
      console.log(`[PrimaryObs] Response for client ${clientId}:`, response.data);
      return response.data;
    },
    enabled: !!clientId
  });

  if (isError) {
    console.error(`[PrimaryObs] Error fetching primary observation for client ${clientId}:`, error);
    return null;
  }

  if (!primaryObservation) {
    console.log(`[PrimaryObs] No primary observation found for client ${clientId}`);
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
        className="flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        title="Observación importante"
      >
        <span className="text-sm font-bold">!</span>
      </button>

      {showTooltip && (
        <>
          {/* Overlay para cerrar al hacer click fuera */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowTooltip(false)}
          />

          {/* Tooltip */}
          <div className="absolute left-0 top-8 z-20 w-80 bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 text-sm mb-1">Observación Importante</h4>
                <p className="text-sm text-yellow-800">{primaryObservation.observation_text}</p>
                <p className="text-xs text-yellow-600 mt-2">
                  Por {primaryObservation.created_by_name} • {new Date(primaryObservation.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
