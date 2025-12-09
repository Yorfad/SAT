import { useState, useRef, useEffect } from 'react';
import { useWorkspace, CONSOLIDATED_WORKSPACE } from '../context/WorkspaceContext';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function WorkspaceSelector() {
  const { workspaces, currentWorkspace, isConsolidatedView, isLoading, switchWorkspace, setConsolidatedView } = useWorkspace();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // No mostrar si no hay workspaces o está cargando
  if (isLoading || workspaces.length === 0) {
    return (
      <div className="px-3 py-2 bg-slate-800/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-600 animate-pulse" />
          <span className="text-sm text-slate-400">Cargando...</span>
        </div>
      </div>
    );
  }

  const displayName = isConsolidatedView
    ? 'Vista General'
    : currentWorkspace?.name || 'Seleccionar';

  const displayColor = isConsolidatedView
    ? '#8b5cf6'
    : currentWorkspace?.color || '#64748b';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 transition-colors"
      >
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: displayColor }}
        />
        <span className="text-sm text-white font-medium truncate flex-1 text-left">
          {displayName}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Opción de Vista General */}
          <button
            onClick={() => {
              setConsolidatedView(true);
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 transition-colors ${
              isConsolidatedView ? 'bg-purple-900/30 border-l-2 border-purple-500' : ''
            }`}
          >
            <div className="w-7 h-7 rounded-md bg-purple-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-white truncate">Vista General</p>
              <p className="text-xs text-slate-400">Todos los workspaces</p>
            </div>
            {isConsolidatedView && (
              <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <div className="border-t border-slate-700/50 my-1" />

          {/* Lista de Workspaces */}
          <div className="max-h-48 overflow-y-auto">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => {
                  switchWorkspace(workspace);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 transition-colors ${
                  !isConsolidatedView && currentWorkspace?.id === workspace.id
                    ? 'bg-slate-800/50 border-l-2 border-orange-500'
                    : ''
                }`}
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: workspace.color }}
                >
                  <span className="text-white text-xs font-bold">
                    {workspace.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">{workspace.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{workspace.role_in_workspace}</p>
                </div>
                {workspace.is_primary && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-orange-600/20 text-orange-400 rounded flex-shrink-0">
                    Principal
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Botón para gestionar workspaces (solo admin) */}
          {user?.role === 'admin' && (
            <>
              <div className="border-t border-slate-700/50 my-1" />
              <Link
                to="/admin/workspaces"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Gestionar Workspaces
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
