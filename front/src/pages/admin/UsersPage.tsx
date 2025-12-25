import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'employee';
  is_active: boolean;
  created_at: string;
}

interface Role {
  id: number;
  role_key: string;
  role_name: string;
  description: string | null;
  is_system_role: boolean;
}

interface UserRole {
  id: number;
  role_key: string;
  role_name: string;
  description: string | null;
  is_system_role: boolean;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
  notes: string | null;
  granted_by_name: string | null;
}


export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'employee' as 'admin' | 'employee'
  });

  const [newPassword, setNewPassword] = useState('');

  // Cargar usuarios
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', filterRole, filterActive, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterRole) params.append('role', filterRole);
      if (filterActive) params.append('is_active', filterActive);
      if (search) params.append('search', search);
      const res = await api.get(`/user-management/users?${params}`);
      return res.data as User[];
    }
  });

  // Cargar todos los roles disponibles
  const { data: allRolesData } = useQuery({
    queryKey: ['roles-list'],
    queryFn: async () => {
      const res = await api.get('/roles-permissions/roles?include_stats=false');
      return res.data as { roles: Role[] };
    }
  });

  const allRoles = allRolesData?.roles || [];

  // Cargar roles del usuario seleccionado
  const { data: userRolesData, refetch: refetchUserRoles } = useQuery({
    queryKey: ['user-roles', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return { roles: [] };
      const res = await api.get(`/roles-permissions/users/${selectedUserId}/roles`);
      return res.data as { roles: UserRole[] };
    },
    enabled: !!selectedUserId && showRolesModal,
  });

  const userRoles = userRolesData?.roles || [];

  // Crear usuario
  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return api.post('/user-management/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    }
  });

  // Actualizar usuario
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof form> }) => {
      return api.put(`/user-management/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    }
  });

  // Cambiar estado
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      return api.patch(`/user-management/users/${id}/status`, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  // Cambiar contraseña
  const changePasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      return api.patch(`/user-management/users/${id}/password`, { password });
    },
    onSuccess: () => {
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedUserId(null);
    }
  });

  // Eliminar usuario
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/user-management/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  // Asignar rol a usuario
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      return api.post(`/roles-permissions/users/${userId}/roles`, { role_id: roleId });
    },
    onSuccess: () => {
      refetchUserRoles();
    }
  });

  // Revocar rol de usuario
  const revokeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      return api.delete(`/roles-permissions/users/${userId}/roles/${roleId}`);
    },
    onSuccess: () => {
      refetchUserRoles();
    }
  });

  const handleDelete = (user: User) => {
    if (confirm(`¿Estás seguro de eliminar a ${user.full_name}? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const openNewModal = () => {
    setEditingUser(null);
    setForm({ email: '', password: '', full_name: '', role: 'employee' });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role
    });
    setShowModal(true);
  };

  const openPasswordModal = (userId: number) => {
    setSelectedUserId(userId);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const openRolesModal = (user: User) => {
    setSelectedUserId(user.id);
    setSelectedUserName(user.full_name);
    setShowRolesModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setForm({ email: '', password: '', full_name: '', role: 'employee' });
  };

  const closeRolesModal = () => {
    setShowRolesModal(false);
    setSelectedUserId(null);
    setSelectedUserName('');
  };

  const handleSubmit = () => {
    if (!form.email || !form.full_name) return;

    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        data: { email: form.email, full_name: form.full_name, role: form.role }
      });
    } else {
      if (!form.password || form.password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      createMutation.mutate(form);
    }
  };

  const handleChangePassword = () => {
    if (!selectedUserId || !newPassword || newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    changePasswordMutation.mutate({ id: selectedUserId, password: newPassword });
  };

  const handleToggleRole = (roleId: number) => {
    if (!selectedUserId) return;

    const hasRole = userRoles.some(r => r.id === roleId);
    if (hasRole) {
      revokeRoleMutation.mutate({ userId: selectedUserId, roleId });
    } else {
      assignRoleMutation.mutate({ userId: selectedUserId, roleId });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Gestión de Usuarios</h1>
          <p className="text-slate-400 text-sm mt-1">
            Administra empleados y otros administradores
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700"
        >
          + Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white w-64"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
        >
          <option value="">Todos los roles</option>
          <option value="admin">Administradores</option>
          <option value="employee">Empleados</option>
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
        >
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Rol Base</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {users.map((user) => (
              <tr key={user.id} className={`hover:bg-slate-800/50 ${!user.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <div>
                    <span className="text-white font-medium">{user.full_name}</span>
                    <p className="text-sm text-slate-400">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${
                    user.role === 'admin'
                      ? 'bg-purple-900/50 text-purple-300'
                      : 'bg-blue-900/50 text-blue-300'
                  }`}>
                    {user.role === 'admin' ? 'Administrador' : 'Empleado'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleStatusMutation.mutate({
                      id: user.id,
                      is_active: !user.is_active
                    })}
                    className={`px-2 py-1 text-xs rounded ${
                      user.is_active
                        ? 'bg-green-900/50 text-green-300 hover:bg-green-900'
                        : 'bg-red-900/50 text-red-300 hover:bg-red-900'
                    }`}
                  >
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => openRolesModal(user)}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      Roles
                    </button>
                    <button
                      onClick={() => openPasswordModal(user.id)}
                      className="text-sm text-orange-400 hover:text-orange-300"
                    >
                      Contraseña
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={deleteMutation.isPending}
                      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            No hay usuarios que mostrar
          </div>
        )}
      </div>

      {/* Modal crear/editar usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="usuario@email.com"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rol Base
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'employee' })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                >
                  <option value="employee">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {form.role === 'admin'
                    ? 'Tendrá acceso total al sistema'
                    : 'Acceso básico. Usa "Roles" para permisos granulares'}
                </p>
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
                  disabled={!form.email || !form.full_name || createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal cambiar contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold text-white mb-4">
              Cambiar Contraseña
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setSelectedUserId(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={!newPassword || newPassword.length < 6 || changePasswordMutation.isPending}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50"
                >
                  {changePasswordMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal gestionar roles */}
      {showRolesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-semibold text-white mb-2">
              Gestionar Roles
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Usuario: {selectedUserName}
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allRoles.length === 0 ? (
                <p className="text-slate-400 text-center py-4">
                  No hay roles disponibles. Crea roles en la página de Roles y Permisos.
                </p>
              ) : (
                allRoles.map((role) => {
                  const hasRole = userRoles.some(r => r.id === role.id);
                  const isPending = assignRoleMutation.isPending || revokeRoleMutation.isPending;

                  return (
                    <div
                      key={role.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        hasRole
                          ? 'bg-purple-900/20 border-purple-700'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{role.role_name}</span>
                          {role.is_system_role && (
                            <span className="px-1.5 py-0.5 bg-purple-900/50 text-purple-300 text-xs rounded">
                              Sistema
                            </span>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-sm text-slate-400 mt-0.5">{role.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleRole(role.id)}
                        disabled={isPending}
                        className={`px-3 py-1.5 text-sm rounded transition-colors ${
                          hasRole
                            ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                            : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        } disabled:opacity-50`}
                      >
                        {hasRole ? 'Quitar' : 'Asignar'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-700">
              <button
                onClick={closeRolesModal}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
