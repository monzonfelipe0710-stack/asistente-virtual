import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileData } from "../useProfileData";
import { SectionHeader, EmptyNote, Icon, ICONS, DetailModal, Field, Pill } from "../ui";
import { formatDate } from "../../../utils/date";

const META = {
  Pendiente: { tone: "bg-warn/10 text-warn", label: "En espera de revisión", icon: ICONS.solicitud },
  Activo: { tone: "bg-ok/10 text-ok", label: "Acceso habilitado", icon: ICONS.check },
  Suspendido: { tone: "bg-muted/15 text-muted", label: "Acceso suspendido", icon: ICONS.lock },
  Rechazado: { tone: "bg-bad/10 text-bad", label: "No fue aprobada", icon: ICONS.close },
};

export default function Solicitudes() {
  const data = useProfileData();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);

  if (!data) return null;

  // Ciudadano
  const mine = data.myRequests;
  return (
    <div>
      <SectionHeader
        title="Mis solicitudes"
        description="Las solicitudes que registraste y su resolución."
      />
      {mine.length === 0 ? (
        <div className="card card-border">
          <EmptyNote
            icon={<Icon path={ICONS.solicitud} className="w-10 h-10 mx-auto" />}
            title="Todavía no realizaste ninguna solicitud"
            description="Si sos empleado público podés pedir el acceso al Panel de Administración desde el registro de cuenta."
            action={<button className="btn-primary text-[13px]!" onClick={() => navigate("/")}>Volver al inicio</button>}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {mine.map((r) => {
            const meta = META[r.status] || META.Pendiente;
            return (
              <button
                key={r.id}
                onClick={() => setDetail(r)}
                className="card card-interactive w-full p-4 text-left cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${meta.tone}`}>
                      <Icon path={meta.icon} className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink m-0">Alta como empleado</p>
                      <p className="text-[11px] font-mono text-faint m-0">
                        {r.id} · solicitada el {formatDate(r.requestedAt)}
                      </p>
                    </div>
                  </div>
                  <ReqPill status={r.status} />
                </div>
                {r.reviewNote && (
                  <p className="text-xs text-muted m-0 mt-3 leading-relaxed border-l-2 border-line pl-3">
                    {r.reviewNote}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      <DetailModal open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <>
            <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-line shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0 bg-brand-deep/10 text-brand-deep">
                  <Icon path={ICONS.solicitud} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-ink m-0">Solicitud de acceso</h2>
                  <p className="text-[11px] font-mono text-muted m-0 mt-0.5">{detail.id} · {formatDate(detail.requestedAt)}</p>
                </div>
              </div>
              <button className="text-muted hover:text-ink p-1 cursor-pointer" onClick={() => setDetail(null)} aria-label="Cerrar">
                <Icon path={ICONS.close} />
              </button>
            </div>

            <div className="px-5 py-4 overflow-y-auto">
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <ReqPill status={detail.status} />
                {(META[detail.status] || META.Pendiente) && (
                  <Pill tone="bg-mist text-muted border border-line">
                    {META[detail.status].label}
                  </Pill>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label="CUIL" value={detail.cuil} mono />
                <Field label="Teléfono" value={detail.phone} />
                <Field label="Dependencia" value={detail.department} />
                <Field label="Puesto" value={detail.position} />
                <div className="col-span-2">
                  <Field label="Motivo" value={detail.reason} />
                </div>
                {detail.reviewNote && (
                  <div className="col-span-2">
                    <Field label="Resolución" value={detail.reviewNote} />
                  </div>
                )}
                {detail.reviewedAt && (
                  <div className="col-span-2">
                    <Field
                      label={detail.status === "Activo" ? "Aprobado" : "Revisado"}
                      value={`${detail.reviewedBy || "—"} · ${formatDate(detail.reviewedAt)}`}
                    />
                  </div>
                )}
              </dl>

              {detail.status === "Rechazado" && (
                <p className="text-xs text-bad m-0 mt-4">
                  Esta solicitud fue rechazada. Si considerás que fue un error, contactate con la Mesa de Ayuda.
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

function ReqPill({ status }) {
  const meta = META[status] || META.Pendiente;
  return <span className={`badge ${meta.tone}`}>{status}</span>;
}