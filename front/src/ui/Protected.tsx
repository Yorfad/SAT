import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'

type Role = 'admin' | 'employee' | 'client'
type Props = { children?: React.ReactNode; roles?: Role[] }

export default function Protected({ children, roles }: Props) {
  const { user, initialized, logout } = useAuth()
  const location = useLocation()

  // Si el usuario es un cliente y está desactivado, cerrar sesión y redirigir
  useEffect(() => {
    if (user && user.role === 'client' && user.is_active === 0) {
      alert(`Tu cuenta ha sido desactivada.\nMotivo: ${user.deactivation_reason || 'No especificado'}\n\nPor favor contacta a soporte para más información.`)
      logout()
    }
  }, [user, logout])

  if (!initialized) return <div className="p-6 text-slate-600">Cargando…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  // Bloquear acceso a clientes desactivados
  if (user.role === 'client' && user.is_active === 0) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return children ? <>{children}</> : <Outlet />
}
