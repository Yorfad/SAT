import { useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

interface Role {
  id: number;
  role_key: string;
  role_name: string;
  description: string | null;
  is_system_role: boolean;
  is_active: boolean;
  permissions_count: number;
  users_count: number;
  active_users_count: number;
  workspace_name: string | null;
  created_in_workspace_id: number | null;
}

interface Action {
  action_id: number;
  action_key: string;
  action_name: string;
  permission_id: number | null;
  granted: boolean;
}

interface PagePermissions {
  page_id: number;
  page_key: string;
  page_name: string;
  description: string;
  actions: Action[];
}

interface PermissionMatrix {
  role: { id: number; role_name: string };
  matrix: PagePermissions[];
  actions: { id: number; action_key: string; action_name: string }[];
}

// Descripciones detalladas de cada acción con ejemplos
const actionDescriptions: Record<string, { icon: string; label: string; shortDesc: string; longDesc: string; examples: string[] }> = {
  view: {
    icon: '👁',
    label: 'Ver',
    shortDesc: 'Ver detalles de un registro específico',
    longDesc: 'Permite acceder a la vista detallada de un registro individual. El usuario puede ver toda la información pero no modificarla.',
    examples: [
      'Ver el perfil completo de un cliente',
      'Consultar los detalles de una factura',
      'Revisar la información de una tarea específica',
    ],
  },
  list: {
    icon: '📋',
    label: 'Listar',
    shortDesc: 'Ver la lista de todos los registros',
    longDesc: 'Permite ver la tabla o listado general de registros. Es el permiso básico para acceder a un módulo.',
    examples: [
      'Ver la tabla de todos los clientes',
      'Acceder al listado de tareas pendientes',
      'Consultar el historial de pagos',
    ],
  },
  create: {
    icon: '➕',
    label: 'Crear',
    shortDesc: 'Crear nuevos registros',
    longDesc: 'Permite agregar nuevos registros al sistema. El usuario verá el botón "Nuevo" o "Agregar" en la interfaz.',
    examples: [
      'Registrar un nuevo cliente',
      'Crear una nueva tarea manual',
      'Agregar un nuevo servicio al catálogo',
    ],
  },
  edit: {
    icon: '✏️',
    label: 'Editar',
    shortDesc: 'Modificar registros existentes',
    longDesc: 'Permite modificar la información de registros ya existentes. El usuario verá el botón "Editar" en cada registro.',
    examples: [
      'Actualizar el teléfono de un cliente',
      'Cambiar la fecha de vencimiento de una tarea',
      'Modificar el precio de un servicio',
    ],
  },
  delete: {
    icon: '🗑️',
    label: 'Eliminar',
    shortDesc: 'Eliminar registros permanentemente',
    longDesc: 'Permite eliminar registros del sistema. Esta acción suele ser irreversible. Use con precaución.',
    examples: [
      'Eliminar un cliente inactivo',
      'Borrar una tarea cancelada',
      'Quitar un servicio descontinuado',
    ],
  },
  assign: {
    icon: '👤',
    label: 'Asignar',
    shortDesc: 'Asignar a empleados o reasignar elementos',
    longDesc: 'Permite asignar registros a otros usuarios del sistema, como asignar clientes a empleados o tareas a responsables.',
    examples: [
      'Asignar un cliente a un empleado',
      'Reasignar tareas entre empleados',
      'Tomar clientes del pool de disponibles',
    ],
  },
  complete: {
    icon: '✅',
    label: 'Completar',
    shortDesc: 'Marcar tareas o procesos como completados',
    longDesc: 'Permite marcar tareas, actividades o procesos como finalizados. Cambia el estado del registro.',
    examples: [
      'Marcar una declaración como presentada',
      'Finalizar una tarea de facturación',
      'Completar un proceso de auditoría',
    ],
  },
  activate: {
    icon: '🟢',
    label: 'Activar',
    shortDesc: 'Activar registros deshabilitados',
    longDesc: 'Permite reactivar registros que fueron previamente desactivados. Restaura el acceso y funcionalidad.',
    examples: [
      'Reactivar un cliente suspendido',
      'Habilitar un servicio pausado',
      'Restaurar un usuario bloqueado',
    ],
  },
  deactivate: {
    icon: '🔴',
    label: 'Desactivar',
    shortDesc: 'Desactivar registros sin eliminarlos',
    longDesc: 'Permite desactivar registros temporalmente sin eliminarlos. Los datos se conservan pero no aparecen en las vistas activas.',
    examples: [
      'Suspender un cliente moroso',
      'Pausar un servicio temporalmente',
      'Deshabilitar un usuario de vacaciones',
    ],
  },
  export: {
    icon: '📤',
    label: 'Exportar',
    shortDesc: 'Descargar datos en Excel, PDF, etc.',
    longDesc: 'Permite descargar los datos del sistema en diferentes formatos. Útil para reportes y análisis externos.',
    examples: [
      'Exportar lista de clientes a Excel',
      'Descargar reporte de pagos en PDF',
      'Generar archivo CSV de tareas',
    ],
  },
  import: {
    icon: '📥',
    label: 'Importar',
    shortDesc: 'Cargar datos desde archivos externos',
    longDesc: 'Permite cargar datos masivos al sistema desde archivos externos. Útil para migraciones y actualizaciones masivas.',
    examples: [
      'Importar lista de clientes desde Excel',
      'Cargar catálogo de servicios',
      'Subir datos de facturación histórica',
    ],
  },
  approve: {
    icon: '✔️',
    label: 'Aprobar',
    shortDesc: 'Aprobar solicitudes o documentos pendientes',
    longDesc: 'Permite aprobar o rechazar solicitudes, documentos o procesos que requieren autorización.',
    examples: [
      'Aprobar solicitud de nuevo servicio',
      'Autorizar un pago pendiente',
      'Validar documentos subidos por cliente',
    ],
  },
  manage: {
    icon: '⚙️',
    label: 'Gestionar',
    shortDesc: 'Acceso administrativo completo al módulo',
    longDesc: 'Otorga acceso administrativo completo al módulo. Incluye configuraciones avanzadas y operaciones especiales no cubiertas por otros permisos.',
    examples: [
      'Configurar opciones del módulo',
      'Acceder a funciones administrativas',
      'Realizar operaciones masivas',
    ],
  },
};

// Descripciones de páginas/módulos - SOLO PÁGINAS REALES DEL SISTEMA
// Las páginas deben coincidir con las rutas del sidebar en AppLayout.tsx
const pageDescriptions: Record<string, { icon: string; label: string; description: string; category?: string }> = {
  // === PANEL PRINCIPAL ===
  dashboard: {
    icon: '📊',
    label: 'Dashboard',
    description: 'Panel principal con métricas y resumen general del negocio',
    category: 'Principal',
  },

  // === GESTIÓN FINANCIERA (página principal con tabs) ===
  financial: {
    icon: '💰',
    label: 'Gestión Financiera',
    description: 'Acceso general a la página de Gestión Financiera',
    category: 'Finanzas',
  },
  'financial-payments': {
    icon: '💳',
    label: 'Gestión Financiera - Pagos',
    description: 'Tab de pagos: registrar cobros, ver pagos pendientes, historial',
    category: 'Finanzas',
  },
  'financial-expenses': {
    icon: '💸',
    label: 'Gestión Financiera - Gastos',
    description: 'Tab de gastos: registrar gastos únicos y recurrentes',
    category: 'Finanzas',
  },
  'financial-infractions': {
    icon: '⚠️',
    label: 'Gestión Financiera - Infracciones',
    description: 'Tab de infracciones: crear y resolver infracciones de clientes',
    category: 'Finanzas',
  },

  // === GESTIÓN DE CLIENTES ===
  'my-clients': {
    icon: '👤',
    label: 'Mis Clientes',
    description: 'Clientes asignados al usuario actual para seguimiento',
    category: 'Clientes',
  },
  clients: {
    icon: '👥',
    label: 'Gestión de Clientes',
    description: 'Administración completa de clientes: crear, editar, ver historial',
    category: 'Clientes',
  },
  'client-fields': {
    icon: '📝',
    label: 'Campos de Cliente',
    description: 'Configurar campos personalizados para perfiles de clientes',
    category: 'Clientes',
  },

  // === TAREAS Y SERVICIOS ===
  tasks: {
    icon: '✅',
    label: 'Tareas Pendientes',
    description: 'Ver y gestionar tareas asignadas, marcar como completadas',
    category: 'Operaciones',
  },
  services: {
    icon: '🛠️',
    label: 'Servicios',
    description: 'Catálogo de servicios: crear, editar precios, configurar recurrencia',
    category: 'Operaciones',
  },
  bundles: {
    icon: '📦',
    label: 'Bundles',
    description: 'Paquetes de servicios predefinidos para asignar a clientes',
    category: 'Operaciones',
  },

  // === ADMINISTRACIÓN ===
  users: {
    icon: '👥',
    label: 'Usuarios',
    description: 'Administrar usuarios del sistema: empleados, admins, clientes',
    category: 'Administración',
  },
  roles: {
    icon: '🔐',
    label: 'Roles y Permisos',
    description: 'Crear roles y asignar permisos granulares',
    category: 'Administración',
  },
  workspaces: {
    icon: '🏢',
    label: 'Workspaces',
    description: 'Administrar espacios de trabajo (sucursales, departamentos)',
    category: 'Administración',
  },
  invitations: {
    icon: '📧',
    label: 'Invitaciones',
    description: 'Códigos de invitación para registro de nuevos clientes',
    category: 'Administración',
  },
  'bulk-assignment': {
    icon: '📋',
    label: 'Asignación Masiva',
    description: 'Asignar tareas a múltiples clientes con filtros avanzados',
    category: 'Administración',
  },
};

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [matrixData, setMatrixData] = useState<PermissionMatrix | null>(null);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const [form, setForm] = useState({
    role_key: '',
    role_name: '',
    description: '',
  });

  // Cargar roles
  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles-permissions/roles?include_stats=true');
      return res.data as { roles: Role[]; roles_per_workspace: boolean };
    },
  });

  const roles = rolesData?.roles || [];
  const rolesPerWorkspace = rolesData?.roles_per_workspace || false;

  // Crear rol
  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return api.post('/roles-permissions/roles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      closeModal();
    },
  });

  // Actualizar rol
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof form> }) => {
      return api.put(`/roles-permissions/roles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      closeModal();
    },
  });

  // Eliminar rol
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/roles-permissions/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  // Cargar matriz de permisos
  const loadMatrix = async (roleId: number) => {
    try {
      const res = await api.get(`/roles-permissions/roles/${roleId}/matrix`);
      setMatrixData(res.data);
      setSelectedRoleId(roleId);
      setShowMatrixModal(true);
    } catch (error) {
      console.error('Error loading matrix:', error);
    }
  };

  // Guardar matriz de permisos
  const saveMatrixMutation = useMutation({
    mutationFn: async ({ roleId, permissions }: { roleId: number; permissions: { permission_id: number; granted: boolean }[] }) => {
      return api.put(`/roles-permissions/roles/${roleId}/matrix`, { permissions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowMatrixModal(false);
      setMatrixData(null);
      setSelectedRoleId(null);
    },
  });

  const handleTogglePermission = (pageIndex: number, actionIndex: number) => {
    if (!matrixData) return;

    const newMatrix = { ...matrixData };
    const action = newMatrix.matrix[pageIndex].actions[actionIndex];
    action.granted = !action.granted;
    setMatrixData(newMatrix);
  };

  // Marcar/desmarcar toda una fila
  const toggleRow = (pageIndex: number, grant: boolean) => {
    if (!matrixData) return;
    const newMatrix = { ...matrixData };
    newMatrix.matrix[pageIndex].actions.forEach((action) => {
      if (action.permission_id) {
        action.granted = grant;
      }
    });
    setMatrixData(newMatrix);
  };

  const handleSaveMatrix = () => {
    if (!matrixData || !selectedRoleId) return;

    const permissions: { permission_id: number; granted: boolean }[] = [];
    matrixData.matrix.forEach((page) => {
      page.actions.forEach((action) => {
        if (action.permission_id) {
          permissions.push({
            permission_id: action.permission_id,
            granted: action.granted,
          });
        }
      });
    });

    saveMatrixMutation.mutate({ roleId: selectedRoleId, permissions });
  };

  const handleDelete = (role: Role) => {
    if (role.is_system_role) {
      alert('No se pueden eliminar roles del sistema');
      return;
    }
    if (confirm(`¿Estás seguro de eliminar el rol "${role.role_name}"?`)) {
      deleteMutation.mutate(role.id);
    }
  };

  const openNewModal = () => {
    setEditingRole(null);
    setForm({ role_key: '', role_name: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (role: Role) => {
    if (role.is_system_role) {
      alert('No se pueden editar roles del sistema');
      return;
    }
    setEditingRole(role);
    setForm({
      role_key: role.role_key,
      role_name: role.role_name,
      description: role.description || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setForm({ role_key: '', role_name: '', description: '' });
  };

  const handleSubmit = () => {
    if (!form.role_key || !form.role_name) {
      alert('El key y nombre del rol son requeridos');
      return;
    }

    if (editingRole) {
      updateMutation.mutate({
        id: editingRole.id,
        data: { role_name: form.role_name, description: form.description },
      });
    } else {
      createMutation.mutate(form);
    }
  };

  const getActionInfo = (actionKey: string) => {
    return actionDescriptions[actionKey] || { icon: '❓', label: actionKey, shortDesc: '', longDesc: '', examples: [] };
  };

  const getPageInfo = (pageKey: string) => {
    return pageDescriptions[pageKey] || { icon: '📄', label: pageKey, description: '' };
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-slate-800 min-h-screen">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-white">Gestión de Roles</h1>
          <p className="text-slate-400 text-sm mt-1">
            Crea y administra roles personalizados con permisos específicos
            {rolesPerWorkspace && (
              <span className="ml-2 px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs">
                Modo: Roles por Workspace
              </span>
            )}
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 whitespace-nowrap"
        >
          + Nuevo Rol
        </button>
      </div>

      {/* Lista de roles */}
      <div className="grid gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className={`bg-slate-900 border border-slate-700 rounded-lg p-4 ${
              role.is_system_role ? 'border-l-4 border-l-purple-500' : ''
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-medium text-white">{role.role_name}</h3>
                  <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-0.5 rounded">
                    {role.role_key}
                  </span>
                  {role.is_system_role && (
                    <span className="px-2 py-0.5 bg-purple-900/50 text-purple-300 text-xs rounded">
                      Sistema
                    </span>
                  )}
                  {role.workspace_name && (
                    <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs rounded">
                      {role.workspace_name}
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mt-1 truncate">
                  {role.description || 'Sin descripción'}
                </p>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-slate-500">
                    <span className="text-white font-medium">{role.permissions_count}</span> permisos
                  </span>
                  <span className="text-slate-500">
                    <span className="text-white font-medium">{role.active_users_count}</span> usuarios
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loadMatrix(role.id)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Permisos
                </button>
                {!role.is_system_role && (
                  <>
                    <button
                      onClick={() => openEditModal(role)}
                      className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded hover:bg-slate-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(role)}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1.5 bg-red-600/20 text-red-400 text-sm rounded hover:bg-red-600/30 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {roles.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No hay roles definidos. Crea uno nuevo para empezar.
          </div>
        )}
      </div>

      {/* Modal crear/editar rol */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Identificador (key) *
                </label>
                <input
                  type="text"
                  value={form.role_key}
                  onChange={(e) => setForm({ ...form, role_key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono"
                  placeholder="ej: miniadmin, contador"
                  disabled={!!editingRole}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Solo letras minúsculas, números, guiones y guiones bajos
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre del Rol *
                </label>
                <input
                  type="text"
                  value={form.role_name}
                  onChange={(e) => setForm({ ...form, role_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="ej: Mini Administrador"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="Describe qué puede hacer este rol..."
                  rows={3}
                />
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
                  disabled={!form.role_key || !form.role_name || createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal matriz de permisos - MEJORADO */}
      {showMatrixModal && matrixData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-[98vw] xl:max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-slate-700 flex-shrink-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-white">
                    Permisos: {matrixData.role.role_name}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Haz clic en las celdas para activar/desactivar permisos
                  </p>
                </div>
                {/* Indicador de ayuda */}
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="text-blue-400">💡</span>
                  Pasa el mouse sobre los iconos de acción para ver la descripción
                </div>
              </div>
            </div>

            {/* Panel de ayuda flotante - visible en hover sobre acciones */}
            {hoveredAction && (
              <div className="hidden md:block fixed top-24 right-8 z-50 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{getActionInfo(hoveredAction).icon}</span>
                    <div>
                      <h4 className="font-semibold text-white text-lg">{getActionInfo(hoveredAction).label}</h4>
                      <p className="text-slate-400 text-sm">{getActionInfo(hoveredAction).shortDesc}</p>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                    {getActionInfo(hoveredAction).longDesc}
                  </p>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-400 uppercase mb-2 flex items-center gap-1">
                      <span>📌</span> Ejemplos de uso:
                    </p>
                    <ul className="space-y-2">
                      {getActionInfo(hoveredAction).examples.map((example, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="text-green-400 font-bold">→</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla con scroll horizontal y vertical - OPTIMIZADA */}
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse min-w-[700px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-800">
                    <th className="sticky left-0 z-20 bg-slate-800 px-3 py-2 text-left min-w-[220px] border-b border-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400 uppercase">
                          Módulo / Sección
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => matrixData.matrix.forEach((_, i) => toggleRow(i, true))}
                            className="text-[9px] px-1.5 py-0.5 bg-green-600/20 text-green-400 rounded hover:bg-green-600/40"
                            title="Activar todo"
                          >
                            Todo ✓
                          </button>
                          <button
                            onClick={() => matrixData.matrix.forEach((_, i) => toggleRow(i, false))}
                            className="text-[9px] px-1.5 py-0.5 bg-red-600/20 text-red-400 rounded hover:bg-red-600/40"
                            title="Desactivar todo"
                          >
                            Nada ✗
                          </button>
                        </div>
                      </div>
                    </th>
                    {matrixData.actions.map((action) => {
                      const info = getActionInfo(action.action_key);
                      return (
                        <th
                          key={action.id}
                          className="px-1 py-2 text-center min-w-[55px] border-b border-slate-600 cursor-help"
                          onMouseEnter={() => setHoveredAction(action.action_key)}
                          onMouseLeave={() => setHoveredAction(null)}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-base" title={info.shortDesc}>{info.icon}</span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {info.label}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Agrupar páginas por categoría
                    const grouped: Record<string, { pages: typeof matrixData.matrix; indices: number[] }> = {};
                    matrixData.matrix.forEach((page, index) => {
                      const pageInfo = getPageInfo(page.page_key);
                      const category = pageInfo.category || 'Otros';
                      if (!grouped[category]) {
                        grouped[category] = { pages: [], indices: [] };
                      }
                      grouped[category].pages.push(page);
                      grouped[category].indices.push(index);
                    });

                    return Object.entries(grouped).map(([category, { pages, indices }]) => (
                      <Fragment key={category}>
                        {/* Header de categoría */}
                        <tr className="bg-slate-800/80">
                          <td
                            colSpan={matrixData.actions.length + 1}
                            className="px-3 py-1.5 text-xs font-semibold text-orange-400 uppercase tracking-wide"
                          >
                            {category}
                          </td>
                        </tr>
                        {/* Páginas de esta categoría */}
                        {pages.map((page, localIndex) => {
                          const pageInfo = getPageInfo(page.page_key);
                          const globalIndex = indices[localIndex];
                          const hasAnyPermission = page.actions.some((a) => a.granted);
                          const activeCount = page.actions.filter((a) => a.granted).length;
                          const totalCount = page.actions.filter((a) => a.permission_id).length;

                          return (
                            <tr
                              key={page.page_id}
                              className={`hover:bg-slate-800/50 border-b border-slate-700/30 ${
                                hasAnyPermission ? 'bg-slate-800/10' : ''
                              }`}
                            >
                              <td className="sticky left-0 z-10 bg-slate-900 px-3 py-1.5 border-r border-slate-700/50">
                                <div className="flex items-center gap-2">
                                  <span className="text-base flex-shrink-0">{pageInfo.icon}</span>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-white text-sm truncate">
                                      {pageInfo.label}
                                    </div>
                                  </div>
                                  {/* Indicador de permisos activos */}
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    activeCount === totalCount && totalCount > 0
                                      ? 'bg-green-900/50 text-green-400'
                                      : activeCount > 0
                                      ? 'bg-yellow-900/50 text-yellow-400'
                                      : 'bg-slate-700/50 text-slate-500'
                                  }`}>
                                    {activeCount}/{totalCount}
                                  </span>
                                  {/* Botones compactos */}
                                  <div className="flex gap-0.5">
                                    <button
                                      onClick={() => toggleRow(globalIndex, true)}
                                      className="w-5 h-5 text-[10px] bg-green-600/20 text-green-400 rounded hover:bg-green-600/40 flex items-center justify-center"
                                      title="Activar todos"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => toggleRow(globalIndex, false)}
                                      className="w-5 h-5 text-[10px] bg-red-600/20 text-red-400 rounded hover:bg-red-600/40 flex items-center justify-center"
                                      title="Desactivar todos"
                                    >
                                      ✗
                                    </button>
                                  </div>
                                </div>
                              </td>
                              {page.actions.map((action, actionIndex) => (
                                <td key={action.action_id} className="px-1 py-1.5 text-center">
                                  {action.permission_id ? (
                                    <button
                                      onClick={() => handleTogglePermission(globalIndex, actionIndex)}
                                      className={`w-7 h-7 rounded transition-all duration-100 flex items-center justify-center text-sm mx-auto ${
                                        action.granted
                                          ? 'bg-green-600 hover:bg-green-500 text-white'
                                          : 'bg-slate-700/30 hover:bg-slate-600 text-slate-600 hover:text-slate-400'
                                      }`}
                                    >
                                      {action.granted ? '✓' : ''}
                                    </button>
                                  ) : (
                                    <span className="text-slate-700/50 text-xs">-</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </Fragment>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 md:p-6 border-t border-slate-700 flex-shrink-0">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Leyenda */}
                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-green-600 rounded flex items-center justify-center text-white text-[10px]">✓</span>
                    Permitido
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-slate-700/50 rounded"></span>
                    Denegado
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-slate-600">·</span>
                    No disponible
                  </span>
                </div>

                {/* Botones */}
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={() => {
                      setShowMatrixModal(false);
                      setMatrixData(null);
                      setSelectedRoleId(null);
                    }}
                    className="flex-1 md:flex-none px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveMatrix}
                    disabled={saveMatrixMutation.isPending}
                    className="flex-1 md:flex-none px-6 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50"
                  >
                    {saveMatrixMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
