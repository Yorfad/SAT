import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

// CSS para ocultar spinners de inputs numéricos
const hideSpinnersStyle = `
  .service-form input[type="number"]::-webkit-outer-spin-button,
  .service-form input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .service-form input[type="number"] {
    -moz-appearance: textfield;
  }
`;
import ActivityListBuilder from './ActivityListBuilder';
import type { Activity } from './ActivityListBuilder';
import UploadSlotBuilder from './UploadSlotBuilder';
import type { UploadSlot } from './UploadSlotBuilder';
import FormFieldBuilder from './FormFieldBuilder';
import type { FormField } from './FormFieldBuilder';
import RecurrencePatternBuilder from './RecurrencePatternBuilder';
import type { RecurrenceRules } from './RecurrencePatternBuilder';

// ============================================
// TIPOS
// ============================================

type RecurrenceType = 'monthly' | 'bimonthly' | 'quarterly' | 'annual' | 'custom' | 'one_time';
type RecurrenceTypeExtended = 'annual' | 'semiannual' | 'quarterly' | 'bimonthly' | 'monthly' | 'biweekly' | 'weekly' | 'on_demand' | 'variable' | 'custom' | 'one_time';
type FileConfig = 'none' | 'optional' | 'required';
type AssignmentType = 'all_clients' | 'selected_clients' | 'on_request';

export interface Service {
  id: number;
  service_name: string;
  description: string | null;
  default_price: number;
  operational_cost: number;
  recurrence_type: RecurrenceType;
  recurrence_type_extended: RecurrenceTypeExtended;
  recurrence_days: number | null;
  activation_day: number | null;
  activation_window_days: number;
  requires_file: boolean;
  file_config: FileConfig;
  completion_determines_next: boolean;
  is_on_request: boolean;
  is_active: boolean;
  is_global: boolean;
  important_notes: string | null;
  employee_notes: string | null;
  client_notes: string | null;
  assignment_type: AssignmentType;
  visible_to_clients: boolean;
  allow_subscription: boolean;
  created_at: string;
}

export interface ServiceFormData {
  service_name: string;
  description: string;
  default_price: number;
  operational_cost: number;
  recurrence_type: RecurrenceType;
  recurrence_type_extended: RecurrenceTypeExtended;
  recurrence_days: number | null;
  activation_day: number | null;
  activation_window_days: number;
  requires_file: boolean;
  file_config: FileConfig;
  completion_determines_next: boolean;
  is_on_request: boolean;
  is_active: boolean;
  employee_notes: string | null;
  client_notes: string | null;
  assignment_type: AssignmentType;
  visible_to_clients: boolean;
  allow_subscription: boolean;
}

interface Props {
  service: Service | null;
  onClose: () => void;
  onSubmit: (data: ServiceFormData, config: ServiceConfig) => void;
  isLoading: boolean;
}

export interface ServiceConfig {
  activities: Activity[];
  uploadSlots: UploadSlot[];
  formFields: FormField[];
  recurrenceRules: RecurrenceRules | null;
}

type TabId = 'general' | 'recurrence' | 'activities' | 'files' | 'client' | 'assignment';

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'recurrence', label: 'Recurrencia' },
  { id: 'activities', label: 'Actividades' },
  { id: 'files', label: 'Archivos' },
  { id: 'client', label: 'Cliente' },
  { id: 'assignment', label: 'Asignación' },
];

