import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { Workspace } from '../../types/workspace.types';

interface WorkspaceWithStats extends Workspace {
  stats?: {
    totalClients: number;
    totalEmployees: number;
    totalServices: number;
  };
  total_users?: number;
  total_clients?: number;
}

// Tipo para colores de infracción (niveles 1-10)
interface InfractionColors {
  [key: string]: string | undefined;
}

type ColorScheme = 'clasico' | 'intenso' | 'profesional' | 'oscuro' | 'custom';

interface CreateWorkspaceData {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  max_infractions?: number;
  auto_deactivate_on_limit?: boolean;
  infraction_color_scheme?: ColorScheme;
  // Colores dinámicos para niveles 1-10
  infraction_color_1_bg?: string;
  infraction_color_1_text?: string;
  infraction_color_2_bg?: string;
  infraction_color_2_text?: string;
  infraction_color_3_bg?: string;
  infraction_color_3_text?: string;
  infraction_color_4_bg?: string;
  infraction_color_4_text?: string;
  infraction_color_5_bg?: string;
  infraction_color_5_text?: string;
  infraction_color_6_bg?: string;
  infraction_color_6_text?: string;
  infraction_color_7_bg?: string;
  infraction_color_7_text?: string;
  infraction_color_8_bg?: string;
  infraction_color_8_text?: string;
  infraction_color_9_bg?: string;
  infraction_color_9_text?: string;
  infraction_color_10_bg?: string;
  infraction_color_10_text?: string;
}

// Plantillas de gradientes predefinidas
const COLOR_TEMPLATES = {
  clasico: {
    name: 'Clásico',
    description: 'Amarillo a rojo suave',
    getColors: (level: number, maxLevel: number) => {
      const ratio = level / maxLevel;
      if (ratio <= 0.33) return { bg: '#FEF3C7', text: '#92400E' }; // Amarillo suave
      if (ratio <= 0.66) return { bg: '#FED7AA', text: '#9A3412' }; // Naranja suave
      return { bg: '#FEE2E2', text: '#991B1B' }; // Rojo suave
    }
  },
  intenso: {
    name: 'Intenso',
    description: 'Colores vivos y llamativos',
    getColors: (level: number, maxLevel: number) => {
      const ratio = level / maxLevel;
      if (ratio <= 0.25) return { bg: '#FCD34D', text: '#78350F' }; // Amarillo
      if (ratio <= 0.5) return { bg: '#FB923C', text: '#7C2D12' }; // Naranja
      if (ratio <= 0.75) return { bg: '#F87171', text: '#7F1D1D' }; // Rojo claro
      return { bg: '#EF4444', text: '#FFFFFF' }; // Rojo intenso
    }
  },
  profesional: {
    name: 'Profesional',
    description: 'Tonos azules a rojos',
    getColors: (level: number, maxLevel: number) => {
      const ratio = level / maxLevel;
      if (ratio <= 0.33) return { bg: '#DBEAFE', text: '#1E40AF' }; // Azul suave
      if (ratio <= 0.66) return { bg: '#FEF3C7', text: '#92400E' }; // Amarillo
      return { bg: '#FEE2E2', text: '#991B1B' }; // Rojo
    }
  },
  oscuro: {
    name: 'Oscuro',
    description: 'Fondos oscuros con texto claro',
    getColors: (level: number, maxLevel: number) => {
      const ratio = level / maxLevel;
      if (ratio <= 0.33) return { bg: '#78350F', text: '#FEF3C7' }; // Marrón
      if (ratio <= 0.66) return { bg: '#9A3412', text: '#FED7AA' }; // Naranja oscuro
      return { bg: '#7F1D1D', text: '#FEE2E2' }; // Rojo oscuro
    }
  }
};

// Función para generar colores de gradiente para N niveles
function generateGradientColors(template: keyof typeof COLOR_TEMPLATES, maxLevel: number): InfractionColors {
  const colors: InfractionColors = {};
  const templateFn = COLOR_TEMPLATES[template].getColors;

  for (let i = 1; i <= maxLevel; i++) {
    const { bg, text } = templateFn(i, maxLevel);
    colors[`infraction_color_${i}_bg`] = bg;
    colors[`infraction_color_${i}_text`] = text;
  }

  return colors;
}

interface WorkspaceUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

// Colores por defecto para el template clásico con 3 infracciones
const getDefaultInfractionColors = (maxInfractions: number = 3): InfractionColors => {
  return generateGradientColors('clasico', maxInfractions);
};

