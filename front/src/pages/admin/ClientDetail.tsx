import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "../../lib/api";
import type { Invoice } from '../../types';
import { money, ym } from "../../utils/format";
import UploadArtifact from "../../ui/UploadArtifact";

export default function ClientDetail(){
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [error, setError] = useState("");

  const { data } = useQuery({
    queryKey:["client-detail", id],
    queryFn: async ()=> (await api.get(`/admin/clients/${id}`)).data
  });

  // Obtener observaciones del cliente
  const { data: observations = [] } = useQuery({
    queryKey: ["client-observations", id],
    queryFn: async () => (await api.get(`/observations/clients/${id}/observations`)).data,
    enabled: !!id
  });

  // Obtener observación primordial
  const { data: primaryObservation } = useQuery({
    queryKey: ["primary-observation", id],
    queryFn: async () => (await api.get(`/observations/clients/${id}/primary-observation`)).data,
    enabled: !!id
  });

  const deactivateMutation = useMutation({
    mutationFn: async (reason: string) => {
      return await api.post(`/clients/${id}/deactivate`, { reason });
    },
    onSuccess: () => {
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
      queryClient.invalidateQueries({ queryKey: ["client-detail", id] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Error al activar cliente");
    }
  });

  // Eliminar observación
  const deleteObservationMutation = useMutation({
    mutationFn: async (observationId: number) => {
      return await api.delete(`/observations/${observationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-observations", id] });
      queryClient.invalidateQueries({ queryKey: ["primary-observation", id] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Error al eliminar observación");
    }
  });

  // Marcar como primordial
  const togglePrimaryMutation = useMutation({
    mutationFn: async ({ observationId, isPrimary }: { observationId: number; isPrimary: boolean }) => {
      return await api.patch(`/observations/${observationId}/primary`, { is_primary: isPrimary });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-observations", id] });
      queryClient.invalidateQueries({ queryKey: ["primary-observation", id] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Error al actualizar observación");
    }
  });

  const handleDeactivate = () => {
    if (deactivationReason.trim().length < 5) {
      setError("El motivo debe tener al menos 5 caracteres");
      return;
    }
    deactivateMutation.mutate(deactivationReason);
  };

  const invoices: Invoice[] = data?.invoices ?? [];
  const client = data?.client;
  const isActive = client?.is_active !== 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{client?.full_name}</h1>

        {client && (
          <div className="flex items-center gap-3">
            {!isActive && (
              <div className="flex flex-col items-end">
                <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                  Cliente Desactivado
                </span>
                {client.deactivation_reason && (
                  <span className="text-xs text-gray-500 mt-1">
                    Motivo: {client.deactivation_reason}
                  </span>
                )}
                {client.deactivated_at && (
                  <span className="text-xs text-gray-500">
                    Fecha: {new Date(client.deactivated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}

            {isActive ? (
              <button
                onClick={() => setShowDeactivateModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Desactivar Cliente
              </button>
            ) : (
              <button
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {activateMutation.isPending ? "Activando..." : "Reactivar Cliente"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Observación Primordial */}
      {primaryObservation && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h3 className="font-semibold text-yellow-900">Observación Importante</h3>
              </div>
              <p className="text-sm text-yellow-800 mt-2">{primaryObservation.observation_text}</p>
              <p className="text-xs text-yellow-600 mt-2">
                Por {primaryObservation.created_by_name} • {new Date(primaryObservation.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Observaciones */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-medium mb-4">Observaciones del Cliente</h2>

        {observations.length === 0 ? (
          <p className="text-sm text-gray-500">No hay observaciones registradas para este cliente.</p>
        ) : (
          <div className="space-y-3">
            {observations.map((obs: any) => (
              <div
                key={obs.id}
                className={`border rounded-lg p-3 ${
                  obs.is_primary ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {obs.is_primary && (
                        <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                      <span className="text-xs font-medium text-gray-500">
                        {obs.task_name} • {obs.invoice_month}/{obs.invoice_year}
                      </span>
                      {obs.rating !== null && (
                        <span className="text-yellow-500 text-sm">
                          {"★".repeat(obs.rating)}{"☆".repeat(5 - obs.rating)}
                        </span>
                      )}
                    </div>

                    {obs.observation_text && (
                      <p className="text-sm text-gray-700 mt-1">{obs.observation_text}</p>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      Por {obs.created_by_name} • {new Date(obs.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() =>
                        togglePrimaryMutation.mutate({
                          observationId: obs.id,
                          isPrimary: !obs.is_primary
                        })
                      }
                      title={obs.is_primary ? "Desmarcar como importante" : "Marcar como importante"}
                      className="text-gray-400 hover:text-yellow-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill={obs.is_primary ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("¿Seguro que quieres eliminar esta observación?")) {
                          deleteObservationMutation.mutate(obs.id);
                        }
                      }}
                      title="Eliminar observación"
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Desactivación */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Desactivar Cliente</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de desactivación (mínimo 5 caracteres)
              </label>
              <textarea
                value={deactivationReason}
                onChange={(e) => {
                  setDeactivationReason(e.target.value);
                  setError("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Ej: Cliente no ha pagado en tres meses"
              />
              {error && (
                <p className="text-red-600 text-sm mt-1">{error}</p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Advertencia:</strong> Al desactivar este cliente:
              </p>
              <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
                <li>No podrá acceder al sistema</li>
                <li>Sus tareas no aparecerán en las listas</li>
                <li>No se generarán nuevas tareas mensuales</li>
                <li>Esta acción es reversible</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivationReason("");
                  setError("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deactivateMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deactivateMutation.isPending ? "Desactivando..." : "Confirmar Desactivación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
