import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useWorkspace, Workspace } from '../../context/WorkspaceContext';

interface WorkspaceWithStats extends Workspace {
  stats?: {
    totalClients: number;
    totalEmployees: number;
    totalServices: number;
  };
  total_users?: number;
  total_clients?: number;
}

interface CreateWorkspaceData {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export default function WorkspacesPage() {
  const queryClient = useQueryClient();
  const { refetchWorkspaces } = useWorkspace();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceWithStats | null>(null);
  const [formData, setFormData] = useState<CreateWorkspaceData>({
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6',
  });

  // Obtener todos los workspaces
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['all-workspaces'],
    queryFn: async () => {
      const { data } = await api.get<WorkspaceWithStats[]>('/workspaces');
      return data;
    },
  });

  // Crear workspace
  const createMutation = useMutation({
    mutationFn: async (data: CreateWorkspaceData) => {
      const { data: result } = await api.post('/workspaces', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['my-workspaces'] });
      refetchWorkspaces();
      setShowCreateModal(false);
      resetForm();
    },
  });

  // Actualizar workspace
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateWorkspaceData> }) => {
      const { data: result } = await api.put(`/workspaces/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['my-workspaces'] });
      refetchWorkspaces();
      setEditingWorkspace(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#3b82f6',
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.slug) return;
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!editingWorkspace) return;
    updateMutation.mutate({
      id: editingWorkspace.id,
      data: formData,
    });
  };

  const openEditModal = (workspace: WorkspaceWithStats) => {
    setEditingWorkspace(workspace);
    setFormData({
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description || '',
      color: workspace.color,
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
    '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#6366f1',
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Workspaces</h1>
          <p className="text-slate-400 mt-1">Gestiona los espacios de trabajo para organizar clientes y empleados</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Workspace
        </button>
      </div>

      {/* Grid de Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workspaces.map((workspace) => (
          <div
            key={workspace.id}
            className="bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: workspace.color }}
                >
                  <span className="text-white text-xl font-bold">
                    {workspace.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{workspace.name}</h3>
                  <p className="text-sm text-slate-400">/{workspace.slug}</p>
                </div>
              </div>
              {workspace.is_default && (
                <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
                  Por defecto
                </span>
              )}
            </div>

            {workspace.description && (
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{workspace.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-white">{workspace.total_clients || 0}</p>
                <p className="text-xs text-slate-400">Clientes</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-2xl font-bold text-white">{workspace.total_users || 0}</p>
                <p className="text-xs text-slate-400">Usuarios</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEditModal(workspace)}
                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Editar
              </button>
              <button
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                title="Gestionar usuarios"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear/Editar */}
      {(showCreateModal || editingWorkspace) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">
                {editingWorkspace ? 'Editar Workspace' : 'Nuevo Workspace'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: editingWorkspace ? formData.slug : generateSlug(e.target.value),
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ej: Departamento Contable"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Identificador (URL)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="departamento-contable"
                  disabled={!!editingWorkspace}
                />
                {editingWorkspace && (
                  <p className="text-xs text-slate-500 mt-1">El identificador no se puede cambiar</p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Descripción (opcional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={3}
                  placeholder="Describe brevemente este workspace..."
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-lg transition-transform ${
                        formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingWorkspace(null);
                  resetForm();
                }}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingWorkspace ? handleUpdate : handleCreate}
                disabled={createMutation.isPending || updateMutation.isPending || !formData.name || !formData.slug}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
              >
                {(createMutation.isPending || updateMutation.isPending) ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
