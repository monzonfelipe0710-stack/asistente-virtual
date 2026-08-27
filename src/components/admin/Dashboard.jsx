import { users } from "../../data/mockUsers";
import { knowledgeBase } from "../../data/mockKnowledge";
import { sigedRecords } from "../../data/mockSiged";

export default function Dashboard() {
  const stats = [
    {
      title: "Usuarios Activos",
      value: users.filter((u) => u.status === "Activo").length,
      total: users.length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "brand",
    },
    {
      title: "Artículos Base",
      value: knowledgeBase.filter((k) => k.active).length,
      total: knowledgeBase.length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "ok",
    },
    {
      title: "Expedientes SIGED",
      value: sigedRecords.length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "ink",
    },
    {
      title: "Pendientes",
      value: sigedRecords.filter((r) => r.status === "En proceso" || r.status === "Ingresado").length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "warn",
    },
  ];

  const colorMap = {
    brand: "bg-brand text-paper",
    ok: "bg-ok text-paper",
    ink: "bg-ink text-paper",
    warn: "bg-warn text-paper",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold uppercase tracking-wide text-ink m-0 mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-paper border border-line p-6">
            <div className={`inline-flex p-2.5 mb-4 ${colorMap[stat.color]}`}>
              {stat.icon}
            </div>
            <p className="text-3xl font-bold text-ink m-0 leading-none">{stat.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted mt-2 m-0">
              {stat.title}
              {stat.total && <span className="text-line"> · de {stat.total}</span>}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-paper border border-line">
        <div className="px-6 py-4 border-b border-line">
          <h2 className="text-lg font-bold uppercase tracking-wide text-ink m-0">
            Últimos movimientos SIGED
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-mist text-left text-[10px] uppercase tracking-widest text-muted">
                <th className="px-6 py-3 font-semibold">Expediente</th>
                <th className="px-6 py-3 font-semibold">Tipo</th>
                <th className="px-6 py-3 font-semibold">Solicitante</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 font-semibold">Último movimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sigedRecords.slice(0, 4).map((rec) => (
                <tr key={rec.id} className="hover:bg-mist transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-ink font-semibold">{rec.id}</td>
                  <td className="px-6 py-4 text-ink">{rec.type}</td>
                  <td className="px-6 py-4 text-ink">{rec.applicant}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={rec.status} />
                  </td>
                  <td className="px-6 py-4 text-muted text-xs">{rec.lastMovement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    Ingresado: "bg-brand text-paper",
    "En proceso": "bg-warn text-paper",
    Observado: "bg-bad text-paper",
    Finalizado: "bg-ok text-paper",
  };

  return (
    <span className={`inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${colors[status] || "bg-mist text-muted"}`}>
      {status}
    </span>
  );
}
