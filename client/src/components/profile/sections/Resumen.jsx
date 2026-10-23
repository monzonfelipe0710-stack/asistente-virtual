import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatCard } from "../../admin/ui";
import { Icon, ICONS, SectionHeader, EmptyNote } from "../ui";
import { useSessionStore } from "../../../store/session";
import { resumenConsultas } from "../../../services/consultas";
import { apiErrorMessage } from "../../../lib/api";

const TOPIC_LABELS = {
  licencias: "Licencias",
  haberes: "Haberes",
  expedientes: "Expedientes",
  legajos: "Legajos",
  formularios: "Formularios",
  ubicaciones: "Oficinas y ubicaciones",
  requisitos: "Requisitos de trámites",
};

export default function Resumen({ data, role, onGo }) {
  const navigate = useNavigate();
  const token = useSessionStore((state) => state.token);
  const [activityState, setActivityState] = useState({
    token: null,
    data: null,
    error: "",
  });
  const activity = activityState.token === token ? activityState.data : null;
  const activityError = activityState.token === token ? activityState.error : "";
  const activityLoading =
    Boolean(token && role === "CIUDADANO" && activityState.token !== token);
  const isSuper = data.isSuperadmin;
  const isAdmin = role === "ADMINISTRADOR";

  useEffect(() => {
    let cancelled = false;
    if (!token || role !== "CIUDADANO") {
      return () => {
        cancelled = true;
      };
    }

    resumenConsultas()
      .then((result) => {
        if (!cancelled) setActivityState({ token, data: result, error: "" });
      })
      .catch((error) => {
        if (!cancelled) {
          setActivityState({
            token,
            data: null,
            error: apiErrorMessage(error),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, role]);

  if (isSuper) {
    const stats = [
      { label: "Usuarios totales", value: data.usersTotales, icon: ICONS.users, tone: "brand" },
      { label: "Ciudadanos", value: data.usersCiudadanos, icon: ICONS.users, tone: "info" },
      { label: "Empleados", value: data.usersAdministradores, icon: ICONS.key, tone: "ok" },
      { label: "Administradores", value: data.usersSuperAdmins, icon: ICONS.shield, tone: "muted" },
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
        title={data?.user?.firstName ? `Tu espacio, ${data.user.firstName}` : "Tu espacio"}
        description="Un resumen de tus trámites, solicitudes y actividad en ChatAP."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <StatCard label="Trámites" value={data.myTramites.length} tone="brand" hint="a tu nombre" icon={<Icon path={ICONS.tramite} />} />
        <StatCard label="Solicitudes" value={data.myRequests.length} tone="info" hint="de acceso" icon={<Icon path={ICONS.solicitud} />} />
        <StatCard label="Conversaciones" value={data.chatSessions.length} tone="ok" hint="con ChatAP" icon={<Icon path={ICONS.chat} />} />
        <StatCard label="Notificaciones" value={data.notificationsUnread} tone="warn" hint={data.notificationsUnread ? "sin leer" : "todo leído"} icon={<Icon path={ICONS.bell} />} />
      </div>

      <section className="card card-border p-5" aria-labelledby="consultas-resumen">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 id="consultas-resumen" className="text-sm font-bold text-ink m-0">
              Tu actividad de consultas
            </h3>
            <p className="text-xs text-muted m-0 mt-1">
              Temas y consultas acumulados durante el mes actual.
            </p>
          </div>
          {activity && (
            <p className="text-sm font-semibold text-brand-deep m-0">
              {activity.ultimoMes} consulta{activity.ultimoMes === 1 ? "" : "s"} este mes
            </p>
          )}
        </div>
        {activityError ? (
          <p role="alert" className="mt-4 text-sm text-bad">{activityError}</p>
        ) : activityLoading ? (
          <p role="status" className="mt-4 text-sm text-muted">Cargando tu resumen…</p>
        ) : !token ? (
          <p className="mt-4 text-sm text-muted">
            El resumen personal estará disponible cuando uses una cuenta conectada al backend.
          </p>
        ) : activity?.topicos?.length ? (
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {activity.topicos.map((topic) => (
              <li key={topic.topico} className="flex items-center justify-between gap-3 rounded-xl bg-mist px-3 py-2.5">
                <span className="text-sm text-ink">{TOPIC_LABELS[topic.topico] || topic.topico}</span>
                <span className="text-sm font-bold text-brand-deep">
                  {topic.cantidad}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">Todavía no registramos consultas este mes.</p>
        )}
      </section>

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