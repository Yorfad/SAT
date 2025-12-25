import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import { money } from "../../utils/format";
import { useWorkspace } from "../../context/WorkspaceContext";

type TabType = "payments" | "expenses" | "infractions";

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
  created_by_name: string;
};

type Infraction = {
  id: number;
  client_user_id: number;
  client_name: string;
  infraction_type: "automatic_unpaid" | "manual";
  reason: string;
  invoice_year: number | null;
  invoice_month: number | null;
  is_active: boolean;
  created_at: string;
  created_by_name: string | null;
};

export default function FinancialManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("payments");
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
    queryClient.invalidateQueries({ queryKey: ["infractions"] });
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
              active={activeTab === "payments"}
              onClick={() => setActiveTab("payments")}
              label="Pagos"
            />
            <Tab
              active={activeTab === "expenses"}
              onClick={() => setActiveTab("expenses")}
              label="Gastos"
            />
            <Tab
              active={activeTab === "infractions"}
              onClick={() => setActiveTab("infractions")}
              label="Infracciones"
            />
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "payments" && <PaymentsTab />}
          {activeTab === "expenses" && <ExpensesTab />}
          {activeTab === "infractions" && <InfractionsTab />}
        </div>
      </div>
    </div>
  );
}

function Tab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-orange-500 text-orange-400"
          : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600"
      }`}
    >
      {label}
    </button>
  );
}

// ============================================================================
// TAB DE PAGOS
// ============================================================================

function PaymentsTab() {
  const queryClient = useQueryClient();
  const [selectedInvoice, setSelectedInvoice] = useState<PendingPayment | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>("paid");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { data: pendingPayments, isLoading } = useQuery({
    queryKey: ["pending-payments"],
    queryFn: async () => (await api.get<PendingPayment[]>("/payments/pending")).data,
  });

  const registerPaymentMutation = useMutation({
    mutationFn: async (data: { invoiceId: number; paymentStatus: string; amountPaid: number; notes?: string }) => {
      await api.post(`/payments/register/${data.invoiceId}`, {
        paymentStatus: data.paymentStatus,
        amountPaid: data.amountPaid,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
      setSelectedInvoice(null);
      setAmountPaid("");
      setNotes("");
      alert("Pago registrado correctamente");
    },
  });

  const handleRegisterPayment = () => {
    if (!selectedInvoice || !amountPaid) {
      alert("Selecciona una factura y especifica el monto pagado");
      return;
    }

    registerPaymentMutation.mutate({
      invoiceId: selectedInvoice.id,
      paymentStatus,
      amountPaid: parseFloat(amountPaid),
      notes: notes || undefined,
    });
  };

  if (isLoading) return <div className="text-slate-400">Cargando pagos pendientes...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Pagos Pendientes */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Pagos Pendientes del Mes</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pendingPayments && pendingPayments.length > 0 ? (
              pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  onClick={() => {
                    setSelectedInvoice(payment);
                    setAmountPaid(payment.balance.toString());
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedInvoice?.id === payment.id
                      ? "border-orange-500 bg-orange-950/20"
                      : "border-slate-700 bg-slate-800 hover:border-slate-600"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-white">{payment.client_name}</p>
                      <p className="text-xs text-slate-400">{payment.client_email}</p>
                    </div>
                    {payment.active_infractions_count > 0 && (
                      <span className="bg-red-900/30 text-red-400 text-xs px-2 py-1 rounded border border-red-800">
                        {payment.active_infractions_count} infracciones
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-400">Total:</span>
                      <span className="ml-1 font-medium text-slate-200">{money(payment.total_due)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Pagado:</span>
                      <span className="ml-1 font-medium text-slate-200">{money(payment.amount_paid)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Saldo:</span>
                      <span className="ml-1 font-medium text-red-400">{money(payment.balance)}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        payment.payment_status === "paid"
                          ? "bg-green-900/30 text-green-400 border border-green-800"
                          : payment.payment_status === "partial"
                          ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                          : "bg-slate-700 text-slate-300 border border-slate-600"
                      }`}
                    >
                      {payment.payment_status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-8">No hay pagos pendientes</p>
            )}
          </div>
        </div>

        {/* Formulario de Registro de Pago */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-white">Registrar Pago</h3>
          {selectedInvoice ? (
            <div className="space-y-4">
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
                <p className="font-semibold text-white">{selectedInvoice.client_name}</p>
                <p className="text-sm text-slate-400">
                  Factura: {selectedInvoice.invoice_month}/{selectedInvoice.invoice_year}
                </p>
                <p className="text-lg font-bold mt-2 text-orange-400">Saldo: {money(selectedInvoice.balance)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Estado del Pago</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="paid">Pagado Completo</option>
                  <option value="partial">Pago Parcial/Abono</option>
                  <option value="deferred_next_month">Pasa al Siguiente Mes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Monto Pagado</label>
                <input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Observaciones sobre el pago..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRegisterPayment}
                  disabled={registerPaymentMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 font-medium"
                >
                  {registerPaymentMutation.isPending ? "Registrando..." : "Registrar Pago"}
                </button>
                <button
                  onClick={() => {
                    setSelectedInvoice(null);
                    setAmountPaid("");
                    setNotes("");
                  }}
                  className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">
              Selecciona una factura de la lista para registrar un pago
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB DE GASTOS
// ============================================================================

function ExpensesTab() {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseType, setExpenseType] = useState<"one_time" | "monthly_recurring">("one_time");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");

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
        }
      });
    } else {
      createExpenseMutation.mutate({
        expenseType,
        description,
        amount: parseFloat(amount),
        expenseDate,
        category: category || undefined,
      });
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setCategory(expense.category || "");
    setExpenseType(expense.expense_type);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setShowForm(false);
    setDescription("");
    setAmount("");
    setCategory("");
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
              <label className="block text-sm font-medium text-slate-300 mb-1">Categoría</label>
              <input
                type="text"
                list="expense-categories"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Selecciona o escribe una categoría..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <datalist id="expense-categories">
                <option value="Nómina" />
                <option value="Suministros" />
                <option value="Servicios Públicos" />
                <option value="Alquiler" />
                <option value="Mantenimiento" />
                <option value="Transporte" />
                <option value="Tecnología" />
                <option value="Marketing" />
                <option value="Impuestos" />
                <option value="Seguros" />
                <option value="Capacitación" />
                <option value="Otros" />
              </datalist>
              <p className="text-xs text-slate-400 mt-1">
                Selecciona una categoría existente o escribe una nueva
              </p>
            </div>
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
    </div>
  );
}

