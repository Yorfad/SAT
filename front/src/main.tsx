import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import AppLayout from './ui/AppLayout';
import Protected from './ui/Protected';

import LoginPage from './pages/auth/LoginPage';
import ClientsPage from './pages/admin/ClientsPage';
import ClientDetail from './pages/admin/ClientDetail';
import ClientDashboard from './pages/client/ClientDashboard';
import InvoicesPage from './pages/common/InvoicesPage';

import { AuthProvider } from './context/AuthContext';
import './index.css';

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
      { index: true, element: <ClientDashboard /> },
      { path: 'admin/clients', element: <ClientsPage /> },
      { path: 'admin/clients/:id', element: <ClientDetail /> },
      { path: 'invoices', element: <InvoicesPage /> },
    ],
  },
]);

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
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
