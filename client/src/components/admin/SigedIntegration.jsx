import { useState } from "react";
import { sigedRecords, sigedStatuses } from "../../data/mockSiged";

export default function SigedIntegration() {
  const [statusFilter, setStatusFilter] = useState("Todos");

  const filtered =
    statusFilter === "Todos"
      ? sigedRecords
      : sigedRecords.filter((r) => r.status === statusFilter);

  const statusColors = {
    Ingresado: "bg-info text-paper",
    "En proceso": "bg-warn text-paper",
    Observado: "bg-bad text-paper",
    Finalizado: "bg-ok text-paper",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-wide text-ink m-0">
          Integración SIGED
        </h1>
        <p className="text-xs uppercase tracking-wide text-muted m-0 mt-2">
          Sistema de Gestión Documental · Mesa de Entradas
        </p>
      </div>

      <div className="bg-paper border border-line mb-8">
        <div className="px-6 py-4 border-b border-line bg-mist flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <span className="w-2 h-2 bg-ok inline-block" />
            API conectada
            <span className="text-line mx-1">|</span>
            <span>Última sincronización: {new Date().toLocaleString("es-AR")}</span>
          </div>
          <button className="px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-paper bg-brand cursor-pointer hover:bg-brand-dark transition-all duration-300 hover:-translate-y-0.5">
            Sincronizar ahora
          </button>
        </div>

        <div className="flex flex-wrap gap-2 px-6 py-4 border-b border-line">
          <button
            onClick={() => setStatusFilter("Todos")}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide cursor-pointer transition-colors ${
              statusFilter === "Todos"
                ? "bg-brand text-paper"
                : "bg-paper text-ink border border-line hover:border-brand"
            }`}
          >
            Todos ({sigedRecords.length})
          </button>
          {sigedStatuses.map((status) => {
            const count = sigedRecords.filter((r) => r.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide cursor-pointer transition-colors ${
                  statusFilter === status
                    ? "bg-brand text-paper"
                    : "bg-paper text-ink border border-line hover:border-brand"
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
              <tr className="bg-mist text-left text-[10px] uppercase tracking-widest text-muted">
                <th className="px-6 py-3 font-semibold">Expediente</th>
                <th className="px-6 py-3 font-semibold">Tipo</th>
                <th className="px-6 py-3 font-semibold">Solicitante</th>
                <th className="px-6 py-3 font-semibold">Área</th>
                <th className="px-6 py-3 font-semibold">Fecha</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 font-semibold">Último movimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((rec) => (
                <tr key={rec.id} className="hover:bg-mist transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-brand font-semibold">
                    {rec.id}
                  </td>
                  <td className="px-6 py-4 text-ink">{rec.type}</td>
                  <td className="px-6 py-4 text-ink">{rec.applicant}</td>
                  <td className="px-6 py-4 text-xs text-muted">{rec.department}</td>
                  <td className="px-6 py-4 text-xs text-muted">
                    {new Date(rec.date).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusColors[rec.status] || "bg-mist text-muted"}`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted">{rec.lastMovement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted text-center py-8 m-0">
            No hay expedientes con ese estado.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-paper border border-line p-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">
            Mesa de Entradas
          </h3>
          <p className="text-sm text-ink leading-relaxed">
            Los expedientes ingresados son recibidos y asignados por Mesa de Entradas para su procesamiento.
          </p>
        </div>
        <div className="bg-paper border border-line p-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">
            API Status
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-ok inline-block" />
            <span className="font-semibold text-ink">Operativa</span>
            <span className="text-line mx-1">|</span>
            <span className="text-xs text-muted">Latencia: 45ms</span>
          </div>
        </div>
        <div className="bg-paper border border-line p-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3">
            Consultas hoy
          </h3>
          <p className="text-3xl font-bold text-ink m-0 leading-none">
            {sigedRecords.filter((r) => r.date === "2026-06-04").length}
          </p>
        </div>
      </div>
    </div>
  );
}
