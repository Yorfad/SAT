import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { Link } from "react-router-dom";

// ============ TYPES ============
interface ClientField {
  id: number;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'textarea' | 'checkbox';
  placeholder: string | null;
  is_required: boolean;
  show_in_registration: boolean;
  show_in_list: boolean;
  select_options: string[] | null;
}

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select';
  source: string;
  options?: string[] | { id: number; name: string }[];
  fieldId?: number;
}

interface Filter {
  field: string;
  operator: string;
  value: string;
}

type Client = {
  id: number;
  full_name: string;
  email: string;
  nit: string | null;
  phone_number: string | null;
  is_active: number | boolean;
  assigned_to_user_id: number | null;
  assigned_to_name: string | null;
  sede: string | null;
  grupo: string | null;
  contract_number: string | null;
  active_infractions_count: number;
  services_disabled_by_infractions: number;
  workspace_name?: string | null;
  workspace_color?: string | null;
  custom_fields?: Record<string, string>;
};

type Employee = { id: number; full_name: string; email?: string };

type PoolItem = {
  id: number;
  client_user_id: number;
  client_name: string;
  client_email: string;
  description: string;
  priority: "baja" | "normal" | "alta" | "urgente";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  assigned_to_user_id: number | null;
  assigned_to_name: string | null;
  created_at: string;
};

type Service = {
  id: number;
  service_name: string;
  description: string | null;
  recurrence_type: string;
};

// ============ CONSTANTS ============
const TABS = [
  { id: 'clients', label: 'Clientes', icon: '👥' },
  { id: 'assign-tasks', label: 'Asignar Tareas', icon: '📋' },
  { id: 'pool', label: 'Pool de Tareas', icon: '🔧' },
] as const;

const OPERATORS = [
  { value: 'equals', label: 'Es igual a' },
  { value: 'contains', label: 'Contiene' },
  { value: 'starts_with', label: 'Empieza con' },
];

const priorityColors = {
  baja: "bg-slate-600 text-slate-200",
  normal: "bg-blue-600 text-blue-100",
  alta: "bg-orange-600 text-orange-100",
  urgente: "bg-red-600 text-red-100"
};

const statusColors = {
  pending: "bg-yellow-900/50 text-yellow-300 border-yellow-800",
  in_progress: "bg-blue-900/50 text-blue-300 border-blue-800",
  completed: "bg-green-900/50 text-green-300 border-green-800",
  cancelled: "bg-gray-900/50 text-gray-300 border-gray-800"
};

