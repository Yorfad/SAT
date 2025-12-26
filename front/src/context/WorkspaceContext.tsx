import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Workspace } from '../types/workspace.types';

export type { Workspace };

export const CONSOLIDATED_WORKSPACE = 'all';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isConsolidatedView: boolean;
  isLoading: boolean;
  switchWorkspace: (workspace: Workspace | null) => void;
  setConsolidatedView: (consolidated: boolean) => void;
  refetchWorkspaces: () => void;
  getCurrentWorkspaceSlug: () => string;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const queryClient = useQueryClient();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isConsolidatedView, setIsConsolidatedView] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Obtener workspaces del usuario
  const { data: workspaces = [], isLoading, refetch } = useQuery({
    queryKey: ['my-workspaces'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) return [];

      try {
        const { data } = await api.get<Workspace[]>('/workspaces/my');
        return data;
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!localStorage.getItem('token'),
  });

  // Cargar workspace guardado o usar el primario
  useEffect(() => {
    if (workspaces.length > 0 && !isInitialized) {
      const savedWorkspaceSlug = localStorage.getItem('currentWorkspace');
      const savedConsolidated = localStorage.getItem('consolidatedView') === 'true';

      if (savedConsolidated) {
        setIsConsolidatedView(true);
        setCurrentWorkspace(null);
      } else if (savedWorkspaceSlug && savedWorkspaceSlug !== CONSOLIDATED_WORKSPACE) {
        const saved = workspaces.find(w => w.slug === savedWorkspaceSlug);
        if (saved) {
          setCurrentWorkspace(saved);
        } else {
          // Si el workspace guardado no existe, usar el primario
          const primary = workspaces.find(w => w.is_primary) || workspaces[0];
          if (primary) {
            setCurrentWorkspace(primary);
            localStorage.setItem('currentWorkspace', primary.slug);
          }
        }
      } else {
        // Usar workspace primario por defecto
        const primary = workspaces.find(w => w.is_primary) || workspaces[0];
        if (primary) {
          setCurrentWorkspace(primary);
          localStorage.setItem('currentWorkspace', primary.slug);
        }
      }
      setIsInitialized(true);
    }
  }, [workspaces, isInitialized]);

  const switchWorkspace = useCallback((workspace: Workspace | null) => {
    setCurrentWorkspace(workspace);
    setIsConsolidatedView(false);

    if (workspace) {
      localStorage.setItem('currentWorkspace', workspace.slug);
      localStorage.removeItem('consolidatedView');
    }

    // Invalidar queries que dependen del workspace
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    queryClient.invalidateQueries({ queryKey: ['all-clients'] });
    queryClient.invalidateQueries({ queryKey: ['client-management'] });
    queryClient.invalidateQueries({ queryKey: ['client-management-filters'] });
    queryClient.invalidateQueries({ queryKey: ['filterable-fields'] });
    queryClient.invalidateQueries({ queryKey: ['services'] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['admin-summary'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['board'] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['pool-items'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['infractions'] });
    queryClient.invalidateQueries({ queryKey: ['my-clients'] });
  }, [queryClient]);

  const handleSetConsolidatedView = useCallback((consolidated: boolean) => {
    setIsConsolidatedView(consolidated);
    if (consolidated) {
      setCurrentWorkspace(null);
      localStorage.setItem('consolidatedView', 'true');
      localStorage.removeItem('currentWorkspace');
    }

    // Invalidar queries
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    queryClient.invalidateQueries({ queryKey: ['admin-summary'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  const getCurrentWorkspaceSlug = useCallback(() => {
    if (isConsolidatedView) return CONSOLIDATED_WORKSPACE;
    return currentWorkspace?.slug || '';
  }, [isConsolidatedView, currentWorkspace]);

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      currentWorkspace,
      isConsolidatedView,
      isLoading,
      switchWorkspace,
      setConsolidatedView: handleSetConsolidatedView,
      refetchWorkspaces: refetch,
      getCurrentWorkspaceSlug,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

// Hook para obtener el slug actual del workspace (útil para llamadas API)
export function useCurrentWorkspaceSlug(): string {
  const { getCurrentWorkspaceSlug } = useWorkspace();
  return getCurrentWorkspaceSlug();
}
