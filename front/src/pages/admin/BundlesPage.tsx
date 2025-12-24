import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import NumericInput from "../../components/ui/NumericInput";

interface Service {
  id: number;
  service_name: string;
  default_price: string | number;
  recurrence_type: string;
  recurrence_type_extended?: string;
  is_active: number;
}

interface BundleService extends Service {
  include_in_base_price: boolean;
  add_when_due: boolean;
  custom_price: number | null;
  assignment_type: 'all_clients' | 'selected_clients';
  effective_price: string | number;
}

interface Bundle {
  id: number;
  workspace_id: number | null;
  bundle_name: string;
  description: string | null;
  client_description: string | null;
  bundle_price: string | number;
  base_price: string | number;
  billing_type: 'fixed' | 'dynamic';
  is_active: number;
  services_count: number;
  base_services: string;
  extra_services: string;
  created_at: string;
}

interface BundleWithServices extends Bundle {
  services: BundleService[];
  calculated_base_price: number;
}

interface ServiceConfig {
  serviceId: number;
  includeInBasePrice: boolean;
  addWhenDue: boolean;
  customPrice: number | null;
  assignmentType: 'all_clients' | 'selected_clients';
}

// CSS para ocultar spinners de inputs numéricos
const hideSpinnersStyle = `
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

export default function BundlesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingBundle, setEditingBundle] = useState<BundleWithServices | null>(null);

  // Form state
  const [bundleName, setBundleName] = useState("");
  const [description, setDescription] = useState("");
  const [clientDescription, setClientDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [billingType, setBillingType] = useState<'fixed' | 'dynamic'>('dynamic');
  const [isGlobal, setIsGlobal] = useState(false);
  const [serviceConfigs, setServiceConfigs] = useState<ServiceConfig[]>([]);

  // Fetch bundles
  const { data: bundles, isLoading } = useQuery({
    queryKey: ["bundles"],
    queryFn: async () => (await api.get('/bundles')).data as Bundle[]
  });

  // Fetch services for selection
  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get('/services')).data as Service[]
  });

  // Create bundle
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/bundles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
      closeModal();
    }
  });

  // Update bundle
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await api.patch(`/bundles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
      closeModal();
    }
  });

  // Delete bundle
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/bundles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
    }
  });

  // Toggle status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return await api.patch(`/bundles/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
    }
  });

  const openNewModal = () => {
    setEditingBundle(null);
    setBundleName("");
    setDescription("");
    setClientDescription("");
    setBasePrice("");
    setBillingType('dynamic');
    setIsGlobal(false);
    setServiceConfigs([]);
    setShowModal(true);
  };

  const openEditModal = async (bundle: Bundle) => {
    const { data } = await api.get(`/bundles/${bundle.id}`);
    setEditingBundle(data);
    setBundleName(data.bundle_name);
    setDescription(data.description || "");
    setClientDescription(data.client_description || "");
    setBasePrice(String(data.base_price || data.bundle_price || 0));
    setBillingType(data.billing_type || 'dynamic');
    setIsGlobal(data.workspace_id === null);

    // Cargar configuración de servicios
    const configs: ServiceConfig[] = (data.services || []).map((s: BundleService) => ({
      serviceId: s.id,
      includeInBasePrice: s.include_in_base_price,
      addWhenDue: s.add_when_due,
      customPrice: s.custom_price,
      assignmentType: s.assignment_type || 'all_clients'
    }));
    setServiceConfigs(configs);

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBundle(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calcular precio total del bundle
    const totalPrice = serviceConfigs.reduce((sum, cfg) => {
      if (cfg.includeInBasePrice) {
        const svc = services?.find(s => s.id === cfg.serviceId);
        const price = cfg.customPrice ?? parseFloat(String(svc?.default_price || 0));
        return sum + price;
      }
      return sum;
    }, 0);

    const data = {
      bundleName,
      description,
      clientDescription,
      bundlePrice: billingType === 'fixed' ? parseFloat(basePrice) || 0 : totalPrice,
      basePrice: parseFloat(basePrice) || totalPrice,
      billingType,
      services: serviceConfigs,
      isGlobal
    };

    if (editingBundle) {
      updateMutation.mutate({ id: editingBundle.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleService = (serviceId: number) => {
    const exists = serviceConfigs.find(c => c.serviceId === serviceId);
    if (exists) {
      setServiceConfigs(prev => prev.filter(c => c.serviceId !== serviceId));
    } else {
      setServiceConfigs(prev => [...prev, {
        serviceId,
        includeInBasePrice: true,
        addWhenDue: false,
        customPrice: null,
        assignmentType: 'all_clients'
      }]);
    }
  };

  const updateServiceConfig = (serviceId: number, field: keyof ServiceConfig, value: any) => {
    setServiceConfigs(prev => prev.map(cfg =>
      cfg.serviceId === serviceId ? { ...cfg, [field]: value } : cfg
    ));
  };

  const handleDelete = (bundle: Bundle) => {
    if (confirm(`¿Eliminar el bundle "${bundle.bundle_name}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(bundle.id);
    }
  };

  const getRecurrenceLabel = (type: string) => {
    const labels: Record<string, string> = {
      monthly: "Mensual",
      annual: "Anual",
      one_time: "Único",
      custom: "Variable"
    };
    return labels[type] || type;
  };

  // Calcular precio dinámico
  const calculatedPrice = serviceConfigs.reduce((sum, cfg) => {
    if (cfg.includeInBasePrice) {
      const svc = services?.find(s => s.id === cfg.serviceId);
      const price = cfg.customPrice ?? parseFloat(String(svc?.default_price || 0));
      return sum + price;
    }
    return sum;
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Estilos para ocultar spinners */}
      <style>{hideSpinnersStyle}</style>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Bundles de Servicios</h1>
          <p className="text-slate-400 mt-1">
            Agrupa servicios en paquetes con precios personalizados
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Bundle
        </button>
      </div>

      {/* Bundles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bundles?.map(bundle => (
          <div
            key={bundle.id}
            className={`bg-slate-800 rounded-xl border ${
              bundle.is_active ? 'border-slate-700' : 'border-red-900/50'
            } overflow-hidden`}
          >
            {/* Card Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-100">{bundle.bundle_name}</h3>
                  {bundle.description && (
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{bundle.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    bundle.is_active
                      ? 'bg-emerald-900/50 text-emerald-400'
                      : 'bg-red-900/50 text-red-400'
                  }`}>
                    {bundle.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    bundle.billing_type === 'fixed'
                      ? 'bg-blue-900/50 text-blue-400'
                      : 'bg-purple-900/50 text-purple-400'
                  }`}>
                    {bundle.billing_type === 'fixed' ? 'Precio Fijo' : 'Dinámico'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-3">
              {/* Price */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Precio base:</span>
                <span className="text-xl font-bold text-emerald-400">
                  Q{parseFloat(String(bundle.base_price || bundle.bundle_price)).toFixed(2)}
                </span>
              </div>

              {/* Services Count */}
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-slate-300">{bundle.services_count} servicios</span>
              </div>

              {/* Base Services */}
              {bundle.base_services && (
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Incluidos en precio base:</span>
                  <div className="text-xs text-slate-300 bg-slate-900/50 rounded-lg p-2">
                    {bundle.base_services}
                  </div>
                </div>
              )}

              {/* Extra Services */}
              {bundle.extra_services && (
                <div className="space-y-1">
                  <span className="text-xs text-amber-500">Cargos extra cuando aplican:</span>
                  <div className="text-xs text-amber-300 bg-amber-900/20 rounded-lg p-2">
                    {bundle.extra_services}
                  </div>
                </div>
              )}

              {/* Global indicator */}
              {bundle.workspace_id === null && (
                <div className="flex items-center gap-1 text-xs text-blue-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                  </svg>
                  Bundle Global
                </div>
              )}
            </div>

            {/* Card Actions */}
            <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-700 flex gap-2">
              <button
                onClick={() => openEditModal(bundle)}
                className="flex-1 px-3 py-2 text-sm bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => toggleStatusMutation.mutate({
                  id: bundle.id,
                  isActive: !bundle.is_active
                })}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  bundle.is_active
                    ? 'bg-amber-900/50 text-amber-400 hover:bg-amber-900/70'
                    : 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/70'
                }`}
              >
                {bundle.is_active ? 'Desactivar' : 'Activar'}
              </button>
              <button
                onClick={() => handleDelete(bundle)}
                className="px-3 py-2 text-sm bg-red-900/50 text-red-400 rounded-lg hover:bg-red-900/70 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {bundles?.length === 0 && (
          <div className="col-span-full text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
            <svg className="w-12 h-12 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-slate-400 mb-2">No hay bundles creados</h3>
            <p className="text-slate-500 mb-4">
              Crea tu primer bundle para agrupar servicios
            </p>
            <button
              onClick={openNewModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Bundle
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-100">
                {editingBundle ? 'Editar Bundle' : 'Nuevo Bundle'}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nombre del Bundle *
                    </label>
                    <input
                      type="text"
                      value={bundleName}
                      onChange={(e) => setBundleName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ej: Paquete Básico"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tipo de Facturación
                    </label>
                    <select
                      value={billingType}
                      onChange={(e) => setBillingType(e.target.value as 'fixed' | 'dynamic')}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dynamic">Dinámico (varía según servicios activos)</option>
                      <option value="fixed">Fijo (siempre el mismo precio)</option>
                    </select>
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Descripción (interno)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Descripción interna..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Descripción para Cliente
                    </label>
                    <textarea
                      value={clientDescription}
                      onChange={(e) => setClientDescription(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Lo que verá el cliente..."
                    />
                  </div>
                </div>

                {/* Price & Global */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {billingType === 'fixed' ? 'Precio Fijo (Q)' : 'Precio Base (Q)'}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={basePrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setBasePrice(val);
                        }
                      }}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-blue-500"
                      placeholder={billingType === 'dynamic' ? 'Auto-calculado' : '0.00'}
                    />
                  </div>

                  <div className="flex items-end">
                    <div className="bg-slate-700/50 rounded-lg p-3 w-full">
                      <span className="text-xs text-slate-400">Precio calculado:</span>
                      <div className="text-lg font-bold text-emerald-400">
                        Q{calculatedPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {!editingBundle && (
                    <div className="flex items-center">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isGlobal}
                          onChange={(e) => setIsGlobal(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-sm text-slate-300">Bundle Global</span>
                          <p className="text-xs text-slate-500">Disponible en todos los workspaces</p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                {/* Services Selection with Configuration */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Servicios del Bundle
                  </label>
                  <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-800 text-xs font-medium text-slate-400 border-b border-slate-700">
                      <div className="col-span-4">Servicio</div>
                      <div className="col-span-2 text-center">Recurrencia</div>
                      <div className="col-span-2 text-center">Precio</div>
                      <div className="col-span-2 text-center">En Base</div>
                      <div className="col-span-2 text-center">Asignación</div>
                    </div>

                    {/* Services List */}
                    <div className="max-h-72 overflow-y-auto">
                      {services?.filter(s => s.is_active).map(service => {
                        const config = serviceConfigs.find(c => c.serviceId === service.id);
                        const isSelected = !!config;
                        const isMonthly = service.recurrence_type === 'monthly';

                        return (
                          <div
                            key={service.id}
                            className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-slate-700/50 transition-colors ${
                              isSelected ? 'bg-blue-900/20' : 'hover:bg-slate-800/50'
                            }`}
                          >
                            {/* Checkbox + Name */}
                            <div className="col-span-4 flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleService(service.id)}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-200">{service.service_name}</span>
                            </div>

                            {/* Recurrence */}
                            <div className="col-span-2 text-center">
                              <span className={`text-xs px-2 py-1 rounded ${
                                isMonthly
                                  ? 'bg-blue-900/50 text-blue-300'
                                  : 'bg-amber-900/50 text-amber-300'
                              }`}>
                                {getRecurrenceLabel(service.recurrence_type)}
                              </span>
                            </div>

                            {/* Price */}
                            <div className="col-span-2">
                              {isSelected ? (
                                <NumericInput
                                  value={config?.customPrice ?? null}
                                  onChange={(val) => updateServiceConfig(service.id, 'customPrice', val)}
                                  placeholder={String(service.default_price)}
                                  className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-slate-100 text-center"
                                  min={0}
                                />
                              ) : (
                                <span className="text-sm text-slate-400 block text-center">
                                  Q{parseFloat(String(service.default_price)).toFixed(2)}
                                </span>
                              )}
                            </div>

                            {/* Include in Base */}
                            <div className="col-span-2 flex justify-center">
                              {isSelected && (
                                <div className="flex flex-col items-center gap-1">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={config?.includeInBasePrice ?? true}
                                      onChange={(e) => updateServiceConfig(
                                        service.id,
                                        'includeInBasePrice',
                                        e.target.checked
                                      )}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                  </label>
                                  {!config?.includeInBasePrice && (
                                    <span className="text-[10px] text-amber-400">+Cuando toca</span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Assignment */}
                            <div className="col-span-2 flex justify-center">
                              {isSelected && (
                                <select
                                  value={config?.assignmentType || 'all_clients'}
                                  onChange={(e) => updateServiceConfig(
                                    service.id,
                                    'assignmentType',
                                    e.target.value as 'all_clients' | 'selected_clients'
                                  )}
                                  className="text-xs px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-200"
                                >
                                  <option value="all_clients">Todos</option>
                                  <option value="selected_clients">Selectivo</option>
                                </select>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-emerald-600"></div>
                      <span><strong>En Base ON:</strong> Incluido en precio mensual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-slate-600"></div>
                      <span><strong>En Base OFF:</strong> Se cobra extra cuando corresponde</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span><strong>Todos:</strong> Se asigna automáticamente a cada cliente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span><strong>Selectivo:</strong> Solo se asigna si se elige manualmente</span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {serviceConfigs.length > 0 && (
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Resumen del Bundle</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Servicios incluidos en base:</span>
                        <ul className="mt-1 text-slate-200">
                          {serviceConfigs.filter(c => c.includeInBasePrice).map(c => {
                            const svc = services?.find(s => s.id === c.serviceId);
                            const price = c.customPrice ?? parseFloat(String(svc?.default_price || 0));
                            return (
                              <li key={c.serviceId} className="flex justify-between">
                                <span>{svc?.service_name}</span>
                                <span className="text-emerald-400">Q{price.toFixed(2)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <div>
                        <span className="text-slate-400">Servicios con cargo extra:</span>
                        <ul className="mt-1 text-slate-200">
                          {serviceConfigs.filter(c => !c.includeInBasePrice).map(c => {
                            const svc = services?.find(s => s.id === c.serviceId);
                            const price = c.customPrice ?? parseFloat(String(svc?.default_price || 0));
                            return (
                              <li key={c.serviceId} className="flex justify-between">
                                <span>{svc?.service_name} ({getRecurrenceLabel(svc?.recurrence_type || '')})</span>
                                <span className="text-amber-400">+Q{price.toFixed(2)}</span>
                              </li>
                            );
                          })}
                          {serviceConfigs.filter(c => !c.includeInBasePrice).length === 0 && (
                            <li className="text-slate-500 italic">Ninguno</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-700 flex gap-3 justify-end bg-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-300 hover:text-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || serviceConfigs.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  )}
                  {editingBundle ? 'Guardar Cambios' : 'Crear Bundle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
