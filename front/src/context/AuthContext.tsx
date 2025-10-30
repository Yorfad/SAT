// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import type { User, LoginResponse } from '../types'
import api from '../lib/api'

type AuthCtx = {
  user: User | null
  token: string | null
  initialized: boolean
  login: (email: string, password: string, tenant?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    setInitialized(true)
  }, [])

  const login = async (email: string, password: string, tenant?: string) => {
    const resp = await api.post<LoginResponse>(
      '/auth/login',
      { email, password },
      { headers: { 'X-Tenant': tenant || 'acme' } } // default opcional
    )
    setToken(resp.data.token)
    setUser(resp.data.user)
    localStorage.setItem('token', resp.data.token)
    localStorage.setItem('user', JSON.stringify(resp.data.user))
  }

  const logout = () => {
    setToken(null); setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, initialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
