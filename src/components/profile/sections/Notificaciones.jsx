import { useState } from "react";
import { useProfileData } from "../useProfileData";
import {
  markAllNotificationsRead,
  markNotificationRead,
  loadNotifications,
} from "../../../lib/notifications";
import { SectionHeader, EmptyNote, Icon, ICONS } from "../ui";
import { timeAgo } from "../../../utils/date";

const TONE = {
  solicitud: "bg-info/10 text-info",
  tramite: "bg-warn/10 text-warn",
  sistema: "bg-ink/10 text-ink",
  seguridad: "bg-bad/10 text-bad",
};

const TYPE_ICON = {
  solicitud: ICONS.solicitud,
  tramite: ICONS.tramite,
  sistema: ICONS.bell,
  seguridad: ICONS.shield,
};

export default function Notificaciones() {
  const data = useProfileData();
  const [list, setList] = useState(null);

  if (!data) return null;
  const items = list ?? data.notifications;
  const unread = items.filter((n) => !n.read).length;

  function refresh(next) {
    setList(next);
  }

  function handleMarkAll() {
    if (!data.user) return;
    markAllNotificationsRead(data.user.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh(loadNotifications(data.user.id));
  }

  function handleRead(id) {
    if (!data.user) return;
    markNotificationRead(data.user.id, id);
    refresh(loadNotifications(data.user.id));
  }

  return (
    <div>
      <SectionHeader
        title="Notificaciones"
        description={
          unread > 0
            ? `Tenés ${unread} notificación${unread === 1 ? "" : "es"} sin leer.`
            : "No tenés notificaciones pendientes."
        }
        action={
          unread > 0 ? (
            <button className="btn-ghost text-[13px]!" onClick={handleMarkAll}>
              Marcar todas como leídas
            </button>
          ) : null
        }
      />

      <div className="card card-border overflow-hidden">
        {items.length === 0 ? (
          <EmptyNote
            icon={<Icon path={ICONS.bell} className="w-10 h-10 mx-auto" />}
            title="Sin notificaciones"
            description="Cuando cambie el estado de tus trámites o solicitudes, te avisamos acá."
          />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((n) => {
              const meta = TONE[n.type] || TONE.sistema;
              return (
                <li key={n.id} className="flex items-start gap-3 px-5 py-3.5">
                  <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${meta}`}>
                    <Icon path={TYPE_ICON[n.type] || TYPE_ICON.sistema} className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm m-0 leading-snug ${n.read ? "text-muted" : "text-ink font-semibold"}`}>
                      {n.title}
                    </p>
                    {n.body && <p className="text-xs text-muted m-0 mt-1 leading-relaxed">{n.body}</p>}
                    <p className="text-[11px] text-faint m-0 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <button
                      className="shrink-0 text-xs font-semibold text-brand hover:underline cursor-pointer mt-1"
                      onClick={() => handleRead(n.id)}
                    >
                      Marcar leída
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}