// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, LoginResponse } from '../types'
import api from '../lib/api'
import { setTenant } from "../lib/tenant";

type AuthCtx = {
  user: User | null
  token: string | null
  permissions: string[]
  initialized: boolean
  login: (email: string, password: string, tenant?: string) => Promise<void>
  setAuth: (token: string, user: User, permissions?: string[]) => void
  logout: () => void
  hasPermission: (permissionKey: string) => boolean
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    const p = localStorage.getItem('permissions')
    if (t && u) {
      setToken(t)
      setUser(JSON.parse(u))
      if (p) setPermissions(JSON.parse(p))
    }
    setInitialized(true)
  }, [])

  const login = async (email: string, password: string, tenant?: string) => {
    const resp = await api.post<LoginResponse>("/auth/login", { email, password }, {
      headers: tenant ? { "X-Tenant": tenant } : {},
    });

    setToken(resp.data.token);
    setUser(resp.data.user);
    const userPermissions = resp.data.permissions || [];
    setPermissions(userPermissions);

    localStorage.setItem("token", resp.data.token);
    localStorage.setItem("user", JSON.stringify(resp.data.user));
    localStorage.setItem("permissions", JSON.stringify(userPermissions));
    if (tenant) setTenant(tenant);
  };

  // Para login directo (ClientLoginPage, etc.) sin llamar API desde aquí
  const setAuth = (newToken: string, newUser: User, newPermissions?: string[]) => {
    setToken(newToken);
    setUser(newUser);
    const perms = newPermissions || [];
    setPermissions(perms);

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("permissions", JSON.stringify(perms));
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setPermissions([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
  }, []);

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param permissionKey Clave del permiso (ej: "infractions:create")
   * @returns true si tiene el permiso
   */
  const hasPermission = useCallback((permissionKey: string): boolean => {
    // Admin tiene todos los permisos
    if (user?.role === 'admin') {
      return true;
    }
    // Verificar si tiene el permiso específico o el comodín
    return permissions.includes('*') || permissions.includes(permissionKey);
  }, [user?.role, permissions]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      permissions,
      initialized,
      login,
      setAuth,
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
