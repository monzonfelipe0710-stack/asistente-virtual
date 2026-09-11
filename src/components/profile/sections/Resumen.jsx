import { useNavigate } from "react-router-dom";
import { StatCard } from "../../admin/ui";
import { Icon, ICONS, SectionHeader, EmptyNote } from "../ui";

export default function Resumen({ data, role, onGo }) {
  const navigate = useNavigate();
  const isSuper = data.isSuperadmin;
  const isAdmin = role === "Administrador";

  if (isSuper) {
    const stats = [
      { label: "Usuarios totales", value: data.usersTotales, icon: ICONS.users, tone: "brand" },
      { label: "Ciudadanos", value: data.usersCiudadanos, icon: ICONS.users, tone: "info" },
      { label: "Administradores", value: data.usersAdministradores, icon: ICONS.key, tone: "ok" },
      { label: "SuperAdmins", value: data.usersSuperAdmins, icon: ICONS.shield, tone: "muted" },
      { label: "Cuentas activas", value: data.usersActivos, icon: ICONS.check, tone: "ok" },
      { label: "Suspendidas", value: data.usersSuspendidos, icon: ICONS.lock, tone: "bad" },
      { label: "Solicitudes pendientes", value: data.requestsPendientes, icon: ICONS.solicitud, tone: "warn" },
      { label: "Trámites activos", value: data.tramitesActivos, icon: ICONS.tramite, tone: "info" },
    ];
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Resumen general"
          description="Estado actual del sistema según los datos registrados."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} icon={<Icon path={s.icon} />} tone={s.tone} />
          ))}
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Resumen de gestión"
          description="Lo que está sucediendo en tu área en este momento."
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Solicitudes pendientes" value={data.requestsPendientes} tone="warn" hint="aguardan revisión" icon={<Icon path={ICONS.solicitud} />} />
          <StatCard label="Trámites activos" value={data.tramitesActivos} tone="info" hint="ingresados o en proceso" icon={<Icon path={ICONS.tramite} />} />
          <StatCard label="Usuarios registrados" value={data.usersTotales} tone="brand" hint="cuentas de ChatAP" icon={<Icon path={ICONS.users} />} />
          <StatCard label="Notificaciones" value={data.notificationsUnread} tone="ok" hint="sin leer" icon={<Icon path={ICONS.bell} />} />
        </div>
      </div>
    );
  }

  // Ciudadano
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Tu espacio"
        description="Un resumen de tus trámites, solicitudes y actividad en ChatAP."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard label="Trámites" value={data.myTramites.length} tone="brand" hint="a tu nombre" icon={<Icon path={ICONS.tramite} />} />
        <StatCard label="Solicitudes" value={data.myRequests.length} tone="info" hint="de acceso" icon={<Icon path={ICONS.solicitud} />} />
        <StatCard label="Conversaciones" value={data.chatSessions.length} tone="ok" hint="con ChatAP" icon={<Icon path={ICONS.chat} />} />
        <StatCard label="Notificaciones" value={data.notificationsUnread} tone="warn" hint={data.notificationsUnread ? "sin leer" : "todo leído"} icon={<Icon path={ICONS.bell} />} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.myTramites.length > 0 ? (
          <div className="card card-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-ink m-0">Mis trámites</h3>
              <button className="text-xs font-semibold text-brand hover:underline cursor-pointer" onClick={() => onGo("tramites")}>
                Ver todos
              </button>
            </div>
            <ul className="divide-y divide-line">
              {data.myTramites.slice(0, 3).map((t) => (
                <li key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink m-0 truncate">{t.type}</p>
                    <p className="text-[11px] text-faint m-0 font-mono">{t.id}</p>
                  </div>
                  <StatusPill status={t.status} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="card card-border p-5">
            <EmptyNote
              icon={<Icon path={ICONS.tramite} className="w-8 h-8" />}
              title="No tenés trámites registrados"
              description="Cuando inicies un trámite en Mesa de Entradas o SIGED lo vas a ver acá."
              action={<button className="btn-ghost text-[13px]!" onClick={() => navigate("/contacto")}>Consultar trámites</button>}
            />
          </div>
        )}

        {data.myRequests.length > 0 ? (
          <div className="card card-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-ink m-0">Mis solicitudes</h3>
              <button className="text-xs font-semibold text-brand hover:underline cursor-pointer" onClick={() => onGo("solicitudes")}>
                Ver todas
              </button>
            </div>
            <ul className="divide-y divide-line">
              {data.myRequests.slice(0, 3).map((r) => (
                <li key={r.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink m-0 truncate">Alta como empleado</p>
                    <p className="text-[11px] text-faint m-0 font-mono">{r.id}</p>
                  </div>
                  <ReqPill status={r.status} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="card card-border p-5">
            <EmptyNote
              icon={<Icon path={ICONS.solicitud} className="w-8 h-8" />}
              title="Todavía no realizaste ninguna solicitud"
              description="Si sos empleado, podés solicitar el acceso al Panel de Administración."
              action={<button className="btn-ghost text-[13px]!" onClick={() => navigate("/chat")}>Contactar al chatbot</button>}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    Ingresado: "bg-info/10 text-info",
    "En proceso": "bg-warn/10 text-warn",
    Observado: "bg-bad/10 text-bad",
    Finalizado: "bg-ok/10 text-ok",
  };
  return (
    <span className={`badge ${map[status] || "bg-mist text-muted"}`}>{status}</span>
  );
}

function ReqPill({ status }) {
  const map = {
    Pendiente: "bg-warn/10 text-warn",
    Activo: "bg-ok/10 text-ok",
    Suspendido: "bg-muted/15 text-muted",
    Rechazado: "bg-bad/10 text-bad",
  };
  return (
    <span className={`badge ${map[status] || "bg-mist text-muted"}`}>{status}</span>
  );
}