// ============ COMPONENT ============
export default function ClientsPage() {
  const queryClient = useQueryClient();

  // Tab activo
  const [activeTab, setActiveTab] = useState<'clients' | 'assign-tasks' | 'pool'>('clients');

  // Filtros avanzados
  const [filters, setFilters] = useState<Filter[]>([]);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);

  // Modales
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showAddPoolTaskModal, setShowAddPoolTaskModal] = useState(false);

  // Estado de formularios
  const [bulkAssignUserId, setBulkAssignUserId] = useState<number | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [resetPasswordClient, setResetPasswordClient] = useState<Client | null>(null);
  const [resetPasswordMode, setResetPasswordMode] = useState<'random' | 'manual'>('random');
  const [manualPassword, setManualPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({
    fullName: "", email: "", nit: "", phoneNumber: "",
    sede: "", grupo: "", contractNumber: "", isActive: true
  });

  const [createClientForm, setCreateClientForm] = useState<{
    fullName: string; email: string; password: string;
    nit: string; phoneNumber: string; customFields: Record<string, string>;
  }>({ fullName: "", email: "", password: "", nit: "", phoneNumber: "", customFields: {} });

  const [assignTaskForm, setAssignTaskForm] = useState({
    serviceId: '', assignedTo: '', dueDate: '', priority: 'medium', notes: ''
  });

  const [poolTaskForm, setPoolTaskForm] = useState({
    clientUserId: "", description: "", priority: "normal" as "baja" | "normal" | "alta" | "urgente"
  });

  // ============ QUERIES ============
  // Campos filtrables (incluye campos personalizados)
  const { data: filterableFields = [] } = useQuery({
    queryKey: ['filterable-fields'],
    queryFn: async () => {
      const res = await api.get('/bulk-assignment/fields');
      return res.data.fields as FilterField[];
    },
  });

  // Clientes filtrados
  const filterMutation = useMutation({
    mutationFn: async (filterList: Filter[]) => {
      const res = await api.post('/bulk-assignment/filter-clients', { filters: filterList });
      return res.data as { clients: Client[]; total: number };
    },
  });

  // Clientes (query tradicional para cuando no hay filtros)
  const { data: allClients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["all-clients"],
    queryFn: async () => {
      const res = await api.get("/client-management");
      return res.data;
    },
    enabled: filters.length === 0
  });

  // Pool items
  const { data: poolItems = [] } = useQuery({
    queryKey: ["pool-items"],
    queryFn: async () => {
      const res = await api.get("/pool");
      return res.data;
    }
  });

  // Opciones de filtros (empleados, sedes, grupos)
  const { data: filterOptions } = useQuery({
    queryKey: ["client-management-filters"],
    queryFn: async () => {
      const res = await api.get("/client-management/filter-options");
      return res.data;
    }
  });

  // Campos personalizados para registro
  const { data: clientFields = [] } = useQuery({
    queryKey: ["client-fields"],
    queryFn: async () => {
      const res = await api.get("/client-fields");
      return res.data as ClientField[];
    }
  });

  // Servicios para asignación
  const { data: servicesData } = useQuery({
    queryKey: ['services-for-assignment'],
    queryFn: async () => {
      const res = await api.get('/bulk-assignment/services');
      return res.data as { services: Service[] };
    },
  });

  // Empleados para asignación
  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-assignment'],
    queryFn: async () => {
      const res = await api.get('/bulk-assignment/employees');
      return res.data as { employees: Employee[] };
    },
  });

  const services = servicesData?.services || [];
  const employees = employeesData?.employees || filterOptions?.employees || [];

  // Clientes a mostrar
  const clients: Client[] = filters.length > 0
    ? (filterMutation.data?.clients || [])
    : allClients;

  // ============ MUTATIONS ============
  // Asignar cliente individual
  const assignMutation = useMutation({
    mutationFn: async ({ clientId, userId }: { clientId: number; userId: number | null }) => {
      await api.patch(`/client-management/${clientId}/assign`, { assignedToUserId: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-management"] });
    }
  });

  // Asignación masiva a empleado
  const bulkAssignMutation = useMutation({
    mutationFn: async ({ clientIds, userId }: { clientIds: number[]; userId: number | null }) => {
      await api.post("/client-management/bulk-assign", { clientIds, assignedToUserId: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      setSelectedClients([]);
      setShowBulkAssignModal(false);
      setBulkAssignUserId(null);
    }
  });

  // Asignar tareas en masa
  const assignTasksMutation = useMutation({
    mutationFn: async (data: {
      clientIds: number[]; serviceId: number; assignedTo: number | null;
      dueDate: string | null; notes: string; priority: string;
    }) => {
      const res = await api.post('/bulk-assignment/assign-tasks', data);
      return res.data;
    },
    onSuccess: (data) => {
      alert(`Se crearon ${data.created} tareas exitosamente`);
      setShowAssignTaskModal(false);
      setSelectedClients([]);
      setAssignTaskForm({ serviceId: '', assignedTo: '', dueDate: '', priority: 'medium', notes: '' });
      queryClient.invalidateQueries({ queryKey: ["pool-items"] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al asignar tareas');
    }
  });

  // Actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async ({ clientId, data }: { clientId: number; data: any }) => {
      await api.patch(`/client-management/${clientId}/profile`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-management"] });
      setShowEditProfileModal(false);
      setEditingClient(null);
    }
  });

  // Reset password - genera contraseña temporal
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ clientId, generateRandom }: {
      clientId: number; generateRandom?: boolean
    }) => {
      const res = await api.post(`/clients/${clientId}/reset-password`, { generateRandom });
      return res.data;
    },
    onSuccess: (data) => {
      // El backend ahora devuelve temporaryPassword
      setGeneratedPassword(data.temporaryPassword);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error al generar contraseña temporal');
    }
  });

  // Pool mutations
  const takePoolTaskMutation = useMutation({
    mutationFn: async (itemId: number) => { await api.patch(`/pool/${itemId}/take`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pool-items"] }); }
  });

  const completePoolTaskMutation = useMutation({
    mutationFn: async (itemId: number) => { await api.patch(`/pool/${itemId}/complete`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pool-items"] }); }
  });

  const addPoolTaskMutation = useMutation({
    mutationFn: async (data: any) => { await api.post("/pool", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pool-items"] });
      setShowAddPoolTaskModal(false);
      setPoolTaskForm({ clientUserId: "", description: "", priority: "normal" });
    }
  });

  // Crear cliente
  const createClientMutation = useMutation({
    mutationFn: async (data: any) => { await api.post("/client-fields/create-client", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      setShowCreateClientModal(false);
      setCreateClientForm({ fullName: "", email: "", password: "", nit: "", phoneNumber: "", customFields: {} });
    }
  });

  // ============ HANDLERS ============
  const addFilter = () => {
    setFilters([...filters, { field: '', operator: 'contains', value: '' }]);
  };

  const updateFilter = (index: number, updates: Partial<Filter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const applyFilters = () => {
    const validFilters = filters.filter(f => f.field && f.value);
    if (validFilters.length > 0) {
      filterMutation.mutate(validFilters);
    }
    setSelectedClients([]);
  };

  const clearFilters = () => {
    setFilters([]);
    filterMutation.reset();
    setSelectedClients([]);
  };

  const toggleClientSelection = (clientId: number) => {
    setSelectedClients(prev =>
      prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
    );
  };

  const toggleAllClients = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map(c => c.id));
    }
  };

  const handleEditProfile = (client: Client) => {
    setEditingClient(client);
    setProfileForm({
      fullName: client.full_name || "",
      email: client.email || "",
      nit: client.nit || "",
      phoneNumber: client.phone_number || "",
      sede: client.sede || "",
      grupo: client.grupo || "",
      contractNumber: client.contract_number || "",
      isActive: client.is_active === 1 || client.is_active === true
    });
    setShowEditProfileModal(true);
  };

  const handleResetPassword = (client: Client) => {
    setResetPasswordClient(client);
    setResetPasswordMode('random');
    setManualPassword('');
    setGeneratedPassword(null);
    setShowResetPasswordModal(true);
  };

  const executeResetPassword = () => {
    if (!resetPasswordClient) return;
    // Siempre genera contraseña temporal aleatoria
    resetPasswordMutation.mutate({ clientId: resetPasswordClient.id, generateRandom: true });
  };

  const handleAssignTasks = () => {
    if (!assignTaskForm.serviceId) {
      alert('Debe seleccionar un servicio');
      return;
    }
    assignTasksMutation.mutate({
      clientIds: selectedClients,
      serviceId: parseInt(assignTaskForm.serviceId),
      assignedTo: assignTaskForm.assignedTo ? parseInt(assignTaskForm.assignedTo) : null,
      dueDate: assignTaskForm.dueDate || null,
      notes: assignTaskForm.notes,
      priority: assignTaskForm.priority,
    });
  };

  const getFieldOptions = (field: FilterField) => {
    if (field.type !== 'select' || !field.options) return [];
    if (typeof field.options[0] === 'string') {
      return (field.options as string[]).map(o => ({ value: o, label: o }));
    }
    return (field.options as { id: number; name: string }[]).map(o => ({
      value: o.id.toString(), label: o.name,
    }));
  };

  const activePoolItems = poolItems.filter((i: PoolItem) =>
    i.status === 'pending' || i.status === 'in_progress'
  );

  // ============ RENDER ============
  return (
    <div className="p-6 space-y-6 bg-slate-800 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Gestión de Clientes</h1>
        <button
          onClick={() => setShowCreateClientModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700"
        >
          + Nuevo Cliente
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
        <nav className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-orange-400 border-b-2 border-orange-500'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.id === 'pool' && activePoolItems.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-orange-600 text-white rounded-full">
                  {activePoolItems.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filtros Avanzados (visible en tabs clientes y asignar tareas) */}
      {(activeTab === 'clients' || activeTab === 'assign-tasks') && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              Filtros Avanzados
              {filters.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-orange-600 text-white rounded-full">
                  {filters.length}
                </span>
              )}
            </h2>
            <button
              onClick={addFilter}
              className="px-3 py-1.5 text-sm bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
            >
              + Agregar Filtro
            </button>
          </div>

          {filters.length === 0 ? (
            <p className="text-slate-500 text-center py-4">
              Agrega filtros para buscar clientes por cualquier campo.
            </p>
          ) : (
            <div className="space-y-3">
              {filters.map((filter, index) => {
                const selectedField = filterableFields.find(f => f.key === filter.field);
                return (
                  <div key={index} className="flex gap-3 items-center">
                    <select
                      value={filter.field}
                      onChange={(e) => updateFilter(index, { field: e.target.value, value: '' })}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                    >
                      <option value="">Seleccionar campo...</option>
                      {filterableFields.map(f => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>

                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(index, { operator: e.target.value })}
                      className="w-40 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                      disabled={selectedField?.type === 'select'}
                    >
                      {OPERATORS.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>

                    {selectedField?.type === 'select' ? (
                      <select
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                      >
                        <option value="">Seleccionar...</option>
                        {getFieldOptions(selectedField).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, { value: e.target.value })}
                        placeholder="Valor..."
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                      />
                    )}

                    <button
                      onClick={() => removeFilter(index)}
                      className="p-2 text-red-400 hover:text-red-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700">
            <button
              onClick={applyFilters}
              disabled={filterMutation.isPending}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50"
            >
              {filterMutation.isPending ? 'Buscando...' : 'Buscar Clientes'}
            </button>
            {filters.length > 0 && (
              <button onClick={clearFilters} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
                Limpiar Filtros
              </button>
            )}
            {(clients.length > 0 || filterMutation.data) && (
              <span className="ml-auto text-slate-400 self-center">
                {clients.length} clientes encontrados
              </span>
            )}
          </div>
        </div>
      )}

      {/* Barra de acciones masivas */}
      {selectedClients.length > 0 && (activeTab === 'clients' || activeTab === 'assign-tasks') && (
        <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-4 flex items-center justify-between">
          <span className="text-orange-300 font-medium">
            {selectedClients.length} cliente{selectedClients.length > 1 ? 's' : ''} seleccionado{selectedClients.length > 1 ? 's' : ''}
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkAssignModal(true)}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
            >
              Asignar a Empleado
            </button>
            <button
              onClick={() => setShowAssignTaskModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700"
            >
              Asignar Tarea
            </button>
          </div>
        </div>
      )}

      {/* Tab: Clientes */}
      {activeTab === 'clients' && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
          {isLoadingClients && filters.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Cargando clientes...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={clients.length > 0 && selectedClients.length === clients.length}
                      onChange={toggleAllClients}
                      className="rounded border-slate-600 bg-slate-700 text-orange-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">NIT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Teléfono</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Asignado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className={`hover:bg-slate-800/50 ${selectedClients.includes(client.id) ? 'bg-orange-900/20' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.id)}
                        onChange={() => toggleClientSelection(client.id)}
                        className="rounded border-slate-600 bg-slate-700 text-orange-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/clients/${client.id}`} className="text-orange-400 hover:text-orange-300 font-medium">
                        {client.full_name}
                      </Link>
                      <p className="text-sm text-slate-400">{client.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{client.nit || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{client.phone_number || '-'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={client.assigned_to_user_id || ""}
                        onChange={(e) => {
                          const userId = e.target.value ? parseInt(e.target.value) : null;
                          assignMutation.mutate({ clientId: client.id, userId });
                        }}
                        className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                      >
                        <option value="">Pool</option>
                        {employees.map((emp: Employee) => (
                          <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 text-xs rounded ${
                        client.is_active ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                      }`}>
                        {client.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditProfile(client)}
                          className="text-sm text-blue-400 hover:text-blue-300"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleResetPassword(client)}
                          className="text-sm text-yellow-400 hover:text-yellow-300"
                          title="Restablecer Contraseña"
                        >
                          🔑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {clients.length === 0 && !isLoadingClients && (
            <div className="p-8 text-center text-slate-400">No se encontraron clientes</div>
          )}
        </div>
      )}

      {/* Tab: Asignar Tareas */}
      {activeTab === 'assign-tasks' && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <div className="text-center text-slate-400 mb-6">
            <p className="text-lg">Selecciona clientes usando los filtros arriba</p>
            <p className="text-sm mt-2">
              {selectedClients.length > 0
                ? `${selectedClients.length} cliente(s) seleccionado(s)`
                : 'Ningún cliente seleccionado'}
            </p>
          </div>

          {selectedClients.length > 0 && (
            <div className="max-w-xl mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Servicio *</label>
                <select
                  value={assignTaskForm.serviceId}
                  onChange={(e) => setAssignTaskForm({ ...assignTaskForm, serviceId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">Seleccionar servicio...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.service_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Asignar a (opcional)</label>
                <select
                  value={assignTaskForm.assignedTo}
                  onChange={(e) => setAssignTaskForm({ ...assignTaskForm, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">Sin asignar (Pool)</option>
                  {employees.map((e: Employee) => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Fecha límite</label>
                  <input
                    type="date"
                    value={assignTaskForm.dueDate}
                    onChange={(e) => setAssignTaskForm({ ...assignTaskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Prioridad</label>
                  <select
                    value={assignTaskForm.priority}
                    onChange={(e) => setAssignTaskForm({ ...assignTaskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notas</label>
                <textarea
                  value={assignTaskForm.notes}
                  onChange={(e) => setAssignTaskForm({ ...assignTaskForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  rows={3}
                  placeholder="Instrucciones adicionales..."
                />
              </div>

              <button
                onClick={handleAssignTasks}
                disabled={!assignTaskForm.serviceId || assignTasksMutation.isPending}
                className="w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50"
              >
                {assignTasksMutation.isPending
                  ? 'Asignando...'
                  : `Crear ${selectedClients.length} Tarea${selectedClients.length > 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Pool de Tareas */}
      {activeTab === 'pool' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddPoolTaskModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700"
            >
              + Agregar Tarea
            </button>
          </div>

          {activePoolItems.length === 0 ? (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center text-slate-400">
              No hay tareas en el pool
            </div>
          ) : (
            <div className="space-y-3">
              {activePoolItems.map((item: PoolItem) => (
                <div key={item.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{item.client_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${priorityColors[item.priority]}`}>
                          {item.priority}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded border ${statusColors[item.status]}`}>
                          {item.status === 'pending' ? 'Pendiente' : 'En progreso'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{item.client_email}</p>
                      <p className="text-sm text-slate-300 mt-2">{item.description}</p>
                      {item.assigned_to_name && (
                        <p className="text-xs text-blue-400 mt-1">Asignada a: {item.assigned_to_name}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {item.status === 'pending' && (
                        <button
                          onClick={() => takePoolTaskMutation.mutate(item.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                        >
                          Tomar
                        </button>
                      )}
                      {item.status === 'in_progress' && (
                        <button
                          onClick={() => completePoolTaskMutation.mutate(item.id)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                        >
                          Completar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ MODALES ============ */}

      {/* Modal: Asignar a Empleado */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">
              Asignar {selectedClients.length} clientes
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Asignar a:</label>
                <select
                  value={bulkAssignUserId || ""}
                  onChange={(e) => setBulkAssignUserId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">Pool Compartido</option>
                  {employees.map((emp: Employee) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowBulkAssignModal(false); setBulkAssignUserId(null); }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => bulkAssignMutation.mutate({ clientIds: selectedClients, userId: bulkAssignUserId })}
                  disabled={bulkAssignMutation.isPending}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg disabled:opacity-50"
                >
                  {bulkAssignMutation.isPending ? "Asignando..." : "Asignar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Perfil */}
      {showEditProfileModal && editingClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-white mb-4">Editar Cliente</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">NIT</label>
                  <input
                    type="text"
                    value={profileForm.nit}
                    onChange={(e) => setProfileForm({ ...profileForm, nit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Teléfono</label>
                  <input
                    type="text"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Sede</label>
                  <input
                    type="text"
                    value={profileForm.sede}
                    onChange={(e) => setProfileForm({ ...profileForm, sede: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Grupo</label>
                  <input
                    type="text"
                    value={profileForm.grupo}
                    onChange={(e) => setProfileForm({ ...profileForm, grupo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">No. Contrato</label>
                  <input
                    type="text"
                    value={profileForm.contractNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, contractNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileForm.isActive}
                  onChange={(e) => setProfileForm({ ...profileForm, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-orange-600"
                />
                <span className="text-sm font-medium text-slate-300">Cliente activo</span>
              </label>
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
                <button
                  onClick={() => { setShowEditProfileModal(false); setEditingClient(null); }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => updateProfileMutation.mutate({ clientId: editingClient.id, data: profileForm })}
                  disabled={updateProfileMutation.isPending}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {showResetPasswordModal && resetPasswordClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🔑</span>
              Generar Contraseña Temporal
            </h2>

            {!generatedPassword ? (
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-slate-300"><strong>Cliente:</strong> {resetPasswordClient.full_name}</p>
                  <p className="text-slate-400 text-sm"><strong>NIT:</strong> {resetPasswordClient.nit || 'N/A'}</p>
                  {resetPasswordClient.email && (
                    <p className="text-slate-400 text-sm"><strong>Email:</strong> {resetPasswordClient.email}</p>
                  )}
                </div>

                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                  <p className="text-blue-300 text-sm font-medium mb-2">¿Cómo funciona?</p>
                  <ul className="text-blue-200/80 text-sm space-y-1">
                    <li>1. Se generará una contraseña temporal segura</li>
                    <li>2. El cliente deberá cambiarla al iniciar sesión</li>
                    <li>3. La nueva contraseña será elegida por el cliente</li>
                  </ul>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    onClick={() => { setShowResetPasswordModal(false); setResetPasswordClient(null); }}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={executeResetPassword}
                    disabled={resetPasswordMutation.isPending}
                    className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {resetPasswordMutation.isPending ? "Generando..." : "Generar Contraseña"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-900 rounded-full mb-3">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-400 font-medium mb-3">Contraseña temporal generada</p>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-2">Contraseña temporal:</p>
                    <p className="text-2xl font-mono text-white tracking-wider select-all bg-slate-700 px-4 py-2 rounded">{generatedPassword}</p>
                  </div>
                </div>

                <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 space-y-2">
                  <p className="text-amber-400 text-sm font-medium flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Instrucciones para el cliente:
                  </p>
                  <ul className="text-amber-200/80 text-sm space-y-1 ml-7">
                    <li>• Comunique esta contraseña de forma segura</li>
                    <li>• Al iniciar sesión, deberá crear una nueva</li>
                    <li>• Esta contraseña no se mostrará nuevamente</li>
                  </ul>
                </div>

                {resetPasswordClient.email && (
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <p className="text-slate-400 text-xs">
                      El cliente también puede usar "Olvidé mi contraseña" para recibir un enlace en su email.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setResetPasswordClient(null);
                    setGeneratedPassword(null);
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-lg hover:from-slate-600 hover:to-slate-500"
                >
                  Entendido, cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Agregar Tarea al Pool */}
      {showAddPoolTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">Agregar Tarea al Pool</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cliente</label>
                <select
                  value={poolTaskForm.clientUserId}
                  onChange={(e) => setPoolTaskForm({ ...poolTaskForm, clientUserId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">Seleccionar cliente...</option>
                  {allClients.map((c: Client) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Descripción</label>
                <textarea
                  value={poolTaskForm.description}
                  onChange={(e) => setPoolTaskForm({ ...poolTaskForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="Describe la tarea..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Prioridad</label>
                <select
                  value={poolTaskForm.priority}
                  onChange={(e) => setPoolTaskForm({ ...poolTaskForm, priority: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                >
                  <option value="baja">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowAddPoolTaskModal(false); setPoolTaskForm({ clientUserId: "", description: "", priority: "normal" }); }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => addPoolTaskMutation.mutate({
                    clientUserId: parseInt(poolTaskForm.clientUserId),
                    description: poolTaskForm.description,
                    priority: poolTaskForm.priority
                  })}
                  disabled={addPoolTaskMutation.isPending || !poolTaskForm.clientUserId || !poolTaskForm.description}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg disabled:opacity-50"
                >
                  {addPoolTaskMutation.isPending ? "Agregando..." : "Agregar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear Cliente */}
      {showCreateClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-white mb-4">Nuevo Cliente</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={createClientForm.fullName}
                    onChange={(e) => setCreateClientForm({ ...createClientForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={createClientForm.email}
                    onChange={(e) => setCreateClientForm({ ...createClientForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">NIT</label>
                  <input
                    type="text"
                    value={createClientForm.nit}
                    onChange={(e) => setCreateClientForm({ ...createClientForm, nit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={createClientForm.phoneNumber}
                    onChange={(e) => setCreateClientForm({ ...createClientForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Contraseña <span className="text-slate-500">(vacío = "Cliente123!")</span>
                  </label>
                  <input
                    type="password"
                    value={createClientForm.password}
                    onChange={(e) => setCreateClientForm({ ...createClientForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                    placeholder="Dejar vacío para usar contraseña por defecto"
                  />
                </div>
              </div>

              {clientFields.filter(f => f.show_in_registration).length > 0 && (
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Información adicional</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientFields.filter(f => f.show_in_registration).map(field => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {field.field_label} {field.is_required && <span className="text-orange-400">*</span>}
                        </label>
                        {field.field_type === 'select' ? (
                          <select
                            value={createClientForm.customFields[field.field_key] || ''}
                            onChange={(e) => setCreateClientForm({
                              ...createClientForm,
                              customFields: { ...createClientForm.customFields, [field.field_key]: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                          >
                            <option value="">Seleccionar...</option>
                            {field.select_options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : 'text'}
                            value={createClientForm.customFields[field.field_key] || ''}
                            onChange={(e) => setCreateClientForm({
                              ...createClientForm,
                              customFields: { ...createClientForm.customFields, [field.field_key]: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                            placeholder={field.placeholder || ''}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
                <button
                  onClick={() => { setShowCreateClientModal(false); setCreateClientForm({ fullName: "", email: "", password: "", nit: "", phoneNumber: "", customFields: {} }); }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => createClientMutation.mutate({
                    fullName: createClientForm.fullName,
                    email: createClientForm.email,
                    password: createClientForm.password || undefined,
                    nit: createClientForm.nit || undefined,
                    phoneNumber: createClientForm.phoneNumber || undefined,
                    customFields: createClientForm.customFields
                  })}
                  disabled={createClientMutation.isPending || !createClientForm.fullName || !createClientForm.email}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg disabled:opacity-50"
                >
                  {createClientMutation.isPending ? "Creando..." : "Crear Cliente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Asignar Tarea (desde barra de acciones) */}
      {showAssignTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              Asignar Tarea a {selectedClients.length} Cliente{selectedClients.length > 1 ? 's' : ''}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Servicio *</label>
                <select
                  value={assignTaskForm.serviceId}
                  onChange={(e) => setAssignTaskForm({ ...assignTaskForm, serviceId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">Seleccionar servicio...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.service_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Asignar a</label>
                <select
                  value={assignTaskForm.assignedTo}
                  onChange={(e) => setAssignTaskForm({ ...assignTaskForm, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">Sin asignar (Pool)</option>
                  {employees.map((e: Employee) => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Fecha límite</label>
                  <input
                    type="date"
                    value={assignTaskForm.dueDate}
                    onChange={(e) => setAssignTaskForm({ ...assignTaskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Prioridad</label>
                  <select
                    value={assignTaskForm.priority}
                    onChange={(e) => setAssignTaskForm({ ...assignTaskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notas</label>
                <textarea
                  value={assignTaskForm.notes}
                  onChange={(e) => setAssignTaskForm({ ...assignTaskForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setShowAssignTaskModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssignTasks}
                  disabled={!assignTaskForm.serviceId || assignTasksMutation.isPending}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg disabled:opacity-50"
                >
                  {assignTasksMutation.isPending ? 'Asignando...' : `Crear ${selectedClients.length} Tarea${selectedClients.length > 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
