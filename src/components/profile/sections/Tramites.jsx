import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusPill } from "../../admin/ui";
import { useProfileData } from "../useProfileData";
import { SectionHeader, EmptyNote, Icon, ICONS, DetailModal, Field } from "../ui";
import { formatDate } from "../../../utils/date";

const ORDER = { Ingresado: 0, "En proceso": 2, Observado: 2, Finalizado: 3 };
const STEPS = ["Ingresado", "En revisión", "En proceso", "Finalizado"];

function Timeline({ status }) {
  const activeIdx = ORDER[status] ?? 0;
  return (
    <ol className="relative space-y-0 m-0 pl-6">
      {STEPS.map((step, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        const isObserved = status === "Observado" && activeIdx === 2;
        return (
          <li key={step} className="relative pb-6 last:pb-0">
            {i < STEPS.length - 1 && (
              <span
                className={`absolute left-[5px] top-4 bottom-0 w-0.5 ${done || active ? "bg-brand-deep" : "bg-line"}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`absolute left-0 top-1 w-[11px] h-[11px] rounded-full border-2 ${
                active ? "bg-brand-deep border-brand-deep dot-ping" : done ? "bg-brand-deep border-brand-deep" : "bg-paper border-line"
              }`}
              aria-hidden="true"
            />
            <div className="-mt-0.5">
              <p className={`text-sm m-0 font-medium ${active ? "text-ink" : done ? "text-muted" : "text-faint"}`}>
                {step}
                {active && isObserved && (
                  <span className="badge bg-bad/10 text-bad ml-2">Observado</span>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function TramiteRow({ t, onClick }) {
  return (
    <li className="py-3 px-4 hover:bg-mist/70 transition-colors cursor-pointer" onClick={onClick}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink m-0 truncate">{t.type}</p>
          <p className="text-[11px] font-mono text-faint m-0 mt-0.5">{t.id} · {formatDate(t.date)}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusPill status={t.status} />
          <span className="text-faint" aria-hidden="true">›</span>
        </div>
      </div>
    </li>
  );
}

export default function Tramites() {
  const data = useProfileData();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);

  if (!data) return null;
  const { user, myTramites } = data;

  if (myTramites.length === 0) {
    return (
      <div>
        <SectionHeader title="Mis trámites" description="Expedientes registrados a tu nombre." />
        <div className="card card-border">
          <EmptyNote
            icon={<Icon path={ICONS.tramite} className="w-10 h-10 mx-auto" />}
            title="No tenés trámites registrados"
            description="Si iniciaste un trámite en la Mesa de Entradas o por SIGED, el detalle va a aparecer acá con su estado y movimiento."
            action={<button className="btn-primary text-[13px]!" onClick={() => navigate("/contacto")}>Consultar trámites</button>}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Mis trámites"
        description="Expedientes asociados a tu cuenta. Seleccioná uno para ver el detalle y la línea de tiempo."
      />
      <div className="card card-border overflow-hidden">
        <ul className="divide-y divide-line">
          {myTramites.map((t) => (
            <TramiteRow key={t.id} t={t} onClick={() => setDetail(t)} />
          ))}
        </ul>
      </div>

      <DetailModal open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <>
            <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-line shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0 bg-brand-deep/10 text-brand-deep">
                  <Icon path={ICONS.tramite} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-ink m-0 truncate leading-tight">{detail.type}</h2>
                  <p className="text-[11px] font-mono text-muted m-0 mt-0.5">{detail.id} · {formatDate(detail.date)}</p>
                </div>
              </div>
              <button className="text-muted hover:text-ink p-1 cursor-pointer" onClick={() => setDetail(null)} aria-label="Cerrar">
                <Icon path={ICONS.close} />
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <StatusPill status={detail.status} />
                <span className="badge bg-mist text-muted border border-line">{detail.priority}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <Field label="Solicitante" value={detail.applicant || user.name} />
                <Field label="Dependencia" value={detail.department} />
                <div className="col-span-2">
                  <Field label="Último movimiento" value={detail.lastMovement} />
                </div>
              </div>

              <p className="text-[11px] uppercase tracking-widest text-muted font-semibold m-0 mb-3">
                Línea de tiempo
              </p>
              <div className="rounded-xl border border-line bg-mist/50 p-4 mb-5">
                <Timeline status={detail.status} />
              </div>
              {detail.status === "Observado" && (
                <p className="text-xs text-bad m-0">
                  Tu trámite fue observado por documentación incompleta. Acercate a la Mesa de Entradas para regularizarlo.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-line bg-soft/60 shrink-0">
              <button className="btn-ghost py-2! px-3.5! text-[13px]!" onClick={() => setDetail(null)}>
                Cerrar
              </button>
            </div>
          </>
        )}
      </DetailModal>
    </div>
  );
}