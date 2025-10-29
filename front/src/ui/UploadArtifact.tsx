import { useRef, useState } from "react";
import api from "../lib/api";

export default function UploadArtifact({ invoiceId }:{ invoiceId:number }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading,setLoading] = useState(false);
  const [msg,setMsg] = useState<string|null>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // Si tu backend requiere code del artifact, añade fd.append("code","IVA_DECLARACION")
      await api.post(`/admin/files/upload/${invoiceId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMsg("Archivo subido ✅");
    } catch (err:any) {
      setMsg(err?.response?.data?.message ?? "No se pudo subir");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input ref={fileRef} disabled={loading} type="file" onChange={onChange}/>
      {loading && <span className="text-xs text-slate-500">Subiendo...</span>}
      {msg && <span className="text-xs">{msg}</span>}
    </div>
  );
}
