import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import api from "../../lib/api";
import { setTenant } from "../../lib/tenant";
import { useAuth } from "../../context/AuthContext";

export default function ClientLoginPage() {
  const nav = useNavigate();
  const { setAuth } = useAuth();
  const [nit, setNit] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Estado para modal de cambio de contraseña
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [tempUser, setTempUser] = useState<any>(null);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const isNative = Capacitor.isNativePlatform();
    const endpoint = isNative ? "/auth/mobile/login" : "/auth/client/login";

    try {
      const response = await api.post(endpoint, { nit, password });
      const { token, user, tenant, mustChangePassword, passwordMessage: msg } = response.data;

      // Guardar tenant si viene en la respuesta
      if (tenant) {
        setTenant(tenant);
      }

      // Si debe cambiar contraseña, mostrar modal
      if (mustChangePassword) {
        setTempToken(token);
        setTempUser(user);
        setPasswordMessage(msg || "Tu contraseña es temporal. Debes crear una nueva contraseña personal.");
        setShowChangePassword(true);
        setLoading(false);
        return;
      }

      // Login normal
      setAuth(token, user);
      nav("/client/dashboard");
    } catch (error: any) {
      const response = error?.response?.data;
      if (response?.message === "Cuenta desactivada") {
        setErr(`Tu cuenta ha sido desactivada.\nMotivo: ${response.reason}\n\nContacta a soporte para más información.`);
      } else {
        setErr(response?.message || "NIT o contraseña incorrectos");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);

    if (newPassword.length < 6) {
      setChangeError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword === nit) {
      setChangeError("Por seguridad, tu contraseña no puede ser igual a tu NIT");
      return;
    }

    setChangingPassword(true);

    try {
      // Usar el token temporal para cambiar la contraseña
      await api.post("/auth/change-password", {
        newPassword,
        confirmPassword
      }, {
        headers: { Authorization: `Bearer ${tempToken}` }
      });

      // Ahora hacer login de nuevo con la nueva contraseña
      const isNative = Capacitor.isNativePlatform();
      const endpoint = isNative ? "/auth/mobile/login" : "/auth/client/login";
      const response = await api.post(endpoint, { nit, password: newPassword });

      const { token, user, tenant } = response.data;

      if (tenant) {
        setTenant(tenant);
      }

      setAuth(token, user);
      nav("/client/dashboard");
    } catch (error: any) {
      setChangeError(error?.response?.data?.message || "Error al cambiar la contraseña");
    } finally {
      setChangingPassword(false);
    }
  };

  // Validación de fortaleza de contraseña
  const passwordStrength = () => {
    if (!newPassword) return { level: 0, text: "", color: "" };
    let score = 0;
    if (newPassword.length >= 6) score++;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 2) return { level: 1, text: "Débil", color: "bg-red-500" };
    if (score <= 3) return { level: 2, text: "Regular", color: "bg-yellow-500" };
    if (score <= 4) return { level: 3, text: "Buena", color: "bg-green-500" };
    return { level: 4, text: "Excelente", color: "bg-emerald-500" };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-900 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-900 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Modal de cambio de contraseña obligatorio */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 overflow-hidden">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 rounded-full mb-3 shadow-lg">
                <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Crea tu nueva contraseña</h2>
              <p className="text-amber-100 text-sm mt-2">{passwordMessage}</p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleChangePassword} className="px-6 py-6 space-y-5">
              {/* Mensaje informativo */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-slate-300">
                    <p className="font-medium text-blue-300 mb-1">Consejos para tu contraseña:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>Usa al menos 6 caracteres</li>
                      <li>Combina letras, números y símbolos</li>
                      <li>No uses tu NIT como contraseña</li>
                      <li>Guárdala en un lugar seguro</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-orange-400"
                  >
                    {showNewPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Indicador de fortaleza */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= strength.level ? strength.color : "bg-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${strength.color.replace('bg-', 'text-')}`}>
                      Fortaleza: {strength.text}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">Las contraseñas no coinciden</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Las contraseñas coinciden
                  </p>
                )}
              </div>

              {/* Error */}
              {changeError && (
                <div className="bg-red-900/30 border border-red-800 rounded-lg p-3">
                  <p className="text-red-200 text-sm">{changeError}</p>
                </div>
              )}

              {/* Botón */}
              <button
                type="submit"
                disabled={changingPassword || !newPassword || newPassword !== confirmPassword}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {changingPassword ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
                ) : (
                  "Guardar mi nueva contraseña"
                )}
              </button>
            </form>

            {/* Recordatorio */}
            <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Recuerda tu contraseña. No la compartas con nadie.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card de Login */}
      <div className="relative w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm border border-slate-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-full mb-4 shadow-lg">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Portal de Clientes</h1>
            <p className="text-orange-100 text-sm">Ingresa con tu NIT y contraseña</p>
          </div>

          {/* Formulario */}
          <form onSubmit={onSubmit} className="px-8 py-8 space-y-6">
            {/* NIT Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                NIT
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  placeholder="12345678-9"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-orange-400 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Link olvidé contraseña */}
              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            {/* Error Message */}
            {err && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-200 text-sm whitespace-pre-line">{err}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-orange-700 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-orange-900/50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ingresando...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          {/* Footer con link a registro */}
          <div className="px-8 py-4 bg-slate-900/50 border-t border-slate-700">
            <p className="text-center text-sm text-slate-400">
              ¿No tienes cuenta?{" "}
              <Link to="/client/register" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Link a login de admin/empleado */}
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
            ¿Eres administrador o empleado? Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
