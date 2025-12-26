import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface Infraction {
  id: number;
  infraction_type: "automatic_unpaid" | "manual";
  reason: string;
  is_active: boolean;
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_by_name: string | null;
  resolved_by_name: string | null;
  invoice_year: number | null;
  invoice_month: number | null;
  invoice_amount: number | null;
}

interface InfractionHistoryModalProps {
  client: { id: number; full_name: string };
  onClose: () => void;
}

export function InfractionHistoryModal({ client, onClose }: InfractionHistoryModalProps) {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  const { data: infractions = [], isLoading } = useQuery({
    queryKey: ["client-infractions", client.id],
    queryFn: async () => {
      const { data } = await api.get<Infraction[]>(`/infractions/client/${client.id}`);
      return data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      await api.patch(`/infractions/${id}/resolve`, { resolutionNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-infractions", client.id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });

  const handleResolve = (infraction: Infraction) => {
    const notes = prompt("Notas de resolucion (opcional):");
    if (notes === null) return; // Canceló
    resolveMutation.mutate({ id: infraction.id, notes: notes || "Resuelta por administrador" });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-GT", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const activeCount = infractions.filter((i) => i.is_active).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-2xl border border-slate-700 shadow-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white">Historial de Infracciones</h2>
            <p className="text-sm text-slate-400 mt-1">
              Cliente: <span className="text-white">{client.full_name}</span>
              {activeCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-900/50 text-red-300 rounded text-xs">
                  {activeCount} activa{activeCount > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Cargando historial...</div>
          ) : infractions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Este cliente no tiene infracciones registradas.
            </div>
          ) : (
            <div className="space-y-3">
              {infractions.map((infraction) => (
                <div
                  key={infraction.id}
                  className={`rounded-lg p-4 border ${
                    infraction.is_active
                      ? "bg-red-950/30 border-red-800"
                      : "bg-slate-900/50 border-slate-700 opacity-70"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Estado y tipo */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            infraction.is_active
                              ? "bg-red-600 text-white"
                              : "bg-slate-600 text-slate-300"
                          }`}
                        >
                          {infraction.is_active ? "ACTIVA" : "RESUELTA"}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded border ${
                            infraction.infraction_type === "automatic_unpaid"
                              ? "bg-orange-900/30 text-orange-400 border-orange-700"
                              : "bg-purple-900/30 text-purple-400 border-purple-700"
                          }`}
                        >
                          {infraction.infraction_type === "automatic_unpaid"
                            ? "Automatica (impago)"
                            : "Manual"}
                        </span>
                      </div>

                      {/* Motivo */}
                      <p className="text-slate-200 mb-2">{infraction.reason}</p>

                      {/* Detalles */}
                      <div className="text-xs text-slate-400 space-y-1">
                        <p>
                          Fecha: {formatDate(infraction.created_at)}
                          {infraction.created_by_name && (
                            <> - Por: <span className="text-slate-300">{infraction.created_by_name}</span></>
                          )}
                        </p>
                        {infraction.invoice_month && infraction.invoice_year && (
                          <p>
                            Factura relacionada: {infraction.invoice_month}/{infraction.invoice_year}
                            {infraction.invoice_amount && (
                              <> - Q{infraction.invoice_amount.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</>
                            )}
                          </p>
                        )}
                        {!infraction.is_active && infraction.resolved_at && (
                          <p className="text-green-400">
                            Resuelta: {formatDate(infraction.resolved_at)}
                            {infraction.resolved_by_name && <> - Por: {infraction.resolved_by_name}</>}
                            {infraction.resolution_notes && (
                              <> - Notas: {infraction.resolution_notes}</>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    {infraction.is_active && hasPermission("infractions:resolve") && (
                      <button
                        onClick={() => handleResolve(infraction)}
                        disabled={resolveMutation.isPending}
                        className="ml-4 px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                      >
                        Resolver
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default InfractionHistoryModal;
