import { useState, useEffect } from "react";
import { users } from "../../data/mockUsers";
import { knowledgeBase, knowledgeCategories } from "../../data/mockKnowledge";
import { sigedRecords } from "../../data/mockSiged";
import { documents } from "../../data/mockDocuments";
import { activityLog } from "../../data/mockActivity";
import { departments } from "../../data/mockUsers";
import { StatsSkeleton, CardSkeleton } from "./Skeleton";

function StatCard({ label, value, icon, color, subtitle }) {
  return (
    <div className="card card-border p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-primary m-0 tracking-tight animate-counter">{value}</p>
          <p className="text-xs text-slate-400 m-0 font-medium">{label}</p>
          {subtitle && <p className="text-[10px] text-slate-400 m-0 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const activeUsers = users.filter((u) => u.status === "Activo").length;
  const activeArticles = knowledgeBase.filter((k) => k.active).length;
  const totalViews = knowledgeBase.reduce((s, k) => s + (k.views || 0), 0);
  const totalDownloads = documents.reduce((s, d) => s + d.downloads, 0);
  const totalDocs = documents.length;
  const byCategory = knowledgeCategories.slice(1).map((cat) => ({ label: cat, count: knowledgeBase.filter((k) => k.category === cat).length }));
  const byDept = departments.map((d) => ({ label: d, count: sigedRecords.filter((r) => r.department === d).length }));
  const byStatus = [{ label: "Activos", count: activeUsers, pct: Math.round((activeUsers / users.length) * 100) }, { label: "Inactivos", count: users.length - activeUsers, pct: Math.round(((users.length - activeUsers) / users.length) * 100) }];
  const byPriority = [{ label: "Alta", count: sigedRecords.filter((r) => r.priority === "Alta").length, color: "bg-red-500" }, { label: "Normal", count: sigedRecords.filter((r) => r.priority === "Normal").length, color: "bg-blue-500" }, { label: "Baja", count: sigedRecords.filter((r) => r.priority === "Baja").length, color: "bg-slate-400" }];
  const sigedByStatus = ["Ingresado", "En proceso", "Observado", "Finalizado"].map((s) => ({ label: s, count: sigedRecords.filter((r) => r.status === s).length }));
  const topArticles = [...knowledgeBase].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const topDocs = [...documents].sort((a, b) => b.downloads - a.downloads).slice(0, 5);
  const usersByRole = ["Administrador", "Supervisor", "Agente"].map((r) => ({ label: r, count: users.filter((u) => u.role === r).length }));

  const maxCat = Math.max(...byCategory.map((c) => c.count), 1);
  const maxDept = Math.max(...byDept.map((d) => d.count), 1);

  if (loading) return <div className="animate-fade-in"><StatsSkeleton /><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><CardSkeleton lines={5} /><CardSkeleton lines={5} /></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-primary m-0 tracking-tight">Reportes y Analíticas</h1>
          <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">Métricas detalladas del sistema y contenido</p>
        </div>
        <div className="flex gap-1.5 bg-slate-100 p-0.5 rounded-lg">
          {[{ v: "7d", l: "7 días" }, { v: "30d", l: "30 días" }, { v: "90d", l: "90 días" }].map(({ v, l }) => (
            <button key={v} onClick={() => setPeriod(v)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${period === v ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-primary bg-transparent"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard label="Vistas totales" value={totalViews.toLocaleString()} subtitle="en artículos" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} color="bg-sky-50 text-sky-600" />
        <StatCard label="Descargas" value={totalDownloads.toLocaleString()} subtitle="de documentos" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Expedientes" value={sigedRecords.length} subtitle="gestionados" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} color="bg-amber-50 text-amber-600" />
        <StatCard label="Artículos activos" value={`${activeArticles}/${knowledgeBase.length}`} subtitle="en base" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 stagger-children">
        <div className="card card-border p-4">
          <h2 className="text-sm font-semibold text-primary m-0 mb-3">Artículos más vistos</h2>
          <div className="space-y-2">
            {topArticles.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 py-1.5">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-400"}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 m-0 truncate font-medium">{a.question}</p>
                  <p className="text-[10px] text-slate-400 m-0">{a.category} · {a.views} vistas</p>
                </div>
                <div className="text-xs font-semibold text-slate-500">{a.views}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-border p-4">
          <h2 className="text-sm font-semibold text-primary m-0 mb-3">Documentos más descargados</h2>
          <div className="space-y-2">
            {topDocs.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3 py-1.5">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-400"}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 m-0 truncate font-medium">{d.title}</p>
                  <p className="text-[10px] text-slate-400 m-0">{d.category} · {d.format} · {d.fileSize}</p>
                </div>
                <div className="text-xs font-semibold text-slate-500">{d.downloads}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 stagger-children">
        <div className="card card-border p-4">
          <h2 className="text-sm font-semibold text-primary m-0 mb-3">Artículos por categoría</h2>
          <div className="space-y-2">
            {byCategory.map((c) => (
              <div key={c.label} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-20 font-medium">{c.label}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${(c.count / maxCat) * 100}%`, animation: "bar-fill 0.5s ease-out" }} />
                </div>
                <span className="text-xs text-slate-500 font-medium w-6 text-right">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-border p-4">
          <h2 className="text-sm font-semibold text-primary m-0 mb-3">Expedientes por área</h2>
          <div className="space-y-2">
            {byDept.map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-24 font-medium truncate">{d.label}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${(d.count / maxDept) * 100}%`, animation: "bar-fill 0.5s ease-out" }} />
                </div>
                <span className="text-xs text-slate-500 font-medium w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-border p-4">
          <h2 className="text-sm font-semibold text-primary m-0 mb-3">Usuarios por rol</h2>
          <div className="space-y-2">
            {usersByRole.map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-24 font-medium">{r.label}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${(r.count / users.length) * 100}%`, animation: "bar-fill 0.5s ease-out" }} />
                </div>
                <span className="text-xs text-slate-500 font-medium w-6 text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        <div className="card card-border p-4">
          <h2 className="text-sm font-semibold text-primary m-0 mb-3">Estado de expedientes</h2>
          <div className="grid grid-cols-4 gap-2">
            {sigedByStatus.map((s) => {
              const pct = sigedRecords.length ? Math.round((s.count / sigedRecords.length) * 100) : 0;
              const colors = { Ingresado: "bg-blue-500", "En proceso": "bg-amber-500", Observado: "bg-red-500", Finalizado: "bg-emerald-500" };
              return (
                <div key={s.label} className="text-center p-3 bg-slate-50 rounded-xl">
                  <div className={`w-3 h-3 rounded-full mx-auto mb-1.5 ${colors[s.label] || "bg-slate-400"}`} />
                  <p className="text-lg font-bold text-primary m-0">{s.count}</p>
                  <p className="text-[10px] text-slate-500 font-medium m-0">{s.label}</p>
                  <p className="text-[10px] text-slate-400 m-0">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card card-border p-4">
          <h2 className="text-sm font-semibold text-primary m-0 mb-3">Distribución de usuarios</h2>
          <div className="grid grid-cols-2 gap-4">
            {byStatus.map((s) => (
              <div key={s.label} className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-2xl font-bold text-primary m-0">{s.count}</p>
                <p className="text-xs text-slate-500 font-medium m-0">{s.label}</p>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.label === "Activos" ? "bg-emerald-500" : "bg-slate-400"}`} style={{ width: `${s.pct}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{s.pct}% del total</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
