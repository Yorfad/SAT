import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import type { Invoice } from '../../types';
import { money, ym } from "../../utils/format";

export default function ClientDashboard() {
  const navigate = useNavigate();

  // Obtener datos del usuario del localStorage
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ["client-dashboard"],
    queryFn: async () => (await api.get("/clients/dashboard")).data
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/client/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-300 flex items-center gap-3">
          <svg className="animate-spin h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Cargando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-300">
          Error: {(error as any)?.response?.data?.message || (error as any).message}
        </div>
      </div>
    );
  }

  const invoices: Invoice[] = data?.invoices ?? [];
  const services = data?.services ?? [];
  const pendingAmount = invoices.reduce((sum, inv) => sum + Number(inv.balance || 0), 0);
  const pendingInvoices = invoices.filter(inv => inv.payment_status !== 'paid');

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.full_name?.charAt(0) || 'C'}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-100">{user?.full_name || 'Cliente'}</h1>
              <p className="text-xs text-slate-400">NIT: {user?.nit || 'N/A'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 transition-colors p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-900/30 rounded-lg">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400">Saldo pendiente</p>
                <p className="text-xl font-bold text-orange-400">{money(pendingAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-900/30 rounded-lg">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400">Servicios activos</p>
                <p className="text-xl font-bold text-blue-400">{services.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Facturas pendientes */}
        {pendingInvoices.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <h2 className="font-semibold text-slate-100">Facturas Pendientes</h2>
              <span className="text-xs bg-orange-900/30 text-orange-400 px-2 py-1 rounded-full">
                {pendingInvoices.length} pendiente{pendingInvoices.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="divide-y divide-slate-700">
              {pendingInvoices.map(inv => (
                <div key={inv.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-200">{ym(inv.invoice_year, inv.invoice_month)}</p>
                    <p className="text-xs text-slate-400">Total: {money(inv.total_due)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-400">{money(inv.balance)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      inv.payment_status === 'overdue'
                        ? 'bg-red-900/30 text-red-400'
                        : inv.payment_status === 'partial'
                          ? 'bg-yellow-900/30 text-yellow-400'
                          : 'bg-slate-700 text-slate-400'
                    }`}>
                      {inv.payment_status === 'overdue' ? 'Vencida' :
                       inv.payment_status === 'partial' ? 'Parcial' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historial de facturas */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="font-semibold text-slate-100">Historial de Facturas</h2>
          </div>
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No hay facturas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/50">
                  <tr className="text-left text-slate-400">
                    <th className="py-3 px-4 font-medium">Período</th>
                    <th className="py-3 px-4 font-medium text-right">Total</th>
                    <th className="py-3 px-4 font-medium text-right">Pagado</th>
                    <th className="py-3 px-4 font-medium text-right">Saldo</th>
                    <th className="py-3 px-4 font-medium text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 px-4 text-slate-200 font-medium">
                        {ym(inv.invoice_year, inv.invoice_month)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">{money(inv.total_due)}</td>
                      <td className="py-3 px-4 text-right text-green-400">{money(inv.amount_paid)}</td>
                      <td className="py-3 px-4 text-right text-orange-400">{money(inv.balance)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          inv.payment_status === 'paid'
                            ? 'bg-green-900/30 text-green-400 border border-green-800'
                            : inv.payment_status === 'overdue'
                              ? 'bg-red-900/30 text-red-400 border border-red-800'
                              : inv.payment_status === 'partial'
                                ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                                : 'bg-slate-700 text-slate-400 border border-slate-600'
                        }`}>
                          {inv.payment_status === 'paid' ? 'Pagada' :
                           inv.payment_status === 'overdue' ? 'Vencida' :
                           inv.payment_status === 'partial' ? 'Parcial' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Servicios contratados */}
        {services.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700">
              <h2 className="font-semibold text-slate-100">Mis Servicios</h2>
            </div>
            <div className="divide-y divide-slate-700">
              {services.map((svc: any) => (
                <div key={svc.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-900/30 rounded-lg">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{svc.service_name}</p>
                      {svc.description && (
                        <p className="text-xs text-slate-400">{svc.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-200">{money(svc.custom_price || svc.default_price)}</p>
                    <span className="text-xs text-green-400">Activo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Información de contacto */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h2 className="font-semibold text-slate-100 mb-3">¿Necesitas ayuda?</h2>
          <p className="text-sm text-slate-400 mb-4">
            Contacta a tu contador para cualquier duda sobre tus facturas o servicios.
          </p>
          <div className="flex gap-3">
            <a
              href="tel:+50212345678"
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 px-4 rounded-lg text-center text-sm font-medium transition-colors"
            >
              Llamar
            </a>
            <a
              href="https://wa.me/50212345678"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-center text-sm font-medium transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
