import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../hooks/useSettings";

export default function AppLayout(){
  const { user, logout } = useAuth();
  const { data:settings } = useSettings();

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-slate-900 text-white p-4">
        <div className="flex items-center gap-2 mb-6">
          {settings?.logo_url && <img src={settings.logo_url} className="h-8" />}
          <span className="font-semibold">{settings?.display_name ?? "SAT"}</span>
        </div>
        <nav className="flex flex-col gap-2">
          {(user?.role === "admin" || user?.role === "employee") && (
            <>
              <NavLink to="/" className="hover:underline">Dashboard</NavLink>
              <NavLink to="/admin/clients" className="hover:underline">Clientes</NavLink>
            </>
          )}
          {user?.role === "client" && (
            <>
              <NavLink to="/client" className="hover:underline">Mi panel</NavLink>
              <NavLink to="/invoices" className="hover:underline">Mis facturas</NavLink>
            </>
          )}
          <button onClick={logout} className="mt-6 text-left text-red-300">Cerrar sesión</button>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet/>
      </main>
    </div>
  );
}
