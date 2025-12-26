import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

const VALID_ROLES = ['admin', 'employee', 'client'] as const;
type Role = typeof VALID_ROLES[number];
type Props = { children?: React.ReactNode; roles?: Role[] }

export default function Protected({ children, roles }: Props) {
  const { user, initialized, logout } = useAuth()
  const location = useLocation()

  // Si el usuario tiene un rol inválido (token viejo), hacer logout
  useEffect(() => {
    if (user && !VALID_ROLES.includes(user.role as Role)) {
      console.warn('Rol inválido detectado, cerrando sesión:', user.role);
      logout();
    }
  }, [user, logout]);

  // Si el usuario es un cliente y está desactivado, cerrar sesión y redirigir
  useEffect(() => {
    if (user && user.role === 'client' && user.is_active === 0) {
      alert(`Tu cuenta ha sido desactivada.\nMotivo: ${user.deactivation_reason || 'No especificado'}\n\nPor favor contacta a soporte para más información.`)
      logout()
    }
  }, [user, logout])

  if (!initialized) return <div className="p-6 text-slate-600">Cargando…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  // Si el rol no es válido, redirigir a login (el useEffect hará logout)
  if (!VALID_ROLES.includes(user.role as Role)) {
    return <Navigate to="/login" replace />
  }

  // Bloquear acceso a clientes desactivados
  if (user.role === 'client' && user.is_active === 0) {
    return <Navigate to="/login" replace />
  }

  // Verificar roles permitidos
  if (roles && !roles.includes(user.role as Role)) {
    return <Navigate to="/" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