// ============================================================================
// TAB DE INFRACCIONES
// ============================================================================

function InfractionsTab() {
  const queryClient = useQueryClient();
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [relatedInvoiceId, setRelatedInvoiceId] = useState<string>("");

  // Obtener lista de clientes
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => (await api.get("/clients")).data,
  });

  const { data: infractions, isLoading } = useQuery({
    queryKey: ["infractions", showActiveOnly],
    queryFn: async () =>
      (await api.get<Infraction[]>(`/infractions?isActive=${showActiveOnly}`)).data,
  });

  const createInfractionMutation = useMutation({
    mutationFn: async (data: { clientUserId: number; reason: string; relatedInvoiceId?: number; confirmDeactivation?: boolean }) => {
      return await api.post("/infractions", data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["infractions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
      queryClient.invalidateQueries({ queryKey: ["clients-list"] });
      setShowForm(false);
      setSelectedClient("");
      setReason("");
      setRelatedInvoiceId("");

      if (response.data.clientDeactivated) {
        alert("⚠️ " + response.data.message);
      } else {
        alert(response.data.message);
      }
    },
    onError: (err: any) => {
      if (err?.response?.data?.error === 'warning_third_infraction') {
        const confirmed = confirm(err.response.data.message + "\n\n¿Deseas continuar y crear esta infracción?");
        if (confirmed) {
          // Reintentar con confirmación
          createInfractionMutation.mutate({
            clientUserId: parseInt(selectedClient),
            reason,
            relatedInvoiceId: relatedInvoiceId ? parseInt(relatedInvoiceId) : undefined,
            confirmDeactivation: true
          });
        }
      } else {
        alert(err?.response?.data?.message || err?.response?.data?.error || "Error al crear infracción");
      }
    }
  });

  const resolveInfractionMutation = useMutation({
    mutationFn: async (id: number) => {
      const notes = prompt("Notas de resolución (opcional):");
      if (notes === null) throw new Error("Cancelado");
      await api.patch(`/infractions/${id}/resolve`, {
        resolutionNotes: notes || "Desactivada por administrador",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["infractions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-summary"] });
      alert("Infracción desactivada correctamente");
    },
    onError: (err: any) => {
      if (err.message !== "Cancelado") {
        alert("Error al desactivar infracción");
      }
    }
  });

  const handleCreateInfraction = () => {
    if (!selectedClient || !reason.trim()) {
      alert("Por favor selecciona un cliente e ingresa el motivo de la infracción");
      return;
    }

    createInfractionMutation.mutate({
      clientUserId: parseInt(selectedClient),
      reason,
      relatedInvoiceId: relatedInvoiceId ? parseInt(relatedInvoiceId) : undefined
    });
  };

  if (isLoading) return <div className="text-slate-400">Cargando infracciones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Infracciones de Clientes</h3>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-600"
            />
            <span className="text-sm">Solo activas</span>
          </label>
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setSelectedClient("");
                setReason("");
                setRelatedInvoiceId("");
              } else {
                setShowForm(true);
              }
            }}
            className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-orange-700 hover:to-amber-700 font-medium"
          >
            {showForm ? "Cancelar" : "+ Agregar Infracción"}
          </button>
        </div>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
          <h4 className="font-semibold text-white">Nueva Infracción</h4>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Cliente *</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map((client: any) => (
                <option key={client.id} value={client.id}>
                  {client.full_name} ({client.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Motivo de la Infracción *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ej: Cliente no ha pagado facturas de los últimos 2 meses"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Factura Relacionada (opcional)</label>
            <input
              type="number"
              value={relatedInvoiceId}
              onChange={(e) => setRelatedInvoiceId(e.target.value)}
              placeholder="ID de factura relacionada"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <button
            onClick={handleCreateInfraction}
            disabled={createInfractionMutation.isPending}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 font-medium"
          >
            {createInfractionMutation.isPending ? "Creando..." : "Crear Infracción"}
          </button>
        </div>
      )}

      {/* Lista de infracciones */}
      <div className="space-y-2">
        {infractions && infractions.length > 0 ? (
          infractions.map((infraction) => (
            <div
              key={infraction.id}
              className={`border rounded-lg p-4 ${
                infraction.is_active ? "bg-red-950/20 border-red-800" : "bg-slate-800 border-slate-700 opacity-70"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white">{infraction.client_name}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${
                        infraction.infraction_type === "automatic_unpaid"
                          ? "bg-red-900/30 text-red-400 border-red-800"
                          : "bg-orange-900/30 text-orange-400 border-orange-800"
                      }`}
                    >
                      {infraction.infraction_type === "automatic_unpaid" ? "No Pago Automático" : "Manual"}
                    </span>
                    {infraction.is_active ? (
                      <span className="text-xs px-2 py-1 rounded bg-red-500 text-white">ACTIVA</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 border border-gray-600">DESACTIVADA</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{infraction.reason}</p>
                  <p className="text-xs text-slate-400">
                    Fecha: {new Date(infraction.created_at).toLocaleDateString()}
                    {infraction.invoice_month && infraction.invoice_year && (
                      <> • Factura: {infraction.invoice_month}/{infraction.invoice_year}</>
                    )}
                    {infraction.created_by_name && <> • Creada por: {infraction.created_by_name}</>}
                  </p>
                </div>
                {infraction.is_active && (
                  <button
                    onClick={() => resolveInfractionMutation.mutate(infraction.id)}
                    disabled={resolveInfractionMutation.isPending}
                    className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Desactivar
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-400 text-center py-8">
            {showActiveOnly ? "No hay infracciones activas" : "No hay infracciones registradas"}
          </p>
        )}
      </div>
    </div>
  );
}
