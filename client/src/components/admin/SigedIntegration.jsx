import { useState, useEffect } from "react";
import { sigedRecords, sigedStatuses, sigedPriorities } from "../../data/mockSiged";
import { useToast } from "../common/Toast";
import Pagination, { usePagination } from "../common/Pagination";
import ExpedienteDetail from "./ExpedienteDetail";
import EmptyState from "./EmptyState";
import { TableSkeleton } from "./Skeleton";
import useSortable from "../../hooks/useSortable";

export default function SigedIntegration() {
  const addToast = useToast();
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [search, setSearch] = useState("");
  const [localRecords, setLocalRecords] = useState(sigedRecords);
  const [detailExp, setDetailExp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const filtered = localRecords.filter((r) => {
    if (statusFilter !== "Todos" && r.status !== statusFilter) return false;
    if (priorityFilter !== "Todas" && r.priority !== priorityFilter) return false;
    if (search && !r.id.toLowerCase().includes(search.toLowerCase()) && !r.applicant.toLowerCase().includes(search.toLowerCase()) && !r.type.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const { sorted, toggleSort, getSortIndicator } = useSortable(filtered, "date", "desc");
  const { page, totalPages, paginatedItems, setPage } = usePagination(sorted, 7);

  const statusColors = { Ingresado: "bg-blue-50 text-blue-700 border-blue-200/60", "En proceso": "bg-amber-50 text-amber-700 border-amber-200/60", Observado: "bg-red-50 text-red-700 border-red-200/60", Finalizado: "bg-emerald-50 text-emerald-700 border-emerald-200/60" };
  const priorityColors = { Alta: "bg-red-50 text-red-600 border-red-200", Normal: "bg-blue-50 text-blue-600 border-blue-200", Baja: "bg-slate-50 text-slate-500 border-slate-200" };

  const today = new Date().toISOString().slice(0, 10);

  function handleStatusChange(id, newStatus) {
    setLocalRecords((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus, lastMovement: `Estado actualizado a ${newStatus}` } : r));
    addToast(`Expediente ${id} actualizado a "${newStatus}"`, "success");
  }

  if (loading) return <div className="animate-fade-in"><div className="animate-shimmer h-8 w-48 rounded-lg mb-4" /><TableSkeleton rows={5} cols={7} /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-primary m-0 tracking-tight">Integración SIGED</h1>
          <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">{localRecords.length} expedientes · Sistema de Gestión Documental</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          API conectada · Latencia 45ms
        </div>
      </div>

      <div className="card card-border overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar expediente..." className="input-field pl-8 py-1.5 text-xs w-48" />
            </div>
            <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }} className="input-field py-1.5 text-xs w-28">
              <option value="Todas">Todas prioridades</option>
              {sigedPriorities.map((p) => <option key={p}>{p}</option>)}
            </select>
            <span className="text-xs text-slate-400 font-medium">Última sincro: {new Date().toLocaleString("es-AR")}</span>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium text-accent bg-accent-light/50 rounded-lg cursor-pointer hover:bg-accent-light transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Sincronizar
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-slate-100">
          {["Todos", ...sigedStatuses].map((s) => {
            const count = s === "Todos" ? localRecords.length : localRecords.filter((r) => r.status === s).length;
            return (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all duration-200 ${statusFilter === s ? "bg-primary text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200/60 hover:border-primary/30 hover:text-primary"}`}>
                {s} ({count})
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs text-slate-500 uppercase tracking-wider">
                <TH sortable sortKey="id" label="Expediente" onSort={toggleSort} indicator={getSortIndicator("id")} />
                <TH sortable sortKey="type" label="Tipo" onSort={toggleSort} indicator={getSortIndicator("type")} />
                <TH sortable sortKey="applicant" label="Solicitante" onSort={toggleSort} indicator={getSortIndicator("applicant")} />
                <TH sortable sortKey="department" label="Área" onSort={toggleSort} indicator={getSortIndicator("department")} />
                <TH sortable sortKey="date" label="Fecha" onSort={toggleSort} indicator={getSortIndicator("date")} />
                <TH sortable sortKey="priority" label="Prioridad" onSort={toggleSort} indicator={getSortIndicator("priority")} />
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 stagger-children">
              {paginatedItems.map((rec) => (
                <tr key={rec.id} className="table-row cursor-pointer" onClick={() => setDetailExp(rec)}>
                  <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{rec.id}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{rec.type}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">{rec.applicant.charAt(0)}</div>
                      <span className="text-xs text-slate-600">{rec.applicant}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{rec.department}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(rec.date).toLocaleDateString("es-AR")}</td>
                  <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-lg border ${priorityColors[rec.priority] || "bg-slate-100 text-slate-600"}`}>{rec.priority}</span></td>
                  <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-lg border ${statusColors[rec.status] || "bg-slate-100 text-slate-600 border-slate-200/60"}`}>{rec.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); setDetailExp(rec); }} className="px-2.5 py-1 text-[10px] font-medium text-accent bg-accent-light/50 rounded-lg cursor-pointer hover:bg-accent-light transition-colors">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && <EmptyState title="Sin expedientes" description="No hay expedientes con los filtros seleccionados." action={<button onClick={() => { setStatusFilter("Todos"); setPriorityFilter("Todas"); setSearch(""); setPage(1); }} className="btn-ghost text-xs">Limpiar filtros</button>} />}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-children">
        <div className="card card-border p-4">
          <div className="flex items-center gap-2 mb-2"><svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg><h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0">Mesa de Entradas</h3></div>
          <p className="text-xs text-slate-600 leading-relaxed">Los expedientes son recibidos y asignados por Mesa de Entradas para su procesamiento.</p>
        </div>
        <div className="card card-border p-4">
          <div className="flex items-center gap-2 mb-2"><svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg><h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0">API Status</h3></div>
          <div className="flex items-center gap-2 text-xs"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span><span className="text-slate-600 font-medium">Operativa</span><span className="text-slate-200 mx-1">|</span><span className="text-slate-400">Latencia: 45ms</span></div>
        </div>
        <div className="card card-border p-4">
          <div className="flex items-center gap-2 mb-2"><svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0">Consultas hoy</h3></div>
          <p className="text-2xl font-bold text-primary m-0 tracking-tight">{localRecords.filter((r) => r.date === today).length}</p>
        </div>
        <div className="card card-border p-4">
          <div className="flex items-center gap-2 mb-2"><svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg><h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0">En proceso</h3></div>
          <p className="text-2xl font-bold text-amber-600 m-0 tracking-tight">{localRecords.filter((r) => r.status === "En proceso").length}</p>
        </div>
      </div>

      <ExpedienteDetail expediente={detailExp} onClose={() => setDetailExp(null)} onStatusChange={handleStatusChange} />
    </div>
  );
}

function TH({ sortable, sortKey, label, onSort, indicator }) {
  if (!sortable) return <th className="px-4 py-3 font-semibold">{label}</th>;
  return (
    <th className="px-4 py-3 font-semibold sort-header" onClick={() => onSort(sortKey)}>
      <span className="inline-flex items-center gap-1">{label}{indicator && <span className="text-[9px] text-accent">{indicator}</span>}</span>
    </th>
  );
}
