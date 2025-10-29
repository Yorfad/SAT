import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { detectTenant } from "../../lib/tenant";

export default function LoginPage(){
  const nav = useNavigate();
  const loc = useLocation() as any;
  const { login } = useAuth();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [tenant,setTenant] = useState(detectTenant() ?? "");
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState<string|null>(null);

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    try{
      await login(email,password,tenant || undefined);
      nav(loc.state?.from?.pathname ?? "/");
    }catch(error:any){
      setErr(error?.response?.data?.message ?? "Error al iniciar sesión");
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white p-6 rounded-xl shadow">
        <h1 className="text-xl font-semibold mb-4">Ingresar</h1>
        <label className="block mb-2 text-sm">Tenant (negocio)</label>
        <input className="w-full border rounded p-2 mb-4" value={tenant} onChange={e=>setTenant(e.target.value)} placeholder="acme" />

        <label className="block mb-2 text-sm">Email</label>
        <input className="w-full border rounded p-2 mb-4" value={email} onChange={e=>setEmail(e.target.value)} />

        <label className="block mb-2 text-sm">Contraseña</label>
        <input className="w-full border rounded p-2 mb-4" type="password" value={password} onChange={e=>setPassword(e.target.value)} />

        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
        <button disabled={loading} className="w-full bg-brand text-white rounded p-2">
          {loading ? "Ingresando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
