import { useProfileData } from "../useProfileData";
import { SectionHeader, EmptyNote, Icon, ICONS, Pill } from "../ui";
import { timeAgo } from "../../../utils/date";

const TYPE_ICON = {
  user: ICONS.users,
  solicitud: ICONS.solicitud,
  tramite: ICONS.tramite,
  documento: ICONS.solicitud,
  conocimiento: ICONS.chat,
  config: ICONS.key,
  seguridad: ICONS.shield,
  sistema: ICONS.activity,
};

const TYPE_TONE = {
  user: "bg-brand-deep/10 text-brand-deep",
  solicitud: "bg-info/10 text-info",
  tramite: "bg-warn/10 text-warn",
  documento: "bg-ok/10 text-ok",
  conocimiento: "bg-purple-50 text-purple-600",
  config: "bg-muted/10 text-muted",
  seguridad: "bg-bad/10 text-bad",
  sistema: "bg-ink/10 text-ink",
};

export default function Auditoria() {
  const data = useProfileData();
  if (!data) return null;
  const events = data.systemActivity;
  const real = events.filter((e) => !e.id?.toString().startsWith("seed-"));
  const previos = events.filter((e) => e.id?.toString().startsWith("seed-"));

  return (
    <div>
      <SectionHeader
        title="Actividad del sistema"
        description="Registro de auditoría de las acciones administrativas en ChatAP."
      />
      <div className="card card-border overflow-hidden">
        <div className="px-5 py-3 border-b border-line bg-mist/60 flex items-center gap-2">
          <Pill tone="bg-ok/10 text-ok">{real.length} acciones reales registradas</Pill>
          {previos.length > 0 && <Pill tone="bg-mist text-muted border border-line">{previos.length} previas</Pill>}
        </div>
        {events.length === 0 ? (
          <EmptyNote
            icon={<Icon path={ICONS.activity} className="w-10 h-10 mx-auto" />}
            title="Sin actividad registrada"
            description="Las acciones administrativas (aprobaciones, cambios de permiso, configuraciones) se van a registrar acá."
          />
        ) : (
          <ul className="divide-y divide-line max-h-[28rem] overflow-y-auto">
            {events.map((e) => (
              <li key={e.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${TYPE_TONE[e.type] || TYPE_TONE.sistema}`}>
                  <Icon path={TYPE_ICON[e.type] || TYPE_ICON.sistema} className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink m-0 leading-snug">
                    <span className="font-semibold">{e.actor}</span>{" "}
                    <span className="text-muted">{e.action}</span>{" "}
                    {e.target && <span className="text-ink font-medium">{e.target}</span>}
                  </p>
                  <p className="text-[11px] text-faint m-0 mt-0.5">
                    {e.displayDate || timeAgo(e.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="px-5 py-3 border-t border-line bg-soft/60">
          <p className="text-[11px] text-faint m-0 leading-relaxed">
            Las entradas marcadas como "previas" corresponden al registro demo del sistema.
            La auditoría completa (usuarios, roles, permisos e IP) requiere el endpoint{" "}
            <span className="font-mono">GET /audit</span> (ver README).
          </p>
        </div>
      </div>
    </div>
  );
}