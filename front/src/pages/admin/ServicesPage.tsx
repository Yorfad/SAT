import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";

interface Service {
  id: number;
  service_name: string;
  description: string | null;
  default_price: number;
  recurrence_type: 'monthly' | 'bimonthly' | 'quarterly' | 'annual' | 'custom' | 'one_time';
  recurrence_days: number | null;
  activation_day: number | null;
  activation_window_days: number;
  requires_file: boolean;
  completion_determines_next: boolean;
  is_on_request: boolean;
  is_active: boolean;
  created_at: string;
}

interface ServiceFormData {
  service_name: string;
  description: string;
  default_price: number;
  recurrence_type: 'monthly' | 'bimonthly' | 'quarterly' | 'annual' | 'custom' | 'one_time';
  recurrence_days: number | null;
  activation_day: number | null;
  activation_window_days: number;
  requires_file: boolean;
  completion_determines_next: boolean;
  is_on_request: boolean;
  is_active: boolean;
}

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const { data: services, isLoading, error } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get('/services')).data as Service[]
  });

  const createMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      return await api.post('/services', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setShowModal(false);
      setEditingService(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ServiceFormData }) => {
      return await api.put(`/services/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setShowModal(false);
      setEditingService(null);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return await api.patch(`/services/${id}/status`, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    }
  });

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingService(null);
    setShowModal(true);
  };

  const handleToggleStatus = (service: Service) => {
    if (confirm(`¿Seguro que deseas ${service.is_active ? 'desactivar' : 'activar'} el servicio "${service.service_name}"?`)) {
      toggleStatusMutation.mutate({ id: service.id, is_active: !service.is_active });
    }
  };

  const handleDelete = (service: Service) => {
    if (confirm(`¿Seguro que deseas eliminar el servicio "${service.service_name}"? Esta acción no se puede deshacer y solo funcionará si no hay tareas o clientes asociados.`)) {
      deleteMutation.mutate(service.id);
    }
  };

  const getRecurrenceLabel = (service: Service) => {
    switch (service.recurrence_type) {
      case 'monthly': return 'Mensual';
      case 'bimonthly': return 'Bimensual';
      case 'quarterly': return 'Trimestral';
      case 'annual': return 'Anual';
      case 'custom': return `Cada ${service.recurrence_days} días`;
      case 'one_time': return 'Única vez';
      default: return service.recurrence_type;
    }
  };

  if (isLoading) return <div className="p-6 text-slate-400">Cargando servicios...</div>;
  if (error) return <div className="p-6 text-red-400">Error: {(error as any)?.response?.data?.message || 'Algo salió mal'}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-white">Administración de Servicios</h1>
        <button
          onClick={handleCreate}
          className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-orange-700 hover:to-amber-700 font-medium"
        >
          Crear Nuevo Servicio
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Servicio</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Descripción</th>
              <th className="px-4 py-3 text-right font-medium text-slate-300">Precio</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Recurrencia</th>
              <th className="px-4 py-3 text-center font-medium text-slate-300">Día Activación</th>
              <th className="px-4 py-3 text-center font-medium text-slate-300">Días para Completar</th>
              <th className="px-4 py-3 text-center font-medium text-slate-300">Estado</th>
              <th className="px-4 py-3 text-right font-medium text-slate-300">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services?.map((service) => (
              <tr key={service.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium text-white">{service.service_name}</td>
                <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                  {service.description || '-'}
                </td>
                <td className="px-4 py-3 text-right text-slate-200">Q{Number(service.default_price).toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-300">{getRecurrenceLabel(service)}</td>
                <td className="px-4 py-3 text-center text-slate-300">
                  {service.completion_determines_next ? (
                    <span className="text-xs text-purple-400">Al completar</span>
                  ) : service.activation_day !== null ? (
                    `Día ${service.activation_day}`
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3 text-center text-slate-300">
                  {service.activation_window_days} días
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    service.is_active
                      ? 'bg-green-900/30 text-green-400 border border-green-800'
                      : 'bg-slate-700 text-slate-300 border border-slate-600'
                  }`}>
                    {service.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-orange-400 hover:text-orange-300 text-xs font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleStatus(service)}
                      className={`text-xs font-medium ${
                        service.is_active
                          ? 'text-yellow-400 hover:text-yellow-300'
                          : 'text-green-400 hover:text-green-300'
                      }`}
                    >
                      {service.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(service)}
                      className="text-red-400 hover:text-red-300 text-xs font-medium"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {services?.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            No hay servicios configurados. Crea uno nuevo para comenzar.
          </div>
        )}
      </div>

      {showModal && (
        <ServiceFormModal
          service={editingService}
          onClose={() => {
            setShowModal(false);
            setEditingService(null);
          }}
          onSubmit={(data) => {
            if (editingService) {
              updateMutation.mutate({ id: editingService.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

interface ServiceFormModalProps {
  service: Service | null;
  onClose: () => void;
  onSubmit: (data: ServiceFormData) => void;
  isLoading: boolean;
}

function ServiceFormModal({ service, onClose, onSubmit, isLoading }: ServiceFormModalProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    service_name: service?.service_name || '',
    description: service?.description || '',
    default_price: service?.default_price || 0,
    recurrence_type: service?.recurrence_type || 'monthly',
    recurrence_days: service?.recurrence_days || null,
    activation_day: service?.activation_day ?? 25,
    activation_window_days: service?.activation_window_days || 7,
    requires_file: service?.requires_file ?? true,
    completion_determines_next: service?.completion_determines_next || false,
    is_on_request: service?.is_on_request ?? false,
    is_active: service?.is_active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.service_name.trim()) {
      alert('El nombre del servicio es requerido');
      return;
    }

    if (formData.default_price < 0) {
      alert('El precio debe ser mayor o igual a 0');
      return;
    }

    if (formData.recurrence_type === 'custom' && !formData.recurrence_days) {
      alert('Para recurrencia personalizada, debes especificar los días');
      return;
    }

    if (formData.completion_determines_next && formData.activation_day !== null) {
      alert('Si la próxima ejecución se determina al completar, el día de activación debe estar vacío');
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (field: keyof ServiceFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Si se activa completion_determines_next, limpiar activation_day
      if (field === 'completion_determines_next' && value === true) {
        newData.activation_day = null;
      }

      // Si se cambia a recurrence_type que no es custom, limpiar recurrence_days
      if (field === 'recurrence_type' && value !== 'custom') {
        newData.recurrence_days = null;
      }

      return newData;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {service ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre del Servicio */}
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">
                Nombre del Servicio <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.service_name}
                onChange={(e) => handleChange('service_name', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={3}
              />
            </div>

            {/* Precio por Defecto */}
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">
                Precio por Defecto (Q) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.default_price}
                onChange={(e) => handleChange('default_price', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
            </div>

            {/* Tipo de Recurrencia */}
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">
                Tipo de Recurrencia <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.recurrence_type}
                onChange={(e) => handleChange('recurrence_type', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="monthly">Mensual</option>
                <option value="bimonthly">Bimensual (cada 2 meses)</option>
                <option value="quarterly">Trimestral (cada 3 meses)</option>
                <option value="annual">Anual</option>
                <option value="custom">Personalizado (días específicos)</option>
                <option value="one_time">Una sola vez</option>
              </select>
            </div>

            {/* Días de Recurrencia (solo para custom) */}
            {formData.recurrence_type === 'custom' && (
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">
                  Días de Recurrencia <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.recurrence_days || ''}
                  onChange={(e) => handleChange('recurrence_days', parseInt(e.target.value) || null)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Ej: 15, 30, 63"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  Cada cuántos días se debe activar este servicio
                </p>
              </div>
            )}

            {/* Determina próxima ejecución al completar */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="completion_determines_next"
                checked={formData.completion_determines_next}
                onChange={(e) => handleChange('completion_determines_next', e.target.checked)}
                className="h-4 w-4 rounded bg-slate-800 border-slate-600"
              />
              <label htmlFor="completion_determines_next" className="text-sm text-slate-300">
                La próxima ejecución se determina al completar la tarea
              </label>
            </div>
            {formData.completion_determines_next && (
              <p className="text-xs text-slate-400 ml-6 -mt-2">
                Útil para servicios como "Libros al Día" donde la fecha se especifica al completar
              </p>
            )}

            {/* Día de Activación (solo si no es completion_determines_next) */}
            {!formData.completion_determines_next && (
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">
                  Día de Activación (1-28)
                </label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={formData.activation_day || ''}
                  onChange={(e) => handleChange('activation_day', e.target.value === '' ? null : Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="25"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Día del mes en que se debe activar la tarea (1-28 para que funcione en todos los meses)
                </p>
              </div>
            )}

            {/* Días para Completar */}
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">
                Días para Completar <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={formData.activation_window_days}
                onChange={(e) => handleChange('activation_window_days', e.target.value === '' ? 7 : parseInt(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                Número de días que el cliente tiene para completar esta tarea (ej: 10 días)
              </p>
            </div>

            {/* Requiere Archivo */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requires_file"
                checked={formData.requires_file}
                onChange={(e) => handleChange('requires_file', e.target.checked)}
                className="h-4 w-4 rounded bg-slate-800 border-slate-600"
              />
              <label htmlFor="requires_file" className="text-sm text-slate-300">
                Requiere subir archivo al completar
              </label>
            </div>

            {/* Servicio por Solicitud */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_on_request"
                checked={formData.is_on_request}
                onChange={(e) => handleChange('is_on_request', e.target.checked)}
                className="h-4 w-4 rounded bg-slate-800 border-slate-600"
              />
              <label htmlFor="is_on_request" className="text-sm text-slate-300">
                Servicio por solicitud del cliente (ej: RTU)
              </label>
            </div>
            {formData.is_on_request && (
              <p className="text-xs text-slate-400 ml-6 -mt-2">
                Este servicio solo se activará cuando el cliente lo solicite explícitamente
              </p>
            )}

            {/* Estado Activo */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="h-4 w-4 rounded bg-slate-800 border-slate-600"
              />
              <label htmlFor="is_active" className="text-sm text-slate-300">
                Servicio activo
              </label>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 font-medium"
              >
                {isLoading ? 'Guardando...' : service ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
