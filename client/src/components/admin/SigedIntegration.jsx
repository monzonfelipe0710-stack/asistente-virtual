import { useState } from "react";
import { sigedRecords, sigedStatuses } from "../../data/mockSiged";
import Pagination, { usePagination } from "../common/Pagination";

export default function SigedIntegration() {
  const [statusFilter, setStatusFilter] = useState("Todos");

  const filtered =
    statusFilter === "Todos"
      ? sigedRecords
      : sigedRecords.filter((r) => r.status === statusFilter);

  const { page, totalPages, paginatedItems, setPage } = usePagination(filtered, 5);

  const statusColors = {
    Ingresado: "bg-blue-50 text-blue-700 border-blue-200/60",
    "En proceso": "bg-amber-50 text-amber-700 border-amber-200/60",
    Observado: "bg-red-50 text-red-700 border-red-200/60",
    Finalizado: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-primary m-0 tracking-tight">
          Integración SIGED
        </h1>
        <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">
          Consultas conectadas al Sistema de Gestión Documental &mdash; Mesa de Entradas
        </p>
      </div>

      <div className="card card-border overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            API conectada
            <span className="text-slate-200">|</span>
            <span>Última sincronización: {new Date().toLocaleString("es-AR")} hs</span>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium text-accent bg-accent-light/50 rounded-lg cursor-pointer hover:bg-accent-light transition-colors">
            Sincronizar ahora
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-slate-100">
          <button
            onClick={() => { setStatusFilter("Todos"); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all duration-200 ${
              statusFilter === "Todos"
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-slate-500 border border-slate-200/60 hover:border-primary/30 hover:text-primary"
            }`}
          >
            Todos ({sigedRecords.length})
          </button>
          {sigedStatuses.map((status) => {
            const count = sigedRecords.filter((r) => r.status === status).length;
            return (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all duration-200 ${
                  statusFilter === status
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-slate-500 border border-slate-200/60 hover:border-primary/30 hover:text-primary"
                }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold">Expediente</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Solicitante</th>
                <th className="px-4 py-3 font-semibold">Área</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Último movimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 stagger-children">
              {paginatedItems.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">
                    {rec.id}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{rec.type}</td>
                  <td className="px-4 py-3 text-slate-600">{rec.applicant}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{rec.department}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(rec.date).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-lg border ${
                        statusColors[rec.status] || "bg-slate-100 text-slate-600 border-slate-200/60"
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{rec.lastMovement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-8 h-8 text-slate-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-slate-400 font-medium">No hay expedientes con ese estado.</p>
          </div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        <div className="card card-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0">
              Mesa de Entradas
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Los expedientes ingresados son recibidos y asignados por Mesa de Entradas para su procesamiento.
          </p>
        </div>
        <div className="card card-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0">
              API Status
            </h3>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-slate-600 font-medium">Operativa</span>
            <span className="text-slate-200 mx-1">|</span>
            <span className="text-xs text-slate-400">Latencia: 45ms</span>
          </div>
        </div>
        <div className="card card-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0">
              Consultas hoy
            </h3>
          </div>
          <p className="text-2xl font-bold text-primary m-0 tracking-tight">
            {sigedRecords.filter((r) => r.date === today).length}
          </p>
        </div>
      </div>
    </div>
  );
}
