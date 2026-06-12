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
      color: "blue",
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
      color: "emerald",
    },
    {
      title: "Expedientes SIGED",
      value: sigedRecords.length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "indigo",
    },
    {
      title: "Pendientes",
      value: sigedRecords.filter((r) => r.status === "En proceso" || r.status === "Ingresado").length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "amber",
    },
  ];

  const colorMap = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 m-0 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${colorMap[stat.color]}`}>
                {stat.icon}
              </div>
              {stat.total && (
                <span className="text-xs text-slate-400">
                  de {stat.total}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-800 m-0">{stat.value}</p>
            <p className="text-xs text-slate-500 m-0 mt-0.5">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800 m-0">
            Últimos movimientos SIGED
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <th className="px-4 py-3 font-medium">Expediente</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Solicitante</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Último movimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sigedRecords.slice(0, 4).map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{rec.id}</td>
                  <td className="px-4 py-3 text-slate-700">{rec.type}</td>
                  <td className="px-4 py-3 text-slate-700">{rec.applicant}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={rec.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{rec.lastMovement}</td>
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
    Ingresado: "bg-blue-50 text-blue-700",
    "En proceso": "bg-amber-50 text-amber-700",
    Observado: "bg-red-50 text-red-700",
    Finalizado: "bg-emerald-50 text-emerald-700",
  };

  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded-md ${colors[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}
