import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ClientRegisterPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  // Estados
  const [step, setStep] = useState<'code' | 'form' | 'success' | 'pending'>('code');
  const [code, setCode] = useState(['', '', '', '']);
  const [tenantInfo, setTenantInfo] = useState<{ tenant: string; tenantName: string } | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    nit: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Manejar inputs de código
  const handleCodeChange = (index: number, value: string) => {
    // Solo permitir números
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus al siguiente input
    if (value && index < 3) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Si se completaron los 4 dígitos, validar automáticamente
    if (newCode.every(d => d !== '') && newCode.join('').length === 4) {
      validateCode(newCode.join(''));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      const newCode = pasted.split('');
      setCode(newCode);
      validateCode(pasted);
    }
  };

  const validateCode = async (codeStr: string) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/public/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeStr })
      });
      const data = await res.json();

      if (data.valid) {
        setTenantInfo({
          tenant: data.tenant,
          tenantName: data.tenantName
        });
        setStep('form');
      } else {
        setErr(data.message || 'Código inválido');
        setCode(['', '', '', '']);
        document.getElementById('code-0')?.focus();
      }
    } catch {
      setErr('Error al validar el código');
      setCode(['', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setErr('Las contraseñas no coinciden');
      return;
    }
    if (formData.password.length < 6) {
      setErr('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/public/register-with-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.join(''),
          fullName: formData.fullName,
          nit: formData.nit,
          email: formData.email || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          password: formData.password
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al registrar');
      }

      if (data.token) {
        // Auto-aprobado: hacer login directo
        login(data.token, data.user);
        nav('/');
      } else {
        // Pendiente de aprobación
        setStep('pending');
      }
    } catch (error: any) {
      setErr(error.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de pendiente
  if (step === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 text-center max-w-md w-full">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-900/30 rounded-full mb-6">
            <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-4">Registro Enviado</h2>
          <p className="text-slate-400 mb-6">
            Tu solicitud de registro ha sido enviada. El administrador debe aprobar tu cuenta antes de que puedas acceder.
          </p>
          <button
            onClick={() => nav('/client/login')}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all"
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de código
  if (step === 'code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 rounded-full mb-3 shadow-lg">
                <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">Código de Registro</h1>
              <p className="text-orange-100 text-sm">Ingresa el código de 4 dígitos</p>
            </div>

            <div className="px-8 py-8">
              <div className="flex justify-center gap-3 mb-6" onPaste={handleCodePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    disabled={loading}
                    className="w-14 h-16 text-center text-3xl font-bold bg-slate-700 border-2 border-slate-600 text-white rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 outline-none transition-all disabled:opacity-50"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center mb-4">
                  <svg className="animate-spin h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-2 text-slate-400">Verificando...</span>
                </div>
              )}

              {err && (
                <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 mb-4">
                  <p className="text-red-200 text-sm text-center">{err}</p>
                </div>
              )}

              <p className="text-center text-sm text-slate-500">
                El código te lo proporciona tu contador o administrador
              </p>
            </div>

            <div className="px-8 py-4 bg-slate-900/50 border-t border-slate-700">
              <p className="text-center text-sm text-slate-400">
                ¿Ya tienes cuenta?{" "}
                <Link to="/client/login" className="text-orange-400 hover:text-orange-300 font-medium">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de formulario
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-900 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-6 text-center">
            <h1 className="text-2xl font-bold text-white mb-1">Crear Cuenta</h1>
            {tenantInfo && (
              <p className="text-orange-100 text-sm">{tenantInfo.tenantName}</p>
            )}
          </div>

          <form onSubmit={handleRegister} className="px-8 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nombre completo <span className="text-orange-400">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Juan Pérez"
                required
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                NIT <span className="text-orange-400">*</span>
              </label>
              <input
                type="text"
                value={formData.nit}
                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                placeholder="12345678-9"
                required
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tu@email.com (opcional)"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+502 1234-5678 (opcional)"
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Contraseña <span className="text-orange-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 pr-10 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
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
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Confirmar contraseña <span className="text-orange-400">*</span>
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Repite tu contraseña"
                required
                className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            {err && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3">
                <p className="text-red-200 text-sm">{err}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registrando...
                </span>
              ) : (
                "Crear Cuenta"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('code');
                setCode(['', '', '', '']);
                setErr(null);
              }}
              className="w-full text-sm text-slate-400 hover:text-slate-300"
            >
              Usar otro código
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
