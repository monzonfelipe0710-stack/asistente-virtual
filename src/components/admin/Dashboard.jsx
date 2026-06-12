import { useState, useEffect } from "react";
import { users } from "../../data/mockUsers";
import { knowledgeBase } from "../../data/mockKnowledge";
import { sigedRecords } from "../../data/mockSiged";
import { documents } from "../../data/mockDocuments";
import { activityLog } from "../../data/mockActivity";
import ActivityLog from "./ActivityLog";
import { StatsSkeleton, CardSkeleton } from "./Skeleton";

function TrendBadge({ value, positive }) {
  if (!value) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={positive ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
      </svg>
      {value}
    </span>
  );
}

function DonutChart({ percentage = 75, size = 80, stroke = 6, label, sublabel }) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2563eb" strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="donut-ring" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <span className="text-lg font-bold text-primary mt-1">{percentage}%</span>
      {label && <span className="text-xs text-slate-500 font-medium">{label}</span>}
      {sublabel && <span className="text-[10px] text-slate-400">{sublabel}</span>}
    </div>
  );
}

function BarChart({ data = [], height = 140 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-slate-500 font-medium">{d.value}</span>
          <div className="w-full bg-accent-light/50 rounded-t-md relative overflow-hidden" style={{ height: `${(d.value / max) * 100}%`, minHeight: 4, animation: `bar-fill 0.6s ease-out ${i * 0.08}s both`, transformOrigin: "bottom" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-accent/40 to-accent/20 rounded-t-md" />
          </div>
          <span className="text-[9px] text-slate-400 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const activeUsers = users.filter((u) => u.status === "Activo").length;
  const activeArticles = knowledgeBase.filter((k) => k.active).length;
  const activeSiged = sigedRecords.length;
  const totalDocs = documents.length;
  const totalDownloads = documents.reduce((s, d) => s + d.downloads, 0);
  const totalKnowledgeViews = knowledgeBase.reduce((s, k) => s + (k.views || 0), 0);
  const inProgress = sigedRecords.filter((r) => r.status === "En proceso").length;
  const finalized = sigedRecords.filter((r) => r.status === "Finalizado").length;
  const pending = sigedRecords.filter((r) => r.status === "Ingresado").length;

  const priorityCounts = { Alta: sigedRecords.filter((r) => r.priority === "Alta").length, Normal: sigedRecords.filter((r) => r.priority === "Normal").length, Baja: sigedRecords.filter((r) => r.priority === "Baja").length };

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const activityByDay = weekDays.map((label, i) => ({ label, value: Math.floor(Math.random() * 8 + 3 + i) }));

  const stats = [
    { title: "Usuarios Activos", value: activeUsers, total: users.length, trend: "+12%", trendPositive: true, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, light: "bg-blue-50 text-blue-600" },
    { title: "Artículos Base", value: activeArticles, total: knowledgeBase.length, trend: "+3", trendPositive: true, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>, light: "bg-purple-50 text-purple-600" },
    { title: "Expedientes SIGED", value: activeSiged, trend: "+5", trendPositive: true, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, light: "bg-amber-50 text-amber-600" },
    { title: "Descargas", value: totalDownloads.toLocaleString(), icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, light: "bg-emerald-50 text-emerald-600" },
  ];

  if (loading) return <div className="animate-fade-in"><StatsSkeleton /><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><CardSkeleton lines={5} /><CardSkeleton lines={5} /></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-primary m-0 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">Panel de control del sistema &mdash; {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs text-slate-500 font-medium">Sistema operativo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        {stats.map((stat) => (
          <div key={stat.title} className="card card-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.light}`}>{stat.icon}</div>
              <TrendBadge value={stat.trend} positive={stat.trendPositive} />
            </div>
            <p className="text-2xl font-bold text-slate-800 m-0 tracking-tight animate-counter">{stat.value}</p>
            <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">
              {stat.title}
              {stat.total != null && <span className="text-slate-300 ml-1">/ {stat.total}</span>}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 stagger-children">
        <div className="card card-border p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-primary m-0 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Actividad del Sistema
            </h2>
            <select className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-500">
              <option>Últimos 7 días</option>
              <option>Últimos 30 días</option>
            </select>
          </div>
          <BarChart data={activityByDay} height={130} />
        </div>

        <div className="card card-border p-4">
          <h2 className="text-sm font-semibold text-primary m-0 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            Proporción de Estado
          </h2>
          <div className="flex justify-around">
            <DonutChart percentage={Math.round((finalized / activeSiged) * 100)} label="Finalizados" sublabel={`${finalized} de ${activeSiged}`} />
            <DonutChart percentage={Math.round((inProgress / activeSiged) * 100)} label="En proceso" sublabel={`${inProgress} de ${activeSiged}`} />
            <DonutChart percentage={Math.round((pending / activeSiged) * 100)} label="Ingresados" sublabel={`${pending} de ${activeSiged}`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        <div className="card card-border overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <h2 className="text-sm font-semibold text-primary m-0">Últimos movimientos SIGED</h2>
              <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">{activeSiged} total</span>
            </div>
            <a href="/admin/siged" className="text-xs text-accent font-medium no-underline hover:underline">Ver todos</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-left text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Expediente</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Solicitante</th>
                  <th className="px-4 py-3 font-semibold">Prioridad</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sigedRecords.slice(0, 5).map((rec) => (
                  <tr key={rec.id} className="table-row">
                    <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{rec.id}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{rec.type}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{rec.applicant}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={rec.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={rec.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ActivityLog />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = { Ingresado: "bg-blue-50 text-blue-700 border-blue-200/60", "En proceso": "bg-amber-50 text-amber-700 border-amber-200/60", Observado: "bg-red-50 text-red-700 border-red-200/60", Finalizado: "bg-emerald-50 text-emerald-700 border-emerald-200/60" };
  return <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-lg border ${colors[status] || "bg-slate-100 text-slate-600 border-slate-200/60"}`}>{status}</span>;
}

function PriorityBadge({ priority }) {
  const colors = { Alta: "bg-red-50 text-red-600 border-red-200", Normal: "bg-blue-50 text-blue-600 border-blue-200", Baja: "bg-slate-50 text-slate-500 border-slate-200" };
  return <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-lg border ${colors[priority] || "bg-slate-100 text-slate-600"}`}>{priority}</span>;
}
