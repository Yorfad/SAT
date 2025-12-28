import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { money } from "../../utils/format";
import { useWorkspace } from "../../context/WorkspaceContext";

type TabType = "client-payments" | "income" | "expenses";

type PendingPayment = {
  id: number;
  client_user_id: number;
  client_name: string;
  client_email: string;
  invoice_year: number;
  invoice_month: number;
  total_due: number;
  amount_paid: number;
  balance: number;
  payment_status: string;
  due_date: string | null;
  active_infractions_count: number;
};

type Expense = {
  id: number;
  expense_type: "one_time" | "monthly_recurring";
  description: string;
  amount: number;
  expense_date: string;
  category: string | null;
  is_active: boolean;
  is_shared: boolean;
  created_by_name: string;
};

export default function FinancialManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("client-payments");
  const [showAllWorkspaces, setShowAllWorkspaces] = useState(false);
  const { workspaces, currentWorkspace, setConsolidatedView, switchWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  // Ref para guardar el workspace al que volver y si activamos consolidated
  const previousWorkspaceRef = useRef(currentWorkspace);
  const activatedConsolidatedRef = useRef(false);

  // Guardar el workspace actual cuando se monta el componente
  useEffect(() => {
    if (currentWorkspace) {
      previousWorkspaceRef.current = currentWorkspace;
    }
  }, [currentWorkspace]);

  // Al salir de la página, restaurar al workspace anterior si activamos consolidated
  useEffect(() => {
    return () => {
      if (activatedConsolidatedRef.current) {
        // Desactivar vista consolidada
        setConsolidatedView(false);
        // Restaurar workspace anterior si existe
        if (previousWorkspaceRef.current) {
          switchWorkspace(previousWorkspaceRef.current);
        }
      }
    };
  }, [setConsolidatedView, switchWorkspace]);

  const handleToggleAllWorkspaces = () => {
    const newValue = !showAllWorkspaces;
    setShowAllWorkspaces(newValue);
    setConsolidatedView(newValue);
    // Trackear si activamos consolidated para hacer cleanup al salir
    activatedConsolidatedRef.current = newValue;
    // Invalidar queries para recargar datos
    queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header con título y toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Gestión Financiera</h1>
          {showAllWorkspaces && (
            <p className="text-sm text-purple-400 mt-1 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mostrando datos de todos los workspaces
            </p>
          )}
        </div>

        {/* Toggle para ver todos los workspaces */}
        {workspaces.length > 1 && (
          <button
            onClick={handleToggleAllWorkspaces}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              showAllWorkspaces
                ? 'bg-purple-900/30 border-purple-600 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">
              {showAllWorkspaces ? 'Todos los workspaces' : 'Ver todos'}
            </span>
            {showAllWorkspaces && (
              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 rounded-xl shadow-lg">
        <div className="border-b border-slate-700">
          <nav className="flex -mb-px">
            <Tab
              active={activeTab === "client-payments"}
              onClick={() => setActiveTab("client-payments")}
              label="Pagos de Clientes"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            />
            <Tab
              active={activeTab === "income"}
              onClick={() => setActiveTab("income")}
              label="Ingresos"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <Tab
              active={activeTab === "expenses"}
              onClick={() => setActiveTab("expenses")}
              label="Gastos"
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m16 0l-4 4m4-4l-4-4" /></svg>}
            />
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "client-payments" && <ClientPaymentsTab showAllWorkspaces={showAllWorkspaces} />}
          {activeTab === "income" && <IncomeTab />}
          {activeTab === "expenses" && <ExpensesTab />}
        </div>
      </div>
    </div>
  );
}

function Tab({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-orange-500 text-orange-400"
          : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ============================================================================
// TAB DE PAGOS DE CLIENTES (Cash Payments integrado)
// ============================================================================

type ClientForPayment = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  account_balance: number;
  accountBalance: number;
  monthlyDebt: number;
  totalDebt: number;
  active_infractions_count: number;
  workspace_name: string | null;
  lastPayment: {
    amount: number;
    payment_date: string;
    payment_method: string;
  } | null;
};

type Payment = {
  id: number;
  amount: number;
  payment_method: string;
  payment_type: string;
  notes: string | null;
  reference_number: string | null;
  balance_before: number;
  balance_after: number;
  payment_date: string;
  created_at: string;
  registered_by_name: string;
  workspace_name: string | null;
};

type Invoice = {
  id: number;
  invoice_year: number;
  invoice_month: number;
  total_due: number;
  amount_paid: number;
  balance: number;
  payment_status: string;
  payment_registered_at: string | null;
  created_at: string;
};

function ClientPaymentsTab({ showAllWorkspaces }: { showAllWorkspaces: boolean }) {
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<ClientForPayment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Obtener clientes con saldos
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["cash-payments-clients", showAllWorkspaces],
    queryFn: async () => (await api.get<ClientForPayment[]>("/cash-payments/clients")).data
  });

  // Filtrar clientes
  const filteredClients = clients.filter(c =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener historial del cliente seleccionado
  const { data: clientHistory } = useQuery({
    queryKey: ["cash-payments-history", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return null;
      return (await api.get<{ payments: Payment[]; invoices: Invoice[] }>(`/cash-payments/history/${selectedClient.id}`)).data;
    },
    enabled: !!selectedClient
  });

  // Mutacion para registrar pago
  const registerPaymentMutation = useMutation({
    mutationFn: async (data: {
      clientId: number;
      amount: number;
      paymentMethod: string;
      paymentType: string;
      notes: string;
      paymentDate: string;
    }) => (await api.post("/cash-payments", data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-payments-clients"] });
      queryClient.invalidateQueries({ queryKey: ["cash-payments-history"] });
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
      setShowPaymentModal(false);
      alert("Pago registrado correctamente");
    }
  });

  // Resumen de pagos
  const { data: summary } = useQuery({
    queryKey: ["cash-payments-summary", showAllWorkspaces],
    queryFn: async () => (await api.get("/cash-payments/summary")).data
  });

  if (isLoading) return <div className="text-slate-400">Cargando clientes...</div>;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 rounded-xl p-4">
            <p className="text-sm text-green-400">Pagos del Mes</p>
            <p className="text-2xl font-bold text-green-300">{money(summary.totalAmount)}</p>
            <p className="text-xs text-green-500">{summary.totalPayments} transacciones</p>
          </div>
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 rounded-xl p-4">
            <p className="text-sm text-blue-400">Clientes que Pagaron</p>
            <p className="text-2xl font-bold text-blue-300">{summary.uniqueClients}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-400">Total Clientes</p>
            <p className="text-2xl font-bold text-slate-200">{clients.length}</p>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar cliente por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No se encontraron clientes</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="text-left p-4 text-slate-400 font-medium">Cliente</th>
                <th className="text-right p-4 text-slate-400 font-medium">Deuda Mes</th>
                <th className="text-right p-4 text-slate-400 font-medium">Deuda Total</th>
                <th className="text-right p-4 text-slate-400 font-medium">Saldo</th>
                <th className="text-center p-4 text-slate-400 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="text-white font-medium">{client.full_name}</p>
                      <p className="text-sm text-slate-400">{client.email}</p>
                      {showAllWorkspaces && client.workspace_name && (
                        <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-purple-300 mt-1 inline-block">
                          {client.workspace_name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className={client.monthlyDebt > 0 ? 'text-red-400' : 'text-green-400'}>
                      {money(client.monthlyDebt)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={client.totalDebt > 0 ? 'text-red-400' : 'text-green-400'}>
                      {money(client.totalDebt)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={client.accountBalance >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {money(client.accountBalance)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setShowPaymentModal(true);
                        }}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Pago
                      </button>
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-lg transition-colors"
                      >
                        Historial
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de historial */}
      {selectedClient && !showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{selectedClient.full_name}</h2>
                <p className="text-sm text-slate-400">Historial de pagos y facturas</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-400">Saldo actual</p>
                  <p className={`text-lg font-bold ${selectedClient.accountBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {money(selectedClient.accountBalance)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Pagos */}
              <div>
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Pagos Registrados
                </h3>
                {clientHistory?.payments && clientHistory.payments.length > 0 ? (
                  <div className="space-y-2">
                    {clientHistory.payments.map(payment => (
                      <div key={payment.id} className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="text-green-400 font-medium">{money(payment.amount)}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(payment.payment_date).toLocaleDateString()} - {payment.payment_method}
                            {payment.notes && ` - ${payment.notes}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Saldo: {money(payment.balance_before)} → {money(payment.balance_after)}</p>
                          <p className="text-xs text-slate-500">Por: {payment.registered_by_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No hay pagos registrados</p>
                )}
              </div>

              {/* Facturas */}
              <div>
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Facturas Mensuales
                </h3>
                {clientHistory?.invoices && clientHistory.invoices.length > 0 ? (
                  <div className="space-y-2">
                    {clientHistory.invoices.map(invoice => (
                      <div key={invoice.id} className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">
                            {new Date(invoice.invoice_year, invoice.invoice_month - 1).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-400">
                            Total: {money(invoice.total_due)} | Pagado: {money(invoice.amount_paid || 0)}
                          </p>
                        </div>
                        <div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            invoice.payment_status === 'paid' ? 'bg-green-900/50 text-green-400' :
                            invoice.payment_status === 'partial' ? 'bg-yellow-900/50 text-yellow-400' :
                            invoice.payment_status === 'overdue' ? 'bg-red-900/50 text-red-400' :
                            'bg-slate-600 text-slate-300'
                          }`}>
                            {invoice.payment_status === 'paid' ? 'Pagado' :
                             invoice.payment_status === 'partial' ? 'Parcial' :
                             invoice.payment_status === 'overdue' ? 'Vencido' :
                             'Pendiente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No hay facturas</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPaymentModal(true);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              >
                Registrar Pago
              </button>
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de registro de pago */}
      {showPaymentModal && selectedClient && (
        <PaymentModal
          client={selectedClient}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={(data) => registerPaymentMutation.mutate(data)}
          isLoading={registerPaymentMutation.isPending}
        />
      )}
    </div>
  );
}

function PaymentModal({
  client,
  onClose,
  onSubmit,
  isLoading
}: {
  client: ClientForPayment;
  onClose: () => void;
  onSubmit: (data: {
    clientId: number;
    amount: number;
    paymentMethod: string;
    paymentType: string;
    notes: string;
    paymentDate: string;
  }) => void;
  isLoading: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentType, setPaymentType] = useState("regular");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    onSubmit({
      clientId: client.id,
      amount: parseFloat(amount),
      paymentMethod,
      paymentType,
      notes,
      paymentDate
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-md">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Registrar Pago</h2>
          <p className="text-sm text-slate-400">Cliente: {client.full_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Info del cliente */}
          <div className="bg-slate-700/50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Deuda del mes:</span>
              <span className="text-red-400">{money(client.monthlyDebt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Deuda total:</span>
              <span className="text-red-400">{money(client.totalDebt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Saldo actual:</span>
              <span className={client.accountBalance >= 0 ? 'text-green-400' : 'text-red-400'}>
                {money(client.accountBalance)}
              </span>
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Monto del pago *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">Q</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Fecha del pago</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Metodo de pago */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Metodo de pago</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
            >
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="card">Tarjeta</option>
              <option value="other">Otro</option>
            </select>
          </div>

          {/* Tipo de pago */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Tipo de pago</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-500"
            >
              <option value="regular">Pago regular</option>
              <option value="advance">Anticipo</option>
              <option value="partial">Abono parcial</option>
              <option value="debt">Pago de deuda</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500 resize-none"
              rows={2}
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={isLoading || !amount}
            >
              {isLoading ? 'Registrando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// TAB DE INGRESOS EXTERNOS (para el dueño del negocio)
// ============================================================================

type ExternalIncome = {
  id: number;
  description: string;
  amount: number;
  income_date: string;
  source: string;
  notes: string | null;
  created_by_name: string;
  created_at: string;
};

function IncomeTab() {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const { currentWorkspace } = useWorkspace();

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split("T")[0]);
  const [source, setSource] = useState("salary");
  const [notes, setNotes] = useState("");

  // Query para ingresos externos
  const { data: incomes = [], isLoading } = useQuery({
    queryKey: ["external-incomes", currentYear, currentMonth, currentWorkspace?.slug],
    queryFn: async () => {
      try {
        const { data } = await api.get<ExternalIncome[]>(`/external-incomes?year=${currentYear}&month=${currentMonth}`);
        return data;
      } catch {
        return [];
      }
    }
  });

  // Query para resumen
  const { data: summary } = useQuery({
    queryKey: ["external-incomes-summary", currentYear, currentMonth, currentWorkspace?.slug],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/external-incomes/summary?year=${currentYear}&month=${currentMonth}`);
        return data;
      } catch {
        return { total: 0, count: 0 };
      }
    }
  });

  const createIncomeMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/external-incomes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-incomes"] });
      queryClient.invalidateQueries({ queryKey: ["external-incomes-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
      setShowForm(false);
      setDescription("");
      setAmount("");
      setSource("salary");
      setNotes("");
      alert("Ingreso registrado correctamente");
    }
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/external-incomes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-incomes"] });
      queryClient.invalidateQueries({ queryKey: ["external-incomes-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
      alert("Ingreso eliminado");
    }
  });

  const handleCreateIncome = () => {
    if (!description || !amount) {
      alert("Completa todos los campos requeridos");
      return;
    }

    createIncomeMutation.mutate({
      description,
      amount: parseFloat(amount),
      incomeDate,
      source,
      notes: notes || undefined
    });
  };

  const sourceLabels: Record<string, string> = {
    salary: "Salario",
    freelance: "Freelance",
    investment: "Inversión",
    rental: "Alquiler",
    other: "Otro"
  };

  if (isLoading) return <div className="text-slate-400">Cargando ingresos...</div>;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 rounded-xl p-4">
          <p className="text-sm text-green-400">Total Ingresos del Mes</p>
          <p className="text-2xl font-bold text-green-300">{money(summary?.total || 0)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 rounded-xl p-4">
          <p className="text-sm text-blue-400">Registros</p>
          <p className="text-2xl font-bold text-blue-300">{summary?.count || 0}</p>
        </div>
      </div>

      {/* Header con botón */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Ingresos Externos</h3>
          <p className="text-sm text-slate-400">Registra ingresos de otras fuentes (salarios, freelance, etc.)</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 font-medium"
        >
          {showForm ? "Cancelar" : "+ Agregar Ingreso"}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fuente de Ingreso</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="salary">Salario</option>
                <option value="freelance">Freelance</option>
                <option value="investment">Inversión</option>
                <option value="rental">Alquiler</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fecha</label>
              <input
                type="date"
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Descripción *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Salario de Enero, Proyecto freelance..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Monto *</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Notas (opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <button
            onClick={handleCreateIncome}
            disabled={createIncomeMutation.isPending}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 font-medium"
          >
            {createIncomeMutation.isPending ? "Guardando..." : "Guardar Ingreso"}
          </button>
        </div>
      )}

      {/* Lista de Ingresos */}
      <div className="space-y-2">
        {incomes.length > 0 ? (
          incomes.map((income) => (
            <div key={income.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white">{income.description}</p>
                    <span className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400 border border-green-800">
                      {sourceLabels[income.source] || income.source}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {new Date(income.income_date).toLocaleDateString()} • Registrado por {income.created_by_name}
                    {income.notes && ` • ${income.notes}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-green-400">{money(income.amount)}</p>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar "${income.description}"?`)) {
                        deleteIncomeMutation.mutate(income.id);
                      }
                    }}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-400 text-center py-8">No hay ingresos registrados para este mes</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TAB DE GASTOS
// ============================================================================

type ExpenseCategory = {
  id: number;
  name: string;
  description: string | null;
  color: string;
  workspace_id: number | null;
  workspace_name: string | null;
  is_active: boolean;
};

function ExpensesTab() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseType, setExpenseType] = useState<"one_time" | "monthly_recurring">("one_time");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [isShared, setIsShared] = useState(false);

  // Modal de categorias
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6B7280");
  const [newCategoryIsGlobal, setNewCategoryIsGlobal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  // Query para categorias - incluir workspace para refrescar al cambiar
  const { data: categories = [] } = useQuery({
    queryKey: ["expense-categories", currentWorkspace?.slug],
    queryFn: async () => (await api.get<ExpenseCategory[]>("/expense-categories")).data,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; color: string; isGlobal?: boolean }) => {
      await api.post("/expense-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      setNewCategoryName("");
      setNewCategoryColor("#6B7280");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await api.patch(`/expense-categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      setEditingCategory(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/expense-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
    },
  });

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expenses", currentYear, currentMonth],
    queryFn: async () =>
      (await api.get<Expense[]>(`/expenses?year=${currentYear}&month=${currentMonth}`)).data,
  });

  const { data: summary } = useQuery({
    queryKey: ["expenses-summary", currentYear, currentMonth],
    queryFn: async () =>
      (await api.get(`/expenses/summary?year=${currentYear}&month=${currentMonth}`)).data,
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-projections"] });
      setShowForm(false);
      setEditingExpense(null);
      setDescription("");
      setAmount("");
      setCategory("");
      setIsShared(false);
      alert("Gasto registrado correctamente");
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await api.patch(`/expenses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-projections"] });
      setShowForm(false);
      setEditingExpense(null);
      setDescription("");
      setAmount("");
      setCategory("");
      setIsShared(false);
      alert("Gasto actualizado correctamente");
    },
  });

  const toggleExpenseActiveMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/expenses/${id}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-projections"] });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenses-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-projections"] });
      alert("Gasto eliminado correctamente");
    },
  });

  const handleCreateExpense = () => {
    if (!description || !amount) {
      alert("Completa todos los campos requeridos");
      return;
    }

    if (editingExpense) {
      updateExpenseMutation.mutate({
        id: editingExpense.id,
        data: {
          description,
          amount: parseFloat(amount),
          category: category || undefined,
          isShared,
        }
      });
    } else {
      createExpenseMutation.mutate({
        expenseType,
        description,
        amount: parseFloat(amount),
        expenseDate,
        category: category || undefined,
        isShared,
      });
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setCategory(expense.category || "");
    setExpenseType(expense.expense_type);
    setIsShared(expense.is_shared || false);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setShowForm(false);
    setDescription("");
    setAmount("");
    setCategory("");
    setIsShared(false);
  };

  if (isLoading) return <div className="text-slate-400">Cargando gastos...</div>;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-950/20 border border-red-800 rounded-lg p-4">
            <p className="text-sm text-slate-400">Total Gastos</p>
            <p className="text-2xl font-bold text-red-400">{money(summary.summary.total)}</p>
          </div>
          <div className="bg-orange-950/20 border border-orange-800 rounded-lg p-4">
            <p className="text-sm text-slate-400">Gastos Únicos</p>
            <p className="text-2xl font-bold text-orange-400">{money(summary.summary.total_one_time)}</p>
          </div>
          <div className="bg-yellow-950/20 border border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-slate-400">Gastos Recurrentes</p>
            <p className="text-2xl font-bold text-yellow-400">{money(summary.summary.total_recurring)}</p>
          </div>
        </div>
      )}

      {/* Botón Agregar */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Gastos del Mes</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoriesModal(true)}
            className="bg-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-600 font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Categorias
          </button>
          <button
            onClick={() => {
              if (showForm) {
                handleCancelEdit();
              } else {
                setShowForm(true);
              }
            }}
            className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-orange-700 hover:to-amber-700 font-medium"
          >
            {showForm ? "Cancelar" : "+ Agregar Gasto"}
          </button>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tipo de Gasto</label>
              <select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="one_time">Gasto Único</option>
                <option value="monthly_recurring">Gasto Mensual Recurrente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fecha</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Descripción *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Pago a trabajador A, Compra de artículos..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Monto *</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Sin categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} {cat.workspace_id === null ? "(Global)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                Administra categorias desde el boton "Categorias"
              </p>
            </div>
          </div>

          {/* Checkbox para gasto global */}
          <div className="flex items-center gap-3 p-3 bg-purple-900/20 border border-purple-800 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-slate-200 font-medium">Gasto global</span>
            </label>
            <span className="text-xs text-purple-300">
              (visible en todos los workspaces)
            </span>
          </div>

          <button
            onClick={handleCreateExpense}
            disabled={createExpenseMutation.isPending}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 font-medium"
          >
            {createExpenseMutation.isPending ? "Guardando..." : "Guardar Gasto"}
          </button>
        </div>
      )}

      {/* Lista de Gastos */}
      <div className="space-y-2">
        {expenses && expenses.length > 0 ? (
          expenses.map((expense) => (
            <div key={expense.id} className={`rounded-lg p-4 border ${
              expense.is_active
                ? 'bg-slate-800 border-slate-700'
                : 'bg-slate-900/50 border-slate-600 opacity-60'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-semibold ${expense.is_active ? 'text-white' : 'text-slate-500'}`}>
                      {expense.description}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${
                        expense.expense_type === "one_time"
                          ? "bg-orange-900/30 text-orange-400 border-orange-800"
                          : "bg-yellow-900/30 text-yellow-400 border-yellow-800"
                      }`}
                    >
                      {expense.expense_type === "one_time" ? "Único" : "Recurrente"}
                    </span>
                    {expense.is_shared && (
                      <span className="text-xs px-2 py-1 rounded bg-purple-900/50 text-purple-300 border border-purple-700">
                        Global
                      </span>
                    )}
                    {!expense.is_active && (
                      <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 border border-gray-600">
                        Desactivado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    {new Date(expense.expense_date).toLocaleDateString()} • Registrado por{" "}
                    {expense.created_by_name}
                    {expense.category && ` • ${expense.category}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`text-lg font-bold ${expense.is_active ? 'text-red-400' : 'text-slate-500'}`}>
                    {money(expense.amount)}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditExpense(expense)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      title="Editar gasto"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => toggleExpenseActiveMutation.mutate(expense.id)}
                      className={`px-2 py-1 text-white text-xs rounded transition-colors ${
                        expense.is_active
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                      title={expense.is_active ? "Desactivar (para simulaciones)" : "Activar gasto"}
                    >
                      {expense.is_active ? '⏸' : '▶'}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar el gasto "${expense.description}"? Esta acción no se puede deshacer.`)) {
                          deleteExpenseMutation.mutate(expense.id);
                        }
                      }}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      title="Eliminar gasto"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-400 text-center py-8">No hay gastos registrados para este mes</p>
        )}
      </div>

      {/* Modal de Categorias */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-lg border border-slate-700 shadow-xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Gestionar Categorias de Gastos</h2>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Nueva categoria */}
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-medium text-slate-300 mb-3">Nueva Categoria</h3>
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nombre de la categoria..."
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Color:</span>
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border border-slate-600"
                        title="Color de la categoria"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCategoryIsGlobal}
                        onChange={(e) => setNewCategoryIsGlobal(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-orange-500 focus:ring-orange-500"
                      />
                      <span>Visible en todos los workspaces (Global)</span>
                    </label>
                    <button
                      onClick={() => {
                        if (!newCategoryName.trim()) return;
                        createCategoryMutation.mutate({
                          name: newCategoryName.trim(),
                          color: newCategoryColor,
                          isGlobal: newCategoryIsGlobal
                        });
                        setNewCategoryName("");
                        setNewCategoryColor("#6B7280");
                        setNewCategoryIsGlobal(false);
                      }}
                      disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    >
                      {createCategoryMutation.isPending ? "..." : "Agregar"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de categorias */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-300">Categorias Existentes</h3>
                {categories.length === 0 ? (
                  <p className="text-slate-400 text-sm py-4 text-center">No hay categorias</p>
                ) : (
                  categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {editingCategory?.id === cat.id ? (
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="px-2 py-1 bg-slate-800 border border-slate-600 text-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        ) : (
                          <span className="text-slate-200">{cat.name}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          cat.workspace_id === null
                            ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {cat.workspace_id === null ? 'Global' : 'Local'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {editingCategory?.id === cat.id ? (
                          <>
                            <button
                              onClick={() => {
                                updateCategoryMutation.mutate({
                                  id: cat.id,
                                  data: { name: editingCategory.name }
                                });
                              }}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="px-2 py-1 bg-slate-600 text-white text-xs rounded hover:bg-slate-500"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingCategory(cat)}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar la categoria "${cat.name}"?`)) {
                                  deleteCategoryMutation.mutate(cat.id);
                                }
                              }}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Info */}
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                <p className="text-blue-200 text-sm">
                  Las categorias <strong>"Global"</strong> son visibles en todos los workspaces.
                  Las categorias <strong>"Local"</strong> solo en este workspace.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

