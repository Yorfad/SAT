import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Protected({ children }: { children?: React.ReactNode }) {
  const { user, initialized } = useAuth()
  const location = useLocation()

  if (!initialized) {
    return <div className="p-6 text-slate-600">Cargando…</div>
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children ? <>{children}</> : <Outlet />
}
