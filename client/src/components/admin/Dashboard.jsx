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
      gradient: "from-blue-500 to-blue-600",
      light: "bg-blue-50 text-blue-600",
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
      gradient: "from-emerald-500 to-emerald-600",
      light: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Expedientes SIGED",
      value: sigedRecords.length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gradient: "from-indigo-500 to-indigo-600",
      light: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Pendientes",
      value: sigedRecords.filter((r) => r.status === "En proceso" || r.status === "Ingresado").length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: "from-amber-500 to-amber-600",
      light: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-primary m-0 tracking-tight">Dashboard</h1>
        <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">Panel de control del sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        {stats.map((stat) => (
          <div key={stat.title} className="card card-border p-4 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.light}`}>
                {stat.icon}
              </div>
              {stat.total && (
                <span className="text-xs text-slate-400 font-medium">
                  de {stat.total}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-800 m-0 tracking-tight">{stat.value}</p>
            <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">{stat.title}</p>
            <div className={`h-0.5 w-full rounded-full mt-3 bg-gradient-to-r ${stat.gradient} opacity-30`} />
          </div>
        ))}
      </div>

      <div className="card card-border overflow-hidden animate-list-item stagger-5">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-sm font-semibold text-primary m-0">
              Últimos movimientos SIGED
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Expediente</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Solicitante</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Último movimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sigedRecords.slice(0, 4).map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{rec.id}</td>
                  <td className="px-4 py-3 text-slate-600">{rec.type}</td>
                  <td className="px-4 py-3 text-slate-600">{rec.applicant}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={rec.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{rec.lastMovement}</td>
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
    Ingresado: "bg-blue-50 text-blue-700 border-blue-200/60",
    "En proceso": "bg-amber-50 text-amber-700 border-amber-200/60",
    Observado: "bg-red-50 text-red-700 border-red-200/60",
    Finalizado: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  };

  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-lg border ${colors[status] || "bg-slate-100 text-slate-600 border-slate-200/60"}`}>
      {status}
    </span>
  );
}
