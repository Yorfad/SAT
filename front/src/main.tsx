import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import AppLayout from './ui/AppLayout';
import Protected from './ui/Protected';
import BoardPage from './pages/admin/BoardPage';
import LoginPage from './pages/auth/LoginPage';
import ClientsPage from './pages/admin/ClientsPage';
import TasksPage from './pages/admin/TasksPage';
import TaskDetailPage from './pages/admin/TaskDetailPage';
import MyClientsPage from './pages/admin/MyClientsPage';
import ClientDetail from './pages/admin/ClientDetail';
import ServicesPage from './pages/admin/ServicesPage';
import ClientDashboard from './pages/client/ClientDashboard';
import InvoicesPage from './pages/common/InvoicesPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import FinancialManagementPage from './pages/admin/FinancialManagementPage';

import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

// Redirección inteligente según rol
function IndexRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'client') return <Navigate to="/client/dashboard" replace />;
  // Admin/Employee por defecto a tareas
  return <Navigate to="/admin/tasks" replace />;
}

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
      { index: true, element: <IndexRedirect /> },

      // Empleado/Admin
      {
        path: 'admin/dashboard',
        element: (
          <Protected roles={['admin','employee']}>
            <AdminDashboard />
          </Protected>
        ),
      },
      {
        path: 'admin/financial',
        element: (
          <Protected roles={['admin','employee']}>
            <FinancialManagementPage />
          </Protected>
        ),
      },
      {
        path: 'admin/my-clients',
        element: (
          <Protected roles={['admin','employee']}>
            <MyClientsPage />
          </Protected>
        ),
      },
      {
        path: 'admin/tasks',
        element: (
          <Protected roles={['admin','employee']}>
            <TasksPage />
          </Protected>
        ),
      },
      {
        path: 'admin/tasks/:taskId',
        element: (
          <Protected roles={['admin','employee']}>
            <TaskDetailPage />
          </Protected>
        ),
      },
      {
        path: 'admin/clients',
        element: (
          <Protected roles={['admin']}>
            <ClientsPage />
          </Protected>
        ),
      },
      {
        path: 'admin/clients/:id',
        element: (
          <Protected roles={['admin']}>
            <ClientDetail />
          </Protected>
        ),
      },
      {
        path: 'admin/services',
        element: (
          <Protected roles={['admin']}>
            <ServicesPage />
          </Protected>
        ),
      },

      // Cliente
      {
        path: 'client/dashboard',
        element: (
          <Protected roles={['client']}>
            <ClientDashboard />
          </Protected>
        ),
      },

      { path: 'admin/brigade', element: <BoardPage /> },

      // Común (si quieres restringir, añade roles)
      {
        path: 'invoices',
        element: (
          <Protected roles={['admin','client']}>
            <InvoicesPage />
          </Protected>
        ),
      },
    ],
  },
]);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
);
