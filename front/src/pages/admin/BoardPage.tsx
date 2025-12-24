import { useState } from "react";
import { useBrigade, useToggleChecklist, useUpdateObservations } from "../../hooks/useBrigade";
import UploadArtifact from "../../ui/UploadArtifact"; // ya lo tienes
import { detectTenant } from "../../lib/tenant";

export default function BoardPage(){
  const { data, isLoading, isError, refetch } = useBrigade();
  const toggle = useToggleChecklist();
  const updObs = useUpdateObservations();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [reveal, setReveal] = useState<Record<number, boolean>>({});
  const tenant = detectTenant();

  const rows = data?.rows ?? [];

  if (isLoading) return <div className="p-4">Cargando…</div>;
  if (isError)   return <div className="p-4 text-red-600">Error cargando tablero</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Brigadas — {data?.month}/{data?.year}</h1>
        <button className="text-sm underline" onClick={()=>refetch()}>Refrescar</button>
      </div>

      <div className="overflow-auto rounded border">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 w-8">#</th>
              <th className="p-2">Nombre</th>
              <th className="p-2">NIT</th>
              <th className="p-2">Contraseña SAT</th>
              <th className="p-2">Factura</th>
              <th className="p-2">Rectificador</th>
              <th className="p-2">Checklist</th>
              <th className="p-2">Observaciones</th>
              {/* columnas financieras ocultas por defecto (si las quieres mostrar, descomenta) */}
              {/* <th className="p-2">Total</th>
              <th className="p-2">Pagado</th>
              <th className="p-2">Saldo</th> */}
            </tr>
          </thead>

          <tbody>
            {rows.map((r, _idx) => {
              const inv = r.invoice;
              const passShown = !!reveal[r.client_id];
              const allOk = r.checklist_progress.ok;

              return (
                <>
                <tr key={r.client_id} className="border-b align-top">
                  <td className="p-2">
                    <button
                      className="text-xs px-2 py-1 rounded border"
                      onClick={()=>setExpanded(s => ({...s, [r.client_id]: !s[r.client_id]}))}
                      title="Ver checklist"
                    >
                      {expanded[r.client_id] ? "–" : "+"}
                    </button>
                  </td>

                  <td className="p-2">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-slate-500">ID: {r.client_id}</div>
                  </td>

                  <td className="p-2">{r.nit ?? "—"}</td>

                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {r.sat_password ? (passShown ? r.sat_password : "••••••••") : <em className="text-slate-400">sin dato</em>}
                      </span>
                      {r.sat_password &&
                        <button className="text-xs underline"
                          onClick={()=>setReveal(s => ({...s, [r.client_id]: !s[r.client_id]}))}
                        >
                          {passShown ? "Ocultar" : "Ver"}
                        </button>
                      }
                    </div>
                  </td>

                  <td className="p-2">
                    {inv ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${r.artifacts.factura ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {r.artifacts.factura ? "Subida" : "Falta"}
                        </span>
                        {/* Usa tu componente ya creado */}
                        <UploadArtifact invoiceId={inv.id} />
                      </div>
                    ) : <em className="text-slate-400">sin invoice</em>}
                  </td>

                  <td className="p-2">
                    {inv ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${r.artifacts.rectificador ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {r.artifacts.rectificador ? "Subido" : "Falta"}
                        </span>
                        {/* Reutiliza UploadArtifact; si tu backend distingue por "kind", puedes tener dos botones o un select */}
                        {/* Ejemplo rápido: */}
                        {/* <UploadArtifact invoiceId={inv.id} kind="rectificador" /> */}
                      </div>
                    ) : <em className="text-slate-400">sin invoice</em>}
                  </td>

                  <td className="p-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${allOk ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {allOk ? "LISTO" : `${r.checklist_progress.done}/${r.checklist_progress.total}`}
                    </span>
                  </td>

                  <td className="p-2">
                    {inv ? (
                      <textarea
                        defaultValue={inv.observations ?? ""}
                        className="w-64 h-10 border rounded p-1 text-xs"
                        onBlur={(e)=>updObs.mutate({ invoiceId: inv.id, observations: e.currentTarget.value })}
                        placeholder="Escribe observación y deja el foco para guardar…"
                      />
                    ) : <em className="text-slate-400">sin invoice</em>}
                  </td>

                  {/* Financieras (ocultas por defecto) */}
                  {/* <td className="p-2 text-right">{inv?.total_due ?? "—"}</td>
                  <td className="p-2 text-right">{inv?.amount_paid ?? "—"}</td>
                  <td className="p-2 text-right">{inv?.balance ?? "—"}</td> */}
                </tr>

                {expanded[r.client_id] && (
                  <tr className="bg-slate-50">
                    <td />
                    <td colSpan={7} className="p-2">
                      <div className="flex items-center justify-between">
                        <strong>Checklist de servicios</strong>
                        <span className="text-xs text-slate-500">
                          {tenant ? `Tenant: ${tenant}` : ""}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {r.checklist.length === 0 && <em className="text-slate-500">Sin ítems para este mes.</em>}
                        {r.checklist.map(item => (
                          <label key={item.id} className="flex items-center gap-2 p-2 rounded border bg-white">
                            <input
                              type="checkbox"
                              checked={item.status === 'done'}
                              onChange={(e)=>toggle.mutate({ id: item.id, status: e.target.checked ? 'done' : 'todo' })}
                            />
                            <span>{item.name}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
