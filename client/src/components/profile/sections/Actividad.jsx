import { useProfileData } from "../useProfileData";
import { SectionHeader, EmptyNote, Icon, ICONS } from "../ui";
import { timeAgo } from "../../../utils/date";

const TYPE_ICON = {
  user: ICONS.profile,
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

export default function Actividad() {
  const data = useProfileData();
  if (!data) return null;
  const events = data.myActivity;

  return (
    <div>
      <SectionHeader
        title="Mi actividad"
        description="Las acciones registradas de tu cuenta: consultas, cambios de perfil y movimientos."
      />
      <div className="card card-border overflow-hidden">
        {events.length === 0 ? (
          <EmptyNote
            icon={<Icon path={ICONS.activity} className="w-10 h-10 mx-auto" />}
            title="Todavía no hay actividad registrada"
            description="Cambios de perfil, solicitudes, decisiones y otras acciones van a aparecer acá con su fecha y hora."
          />
        ) : (
          <ul className="divide-y divide-line">
            {events.map((e) => (
              <li key={e.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${TYPE_TONE[e.type] || TYPE_TONE.sistema}`}>
                  <Icon path={TYPE_ICON[e.type] || TYPE_ICON.sistema} className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink m-0 leading-snug">
                    <span className="font-semibold">{e.action}</span>{" "}
                    {e.target && <span className="text-muted">{e.target}</span>}
                  </p>
                  <p className="text-[11px] text-faint m-0 mt-0.5">
                    {e.displayDate || timeAgo(e.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}