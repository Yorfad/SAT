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

  if (isLoading) return <div className="p-6">Cargando servicios...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {(error as any)?.response?.data?.message || 'Algo salió mal'}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Administración de Servicios</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Crear Nuevo Servicio
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Servicio</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Descripción</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Precio</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Recurrencia</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Día Activación</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Ventana</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Estado</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services?.map((service) => (
              <tr key={service.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{service.service_name}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                  {service.description || '-'}
                </td>
                <td className="px-4 py-3 text-right">Q{service.default_price.toFixed(2)}</td>
                <td className="px-4 py-3">{getRecurrenceLabel(service)}</td>
                <td className="px-4 py-3 text-center">
                  {service.completion_determines_next ? (
                    <span className="text-xs text-purple-600">Al completar</span>
                  ) : service.activation_day !== null ? (
                    `Día ${service.activation_day}`
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {service.activation_window_days} días
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    service.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {service.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleStatus(service)}
                      className={`text-xs font-medium ${
                        service.is_active
                          ? 'text-orange-600 hover:text-orange-800'
                          : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {service.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(service)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
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
          <div className="text-center py-8 text-gray-500">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {service ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre del Servicio */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre del Servicio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.service_name}
                onChange={(e) => handleChange('service_name', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={3}
              />
            </div>

            {/* Precio por Defecto */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Precio por Defecto (Q) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.default_price}
                onChange={(e) => handleChange('default_price', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            {/* Tipo de Recurrencia */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Tipo de Recurrencia <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.recurrence_type}
                onChange={(e) => handleChange('recurrence_type', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
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
                <label className="block text-sm font-medium mb-1">
                  Días de Recurrencia <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.recurrence_days || ''}
                  onChange={(e) => handleChange('recurrence_days', parseInt(e.target.value) || null)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Ej: 15, 30, 63"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
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
                className="h-4 w-4"
              />
              <label htmlFor="completion_determines_next" className="text-sm">
                La próxima ejecución se determina al completar la tarea
              </label>
            </div>
            {formData.completion_determines_next && (
              <p className="text-xs text-gray-500 ml-6 -mt-2">
                Útil para servicios como "Libros al Día" donde la fecha se especifica al completar
              </p>
            )}

            {/* Día de Activación (solo si no es completion_determines_next) */}
            {!formData.completion_determines_next && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Día de Activación (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.activation_day || ''}
                  onChange={(e) => handleChange('activation_day', parseInt(e.target.value) || null)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="25"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Día del mes en que se debe activar la tarea (por defecto: 25)
                </p>
              </div>
            )}

            {/* Ventana de Activación */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Ventana de Activación (días) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.activation_window_days}
                onChange={(e) => handleChange('activation_window_days', parseInt(e.target.value) || 7)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Número de días antes del día de activación en que la tarea se marca como pendiente
              </p>
            </div>

            {/* Requiere Archivo */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requires_file"
                checked={formData.requires_file}
                onChange={(e) => handleChange('requires_file', e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="requires_file" className="text-sm">
                Requiere subir archivo al completar
              </label>
            </div>

            {/* Estado Activo */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="is_active" className="text-sm">
                Servicio activo
              </label>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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