export default function WorkspacesPage() {
  const queryClient = useQueryClient();
  const { refetchWorkspaces } = useWorkspace();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceWithStats | null>(null);
  const [managingUsersWorkspace, setManagingUsersWorkspace] = useState<WorkspaceWithStats | null>(null);

  // Ref para detectar cambios en max_infractions
  const prevMaxInfractionsRef = useRef<number>(3);

  const [formData, setFormData] = useState<CreateWorkspaceData>({
    name: '',
    slug: '',
    description: '',
    color: '#3b82f6',
    max_infractions: 3,
    auto_deactivate_on_limit: true,
    infraction_color_scheme: 'clasico',
    ...getDefaultInfractionColors(3),
  });

  // Efecto para actualizar colores cuando cambia max_infractions (solo si usa plantilla)
  useEffect(() => {
    const currentMax = formData.max_infractions || 3;
    const prevMax = prevMaxInfractionsRef.current;
    const scheme = formData.infraction_color_scheme || 'clasico';

    if (currentMax !== prevMax && scheme !== 'custom') {
      // Regenerar colores con la plantilla actual
      const newColors = generateGradientColors(scheme as keyof typeof COLOR_TEMPLATES, currentMax);
      setFormData(prev => ({ ...prev, ...newColors }));
      prevMaxInfractionsRef.current = currentMax;
    }
  }, [formData.max_infractions, formData.infraction_color_scheme]);

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

  // Obtener usuarios del workspace
  const { data: workspaceUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['workspace-users', managingUsersWorkspace?.id],
    queryFn: async () => {
      if (!managingUsersWorkspace) return [];
      const { data } = await api.get<WorkspaceUser[]>(`/workspaces/${managingUsersWorkspace.id}/users`);
      return data;
    },
    enabled: !!managingUsersWorkspace,
  });

  // Obtener usuarios disponibles para asignar
  const { data: availableUsers = [] } = useQuery({
    queryKey: ['available-users', managingUsersWorkspace?.id],
    queryFn: async () => {
      if (!managingUsersWorkspace) return [];
      const { data } = await api.get<WorkspaceUser[]>(`/workspaces/${managingUsersWorkspace.id}/available-users`);
      return data;
    },
    enabled: !!managingUsersWorkspace,
  });

  // Asignar usuario a workspace
  const assignUserMutation = useMutation({
    mutationFn: async ({ workspaceId, userId }: { workspaceId: number; userId: number }) => {
      const { data } = await api.post(`/workspaces/${workspaceId}/users`, { userId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-users'] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
      queryClient.invalidateQueries({ queryKey: ['all-workspaces'] });
    },
  });

  // Remover usuario del workspace
  const removeUserMutation = useMutation({
    mutationFn: async ({ workspaceId, userId }: { workspaceId: number; userId: number }) => {
      const { data } = await api.delete(`/workspaces/${workspaceId}/users/${userId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-users'] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
      queryClient.invalidateQueries({ queryKey: ['all-workspaces'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#3b82f6',
      max_infractions: 3,
      auto_deactivate_on_limit: true,
      infraction_color_scheme: 'clasico',
      ...getDefaultInfractionColors(3),
    });
    prevMaxInfractionsRef.current = 3;
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
    const ws = workspace as any;
    const maxInf = ws.max_infractions || 3;
    const scheme: ColorScheme = ws.infraction_color_scheme || 'clasico';
    const autoDeactivate = ws.auto_deactivate_on_limit !== false; // Default true

    // Cargar todos los colores de infracción del workspace
    const infractionColors: InfractionColors = {};
    for (let i = 1; i <= 10; i++) {
      infractionColors[`infraction_color_${i}_bg`] = ws[`infraction_color_${i}_bg`] || undefined;
      infractionColors[`infraction_color_${i}_text`] = ws[`infraction_color_${i}_text`] || undefined;
    }

    // Si no hay colores configurados o es plantilla, regenerar colores
    const hasCustomColors = scheme === 'custom' && infractionColors.infraction_color_1_bg;
    const colorsToUse = hasCustomColors
      ? infractionColors
      : generateGradientColors(scheme === 'custom' ? 'clasico' : scheme, maxInf);

    setFormData({
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description || '',
      color: workspace.color,
      max_infractions: maxInf,
      auto_deactivate_on_limit: autoDeactivate,
      infraction_color_scheme: scheme,
      ...colorsToUse,
    });

    prevMaxInfractionsRef.current = maxInf;
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
                onClick={() => setManagingUsersWorkspace(workspace)}
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
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">
                {editingWorkspace ? 'Editar Workspace' : 'Nuevo Workspace'}
              </h2>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
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

              {/* Configuración de Infracciones - Solo en edición */}
              {editingWorkspace && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">⚠️</span> Configuración de Infracciones
                  </h3>

                  {/* Toggle de auto-desactivación */}
                  <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-300">
                          Desactivar cliente automáticamente
                        </label>
                        <p className="text-xs text-slate-500 mt-1">
                          {formData.auto_deactivate_on_limit
                            ? 'El cliente será desactivado al alcanzar el límite'
                            : 'Solo se bloqueará agregar más infracciones'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          auto_deactivate_on_limit: !prev.auto_deactivate_on_limit
                        }))}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          formData.auto_deactivate_on_limit ? 'bg-orange-600' : 'bg-slate-600'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            formData.auto_deactivate_on_limit ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Límite de infracciones */}
                  <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Límite de infracciones
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.max_infractions || 3}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value);
                          setFormData(prev => ({ ...prev, max_infractions: newMax }));
                        }}
                        className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                      <span className="w-12 text-center text-2xl font-bold text-orange-400">
                        {formData.max_infractions || 3}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {formData.auto_deactivate_on_limit
                        ? 'El cliente será desactivado al alcanzar este número de infracciones'
                        : 'No se podrán agregar más infracciones después de este límite'}
                    </p>
                  </div>

                  {/* Esquema de colores - Toggles exclusivos */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-3">Esquema de colores</label>

                    {/* Toggle: Usar plantilla */}
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.infraction_color_scheme === 'custom') {
                            // Cambiar a plantilla clásico por defecto
                            const newColors = generateGradientColors('clasico', formData.max_infractions || 3);
                            setFormData(prev => ({ ...prev, infraction_color_scheme: 'clasico', ...newColors }));
                          }
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          formData.infraction_color_scheme !== 'custom'
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.infraction_color_scheme !== 'custom' ? 'border-orange-500' : 'border-slate-500'
                        }`}>
                          {formData.infraction_color_scheme !== 'custom' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          )}
                        </div>
                        <span className="text-sm text-slate-200">Usar plantilla predefinida</span>
                      </button>
                    </div>

                    {/* Plantillas - Solo visibles si no es custom */}
                    {formData.infraction_color_scheme !== 'custom' && (
                      <div className="grid grid-cols-2 gap-2 ml-8 mb-4">
                        {(Object.keys(COLOR_TEMPLATES) as Array<keyof typeof COLOR_TEMPLATES>).map((templateKey) => {
                          const template = COLOR_TEMPLATES[templateKey];
                          const maxInf = formData.max_infractions || 3;
                          const previewColors = [1, Math.ceil(maxInf / 2), maxInf].map(level =>
                            template.getColors(level, maxInf)
                          );

                          return (
                            <button
                              key={templateKey}
                              onClick={() => {
                                const newColors = generateGradientColors(templateKey, maxInf);
                                setFormData(prev => ({ ...prev, infraction_color_scheme: templateKey, ...newColors }));
                              }}
                              className={`flex items-center gap-2 p-2 rounded-lg border transition-colors bg-slate-800 ${
                                formData.infraction_color_scheme === templateKey
                                  ? 'border-orange-500 ring-1 ring-orange-500'
                                  : 'border-slate-600 hover:border-slate-500'
                              }`}
                            >
                              <div className="flex gap-0.5">
                                {previewColors.map((c, idx) => (
                                  <div
                                    key={idx}
                                    className="w-5 h-5 rounded"
                                    style={{ backgroundColor: c.bg }}
                                  />
                                ))}
                              </div>
                              <div className="text-left">
                                <span className="text-xs text-slate-300 block">{template.name}</span>
                                <span className="text-[10px] text-slate-500">{template.description}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Toggle: Personalizar colores */}
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.infraction_color_scheme !== 'custom') {
                            setFormData(prev => ({ ...prev, infraction_color_scheme: 'custom' }));
                          }
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          formData.infraction_color_scheme === 'custom'
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.infraction_color_scheme === 'custom' ? 'border-orange-500' : 'border-slate-500'
                        }`}>
                          {formData.infraction_color_scheme === 'custom' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          )}
                        </div>
                        <span className="text-sm text-slate-200">Personalizar colores manualmente</span>
                      </button>
                    </div>

                    {/* Colores personalizados - Solo visibles si es custom */}
                    {formData.infraction_color_scheme === 'custom' && (
                      <div className="space-y-2 ml-8 border-l-2 border-slate-700 pl-4 max-h-48 overflow-y-auto">
                        {Array.from({ length: formData.max_infractions || 3 }, (_, i) => i + 1).map((level) => (
                          <div key={level} className="flex items-center gap-3 p-2 rounded hover:bg-slate-800/50">
                            <span className="text-xs text-slate-500 w-24">
                              {level} infracción{level > 1 ? 'es' : ''}:
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <input
                                  type="color"
                                  value={(formData as any)[`infraction_color_${level}_bg`] || '#CCCCCC'}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      [`infraction_color_${level}_bg`]: e.target.value
                                    }));
                                  }}
                                  className="w-7 h-7 rounded cursor-pointer border-2 border-slate-600 hover:border-slate-400"
                                  title="Color de fondo"
                                />
                                <span className="absolute -bottom-3 left-0 text-[8px] text-slate-600">Fondo</span>
                              </div>
                              <div className="relative">
                                <input
                                  type="color"
                                  value={(formData as any)[`infraction_color_${level}_text`] || '#333333'}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      [`infraction_color_${level}_text`]: e.target.value
                                    }));
                                  }}
                                  className="w-7 h-7 rounded cursor-pointer border-2 border-slate-600 hover:border-slate-400"
                                  title="Color de texto"
                                />
                                <span className="absolute -bottom-3 left-0 text-[8px] text-slate-600">Texto</span>
                              </div>
                            </div>
                            {/* Mini preview */}
                            <div
                              className="px-2 py-1 rounded text-xs ml-2"
                              style={{
                                backgroundColor: (formData as any)[`infraction_color_${level}_bg`] || '#CCCCCC',
                                color: (formData as any)[`infraction_color_${level}_text`] || '#333333'
                              }}
                            >
                              Nivel {level}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vista previa dinámica */}
                  <div className="mt-5 p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <label className="block text-xs font-medium text-slate-400 mb-3 uppercase tracking-wide">
                      Vista previa ({formData.max_infractions} niveles)
                    </label>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {/* Sin infracciones */}
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600">
                        <span className="text-slate-200 text-sm">Cliente sin infracciones</span>
                        <span className="text-xs text-slate-400">Normal</span>
                      </div>
                      {/* Niveles de infracción */}
                      {Array.from({ length: formData.max_infractions || 3 }, (_, i) => i + 1).map((level) => {
                        const bgColor = (formData as any)[`infraction_color_${level}_bg`] || '#CCCCCC';
                        const textColor = (formData as any)[`infraction_color_${level}_text`] || '#333333';
                        const isMax = level === (formData.max_infractions || 3);

                        return (
                          <div
                            key={level}
                            className="flex items-center justify-between px-3 py-2 rounded-lg border"
                            style={{
                              backgroundColor: bgColor,
                              color: textColor,
                              borderColor: bgColor
                            }}
                          >
                            <span className="font-medium text-sm">
                              Cliente con {level} infracción{level > 1 ? 'es' : ''}
                            </span>
                            <span className="text-xs opacity-75">
                              {isMax ? '⛔ Suspendido' : level === 1 ? 'Advertencia' : `Alerta ${level}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
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

      {/* Modal Gestionar Usuarios */}
      {managingUsersWorkspace && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: managingUsersWorkspace.color }}
                >
                  <span className="text-white text-lg font-bold">
                    {managingUsersWorkspace.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{managingUsersWorkspace.name}</h2>
                  <p className="text-sm text-slate-400">Gestionar usuarios</p>
                </div>
              </div>
              <button
                onClick={() => setManagingUsersWorkspace(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Usuarios actuales */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Usuarios en este workspace ({workspaceUsers.length})
                </h3>
                {isLoadingUsers ? (
                  <div className="text-center py-4 text-slate-400">Cargando...</div>
                ) : workspaceUsers.length === 0 ? (
                  <div className="text-center py-4 text-slate-400">No hay usuarios asignados</div>
                ) : (
                  <div className="space-y-2">
                    {workspaceUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.full_name}</p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            user.role === 'admin' ? 'bg-purple-900/50 text-purple-400' :
                            user.role === 'employee' ? 'bg-blue-900/50 text-blue-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>
                            {user.role}
                          </span>
                          <button
                            onClick={() => removeUserMutation.mutate({
                              workspaceId: managingUsersWorkspace.id,
                              userId: user.id
                            })}
                            disabled={removeUserMutation.isPending}
                            className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                            title="Remover del workspace"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Usuarios disponibles para agregar */}
              {availableUsers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Usuarios disponibles para agregar
                  </h3>
                  <div className="space-y-2">
                    {availableUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-dashed border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                            <span className="text-white font-medium">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.full_name}</p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => assignUserMutation.mutate({
                            workspaceId: managingUsersWorkspace.id,
                            userId: user.id
                          })}
                          disabled={assignUserMutation.isPending}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors"
                        >
                          Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700">
              <button
                onClick={() => setManagingUsersWorkspace(null)}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
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
