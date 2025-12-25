import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api from "../../lib/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [userName, setUserName] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Verificar token al cargar
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenError("No se proporcionó un token de restablecimiento");
      return;
    }

    api.get(`/auth/verify-reset-token?token=${token}`)
      .then((res) => {
        if (res.data.valid) {
          setTokenValid(true);
          setUserName(res.data.userName || "");
        } else {
          setTokenError(res.data.message || "El enlace no es válido");
        }
      })
      .catch(() => {
        setTokenError("Error al verificar el enlace");
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token]);

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password-with-token", {
        token,
        newPassword,
        confirmPassword
      });
      setSuccess(true);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Error al restablecer la contraseña";
      if (err?.response?.data?.expired) {
        setTokenValid(false);
        setTokenError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de carga
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-orange-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-400">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  // Token inválido o expirado
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 px-8 py-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-full mb-4 shadow-lg">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Enlace no válido</h1>
            </div>

            <div className="px-8 py-8 text-center">
              <p className="text-slate-300 mb-6">{tokenError}</p>

              <div className="space-y-4">
                <Link
                  to="/forgot-password"
                  className="block w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all"
                >
                  Solicitar nuevo enlace
                </Link>

                <Link
                  to="/client/login"
                  className="block text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Éxito
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-full mb-4 shadow-lg">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">¡Contraseña actualizada!</h1>
            </div>

            <div className="px-8 py-8 text-center">
              <p className="text-slate-300 mb-6">
                Tu contraseña ha sido restablecida exitosamente.
                Ahora puedes iniciar sesión con tu nueva contraseña.
              </p>

              <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-amber-200">
                    <p className="font-medium mb-1">Recuerda:</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-300/80">
                      <li>Guarda tu contraseña en un lugar seguro</li>
                      <li>No la compartas con nadie</li>
                      <li>Usa una contraseña diferente para cada servicio</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/client/login")}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                Ir a iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de nueva contraseña
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-full mb-4 shadow-lg">
              <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Crea tu nueva contraseña</h1>
            {userName && (
              <p className="text-orange-100 text-sm">Hola, {userName}</p>
            )}
          </div>

          <form onSubmit={onSubmit} className="px-8 py-8 space-y-6">
            {/* Tips */}
            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <p className="text-sm text-slate-300 mb-2">
                <strong className="text-blue-300">Consejos para una contraseña segura:</strong>
              </p>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• Usa al menos 6 caracteres</li>
                <li>• Combina letras mayúsculas, minúsculas y números</li>
                <li>• Evita usar información personal (NIT, nombre, etc.)</li>
              </ul>
            </div>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-orange-400"
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
              {confirmPassword && newPassword === confirmPassword && newPassword.length >= 6 && (
                <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Las contraseñas coinciden
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                "Guardar nueva contraseña"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
