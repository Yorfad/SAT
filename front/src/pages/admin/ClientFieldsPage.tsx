import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { useWorkspace } from "../../context/WorkspaceContext";

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
  column_exists: boolean;
  is_protected: boolean;
  // Override info para workspaces
  override_id: number | null;
  ws_required: boolean | null;
  ws_show_registration: boolean | null;
  ws_active: boolean | null;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texto', sql: 'VARCHAR(255)' },
  { value: 'number', label: 'Número', sql: 'INT' },
  { value: 'email', label: 'Email', sql: 'VARCHAR(255)' },
  { value: 'phone', label: 'Teléfono', sql: 'VARCHAR(50)' },
  { value: 'date', label: 'Fecha', sql: 'DATE' },
  { value: 'select', label: 'Selección', sql: 'VARCHAR(100)' },
  { value: 'textarea', label: 'Texto largo', sql: 'TEXT' },
  { value: 'checkbox', label: 'Checkbox', sql: 'TINYINT(1)' },
  { value: 'decimal', label: 'Decimal', sql: 'DECIMAL(10,2)' },
];

export default function ClientFieldsPage() {
  const queryClient = useQueryClient();
  const { isConsolidatedView, currentWorkspace } = useWorkspace();
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<ClientField | null>(null);
  const [form, setForm] = useState({
    fieldKey: '',
    fieldLabel: '',
    fieldType: 'text' as ClientField['field_type'],
    placeholder: '',
    isRequired: false,
    showInRegistration: true,
    selectOptions: '',
    applyToAllWorkspaces: false  // Por defecto solo al workspace actual
  });

  // En vista consolidada/general se pueden crear columnas
  // En workspace específico solo se puede modificar configuración
  const canCreateColumns = isConsolidatedView || !currentWorkspace;
  const workspaceName = currentWorkspace?.name || 'General';

  // Incluir workspace en queryKey para refrescar al cambiar
  const workspaceKey = isConsolidatedView ? 'all' : (currentWorkspace?.slug || 'default');

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['client-fields', workspaceKey],
    queryFn: async () => (await api.get('/client-fields/all')).data as ClientField[]
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => await api.post('/client-fields', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-fields'], exact: false });
      closeModal();
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Error al crear campo');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      await api.patch(`/client-fields/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-fields'], exact: false });
      closeModal();
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Error al actualizar campo');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await api.delete(`/client-fields/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-fields'], exact: false }),
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Error al eliminar campo');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) =>
      await api.patch(`/client-fields/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-fields'] })
  });

  // Mutation para toggles inline (requerido, registro)
  const inlineUpdateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { isRequired?: boolean; showInRegistration?: boolean } }) =>
      await api.patch(`/client-fields/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-fields'] }),
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Error al actualizar');
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => await api.post('/client-fields/sync'),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['client-fields'] });
      alert(response.data.message);
    }
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
      selectOptions: '',
      applyToAllWorkspaces: isConsolidatedView  // En vista consolidada, por defecto a todos
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
      isRequired: field.ws_required ?? field.is_required,
      showInRegistration: field.ws_show_registration ?? field.show_in_registration,
      selectOptions: field.select_options?.join('\n') || '',
      applyToAllWorkspaces: false
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
        : null,
      applyToAllWorkspaces: form.applyToAllWorkspaces
    };

    if (editingField) {
      updateMutation.mutate({ id: editingField.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (field: ClientField) => {
    if (field.is_protected) {
      alert('Este es un campo del sistema y no se puede eliminar.');
      return;
    }
    if (confirm(`¿Eliminar el campo "${field.field_label}"?\n\nADVERTENCIA: Esto eliminará la columna de la base de datos y todos los datos de TODOS los workspaces.`)) {
      deleteMutation.mutate(field.id);
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
            {canCreateColumns
              ? 'Gestiona las columnas de la tabla de clientes. Los cambios afectan la estructura de la base de datos.'
              : `Vista: ${workspaceName}. Solo puedes modificar la configuración de visualización.`
            }
          </p>
        </div>
        <div className="flex gap-2">
          {canCreateColumns && (
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
              title="Detectar columnas existentes sin registrar"
            >
              {syncMutation.isPending ? 'Sincronizando...' : '↻ Sincronizar'}
            </button>
          )}
          <button
            onClick={openNewModal}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-700 hover:to-amber-700"
          >
            + Nuevo Campo
          </button>
        </div>
      </div>

      {/* Info banner para workspace específico */}
      {!canCreateColumns && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 text-xl">ℹ️</span>
            <div>
              <p className="text-blue-300 font-medium">Workspace: {workspaceName}</p>
              <p className="text-blue-400/80 text-sm mt-1">
                Los cambios de visibilidad y requerimiento solo afectan a este workspace.
                Los nuevos campos que crees se agregarán a todos los workspaces.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de campos */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Campo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Tipo</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Requerido</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">En Registro</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {fields.map((field) => {
              const isActive = field.ws_active ?? field.is_active;
              const isRequired = field.ws_required ?? field.is_required;
              const showInReg = field.ws_show_registration ?? field.show_in_registration;
              const hasOverride = field.override_id !== null;

              // "personalizado" solo para campos NO del sistema que tienen override
              const showPersonalizado = !field.is_protected && hasOverride;

              return (
                <tr key={field.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {field.is_protected && (
                        <span className="text-yellow-500" title="Campo del sistema">🔒</span>
                      )}
                      <div>
                        <span className="text-white font-medium">{field.field_label}</span>
                        {showPersonalizado && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-900/50 text-blue-400 rounded">
                            personalizado
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-300">
                      {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {field.is_protected ? (
                      // Campos del sistema siempre son requeridos
                      <span className="text-green-400" title="Siempre requerido">✓</span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={isRequired}
                        onChange={(e) => inlineUpdateMutation.mutate({
                          id: field.id,
                          data: { isRequired: e.target.checked }
                        })}
                        disabled={inlineUpdateMutation.isPending}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-orange-600 cursor-pointer disabled:cursor-wait"
                        title={isRequired ? 'Requerido' : 'No requerido'}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={showInReg}
                      onChange={(e) => inlineUpdateMutation.mutate({
                        id: field.id,
                        data: { showInRegistration: e.target.checked }
                      })}
                      disabled={inlineUpdateMutation.isPending}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-green-600 cursor-pointer disabled:cursor-wait"
                      title={showInReg ? 'Mostrar en registro' : 'No mostrar en registro'}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {!field.is_protected && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(field)}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(field)}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {fields.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            No hay campos definidos. Crea el primero.
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-6 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-yellow-500">🔒</span>
          <span>Campo del sistema (siempre requerido)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-400">✓</span>
          <span>Requerido = obligatorio para crear cliente</span>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked readOnly className="w-3 h-3 rounded bg-slate-700 text-green-600" />
          <span>Registro = mostrar en formulario de registro público</span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingField ? 'Editar Campo' : 'Nuevo Campo'}
            </h2>

            {editingField && !canCreateColumns && (
              <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded text-sm text-blue-300">
                Solo puedes modificar la configuración de visualización para este workspace.
              </div>
            )}

            {!editingField && (
              <div className="mb-4 p-3 bg-amber-900/30 border border-amber-700 rounded text-sm text-amber-300">
                Esto creará una columna real en la tabla <code className="bg-slate-800 px-1 rounded">clients_profiles</code>.
              </div>
            )}

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
                  disabled={editingField?.is_protected && !canCreateColumns}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tipo de campo
                </label>
                <select
                  value={form.fieldType}
                  onChange={(e) => setForm({ ...form, fieldType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                  disabled={editingField?.is_protected || (!!editingField && !canCreateColumns)}
                >
                  {FIELD_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
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

              <div className="space-y-3 pt-3 border-t border-slate-700">
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

                {/* Solo mostrar al crear nuevo campo y si no estamos en vista consolidada */}
                {!editingField && !isConsolidatedView && currentWorkspace && (
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.applyToAllWorkspaces}
                        onChange={(e) => setForm({ ...form, applyToAllWorkspaces: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600"
                      />
                      <div>
                        <span className="text-sm text-slate-300">Activar en todos los workspaces</span>
                        <p className="text-xs text-slate-500">
                          {form.applyToAllWorkspaces
                            ? 'El campo estará disponible en todos los workspaces'
                            : `Solo estará activo en "${currentWorkspace.name}"`
                          }
                        </p>
                      </div>
                    </label>
                  </div>
                )}
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
