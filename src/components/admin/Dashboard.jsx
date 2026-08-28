import { users } from "../../data/mockUsers";
import { knowledgeBase } from "../../data/mockKnowledge";
import { sigedRecords } from "../../data/mockSiged";
import { PageHeader, StatCard, StatusPill } from "./ui";

function Icon({ path }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={path} />
    </svg>
  );
}

export default function Dashboard() {
  const stats = [
    {
      title: "Usuarios Activos",
      value: users.filter((u) => u.status === "Activo").length,
      total: users.length,
      icon: <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
      tone: "brand",
      hint: `de ${users.length} usuarios`,
    },
    {
      title: "Artículos Base",
      value: knowledgeBase.filter((k) => k.active).length,
      total: knowledgeBase.length,
      icon: <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      tone: "ok",
      hint: `de ${knowledgeBase.length} artículos`,
    },
    {
      title: "Expedientes SIGED",
      value: sigedRecords.length,
      icon: <Icon path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      tone: "info",
    },
    {
      title: "Pendientes",
      value: sigedRecords.filter((r) => r.status === "En proceso" || r.status === "Ingresado").length,
      icon: <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
      tone: "warn",
      hint: "requieren atención",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Panel general"
        description="Resumen de la actividad del Acceso Interno."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.title}
            label={stat.title}
            value={stat.value}
            tone={stat.tone}
            hint={stat.hint}
            icon={stat.icon}
            delay={i * 0.06}
          />
        ))}
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-line">
          <h2 className="text-lg font-bold text-ink m-0">Últimos movimientos SIGED</h2>
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
                    <StatusPill status={rec.status} />
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
