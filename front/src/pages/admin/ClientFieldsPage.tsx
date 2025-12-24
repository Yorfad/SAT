import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";

interface ClientField {
  id: number;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'textarea' | 'checkbox';
  placeholder: string | null;
  is_required: boolean;
  is_active: boolean;
  show_in_registration: boolean;
  select_options: string[] | null;
  display_order: number;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'date', label: 'Fecha' },
  { value: 'select', label: 'Selección' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'checkbox', label: 'Checkbox' },
];

export default function ClientFieldsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<ClientField | null>(null);
  const [form, setForm] = useState({
    fieldKey: '',
    fieldLabel: '',
    fieldType: 'text' as ClientField['field_type'],
    placeholder: '',
    isRequired: false,
    showInRegistration: true,
    selectOptions: ''
  });

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['client-fields'],
    queryFn: async () => (await api.get('/client-fields/all')).data as ClientField[]
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => await api.post('/client-fields', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-fields'] });
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      await api.patch(`/client-fields/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-fields'] });
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await api.delete(`/client-fields/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-fields'] })
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) =>
      await api.patch(`/client-fields/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-fields'] })
  });

  const openNewModal = () => {
    setEditingField(null);
    setForm({
      fieldKey: '',
      fieldLabel: '',
      fieldType: 'text',
      placeholder: '',
      isRequired: false,
      showInRegistration: true,
      selectOptions: ''
    });
    setShowModal(true);
  };

  const openEditModal = (field: ClientField) => {
    setEditingField(field);
    setForm({
      fieldKey: field.field_key,
      fieldLabel: field.field_label,
      fieldType: field.field_type,
      placeholder: field.placeholder || '',
      isRequired: field.is_required,
      showInRegistration: field.show_in_registration,
      selectOptions: field.select_options?.join('\n') || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingField(null);
  };

  const handleLabelChange = (label: string) => {
    const key = label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');

    setForm({
      ...form,
      fieldLabel: label,
      fieldKey: editingField ? form.fieldKey : key
    });
  };

  const handleSubmit = () => {
    if (!form.fieldLabel.trim()) return;

    const data = {
      fieldKey: form.fieldKey || form.fieldLabel.toLowerCase().replace(/\s+/g, '_'),
      fieldLabel: form.fieldLabel,
      fieldType: form.fieldType,
      placeholder: form.placeholder || null,
      isRequired: form.isRequired,
      showInRegistration: form.showInRegistration,
      selectOptions: form.selectOptions
        ? form.selectOptions.split('\n').filter(o => o.trim())
        : null
    };

    if (editingField) {
      updateMutation.mutate({ id: editingField.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-slate-800 min-h-screen">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-800 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Campos de Cliente</h1>
          <p className="text-slate-400 text-sm mt-1">
            Define qué información necesitas de tus clientes
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700"
        >
          + Nuevo Campo
        </button>
      </div>

      {/* Lista de campos */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Campo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Tipo</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Requerido</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">En Registro</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {fields.map((field) => (
              <tr key={field.id} className={`hover:bg-slate-800/50 ${!field.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div>
                    <span className="text-white font-medium">{field.field_label}</span>
                    <span className="text-slate-500 text-xs ml-2">({field.field_key})</span>
                  </div>
                  {field.placeholder && (
                    <p className="text-xs text-slate-500">{field.placeholder}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-300">
                    {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {field.is_required ? (
                    <span className="text-orange-400">✓</span>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {field.show_in_registration ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleMutation.mutate({ id: field.id, isActive: !field.is_active })}
                    className={`px-2 py-1 text-xs rounded ${
                      field.is_active
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {field.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(field)}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar este campo?')) {
                          deleteMutation.mutate(field.id);
                        }
                      }}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {fields.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            No hay campos definidos. Crea el primero.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingField ? 'Editar Campo' : 'Nuevo Campo'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Etiqueta *
                </label>
                <input
                  type="text"
                  value={form.fieldLabel}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="Ej: Nombre de Empresa"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre interno
                  </label>
                  <input
                    type="text"
                    value={form.fieldKey}
                    onChange={(e) => setForm({ ...form, fieldKey: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    placeholder="nombre_empresa"
                    disabled={!!editingField}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de campo
                  </label>
                  <select
                    value={form.fieldType}
                    onChange={(e) => setForm({ ...form, fieldType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  >
                    {FIELD_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={form.placeholder}
                  onChange={(e) => setForm({ ...form, placeholder: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="Texto de ayuda..."
                />
              </div>

              {form.fieldType === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Opciones (una por línea)
                  </label>
                  <textarea
                    value={form.selectOptions}
                    onChange={(e) => setForm({ ...form, selectOptions: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                  />
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-slate-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isRequired}
                    onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-orange-600"
                  />
                  <span className="text-sm text-slate-300">Campo requerido</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.showInRegistration}
                    onChange={(e) => setForm({ ...form, showInRegistration: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-orange-600"
                  />
                  <span className="text-sm text-slate-300">Mostrar en formulario de registro</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.fieldLabel.trim() || createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
