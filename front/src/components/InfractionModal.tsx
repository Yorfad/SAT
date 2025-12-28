import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

interface Invoice {
  id: number;
  invoice_month: number;
  invoice_year: number;
  total_due: number;
}

interface InfractionModalProps {
  client: { id: number; full_name: string };
  invoices?: Invoice[];
  onClose: () => void;
  onSuccess?: () => void;
}

export function InfractionModal({ client, invoices = [], onClose, onSuccess }: InfractionModalProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [relatedInvoiceId, setRelatedInvoiceId] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: { confirmDeactivation?: boolean }) => {
      return api.post("/infractions", {
        clientUserId: client.id,
        reason,
        relatedInvoiceId: relatedInvoiceId || null,
        confirmDeactivation: data.confirmDeactivation
      });
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["infractions"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });

      const message = response.data?.clientDeactivated
        ? "Infracción registrada. El cliente ha sido desactivado por alcanzar el límite de infracciones."
        : response.data?.limitReached
          ? "Infracción registrada. El cliente ha alcanzado el límite de infracciones."
          : "Infracción registrada correctamente.";

      alert(message);
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      const errorData = error?.response?.data;

      // Manejo especial: advertencia de desactivación
      if (errorData?.error === 'warning_third_infraction') {
        setWarningMessage(errorData.message);
        setShowConfirmation(true);
        return;
      }

      // Manejo especial: límite alcanzado (no se pueden agregar más)
      if (errorData?.error === 'limit_reached') {
        alert(`⛔ ${errorData.message}`);
        onClose();
        return;
      }

      alert(errorData?.message || "Error al crear infraccion");
    }
  });

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert("Ingresa el motivo de la infraccion");
      return;
    }
    createMutation.mutate({});
  };

  const handleConfirmDeactivation = () => {
    createMutation.mutate({ confirmDeactivation: true });
  };

  const formatMoney = (amount: number) => `Q${amount.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-md border border-slate-700 shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Registrar Infraccion</h2>
          <p className="text-sm text-slate-400 mt-1">
            Cliente: <span className="text-white">{client.full_name}</span>
          </p>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Advertencia de confirmacion */}
          {showConfirmation && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-red-200 font-medium">Advertencia</p>
                  <p className="text-red-300 text-sm mt-1">{warningMessage}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleConfirmDeactivation}
                      disabled={createMutation.isPending}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {createMutation.isPending ? "Procesando..." : "Si, desactivar cliente"}
                    </button>
                    <button
                      onClick={() => {
                        setShowConfirmation(false);
                        setWarningMessage("");
                      }}
                      className="px-3 py-1.5 bg-slate-600 text-white text-sm rounded hover:bg-slate-500"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showConfirmation && (
            <>
              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Motivo de la Infraccion *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={4}
                  placeholder="Ej: Cliente no ha pagado facturas de los ultimos 3 meses"
                />
              </div>

              {/* Factura relacionada */}
              {invoices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Factura Relacionada (opcional)
                  </label>
                  <select
                    value={relatedInvoiceId}
                    onChange={(e) => setRelatedInvoiceId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Sin factura relacionada</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_month}/{inv.invoice_year} - {formatMoney(inv.total_due)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            </>
          )}
        </div>

        {/* Footer */}
        {!showConfirmation && (
          <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !reason.trim()}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Guardando..." : "Registrar Infraccion"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InfractionModal;
