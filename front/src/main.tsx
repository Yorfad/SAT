import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Capacitor } from '@capacitor/core';

import AppLayout from './ui/AppLayout';
import Protected from './ui/Protected';
import BoardPage from './pages/admin/BoardPage';
import LoginPage from './pages/auth/LoginPage';
import ClientLoginPage from './pages/auth/ClientLoginPage';
import ClientRegisterPage from './pages/auth/ClientRegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ClientsPage from './pages/admin/ClientsPage';
import TasksPage from './pages/admin/TasksPage';
import TaskDetailPage from './pages/admin/TaskDetailPage';
import MyClientsPage from './pages/admin/MyClientsPage';
import ClientDetail from './pages/admin/ClientDetail';
import ServicesPage from './pages/admin/ServicesPage';
import BundlesPage from './pages/admin/BundlesPage';
import ClientDashboard from './pages/client/ClientDashboard';
import ClientMobileApp from './pages/client/ClientMobileApp';
import AdminDashboard from './pages/admin/AdminDashboard';
import FinancialManagementPage from './pages/admin/FinancialManagementPage';
import WorkspacesPage from './pages/admin/WorkspacesPage';
import InvitationsPage from './pages/admin/InvitationsPage';
import ClientFieldsPage from './pages/admin/ClientFieldsPage';
import UsersPage from './pages/admin/UsersPage';
import RolesPage from './pages/admin/RolesPage';

import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import './index.css';

// Detectar si es app móvil
const isNativePlatform = Capacitor.isNativePlatform();

// Redirección inteligente según rol y plataforma
function IndexRedirect() {
  const { user } = useAuth();
  if (!user) {
    // En app móvil, ir directo al login de clientes
    return <Navigate to={isNativePlatform ? "/client/login" : "/login"} replace />;
  }
  if (user.role === 'client') return <Navigate to="/client/dashboard" replace />;
  // Admin/Employee por defecto a tareas
  return <Navigate to="/admin/tasks" replace />;
}

const router = createBrowserRouter([
  // En móvil, /login redirige a ClientLoginPage
  { path: '/login', element: isNativePlatform ? <ClientLoginPage /> : <LoginPage /> },
  { path: '/client/login', element: <ClientLoginPage /> },
  { path: '/client/register', element: <ClientRegisterPage /> },
  // Páginas de recuperación de contraseña (públicas)
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
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
      {
        path: 'admin/bundles',
        element: (
          <Protected roles={['admin']}>
            <BundlesPage />
          </Protected>
        ),
      },
      {
        path: 'admin/workspaces',
        element: (
          <Protected roles={['admin']}>
            <WorkspacesPage />
          </Protected>
        ),
      },
      {
        path: 'admin/invitations',
        element: (
          <Protected roles={['admin']}>
            <InvitationsPage />
          </Protected>
        ),
      },
      {
        path: 'admin/client-fields',
        element: (
          <Protected roles={['admin']}>
            <ClientFieldsPage />
          </Protected>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <Protected roles={['admin']}>
            <UsersPage />
          </Protected>
        ),
      },
      {
        path: 'admin/roles',
        element: (
          <Protected roles={['admin']}>
            <RolesPage />
          </Protected>
        ),
      },

      // Cliente - En móvil usa ClientMobileApp, en web usa ClientDashboard
      {
        path: 'client/dashboard',
        element: (
          <Protected roles={['client']}>
            {isNativePlatform ? <ClientMobileApp /> : <ClientDashboard />}
          </Protected>
        ),
      },

      { path: 'admin/brigade', element: <BoardPage /> },
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
        <WorkspaceProvider>
          <RouterProvider router={router} />
        </WorkspaceProvider>
      </AuthProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
);
