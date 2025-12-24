import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import ServiceFormModal from "../../components/services/ServiceFormModal";
import type { Service, ServiceFormData, ServiceConfig } from "../../components/services/ServiceFormModal";

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const { data: services, isLoading, error } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await api.get('/services')).data as Service[]
  });

  const createMutation = useMutation({
    mutationFn: async ({ data, config }: { data: ServiceFormData; config: ServiceConfig }) => {
      // Crear servicio
      const serviceRes = await api.post('/services', data);
      const serviceId = serviceRes.data.id;

      // Guardar configuración
      await saveServiceConfig(serviceId, config);

      return serviceRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setShowModal(false);
      setEditingService(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, config }: { id: number; data: ServiceFormData; config: ServiceConfig }) => {
      // Actualizar servicio
      const serviceRes = await api.put(`/services/${id}`, data);

      // Guardar configuración
      await saveServiceConfig(id, config);

      return serviceRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["service-config"] });
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

  // Función para guardar la configuración del servicio
  const saveServiceConfig = async (serviceId: number, config: ServiceConfig) => {
    const { activities, uploadSlots, formFields, recurrenceRules } = config;

    // Guardar actividades
    for (const activity of activities) {
      if (activity.isDeleted && activity.id) {
        await api.delete(`/services/${serviceId}/activities/${activity.id}`);
      } else if (activity.isNew) {
        await api.post(`/services/${serviceId}/activities`, {
          activity_name: activity.activity_name,
          description: activity.description,
          is_required: activity.is_required
        });
      } else if (activity.id) {
        await api.put(`/services/${serviceId}/activities/${activity.id}`, {
          activity_name: activity.activity_name,
          description: activity.description,
          is_required: activity.is_required
        });
      }
    }

    // Guardar espacios de carga
    for (const slot of uploadSlots) {
      if (slot.isDeleted && slot.id) {
        await api.delete(`/services/${serviceId}/upload-slots/${slot.id}`);
      } else if (slot.isNew) {
        await api.post(`/services/${serviceId}/upload-slots`, {
          slot_name: slot.slot_name,
          slot_label: slot.slot_label,
          description: slot.description,
          is_required: slot.is_required,
          visibility: slot.visibility,
          send_via_whatsapp: slot.send_via_whatsapp
        });
      } else if (slot.id) {
        await api.put(`/services/${serviceId}/upload-slots/${slot.id}`, {
          slot_name: slot.slot_name,
          slot_label: slot.slot_label,
          description: slot.description,
          is_required: slot.is_required,
          visibility: slot.visibility,
          send_via_whatsapp: slot.send_via_whatsapp
        });
      }
    }

    // Guardar campos de formulario
    for (const field of formFields) {
      if (field.isDeleted && field.id) {
        await api.delete(`/services/${serviceId}/form-fields/${field.id}`);
      } else if (field.isNew) {
        await api.post(`/services/${serviceId}/form-fields`, {
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          placeholder: field.placeholder,
          is_required: field.is_required,
          select_options: field.select_options,
          help_text: field.help_text
        });
      } else if (field.id) {
        await api.put(`/services/${serviceId}/form-fields/${field.id}`, {
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          placeholder: field.placeholder,
          is_required: field.is_required,
          select_options: field.select_options,
          help_text: field.help_text
        });
      }
    }

    // Guardar reglas de recurrencia (si existen)
    if (recurrenceRules) {
      await api.put(`/services/${serviceId}/recurrence-rules`, recurrenceRules);
    }
  };

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
    const extended = service.recurrence_type_extended || service.recurrence_type;
    switch (extended) {
      case 'weekly': return 'Semanal';
      case 'biweekly': return 'Quincenal';
      case 'monthly': return 'Mensual';
      case 'bimonthly': return 'Bimensual';
      case 'quarterly': return 'Trimestral';
      case 'semiannual': return 'Semestral';
      case 'annual': return 'Anual';
      case 'on_demand': return 'Bajo demanda';
      case 'variable': return 'Variable';
      case 'custom': return `Cada ${service.recurrence_days} días`;
      case 'one_time': return 'Única vez';
      default: return extended || '-';
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
              <th className="px-4 py-3 text-right font-medium text-slate-300">Costo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Recurrencia</th>
              <th className="px-4 py-3 text-center font-medium text-slate-300">Estado</th>
              <th className="px-4 py-3 text-right font-medium text-slate-300">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services?.map((service) => (
              <tr key={service.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  <div>
                    <span className="font-medium text-white">{service.service_name}</span>
                    {service.important_notes && (
                      <p className="text-xs text-red-400 mt-0.5 truncate max-w-xs" title={service.important_notes}>
                        {service.important_notes}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                  {service.description || '-'}
                </td>
                <td className="px-4 py-3 text-right text-slate-200">
                  Q{Number(service.default_price).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-slate-400">
                  {service.operational_cost > 0 ? `Q${Number(service.operational_cost).toFixed(2)}` : '-'}
                </td>
                <td className="px-4 py-3 text-slate-300">{getRecurrenceLabel(service)}</td>
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
          onSubmit={(data, config) => {
            if (editingService) {
              updateMutation.mutate({ id: editingService.id, data, config });
            } else {
              createMutation.mutate({ data, config });
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
