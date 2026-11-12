import { useState } from "react";
import { sigedRecords, sigedStatuses } from "../../data/mockSiged";

export default function SigedIntegration() {
  const [statusFilter, setStatusFilter] = useState("Todos");

  const filtered =
    statusFilter === "Todos"
      ? sigedRecords
      : sigedRecords.filter((r) => r.status === statusFilter);

  const statusColors = {
    Ingresado: "bg-blue-50 text-blue-700 border-blue-200",
    "En proceso": "bg-amber-50 text-amber-700 border-amber-200",
    Observado: "bg-red-50 text-red-700 border-red-200",
    Finalizado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800 m-0">
          Integración SIGED
        </h1>
        <p className="text-xs text-slate-500 m-0 mt-1">
          Consultas conectadas al Sistema de Gestión Documental &mdash; Mesa de Entradas
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
            API conectada
            <span className="text-slate-300 mx-1">|</span>
            <span>Última sincronización: {new Date().toLocaleString("es-AR")}</span>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100 transition-colors">
            Sincronizar ahora
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-slate-100">
          <button
            onClick={() => setStatusFilter("Todos")}
            className={`px-3 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
              statusFilter === "Todos"
                ? "bg-blue-800 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-800"
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
                className={`px-3 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
                  statusFilter === status
                    ? "bg-blue-800 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-800"
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
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <th className="px-4 py-3 font-medium">Expediente</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Solicitante</th>
                <th className="px-4 py-3 font-medium">Área</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Último movimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-blue-700 font-medium">
                    {rec.id}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{rec.type}</td>
                  <td className="px-4 py-3 text-slate-700">{rec.applicant}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{rec.department}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(rec.date).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-md border ${
                        statusColors[rec.status] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{rec.lastMovement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            No hay expedientes con ese estado.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0 mb-2">
            Mesa de Entradas
          </h3>
          <p className="text-sm text-slate-700">
            Los expedientes ingresados son recibidos y asignados por Mesa de Entradas para su procesamiento.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0 mb-2">
            API Status
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-slate-700">Operativa</span>
            <span className="text-slate-300 mx-1">|</span>
            <span className="text-xs text-slate-400">Latencia: 45ms</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0 mb-2">
            Consultas hoy
          </h3>
          <p className="text-2xl font-bold text-slate-800 m-0">
            {sigedRecords.filter((r) => r.date === "2026-06-04").length}
          </p>
        </div>
      </div>
    </div>
  );
}