const RECURRENCE_OPTIONS: { value: RecurrenceTypeExtended; label: string }[] = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal (cada 2 semanas)' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'bimonthly', label: 'Bimensual (cada 2 meses)' },
  { value: 'quarterly', label: 'Trimestral (cada 3 meses)' },
  { value: 'semiannual', label: 'Semestral (cada 6 meses)' },
  { value: 'annual', label: 'Anual' },
  { value: 'variable', label: 'Variable (patrón personalizado)' },
  { value: 'one_time', label: 'Una sola vez' },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ServiceFormModal({ service, onClose, onSubmit, isLoading }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  // Convertir on_demand legacy a monthly + allow_subscription
  const getInitialRecurrence = (): RecurrenceTypeExtended => {
    if (service?.recurrence_type_extended === 'on_demand') {
      return 'monthly'; // Migrar a mensual con suscripción activa
    }
    return service?.recurrence_type_extended || 'monthly';
  };

  // Estados locales para inputs numéricos (permiten escribir libremente)
  const [priceInput, setPriceInput] = useState(service?.default_price ? String(service.default_price) : '');
  const [costInput, setCostInput] = useState(service?.operational_cost ? String(service.operational_cost) : '');
  const [activationDayInput, setActivationDayInput] = useState(service?.activation_day ? String(service.activation_day) : '');
  const [windowDaysInput, setWindowDaysInput] = useState(service?.activation_window_days ? String(service.activation_window_days) : '7');

  // Estado del formulario principal
  const [formData, setFormData] = useState<ServiceFormData>({
    service_name: service?.service_name || '',
    description: service?.description || '',
    default_price: service?.default_price || 0,
    operational_cost: service?.operational_cost || 0,
    recurrence_type: service?.recurrence_type || 'monthly',
    recurrence_type_extended: getInitialRecurrence(),
    recurrence_days: service?.recurrence_days || null,
    activation_day: service?.activation_day ?? 25,
    activation_window_days: service?.activation_window_days || 7,
    requires_file: service?.requires_file ?? true,
    file_config: service?.file_config || 'required',
    completion_determines_next: service?.completion_determines_next || false,
    is_on_request: service?.is_on_request ?? false,
    is_active: service?.is_active ?? true,
    employee_notes: service?.employee_notes || service?.important_notes || null,
    client_notes: service?.client_notes || null,
    assignment_type: service?.assignment_type || 'selected_clients',
    visible_to_clients: service?.visible_to_clients ?? true,
    // Si era on_demand, activar suscripción automáticamente
    allow_subscription: service?.allow_subscription ?? (service?.recurrence_type_extended === 'on_demand')
  });

  // Estado de configuración (actividades, slots, campos, reglas de recurrencia)
  const [activities, setActivities] = useState<Activity[]>([]);
  const [uploadSlots, setUploadSlots] = useState<UploadSlot[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [recurrenceRules, setRecurrenceRules] = useState<RecurrenceRules>({
    variable_pattern: [],
    completion_days: [],
    activation_days_before: 7,
    day_of_week: null
  });

  // Cargar configuración existente si es edición
  const { data: existingConfig, isLoading: configLoading } = useQuery({
    queryKey: ['service-config', service?.id],
    queryFn: async () => {
      if (!service?.id) return null;
      const res = await api.get(`/services/${service.id}/full-config`);
      return res.data;
    },
    enabled: !!service?.id
  });

  useEffect(() => {
    if (existingConfig) {
      setActivities(existingConfig.activities || []);
      setUploadSlots(existingConfig.uploadSlots || []);
      setFormFields(existingConfig.formFields || []);
      if (existingConfig.recurrenceRules) {
        setRecurrenceRules({
          variable_pattern: existingConfig.recurrenceRules.variable_pattern || [],
          completion_days: existingConfig.recurrenceRules.completion_days || [],
          activation_days_before: existingConfig.recurrenceRules.activation_days_before || 7,
          day_of_week: existingConfig.recurrenceRules.day_of_week || null
        });
      }
    }
  }, [existingConfig]);

  const handleChange = (field: keyof ServiceFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Si se activa completion_determines_next, limpiar activation_day
      if (field === 'completion_determines_next' && value === true) {
        newData.activation_day = null;
      }

      // Sincronizar recurrence_type con recurrence_type_extended
      if (field === 'recurrence_type_extended') {
        const mapping: Record<RecurrenceTypeExtended, RecurrenceType> = {
          annual: 'annual',
          semiannual: 'quarterly',
          quarterly: 'quarterly',
          bimonthly: 'bimonthly',
          monthly: 'monthly',
          biweekly: 'monthly',
          weekly: 'monthly',
          variable: 'custom',
          custom: 'custom',
          one_time: 'one_time',
          on_demand: 'one_time' // Legacy support
        };
        newData.recurrence_type = mapping[value as RecurrenceTypeExtended];

        // Para recurrencia variable: limpiar campos que no aplican
        if (value === 'variable') {
          newData.activation_day = null;
          newData.completion_determines_next = true; // Implícito en variable
        }
      }

      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.service_name.trim()) {
      alert('El nombre del servicio es requerido');
      setActiveTab('general');
      return;
    }

    // Sincronizar valores de inputs locales
    const finalPrice = parseFloat(priceInput) || 0;
    const finalCost = parseFloat(costInput) || 0;
    const finalActivationDay = parseInt(activationDayInput) || null;
    const finalWindowDays = parseInt(windowDaysInput) || 7;

    if (finalPrice < 0) {
      alert('El precio debe ser mayor o igual a 0');
      setActiveTab('general');
      return;
    }

    // Construir datos finales con valores sincronizados
    const finalData = {
      ...formData,
      default_price: finalPrice,
      operational_cost: finalCost,
      activation_day: finalActivationDay,
      activation_window_days: finalWindowDays
    };

    // Si es recurrencia variable, incluir las reglas
    const rules = formData.recurrence_type_extended === 'variable' ? recurrenceRules : null;
    onSubmit(finalData, { activities, uploadSlots, formFields, recurrenceRules: rules });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <style>{hideSpinnersStyle}</style>
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col service-form">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-white">
            {service ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
          </h2>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700 flex-shrink-0">
          <div className="flex overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {configLoading ? (
              <div className="text-center py-8 text-slate-400">Cargando configuración...</div>
            ) : (
              <>
                {/* Tab: General */}
                {activeTab === 'general' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-300">
                        Nombre del Servicio <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.service_name}
                        onChange={(e) => handleChange('service_name', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-300">Descripción</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-300">
                          Precio (Q) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={priceInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              setPriceInput(val);
                            }
                          }}
                          onBlur={() => handleChange('default_price', parseFloat(priceInput) || 0)}
                          className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-slate-300">
                          Costo Operacional (Q)
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={costInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              setCostInput(val);
                            }
                          }}
                          onBlur={() => handleChange('operational_cost', parseFloat(costInput) || 0)}
                          className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">Gasto asociado a este servicio</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-amber-400">
                          📋 Observaciones para Empleados
                        </label>
                        <textarea
                          value={formData.employee_notes || ''}
                          onChange={(e) => handleChange('employee_notes', e.target.value || null)}
                          className="w-full bg-amber-950/30 border border-amber-900/50 text-amber-200 rounded-lg px-3 py-2 placeholder-amber-400/50"
                          rows={2}
                          placeholder="Instrucciones o notas internas para el equipo"
                        />
                        <p className="text-xs text-amber-400/70 mt-1">
                          Solo visible para empleados
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-blue-400">
                          👤 Observaciones para Clientes
                        </label>
                        <textarea
                          value={formData.client_notes || ''}
                          onChange={(e) => handleChange('client_notes', e.target.value || null)}
                          className="w-full bg-blue-950/30 border border-blue-900/50 text-blue-200 rounded-lg px-3 py-2 placeholder-blue-400/50"
                          rows={2}
                          placeholder="Información importante para el cliente"
                        />
                        <p className="text-xs text-blue-400/70 mt-1">
                          Visible para clientes en su portal
                        </p>
                      </div>
                    </div>

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
                  </div>
                )}

                {/* Tab: Recurrencia */}
                {activeTab === 'recurrence' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-300">
                        Tipo de Recurrencia
                      </label>
                      <select
                        value={formData.recurrence_type_extended}
                        onChange={(e) => handleChange('recurrence_type_extended', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
                      >
                        {RECURRENCE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {formData.recurrence_type_extended === 'variable' && (
                      <>
                        <RecurrencePatternBuilder
                          rules={recurrenceRules}
                          onChange={setRecurrenceRules}
                          disabled={isLoading}
                        />
                        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-sm text-blue-300">
                          <strong>Nota:</strong> En recurrencia variable, las tareas se generan automáticamente
                          después de completar la anterior, según el patrón definido. No aplica día fijo del mes.
                        </div>
                      </>
                    )}

                    {/* Solo mostrar opciones de activación para recurrencia NO variable */}
                    {formData.recurrence_type_extended !== 'variable' && (
                      <>
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
                          <p className="text-xs text-slate-400 ml-6">
                            Útil para servicios como "Libros al Día" donde la fecha se especifica al completar
                          </p>
                        )}

                        {!formData.completion_determines_next && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1 text-slate-300">
                                Día de Activación (1-28)
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={activationDayInput}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d*$/.test(val)) {
                                    setActivationDayInput(val);
                                  }
                                }}
                                onBlur={() => {
                                  const num = parseInt(activationDayInput) || null;
                                  if (num === null || (num >= 1 && num <= 28)) {
                                    handleChange('activation_day', num);
                                  } else {
                                    setActivationDayInput(formData.activation_day ? String(formData.activation_day) : '');
                                  }
                                }}
                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
                                placeholder="25"
                              />
                              <p className="text-xs text-slate-500 mt-1">Día del mes para activar la tarea</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1 text-slate-300">
                                Días para Completar
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={windowDaysInput}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d*$/.test(val)) {
                                    setWindowDaysInput(val);
                                  }
                                }}
                                onBlur={() => {
                                  const num = parseInt(windowDaysInput) || 7;
                                  if (num >= 1 && num <= 60) {
                                    handleChange('activation_window_days', num);
                                    setWindowDaysInput(String(num));
                                  } else {
                                    setWindowDaysInput(String(formData.activation_window_days));
                                  }
                                }}
                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
                              />
                              <p className="text-xs text-slate-500 mt-1">Días antes de la fecha límite</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                  </div>
                )}

                {/* Tab: Actividades */}
                {activeTab === 'activities' && (
                  <ActivityListBuilder
                    activities={activities}
                    onChange={setActivities}
                    disabled={isLoading}
                  />
                )}

                {/* Tab: Archivos */}
                {activeTab === 'files' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-300">
                        Configuración de archivos
                      </label>
                      <select
                        value={formData.file_config}
                        onChange={(e) => handleChange('file_config', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2"
                      >
                        <option value="required">Requiere archivos</option>
                        <option value="optional">Archivos opcionales</option>
                        <option value="none">Sin archivos</option>
                      </select>
                    </div>

                    {formData.file_config !== 'none' && (
                      <UploadSlotBuilder
                        slots={uploadSlots}
                        onChange={setUploadSlots}
                        disabled={isLoading}
                      />
                    )}
                  </div>
                )}

                {/* Tab: Cliente */}
                {activeTab === 'client' && (
                  <FormFieldBuilder
                    fields={formFields}
                    onChange={setFormFields}
                    disabled={isLoading}
                  />
                )}

                {/* Tab: Asignación */}
                {activeTab === 'assignment' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">
                        Tipo de Asignación
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="radio"
                            name="assignment_type"
                            checked={formData.assignment_type === 'all_clients'}
                            onChange={() => handleChange('assignment_type', 'all_clients')}
                            className="bg-slate-800 border-slate-600"
                          />
                          Asignar a todos los clientes automáticamente
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="radio"
                            name="assignment_type"
                            checked={formData.assignment_type === 'selected_clients'}
                            onChange={() => handleChange('assignment_type', 'selected_clients')}
                            className="bg-slate-800 border-slate-600"
                          />
                          Asignar manualmente a clientes seleccionados
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="radio"
                            name="assignment_type"
                            checked={formData.assignment_type === 'on_request'}
                            onChange={() => handleChange('assignment_type', 'on_request')}
                            className="bg-slate-800 border-slate-600"
                          />
                          Solo bajo solicitud del cliente
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-slate-700 pt-4 space-y-3">
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={formData.allow_subscription}
                          onChange={(e) => handleChange('allow_subscription', e.target.checked)}
                          className="h-4 w-4 rounded bg-slate-800 border-slate-600"
                        />
                        Permitir suscripción
                      </label>
                      <p className="text-xs text-slate-500 ml-6">
                        Cuando el cliente solicite este servicio, se le preguntará si desea suscribirse
                        para recibirlo automáticamente según la recurrencia configurada.
                      </p>

                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={formData.visible_to_clients}
                          onChange={(e) => handleChange('visible_to_clients', e.target.checked)}
                          className="h-4 w-4 rounded bg-slate-800 border-slate-600"
                        />
                        Visible para clientes en su portal
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700 flex justify-end gap-2 flex-shrink-0">
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
  );
}
