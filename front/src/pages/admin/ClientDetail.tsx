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

  // Bundle modals
  const [showCreateBundleModal, setShowCreateBundleModal] = useState(false);
  const [showEditBundleModal, setShowEditBundleModal] = useState(false);
  const [showManageServicesModal, setShowManageServicesModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [expandedBundles, setExpandedBundles] = useState<Set<number>>(new Set());

  // Infraction modal
  const [showCreateInfractionModal, setShowCreateInfractionModal] = useState(false);
  const [infractionForm, setInfractionForm] = useState({
    reason: "",
    relatedInvoiceId: ""
  });

  // Bundle form state
  const [bundleForm, setBundleForm] = useState({
    name: "",
    description: "",
    totalPrice: "",
    operationalCost: "",
    selectedServiceIds: [] as number[]
  });

  const { data } = useQuery({
    queryKey:["client-detail", id],
    queryFn: async ()=> (await api.get(`/clients/${id}`)).data
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

  // Obtener bundles del cliente
  const { data: bundles = [] } = useQuery({
    queryKey: ["client-bundles", id],
    queryFn: async () => (await api.get(`/bundles/clients/${id}/bundles`)).data,
    enabled: !!id
  });

  // Obtener servicios del cliente para asignar a bundles
  const { data: clientServices = [] } = useQuery({
    queryKey: ["client-services", id],
    queryFn: async () => (await api.get(`/client-services/${id}/services`)).data,
    enabled: !!id
  });

  // Obtener servicios de un bundle específico
  const { data: bundleServices = [] } = useQuery({
    queryKey: ["bundle-services", selectedBundle?.id],
    queryFn: async () => (await api.get(`/bundles/${selectedBundle?.id}/services`)).data,
    enabled: !!selectedBundle?.id
  });

  // Obtener infracciones del cliente
  const { data: infractions = [] } = useQuery({
    queryKey: ["client-infractions", id],
    queryFn: async () => (await api.get(`/infractions?clientId=${id}`)).data,
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

  // Crear bundle
  const createBundleMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post(`/bundles/clients/${id}/bundles`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-bundles", id] });
      queryClient.invalidateQueries({ queryKey: ["client-services", id] });
      setShowCreateBundleModal(false);
      setBundleForm({ name: "", description: "", totalPrice: "", operationalCost: "", selectedServiceIds: [] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Error al crear bundle");
    }
  });

  // Actualizar bundle
  const updateBundleMutation = useMutation({
    mutationFn: async ({ bundleId, data }: { bundleId: number; data: any }) => {
      return await api.patch(`/bundles/${bundleId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-bundles", id] });
      setShowEditBundleModal(false);
      setSelectedBundle(null);
      setBundleForm({ name: "", description: "", totalPrice: "", operationalCost: "", selectedServiceIds: [] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Error al actualizar bundle");
    }
  });

  // Eliminar bundle
  const deleteBundleMutation = useMutation({
    mutationFn: async (bundleId: number) => {
      return await api.delete(`/bundles/${bundleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-bundles", id] });
      queryClient.invalidateQueries({ queryKey: ["client-services", id] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Error al eliminar bundle");
    }
  });

  // Agregar servicio a bundle
  const addServiceToBundleMutation = useMutation({
    mutationFn: async ({ bundleId, serviceId }: { bundleId: number; serviceId: number }) => {
      return await api.post(`/bundles/${bundleId}/add-service`, { serviceId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-bundles", id] });
      queryClient.invalidateQueries({ queryKey: ["client-services", id] });
      queryClient.invalidateQueries({ queryKey: ["bundle-services", selectedBundle?.id] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Error al agregar servicio");
    }
  });

  // Remover servicio de bundle
  const removeServiceFromBundleMutation = useMutation({
    mutationFn: async ({ bundleId, serviceId }: { bundleId: number; serviceId: number }) => {
      return await api.post(`/bundles/${bundleId}/remove-service`, { serviceId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-bundles", id] });
      queryClient.invalidateQueries({ queryKey: ["client-services", id] });
      queryClient.invalidateQueries({ queryKey: ["bundle-services", selectedBundle?.id] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Error al remover servicio");
    }
  });

  // Crear infracción
  const createInfractionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post(`/infractions`, data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["client-infractions", id] });
      queryClient.invalidateQueries({ queryKey: ["client-detail", id] });
      setShowCreateInfractionModal(false);
      setInfractionForm({ reason: "", relatedInvoiceId: "" });

      if (response.data.clientDeactivated) {
        alert("⚠️ " + response.data.message);
      } else {
        alert(response.data.message);
      }
    },
    onError: (err: any) => {
      if (err?.response?.data?.error === 'warning_third_infraction') {
        const confirmed = confirm(err.response.data.message + "\n\n¿Deseas continuar y crear esta infracción?");
        if (confirmed) {
          // Reintentar con confirmación
          createInfractionMutation.mutate({
            clientUserId: parseInt(id!),
            reason: infractionForm.reason,
            relatedInvoiceId: infractionForm.relatedInvoiceId ? parseInt(infractionForm.relatedInvoiceId) : undefined,
            confirmDeactivation: true
          });
        }
      } else {
        alert(err?.response?.data?.message || "Error al crear infracción");
      }
    }
  });

  // Resolver infracción (ahora desactivar)
  const resolveInfractionMutation = useMutation({
    mutationFn: async ({ infractionId, notes }: { infractionId: number; notes?: string }) => {
      return await api.patch(`/infractions/${infractionId}/resolve`, { resolutionNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-infractions", id] });
      queryClient.invalidateQueries({ queryKey: ["client-detail", id] });
      alert("Infracción desactivada correctamente");
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Error al desactivar infracción");
    }
  });

  const handleDeactivate = () => {
    if (deactivationReason.trim().length < 5) {
      setError("El motivo debe tener al menos 5 caracteres");
      return;
    }
    deactivateMutation.mutate(deactivationReason);
  };

  const handleCreateBundle = () => {
    if (!bundleForm.name || !bundleForm.totalPrice) {
      alert("Por favor completa el nombre y precio del bundle");
      return;
    }

    createBundleMutation.mutate({
      name: bundleForm.name,
      description: bundleForm.description || undefined,
      totalPrice: parseFloat(bundleForm.totalPrice),
      operationalCost: bundleForm.operationalCost ? parseFloat(bundleForm.operationalCost) : 0,
      serviceIds: bundleForm.selectedServiceIds.length > 0 ? bundleForm.selectedServiceIds : undefined
    });
  };

  const handleEditBundle = () => {
    if (!bundleForm.name || !bundleForm.totalPrice) {
      alert("Por favor completa el nombre y precio del bundle");
      return;
    }

    updateBundleMutation.mutate({
      bundleId: selectedBundle.id,
      data: {
        name: bundleForm.name,
        description: bundleForm.description || undefined,
        totalPrice: parseFloat(bundleForm.totalPrice),
        operationalCost: bundleForm.operationalCost ? parseFloat(bundleForm.operationalCost) : 0
      }
    });
  };

  const openEditBundleModal = (bundle: any) => {
    setSelectedBundle(bundle);
    setBundleForm({
      name: bundle.name,
      description: bundle.description || "",
      totalPrice: bundle.total_price.toString(),
      operationalCost: bundle.operational_cost?.toString() || "0",
      selectedServiceIds: []
    });
    setShowEditBundleModal(true);
  };

  const openManageServicesModal = (bundle: any) => {
    setSelectedBundle(bundle);
    setShowManageServicesModal(true);
  };

  const toggleBundleExpansion = (bundleId: number) => {
    const newExpanded = new Set(expandedBundles);
    if (newExpanded.has(bundleId)) {
      newExpanded.delete(bundleId);
    } else {
      newExpanded.add(bundleId);
    }
    setExpandedBundles(newExpanded);
  };

  const handleCreateInfraction = () => {
    if (!infractionForm.reason.trim()) {
      alert("Por favor ingresa el motivo de la infracción");
      return;
    }

    createInfractionMutation.mutate({
      clientUserId: parseInt(id!),
      reason: infractionForm.reason,
      relatedInvoiceId: infractionForm.relatedInvoiceId ? parseInt(infractionForm.relatedInvoiceId) : undefined
    });
  };

  const invoices: Invoice[] = data?.invoices ?? [];
  const client = data?.client;
  const isActive = client?.is_active !== 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">{client?.full_name}</h1>

        {client && (
          <div className="flex items-center gap-3">
            {!isActive && (
              <div className="flex flex-col items-end">
                <span className="inline-block px-3 py-1 bg-red-900/50 text-red-300 text-sm font-medium rounded-full border border-red-700">
                  Cliente Desactivado
                </span>
                {client.deactivation_reason && (
                  <span className="text-xs text-slate-400 mt-1">
                    Motivo: {client.deactivation_reason}
                  </span>
                )}
                {client.deactivated_at && (
                  <span className="text-xs text-slate-400">
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
        <div className="bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h3 className="font-semibold text-yellow-300">Observación Importante</h3>
              </div>
              <p className="text-sm text-yellow-100 mt-2">{primaryObservation.observation_text}</p>
              <p className="text-xs text-yellow-400 mt-2">
                Por {primaryObservation.created_by_name} • {new Date(primaryObservation.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl shadow p-4 border border-slate-700">
        <h2 className="font-medium text-white">Facturas</h2>
        <table className="w-full text-sm mt-2">
          <thead><tr className="text-left text-slate-400">
            <th>Mes</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th><th>Archivos</th>
          </tr></thead>
          <tbody>
            {invoices.map(inv=>(
              <tr key={inv.id} className="border-t border-slate-700 text-slate-300">
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

      {/* Bundles */}
      <div className="bg-slate-800 rounded-xl shadow p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-white">Paquetes de Servicios (Bundles)</h2>
          <button
            onClick={() => {
              setBundleForm({ name: "", description: "", totalPrice: "", operationalCost: "", selectedServiceIds: [] });
              setShowCreateBundleModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all"
          >
            + Crear Bundle
          </button>
        </div>

        {bundles.length === 0 ? (
          <p className="text-sm text-slate-400">No hay bundles registrados para este cliente.</p>
        ) : (
          <div className="space-y-2">
            {bundles.map((bundle: any) => (
              <div key={bundle.id} className="border border-slate-700 rounded-lg overflow-hidden">
                <div className="bg-slate-900/50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleBundleExpansion(bundle.id)}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <svg
                            className={`w-5 h-5 transition-transform ${expandedBundles.has(bundle.id) ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div>
                          <h3 className="font-medium text-white">{bundle.name}</h3>
                          {bundle.description && (
                            <p className="text-sm text-slate-400 mt-1">{bundle.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Precio: <span className="text-white font-medium">{money(bundle.total_price)}</span></p>
                        <p className="text-sm text-slate-400">Gasto: <span className="text-red-400 font-medium">{money(bundle.operational_cost || 0)}</span></p>
                        <p className="text-sm text-slate-400">Ganancia: <span className="text-green-400 font-medium">{money((bundle.total_price || 0) - (bundle.operational_cost || 0))}</span></p>
                        <p className="text-xs text-slate-500 mt-1">{bundle.services_count} servicios</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openManageServicesModal(bundle)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          title="Gestionar servicios"
                        >
                          Servicios
                        </button>
                        <button
                          onClick={() => openEditBundleModal(bundle)}
                          className="px-3 py-1 bg-slate-700 text-white text-sm rounded hover:bg-slate-600 transition-colors"
                          title="Editar bundle"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar el bundle "${bundle.name}"? Los servicios se desvincularan pero no se eliminaran.`)) {
                              deleteBundleMutation.mutate(bundle.id);
                            }
                          }}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          title="Eliminar bundle"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {expandedBundles.has(bundle.id) && (
                  <div className="p-3 bg-slate-900/30 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Servicios incluidos en este bundle:</p>
                    {/* This will be populated when we query bundle services */}
                    <div className="text-sm text-slate-300">
                      <p className="text-slate-500">Cargando servicios...</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observaciones */}
      <div className="bg-slate-800 rounded-xl shadow p-4 border border-slate-700">
        <h2 className="font-medium mb-4 text-white">Observaciones del Cliente</h2>

        {observations.length === 0 ? (
          <p className="text-sm text-slate-400">No hay observaciones registradas para este cliente.</p>
        ) : (
          <div className="space-y-3">
            {observations.map((obs: any) => (
              <div
                key={obs.id}
                className={`border rounded-lg p-3 ${
                  obs.is_primary ? 'border-yellow-500 bg-yellow-900/20' : 'border-slate-700 bg-slate-900/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {obs.is_primary && (
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                      <span className="text-xs font-medium text-slate-400">
                        {obs.task_name} • {obs.invoice_month}/{obs.invoice_year}
                      </span>
                      {obs.rating !== null && (
                        <span className="text-yellow-400 text-sm">
                          {"★".repeat(obs.rating)}{"☆".repeat(5 - obs.rating)}
                        </span>
                      )}
                    </div>

                    {obs.observation_text && (
                      <p className="text-sm text-slate-200 mt-1">{obs.observation_text}</p>
                    )}

                    <p className="text-xs text-slate-400 mt-2">
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
                      className="text-slate-400 hover:text-yellow-400 transition-colors"
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
                      className="text-slate-400 hover:text-red-400 transition-colors"
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

      {/* Infracciones */}
      <div className="bg-slate-800 rounded-xl shadow p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-white">Infracciones</h2>
          <button
            onClick={() => {
              setInfractionForm({ reason: "", relatedInvoiceId: "" });
              setShowCreateInfractionModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all"
          >
            + Agregar Infracción
          </button>
        </div>

        {infractions.length === 0 ? (
          <p className="text-sm text-slate-400">No hay infracciones registradas para este cliente.</p>
        ) : (
          <div className="space-y-2">
            {infractions.map((infraction: any) => (
              <div
                key={infraction.id}
                className={`border rounded-lg p-3 ${
                  infraction.is_active
                    ? 'border-red-700 bg-red-900/20'
                    : 'border-slate-700 bg-slate-900/30 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        infraction.is_active
                          ? 'bg-red-900/50 text-red-300 border border-red-700'
                          : 'bg-gray-700 text-gray-300 border border-gray-600'
                      }`}>
                        {infraction.is_active ? 'ACTIVA' : 'DESACTIVADA'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {infraction.infraction_type === 'automatic_unpaid' ? 'Automática (impago)' : 'Manual'}
                      </span>
                      {infraction.invoice_month && infraction.invoice_year && (
                        <span className="text-xs text-slate-400">
                          • {infraction.invoice_month}/{infraction.invoice_year}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-200 mt-2">{infraction.reason}</p>

                    <p className="text-xs text-slate-400 mt-2">
                      Creada por {infraction.created_by_name} • {new Date(infraction.created_at).toLocaleDateString()}
                    </p>

                    {!infraction.is_active && infraction.resolved_at && (
                      <p className="text-xs text-green-400 mt-1">
                        Resuelta por {infraction.resolved_by_name} • {new Date(infraction.resolved_at).toLocaleDateString()}
                        {infraction.resolution_notes && ` • ${infraction.resolution_notes}`}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {infraction.is_active && (
                      <button
                        onClick={() => {
                          const notes = prompt("Notas de resolución (opcional):");
                          if (notes !== null) {
                            resolveInfractionMutation.mutate({
                              infractionId: infraction.id,
                              notes: notes || "Desactivada por administrador"
                            });
                          }
                        }}
                        className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                        title="Desactivar infracción"
                      >
                        Desactivar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Desactivación */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 text-white">Desactivar Cliente</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Motivo de desactivación (mínimo 5 caracteres)
              </label>
              <textarea
                value={deactivationReason}
                onChange={(e) => {
                  setDeactivationReason(e.target.value);
                  setError("");
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                rows={4}
                placeholder="Ej: Cliente no ha pagado en tres meses"
              />
              {error && (
                <p className="text-red-400 text-sm mt-1">{error}</p>
              )}
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-300">
                <strong>Advertencia:</strong> Al desactivar este cliente:
              </p>
              <ul className="text-sm text-yellow-200 mt-2 list-disc list-inside space-y-1">
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
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
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

      {/* Modal Crear Bundle */}
      {showCreateBundleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-white">Crear Nuevo Bundle</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre del Bundle
                </label>
                <input
                  type="text"
                  value={bundleForm.name}
                  onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  placeholder="Ej: Paquete Mensual Completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={bundleForm.description}
                  onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  rows={3}
                  placeholder="Descripción del bundle..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Precio Total (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bundleForm.totalPrice}
                  onChange={(e) => setBundleForm({ ...bundleForm, totalPrice: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Gasto Operativo (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bundleForm.operationalCost}
                  onChange={(e) => setBundleForm({ ...bundleForm, operationalCost: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Ganancia: Q{(parseFloat(bundleForm.totalPrice || "0") - parseFloat(bundleForm.operationalCost || "0")).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Servicios a incluir (opcional)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto bg-slate-900 rounded-lg p-3 border border-slate-700">
                  {clientServices.filter((s: any) => !s.bundle_id).map((service: any) => (
                    <label key={service.id} className="flex items-center gap-2 text-slate-300 hover:bg-slate-800 p-2 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bundleForm.selectedServiceIds.includes(service.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBundleForm({
                              ...bundleForm,
                              selectedServiceIds: [...bundleForm.selectedServiceIds, service.id]
                            });
                          } else {
                            setBundleForm({
                              ...bundleForm,
                              selectedServiceIds: bundleForm.selectedServiceIds.filter(id => id !== service.id)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="flex-1">{service.service_name}</span>
                      <span className="text-slate-400">{money(service.price)}</span>
                    </label>
                  ))}
                  {clientServices.filter((s: any) => !s.bundle_id).length === 0 && (
                    <p className="text-slate-500 text-sm">No hay servicios disponibles sin bundle</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateBundleModal(false);
                  setBundleForm({ name: "", description: "", totalPrice: "", operationalCost: "", selectedServiceIds: [] });
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateBundle}
                disabled={createBundleMutation.isPending}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all disabled:opacity-50"
              >
                {createBundleMutation.isPending ? "Creando..." : "Crear Bundle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Bundle */}
      {showEditBundleModal && selectedBundle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 text-white">Editar Bundle</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre del Bundle
                </label>
                <input
                  type="text"
                  value={bundleForm.name}
                  onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={bundleForm.description}
                  onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Precio Total (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bundleForm.totalPrice}
                  onChange={(e) => setBundleForm({ ...bundleForm, totalPrice: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Gasto Operativo (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bundleForm.operationalCost}
                  onChange={(e) => setBundleForm({ ...bundleForm, operationalCost: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Ganancia: Q{(parseFloat(bundleForm.totalPrice || "0") - parseFloat(bundleForm.operationalCost || "0")).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditBundleModal(false);
                  setSelectedBundle(null);
                  setBundleForm({ name: "", description: "", totalPrice: "", operationalCost: "", selectedServiceIds: [] });
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditBundle}
                disabled={updateBundleMutation.isPending}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all disabled:opacity-50"
              >
                {updateBundleMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestionar Servicios */}
      {showManageServicesModal && selectedBundle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-3xl border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Gestionar Servicios - {selectedBundle.name}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Servicios en el bundle */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Servicios en este bundle</h3>
                <div className="space-y-2 bg-slate-900 rounded-lg p-3 border border-slate-700 max-h-96 overflow-y-auto">
                  {bundleServices.length === 0 ? (
                    <p className="text-slate-500 text-sm">No hay servicios en este bundle</p>
                  ) : (
                    bundleServices.map((service: any) => (
                      <div key={service.id} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                        <div className="flex-1">
                          <p className="text-slate-200 text-sm">{service.service_name}</p>
                          <p className="text-slate-400 text-xs">{money(service.price)}</p>
                        </div>
                        <button
                          onClick={() => {
                            removeServiceFromBundleMutation.mutate({
                              bundleId: selectedBundle.id,
                              serviceId: service.id
                            });
                          }}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                          Quitar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Servicios disponibles */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Servicios disponibles</h3>
                <div className="space-y-2 bg-slate-900 rounded-lg p-3 border border-slate-700 max-h-96 overflow-y-auto">
                  {clientServices.filter((s: any) => !s.bundle_id || s.bundle_id === selectedBundle.id).length === 0 ? (
                    <p className="text-slate-500 text-sm">No hay servicios disponibles</p>
                  ) : (
                    clientServices
                      .filter((s: any) => !s.bundle_id)
                      .map((service: any) => (
                        <div key={service.id} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                          <div className="flex-1">
                            <p className="text-slate-200 text-sm">{service.service_name}</p>
                            <p className="text-slate-400 text-xs">{money(service.price)}</p>
                          </div>
                          <button
                            onClick={() => {
                              addServiceToBundleMutation.mutate({
                                bundleId: selectedBundle.id,
                                serviceId: service.id
                              });
                            }}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            Agregar
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowManageServicesModal(false);
                  setSelectedBundle(null);
                }}
                className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Infracción */}
      {showCreateInfractionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 text-white">Agregar Infracción</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Motivo de la Infracción
                </label>
                <textarea
                  value={infractionForm.reason}
                  onChange={(e) => setInfractionForm({ ...infractionForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                  rows={4}
                  placeholder="Ej: Cliente no ha pagado facturas de los últimos 3 meses"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Factura Relacionada (opcional)
                </label>
                <select
                  value={infractionForm.relatedInvoiceId}
                  onChange={(e) => setInfractionForm({ ...infractionForm, relatedInvoiceId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white"
                >
                  <option value="">Sin factura relacionada</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_month}/{inv.invoice_year} - {money(inv.total_due)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateInfractionModal(false);
                  setInfractionForm({ reason: "", relatedInvoiceId: "" });
                }}
                className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateInfraction}
                disabled={createInfractionMutation.isPending}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all disabled:opacity-50"
              >
                {createInfractionMutation.isPending ? "Creando..." : "Crear Infracción"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
