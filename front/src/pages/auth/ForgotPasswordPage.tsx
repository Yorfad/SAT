import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detectar si es email o NIT
  const isEmail = identifier.includes("@");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post("/auth/forgot-password", isEmail ? { email: identifier } : { nit: identifier });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm border border-slate-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-full mb-4 shadow-lg">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">¿Olvidaste tu contraseña?</h1>
            <p className="text-blue-100 text-sm">No te preocupes, te ayudamos a recuperarla</p>
          </div>

          {success ? (
            /* Mensaje de éxito */
            <div className="px-8 py-10">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/30 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-white mb-3">¡Revisa tu correo!</h2>
                <p className="text-slate-300 mb-6">
                  Si tu {isEmail ? "correo" : "NIT"} está registrado y tiene un email asociado,
                  recibirás instrucciones para restablecer tu contraseña.
                </p>

                <div className="bg-slate-700/50 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-slate-400 mb-2">
                    <strong className="text-slate-300">Consejos:</strong>
                  </p>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Revisa tu bandeja de entrada</li>
                    <li>• Revisa la carpeta de spam/correo no deseado</li>
                    <li>• El enlace expira en 24 horas</li>
                  </ul>
                </div>

                <Link
                  to="/client/login"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          ) : (
            /* Formulario */
            <form onSubmit={onSubmit} className="px-8 py-8 space-y-6">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-sm text-slate-300">
                  Ingresa tu <strong>correo electrónico</strong> o <strong>NIT</strong> y te enviaremos
                  un enlace para restablecer tu contraseña.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Correo electrónico o NIT
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isEmail ? (
                      <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="correo@ejemplo.com o 12345678-9"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {isEmail ? "Detectado: correo electrónico" : identifier ? "Detectado: NIT" : ""}
                </p>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !identifier}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  "Enviar instrucciones"
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/client/login"
                  className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Nota de ayuda */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            ¿No tienes acceso a tu correo?{" "}
            <span className="text-slate-400">Contacta a soporte técnico</span>
          </p>
        </div>
      </div>
    </div>
  );
}
