import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { Link } from "react-router-dom";

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

type Client = {
  id: number;
  full_name: string;
  email: string;
  nit: string | null;
  phone_number: string | null;
  is_active: number;
  assigned_to_user_id: number | null;
  assigned_to_name: string | null;
  sede: string | null;
  grupo: string | null;
  contract_number: string | null;
  active_infractions_count: number;
  services_disabled_by_infractions: number;
};

type Employee = {
  id: number;
  full_name: string;
};

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
  completed_by_user_id: number | null;
  completed_by_name: string | null;
  created_at: string;
  updated_at: string;
};

type GroupedClients = {
  [key: string]: Client[];
};

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

export default function ClientsPage() {
  const queryClient = useQueryClient();

  // Filtros
  const [filters, setFilters] = useState({
    sede: "",
    grupo: "",
    assignedTo: "all",
    isActive: "true",
    searchTerm: ""
  });

  // Vista agrupada solo cuando no hay filtros activos
  const hasActiveFilters = filters.sede || filters.grupo || filters.searchTerm || filters.assignedTo !== "all";

  // Para selección masiva
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignUserId, setBulkAssignUserId] = useState<number | null>(null);

  // Para edición de perfil
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    nit: "",
    phoneNumber: "",
    sede: "",
    grupo: "",
    contractNumber: "",
    isActive: true
  });

  // Para pool tasks
  const [showAddPoolTaskModal, setShowAddPoolTaskModal] = useState(false);
  const [poolTaskForm, setPoolTaskForm] = useState({
    clientUserId: "",
    description: "",
    priority: "normal" as "baja" | "normal" | "alta" | "urgente"
  });

  // Para crear nuevo cliente
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [createClientForm, setCreateClientForm] = useState<{
    fullName: string;
    email: string;
    password: string;
    nit: string;
    phoneNumber: string;
    customFields: Record<string, string>;
  }>({
    fullName: "",
    email: "",
    password: "",
    nit: "",
    phoneNumber: "",
    customFields: {}
  });

  // Expandir/colapsar grupos
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Fetch clientes
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["client-management", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.sede) params.append("sede", filters.sede);
      if (filters.grupo) params.append("grupo", filters.grupo);
      if (filters.assignedTo) params.append("assignedTo", filters.assignedTo);
      if (filters.isActive) params.append("isActive", filters.isActive);
      if (filters.searchTerm) params.append("searchTerm", filters.searchTerm);

      const res = await api.get(`/client-management?${params}`);
      return res.data;
    }
  });

  // Fetch pool items
  const { data: poolItems = [] } = useQuery({
    queryKey: ["pool-items"],
    queryFn: async () => {
      const res = await api.get("/pool");
      return res.data;
    }
  });

  // Fetch opciones de filtros
  const { data: filterOptions } = useQuery({
    queryKey: ["client-management-filters"],
    queryFn: async () => {
      const res = await api.get("/client-management/filter-options");
      return res.data;
    }
  });

  // Fetch custom fields para registro
  const { data: clientFields = [] } = useQuery({
    queryKey: ["client-fields"],
    queryFn: async () => {
      const res = await api.get("/client-fields");
      return res.data as ClientField[];
    }
  });

  // Asignar cliente individual
  const assignMutation = useMutation({
    mutationFn: async ({ clientId, userId }: { clientId: number; userId: number | null }) => {
      await api.patch(`/client-management/${clientId}/assign`, {
        assignedToUserId: userId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-management"] });
    }
  });

  // Asignación masiva
  const bulkAssignMutation = useMutation({
    mutationFn: async ({ clientIds, userId }: { clientIds: number[]; userId: number | null }) => {
      await api.post("/client-management/bulk-assign", {
        clientIds,
        assignedToUserId: userId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-management"] });
      setSelectedClients([]);
      setShowBulkAssignModal(false);
      setBulkAssignUserId(null);
    }
  });

  // Actualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async ({ clientId, data }: { clientId: number; data: any }) => {
      await api.patch(`/client-management/${clientId}/profile`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-management"] });
      setEditingClient(null);
    }
  });

  // Tomar tarea del pool
  const takePoolTaskMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await api.patch(`/pool/${itemId}/take`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pool-items"] });
    }
  });

  // Completar tarea del pool
  const completePoolTaskMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await api.patch(`/pool/${itemId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pool-items"] });
    }
  });

  // Agregar tarea al pool
  const addPoolTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/pool", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pool-items"] });
      setShowAddPoolTaskModal(false);
      setPoolTaskForm({ clientUserId: "", description: "", priority: "normal" });
    }
  });

  // Crear nuevo cliente
  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/client-fields/create-client", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-management"] });
      setShowCreateClientModal(false);
      setCreateClientForm({
        fullName: "",
        email: "",
        password: "",
        nit: "",
        phoneNumber: "",
        customFields: {}
      });
    }
  });

  // Agrupar clientes
  const groupedClients: GroupedClients = clients.reduce((acc: GroupedClients, client: Client) => {
    let key: string;
    if (client.assigned_to_user_id === null) {
      key = "pool";
    } else {
      key = `employee-${client.assigned_to_user_id}`;
    }

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(client);
    return acc;
  }, {});

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  const handleBulkAssign = () => {
    if (selectedClients.length === 0) return;
    bulkAssignMutation.mutate({
      clientIds: selectedClients,
      userId: bulkAssignUserId
    });
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
      isActive: client.is_active === 1
    });
  };

  const handleSaveProfile = () => {
    if (!editingClient) return;
    updateProfileMutation.mutate({
      clientId: editingClient.id,
      data: profileForm
    });
  };

  const handleAddPoolTask = () => {
    if (!poolTaskForm.clientUserId || !poolTaskForm.description) return;
    addPoolTaskMutation.mutate({
      clientUserId: parseInt(poolTaskForm.clientUserId),
      description: poolTaskForm.description,
      priority: poolTaskForm.priority
    });
  };

  const handleCreateClient = () => {
    if (!createClientForm.fullName || !createClientForm.email) return;
    createClientMutation.mutate({
      fullName: createClientForm.fullName,
      email: createClientForm.email,
      password: createClientForm.password || undefined,
      nit: createClientForm.nit || undefined,
      phoneNumber: createClientForm.phoneNumber || undefined,
      customFields: createClientForm.customFields
    });
  };

  const renderCustomFieldInput = (field: ClientField) => {
    const value = createClientForm.customFields[field.field_key] || '';

    switch (field.field_type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setCreateClientForm({
              ...createClientForm,
              customFields: { ...createClientForm.customFields, [field.field_key]: e.target.value }
            })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
            required={field.is_required}
          >
            <option value="">Seleccionar...</option>
            {field.select_options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => setCreateClientForm({
              ...createClientForm,
              customFields: { ...createClientForm.customFields, [field.field_key]: e.target.value }
            })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
            placeholder={field.placeholder || ''}
            rows={3}
            required={field.is_required}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={(e) => setCreateClientForm({
                ...createClientForm,
                customFields: { ...createClientForm.customFields, [field.field_key]: e.target.checked ? 'true' : 'false' }
              })}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-slate-300">{field.field_label}</span>
          </label>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setCreateClientForm({
              ...createClientForm,
              customFields: { ...createClientForm.customFields, [field.field_key]: e.target.value }
            })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
            required={field.is_required}
          />
        );

      default:
        return (
          <input
            type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : field.field_type === 'number' ? 'number' : 'text'}
            value={value}
            onChange={(e) => setCreateClientForm({
              ...createClientForm,
              customFields: { ...createClientForm.customFields, [field.field_key]: e.target.value }
            })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
            placeholder={field.placeholder || ''}
            required={field.is_required}
          />
        );
    }
  };

  const toggleSelectClient = (clientId: number) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map((c: Client) => c.id));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-slate-800 min-h-screen">
        <div className="text-white">Cargando clientes...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-800 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Gestión de Clientes</h1>
        <div className="flex gap-3">
          {selectedClients.length > 0 && (
            <button
              onClick={() => setShowBulkAssignModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all"
            >
              Asignar {selectedClients.length} seleccionados
            </button>
          )}
          <button
            onClick={() => setShowCreateClientModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            + Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Sede</label>
            <select
              value={filters.sede}
              onChange={(e) => setFilters({ ...filters, sede: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Todas las sedes</option>
              {filterOptions?.sedes?.map((s: any) => (
                <option key={s.sede} value={s.sede}>{s.sede}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Grupo</label>
            <select
              value={filters.grupo}
              onChange={(e) => setFilters({ ...filters, grupo: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Todos los grupos</option>
              {filterOptions?.grupos?.map((g: any) => (
                <option key={g.grupo} value={g.grupo}>{g.grupo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Asignado a</label>
            <select
              value={filters.assignedTo}
              onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="unassigned">Sin asignar (Pool)</option>
              {filterOptions?.employees?.map((emp: Employee) => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Estado</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Nombre, email o NIT..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => setFilters({ sede: "", grupo: "", assignedTo: "all", isActive: "true", searchTerm: "" })}
            className="text-sm text-orange-400 hover:text-orange-300"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Vista agrupada o lista */}
      {!hasActiveFilters ? (
        // Vista agrupada por empleado/pool
        <div className="space-y-4">
          {/* Pool Compartido como grupo especial */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800 transition-colors">
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => toggleGroup("pool-tasks")}
              >
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-lg font-medium text-white">Pool Compartido (Tareas)</span>
                <span className="text-sm text-slate-400">({poolItems.filter((i: PoolItem) => i.status === 'pending' || i.status === 'in_progress').length} tareas activas)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddPoolTaskModal(true)}
                  className="px-3 py-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm rounded hover:from-orange-700 hover:to-amber-700"
                >
                  + Agregar Tarea
                </button>
                <svg
                  className={`w-5 h-5 text-slate-400 transition-transform cursor-pointer ${expandedGroups.has("pool-tasks") ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  onClick={() => toggleGroup("pool-tasks")}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {expandedGroups.has("pool-tasks") && (
              <div className="border-t border-slate-700 p-4">
                {poolItems.filter((i: PoolItem) => i.status !== 'completed' && i.status !== 'cancelled').length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    No hay tareas en el pool
                  </div>
                ) : (
                  <div className="space-y-3">
                    {poolItems
                      .filter((item: PoolItem) => item.status !== 'completed' && item.status !== 'cancelled')
                      .map((item: PoolItem) => (
                        <div key={item.id} className="bg-slate-800 border border-slate-600 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
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
                                <p className="text-xs text-blue-400 mt-1">
                                  Asignada a: {item.assigned_to_name}
                                </p>
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
          </div>

          {/* Clientes sin asignar (Pool) */}
          {groupedClients["pool"] && groupedClients["pool"].length > 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleGroup("pool")}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-lg font-medium text-white">Clientes sin Asignar</span>
                  <span className="text-sm text-slate-400">({groupedClients["pool"].length} clientes)</span>
                </div>
                <svg
                  className={`w-5 h-5 text-slate-400 transition-transform ${expandedGroups.has("pool") ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedGroups.has("pool") && (
                <div className="border-t border-slate-700">
                  <table className="w-full">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Sede</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Grupo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Infracciones</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Asignar a</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {groupedClients["pool"].map((client) => (
                        <tr key={client.id} className="hover:bg-slate-800/50">
                          <td className="px-4 py-3">
                            <Link
                              to={`/admin/clients/${client.id}`}
                              className="text-orange-400 hover:text-orange-300 font-medium"
                            >
                              {client.full_name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm">{client.email}</td>
                          <td className="px-4 py-3 text-slate-300 text-sm">{client.sede || "-"}</td>
                          <td className="px-4 py-3 text-slate-300 text-sm">{client.grupo || "-"}</td>
                          <td className="px-4 py-3">
                            {client.active_infractions_count > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-800">
                                {client.active_infractions_count}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-sm">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={client.assigned_to_user_id || ""}
                              onChange={(e) => {
                                const userId = e.target.value ? parseInt(e.target.value) : null;
                                assignMutation.mutate({ clientId: client.id, userId });
                              }}
                              className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="">Pool</option>
                              {filterOptions?.employees?.map((emp: Employee) => (
                                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleEditProfile(client)}
                              className="text-sm text-blue-400 hover:text-blue-300"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Empleados con sus clientes asignados */}
          {Object.entries(groupedClients)
            .filter(([key]) => key !== "pool")
            .map(([key, groupClients]) => {
              const employeeName = groupClients[0]?.assigned_to_name || "Sin nombre";
              const isExpanded = expandedGroups.has(key);

              return (
                <div key={key} className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleGroup(key)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-lg font-medium text-white">{employeeName}</span>
                      <span className="text-sm text-slate-400">({groupClients.length} clientes)</span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-700">
                      <table className="w-full">
                        <thead className="bg-slate-800/50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Nombre</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Sede</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Grupo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Infracciones</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Asignar a</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          {groupClients.map((client) => (
                            <tr key={client.id} className="hover:bg-slate-800/50">
                              <td className="px-4 py-3">
                                <Link
                                  to={`/admin/clients/${client.id}`}
                                  className="text-orange-400 hover:text-orange-300 font-medium"
                                >
                                  {client.full_name}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-slate-300 text-sm">{client.email}</td>
                              <td className="px-4 py-3 text-slate-300 text-sm">{client.sede || "-"}</td>
                              <td className="px-4 py-3 text-slate-300 text-sm">{client.grupo || "-"}</td>
                              <td className="px-4 py-3">
                                {client.active_infractions_count > 0 ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-800">
                                    {client.active_infractions_count}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-sm">0</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={client.assigned_to_user_id || ""}
                                  onChange={(e) => {
                                    const userId = e.target.value ? parseInt(e.target.value) : null;
                                    assignMutation.mutate({ clientId: client.id, userId });
                                  }}
                                  className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-orange-500"
                                >
                                  <option value="">Pool</option>
                                  {filterOptions?.employees?.map((emp: Employee) => (
                                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => handleEditProfile(client)}
                                  className="text-sm text-blue-400 hover:text-blue-300"
                                >
                                  Editar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

          {Object.keys(groupedClients).length === 0 && poolItems.length === 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 text-center text-slate-400">
              No hay clientes para mostrar
            </div>
          )}
        </div>
      ) : (
        // Vista de lista con selección masiva
        <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedClients.length === clients.length && clients.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-600 bg-slate-700 text-orange-600 focus:ring-orange-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Sede</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Grupo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Asignado a</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Infracciones</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Asignar a</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {clients.map((client: Client) => (
                <tr key={client.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => toggleSelectClient(client.id)}
                      className="rounded border-slate-600 bg-slate-700 text-orange-600 focus:ring-orange-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/clients/${client.id}`}
                      className="text-orange-400 hover:text-orange-300 font-medium"
                    >
                      {client.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{client.email}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{client.sede || "-"}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{client.grupo || "-"}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">
                    {client.assigned_to_name || <span className="text-blue-400">Pool</span>}
                  </td>
                  <td className="px-4 py-3">
                    {client.active_infractions_count > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-800">
                        {client.active_infractions_count}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-sm">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={client.assigned_to_user_id || ""}
                      onChange={(e) => {
                        const userId = e.target.value ? parseInt(e.target.value) : null;
                        assignMutation.mutate({ clientId: client.id, userId });
                      }}
                      className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Pool</option>
                      {filterOptions?.employees?.map((emp: Employee) => (
                        <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {clients.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No se encontraron clientes con los filtros seleccionados
            </div>
          )}
        </div>
      )}

      {/* Modal de asignación masiva */}
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
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Pool Compartido</option>
                  {filterOptions?.employees?.map((emp: Employee) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowBulkAssignModal(false);
                    setBulkAssignUserId(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBulkAssign}
                  disabled={bulkAssignMutation.isPending}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50"
                >
                  {bulkAssignMutation.isPending ? "Asignando..." : "Asignar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de perfil */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-white mb-4">
              Editar Cliente
            </h2>

            <div className="space-y-4">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nombre completo *</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">NIT</label>
                  <input
                    type="text"
                    value={profileForm.nit}
                    onChange={(e) => setProfileForm({ ...profileForm, nit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: 12345678-9"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Teléfono</label>
                  <input
                    type="text"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: +502 1234 5678"
                  />
                </div>
              </div>

              {/* Información organizacional */}
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Información organizacional</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Sede</label>
                    <input
                      type="text"
                      value={profileForm.sede}
                      onChange={(e) => setProfileForm({ ...profileForm, sede: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Grupo</label>
                    <input
                      type="text"
                      value={profileForm.grupo}
                      onChange={(e) => setProfileForm({ ...profileForm, grupo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">No. de contrato</label>
                    <input
                      type="text"
                      value={profileForm.contractNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, contractNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div className="border-t border-slate-700 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileForm.isActive}
                    onChange={(e) => setProfileForm({ ...profileForm, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-slate-300">Cliente activo</span>
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
                <button
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending || !profileForm.fullName || !profileForm.email}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar tarea al pool */}
      {showAddPoolTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">
              Agregar Tarea al Pool
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cliente</label>
                <select
                  value={poolTaskForm.clientUserId}
                  onChange={(e) => setPoolTaskForm({ ...poolTaskForm, clientUserId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map((c: Client) => (
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
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe la tarea..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Prioridad</label>
                <select
                  value={poolTaskForm.priority}
                  onChange={(e) => setPoolTaskForm({ ...poolTaskForm, priority: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="baja">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAddPoolTaskModal(false);
                    setPoolTaskForm({ clientUserId: "", description: "", priority: "normal" });
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddPoolTask}
                  disabled={addPoolTaskMutation.isPending || !poolTaskForm.clientUserId || !poolTaskForm.description}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50"
                >
                  {addPoolTaskMutation.isPending ? "Agregando..." : "Agregar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nuevo cliente */}
      {showCreateClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-white mb-4">
              Nuevo Cliente
            </h2>

            <div className="space-y-4">
              {/* Campos básicos obligatorios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={createClientForm.fullName}
                    onChange={(e) => setCreateClientForm({ ...createClientForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={createClientForm.email}
                    onChange={(e) => setCreateClientForm({ ...createClientForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    NIT
                  </label>
                  <input
                    type="text"
                    value={createClientForm.nit}
                    onChange={(e) => setCreateClientForm({ ...createClientForm, nit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: 12345678-9"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={createClientForm.phoneNumber}
                    onChange={(e) => setCreateClientForm({ ...createClientForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: +502 1234 5678"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Contraseña
                    <span className="text-slate-500 ml-2">(Si no se especifica, se usará "Cliente123!")</span>
                  </label>
                  <input
                    type="password"
                    value={createClientForm.password}
                    onChange={(e) => setCreateClientForm({ ...createClientForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                    placeholder="Dejar vacío para usar contraseña por defecto"
                  />
                </div>
              </div>

              {/* Campos personalizados */}
              {clientFields.filter(f => f.show_in_registration).length > 0 && (
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Información adicional</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientFields
                      .filter(f => f.show_in_registration)
                      .map(field => (
                        <div key={field.id} className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}>
                          {field.field_type !== 'checkbox' && (
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              {field.field_label}
                              {field.is_required && <span className="text-orange-400 ml-1">*</span>}
                            </label>
                          )}
                          {renderCustomFieldInput(field)}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
                <button
                  onClick={() => {
                    setShowCreateClientModal(false);
                    setCreateClientForm({
                      fullName: "",
                      email: "",
                      password: "",
                      nit: "",
                      phoneNumber: "",
                      customFields: {}
                    });
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateClient}
                  disabled={createClientMutation.isPending || !createClientForm.fullName || !createClientForm.email}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                >
                  {createClientMutation.isPending ? "Creando..." : "Crear Cliente"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
