import { users } from "../../data/mockUsers";
import { knowledgeBase } from "../../data/mockKnowledge";
import { sigedRecords } from "../../data/mockSiged";
import { StatusPill } from "./ui";
import { useAuth } from "../../context/AuthContext";
import { Kicker, DisplayTitle, Lead } from "../common/editorial";

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = (user?.name || "").split(" ")[0] || "Admin";

  const metrics = [
    {
      label: "Usuarios activos",
      value: users.filter((u) => u.status === "Activo").length,
      hint: `de ${users.length} usuarios`,
    },
    {
      label: "Artículos base",
      value: knowledgeBase.filter((k) => k.active).length,
      hint: `de ${knowledgeBase.length} artículos`,
    },
    {
      label: "Expedientes SIGED",
      value: sigedRecords.length,
    },
    {
      label: "Requieren atención",
      value: sigedRecords.filter((r) => r.status === "En proceso" || r.status === "Ingresado").length,
      hint: "pendientes",
    },
  ];

  return (
    <div className="max-w-6xl">
      <div className="border-b border-line/70 pb-12">
        <Kicker>[ Panel de administración ]</Kicker>
        <DisplayTitle as={2} className="mt-4">
          ADMINISTRACIÓN.
        </DisplayTitle>
        <Lead className="mt-6 max-w-2xl">
          Hola, {firstName}. Resumen de la actividad del panel, los expedientes y la
          base de conocimiento de ChatAP.
        </Lead>
      </div>

      <div className="mt-12 grid gap-px bg-line border border-line overflow-hidden rounded-2xl grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-paper p-6 md:p-8">
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">{m.label}</p>
            <p className="mt-4 m-0 text-4xl md:text-5xl font-extrabold tracking-tighter text-ink">{m.value}</p>
            {m.hint ? <p className="mt-2 m-0 text-sm text-faint">{m.hint}</p> : null}
            <div className="mt-6 h-[3px] w-10 bg-brand-deep" aria-hidden="true" />
          </div>
        ))}
      </div>

      <div className="card mt-16 overflow-hidden">
        <div className="px-8 py-6 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <h2 className="display-3 text-ink m-0 uppercase">Últimos movimientos</h2>
          <span className="text-xs text-faint font-semibold uppercase tracking-wider">SIGED</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-faint">
                <th className="px-8 py-4 font-bold">Expediente</th>
                <th className="px-8 py-4 font-bold">Tipo</th>
                <th className="px-8 py-4 font-bold">Solicitante</th>
                <th className="px-8 py-4 font-bold">Estado</th>
                <th className="px-8 py-4 font-bold">Último movimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sigedRecords.slice(0, 4).map((rec) => (
                <tr key={rec.id} className="hover:bg-mist/60 transition-colors">
                  <td className="px-8 py-6 font-mono text-[13px] text-ink font-semibold">{rec.id}</td>
                  <td className="px-8 py-6 text-ink">{rec.type}</td>
                  <td className="px-8 py-6 text-ink">{rec.applicant}</td>
                  <td className="px-8 py-6">
                    <StatusPill status={rec.status} />
                  </td>
                  <td className="px-8 py-6 text-muted text-xs">{rec.lastMovement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
