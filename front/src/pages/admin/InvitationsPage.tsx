import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useWorkspace } from '../../context/WorkspaceContext';

interface Workspace {
  id: number;
  name: string;
  slug: string;
  registration_code: string;
  auto_approve_registration: boolean;
}

export default function InvitationsPage() {
  const { currentWorkspace } = useWorkspace();
  const [copied, setCopied] = useState(false);

  // Obtener información del workspace actual con su código
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces');
      return res.data as Workspace[];
    }
  });

  // Encontrar el workspace actual
  const workspace = workspaces.find(w => w.id === currentWorkspace?.id) || workspaces[0];
  const code = workspace?.registration_code || '----';

  const copyCode = () => {
    if (workspace?.registration_code) {
      navigator.clipboard.writeText(workspace.registration_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-100">Código de Registro</h1>
          <p className="text-sm text-slate-400 mt-2">
            Comparte este código con tus clientes para que se registren en la app
          </p>
        </div>

        {/* Código grande */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
          <p className="text-slate-400 text-sm mb-4">
            Código para <span className="text-orange-400 font-medium">{workspace?.name || 'General'}</span>
          </p>

          <button
            onClick={copyCode}
            className="group relative inline-block"
            title="Click para copiar"
          >
            <div className="flex items-center justify-center gap-3 bg-slate-900 px-8 py-6 rounded-xl border-2 border-slate-600 group-hover:border-orange-500 transition-colors">
              {code.split('').map((digit, i) => (
                <span
                  key={i}
                  className="text-5xl md:text-6xl font-bold text-orange-400 font-mono w-14 h-16 flex items-center justify-center bg-slate-800 rounded-lg"
                >
                  {digit}
                </span>
              ))}
            </div>

            {/* Indicador de copiado */}
            <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`}>
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-400">Copiado</span>
            </div>

            {/* Hint de copiar */}
            <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-slate-500 transition-opacity ${copied ? 'opacity-0' : 'opacity-100'}`}>
              Click para copiar
            </div>
          </button>

          {/* Estado de auto-aprobación */}
          <div className="mt-12 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-center gap-3">
              {workspace?.auto_approve_registration ? (
                <>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-green-400 text-sm">Los clientes se activan automáticamente</span>
                </>
              ) : (
                <>
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span className="text-yellow-400 text-sm">Requiere aprobación manual del administrador</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="mt-8 bg-blue-900/20 border border-blue-800/50 rounded-xl p-6">
          <h3 className="text-blue-300 font-medium mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ¿Cómo funciona?
          </h3>
          <ol className="text-sm text-blue-200/70 space-y-3 list-decimal list-inside">
            <li>Comparte el código de 4 dígitos con tu cliente</li>
            <li>El cliente abre la app y va a "Registrarse"</li>
            <li>Ingresa el código <code className="font-mono bg-blue-900/50 px-2 py-0.5 rounded text-blue-300">{code}</code> y completa sus datos</li>
            <li>
              {workspace?.auto_approve_registration
                ? 'El cliente podrá usar la app inmediatamente'
                : 'Deberás aprobar su registro antes de que pueda usar la app'
              }
            </li>
          </ol>
        </div>

        {/* Tip para múltiples workspaces */}
        {workspaces.length > 1 && (
          <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-sm text-slate-400">
              Tienes <span className="text-orange-400 font-medium">{workspaces.length} workspaces</span>.
              Cada uno tiene su propio código de registro.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Cambia de workspace en el selector del menú para ver otros códigos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
