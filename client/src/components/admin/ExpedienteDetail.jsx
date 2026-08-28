import { useState } from "react";
import { sigedStatuses } from "../../data/mockSiged";
import { formatDate } from "../../utils/date";

export default function ExpedienteDetail({ expediente, onClose, onStatusChange }) {
  const [selectedStatus, setSelectedStatus] = useState("");
  if (!expediente) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in p-4" onClick={onClose}>
      <div className="card card-border w-full max-w-lg max-h-[85vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary-lighter rounded-xl flex items-center justify-center text-paper text-xs font-bold font-mono">
              {expediente.id.slice(-3)}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-primary m-0 tracking-tight">{expediente.id}</h2>
              <p className="text-[10px] text-muted m-0 font-medium">{expediente.type}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-mist transition-colors text-muted cursor-pointer bg-transparent border-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-muted font-medium uppercase tracking-wider mb-0.5">Tipo</p>
              <p className="text-xs font-medium text-ink m-0">{expediente.type}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted font-medium uppercase tracking-wider mb-0.5">Solicitante</p>
              <p className="text-xs font-medium text-ink m-0 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-muted to-muted flex items-center justify-center text-paper text-[8px] font-bold">{expediente.applicant.charAt(0)}</span>
                {expediente.applicant}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted font-medium uppercase tracking-wider mb-0.5">Área</p>
              <p className="text-xs font-medium text-ink m-0">{expediente.department}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted font-medium uppercase tracking-wider mb-0.5">Fecha</p>
              <p className="text-xs font-medium text-ink m-0">{formatDate(expediente.date)}</p>
            </div>
          </div>

          <div className="bg-soft rounded-xl p-4">
            <p className="text-[10px] text-muted font-medium uppercase tracking-wider mb-2">Estado actual</p>
            <div className="flex items-center gap-3">
              <StatusBadge status={expediente.status} size="md" />
              <div className="flex-1 flex gap-2">
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="input-field py-1.5 text-xs">
                  <option value="">Cambiar estado...</option>
                  {sigedStatuses.filter((s) => s !== expediente.status).map((s) => <option key={s}>{s}</option>)}
                </select>
                {selectedStatus && (
                  <button onClick={() => { onStatusChange(expediente.id, selectedStatus); setSelectedStatus(""); }} className="px-3 py-1 text-xs font-medium text-paper bg-accent rounded-lg cursor-pointer hover:bg-blue-700 transition-colors shrink-0 border-none">
                    Actualizar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-muted font-medium uppercase tracking-wider mb-2">Movimientos</p>
            <div className="relative ml-2 pl-6 border-l-2 border-line space-y-4">
              <div className="relative">
                <div className="absolute -left-[25px] top-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-paper" />
                <p className="text-xs font-medium text-ink m-0">{expediente.status}</p>
                <p className="text-[10px] text-muted m-0">{expediente.lastMovement}</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[25px] top-0 w-3 h-3 rounded-full bg-blue-500 ring-2 ring-paper" />
                <p className="text-xs font-medium text-ink m-0">Ingresado</p>
                <p className="text-[10px] text-muted m-0">Ingresado por Mesa de Entradas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, size = "sm" }) {
  const colors = { Ingresado: "bg-blue-50 text-blue-700 border-blue-200/60", "En proceso": "bg-amber-50 text-amber-700 border-amber-200/60", Observado: "bg-red-50 text-red-700 border-red-200/60", Finalizado: "bg-emerald-50 text-emerald-700 border-emerald-200/60" };
  return <span className={`inline-block px-2.5 py-0.5 font-semibold rounded-lg border ${colors[status] || "bg-mist text-muted border-line/60"} ${size === "md" ? "text-xs" : "text-[10px]"}`}>{status}</span>;
}
