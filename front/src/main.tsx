import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import AppLayout from './ui/AppLayout'
import Protected from './ui/Protected'

import LoginPage from './pages/auth/LoginPage'
import ClientsPage from './pages/admin/ClientsPage'
import ClientDetail from './pages/admin/ClientDetail'
import ClientDashboard from './pages/client/ClientDashboard'   // <- confirma el nombre del archivo
import InvoicesPage from './pages/common/InvoicesPage'

import './index.css'

/**
 * Minimal AuthProvider stub to satisfy usage in this entry file.
 * Replace with your real provider implementation (for example,
 * import { AuthProvider } from './context/AuthProvider' or similar).
 */
const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  return <>{children}</>;
};

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  {
    path: '/',
    element: (
      <Protected>
        <AppLayout />
      </Protected>
    ),
    children: [
      // Cliente autenticado
      { index: true, element: <ClientDashboard /> },

      // Admin / empleado
      { path: 'admin/clients', element: <ClientsPage /> },
      { path: 'admin/clients/:id', element: <ClientDetail /> },

      // Común
      { path: 'invoices', element: <InvoicesPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
)

