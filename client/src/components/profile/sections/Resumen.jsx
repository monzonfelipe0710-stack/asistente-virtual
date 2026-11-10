import { useEffect, useState } from "react";
import PendingBackend from "../../admin/PendingBackend";
import { SectionHeader } from "../ui";
import { resumenConsultas } from "../../../services/consultas";
import { apiErrorMessage } from "../../../lib/api";
import { useSessionStore } from "../../../store/session";

const TOPIC_LABELS = {
  licencias: "Licencias",
  haberes: "Haberes",
  expedientes: "Expedientes",
  legajos: "Legajos",
  formularios: "Formularios",
  ubicaciones: "Oficinas y ubicaciones",
  requisitos: "Requisitos de trámites",
};

export default function Resumen({ data, role }) {
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

  useEffect(() => {
    let active = true;
    if (!token || role !== "CIUDADANO") return () => { active = false; };

    resumenConsultas()
      .then((result) => {
        if (active) setActivityState({ token, data: result, error: "" });
      })
      .catch((error) => {
        if (active) {
          setActivityState({
            token,
            data: null,
            error: apiErrorMessage(error),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [token, role]);

  if (role !== "CIUDADANO") {
    return (
      <div>
        <SectionHeader
          title="Resumen de gestión"
          description="Indicadores administrativos y actividad del sistema."
        />
        <PendingBackend
          title="Próximamente"
          description="Este resumen todavía no consulta los indicadores administrativos del backend. Los datos se habilitarán cuando se conecte a las métricas reales."
        />
      </div>
    );
  }

  const topics = Array.isArray(activity?.topicos) ? activity.topicos : [];
  const sessions = Array.isArray(data?.chatSessions) ? data.chatSessions : [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title={data?.user?.firstName ? `Tu espacio, ${data.user.firstName}` : "Tu espacio"}
        description="Resumen de tus consultas registradas en ChatAP."
      />

      <section className="rounded-2xl border border-line bg-paper p-5" aria-labelledby="consultas-resumen">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="consultas-resumen" className="m-0 text-sm font-bold text-ink">
              Tu actividad de consultas
            </h2>
            <p className="m-0 mt-1 text-xs text-muted">
              Temas y consultas acumulados durante el mes actual.
            </p>
          </div>
          {activity && (
            <p className="m-0 text-sm font-semibold text-brand-deep">
              {activity.ultimoMes} consulta{activity.ultimoMes === 1 ? "" : "s"} este mes
            </p>
          )}
        </div>

        {activityError ? (
          <p role="alert" className="mb-0 mt-4 text-sm text-bad">{activityError}</p>
        ) : activityLoading ? (
          <p role="status" className="mb-0 mt-4 text-sm text-muted">Cargando tu resumen…</p>
        ) : !token ? (
          <p className="mb-0 mt-4 text-sm text-muted">
            El resumen mensual estará disponible cuando la cuenta esté conectada al backend.
          </p>
        ) : topics.length ? (
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <li key={topic.topico} className="flex items-center justify-between gap-3 rounded-xl bg-mist px-3 py-2.5">
                <span className="text-sm text-ink">{TOPIC_LABELS[topic.topico] || topic.topico}</span>
                <span className="text-sm font-bold text-brand-deep">{topic.cantidad}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-0 mt-4 text-sm text-muted">Todavía no hay consultas registradas este mes.</p>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-paper p-5">
        <h2 className="m-0 text-sm font-bold text-ink">Conversaciones</h2>
        <p className="mb-0 mt-2 text-sm text-muted">
          {sessions.length
            ? `${sessions.length} conversación${sessions.length === 1 ? "" : "es"} en tu historial.`
            : "No hay conversaciones en tu historial todavía."}
        </p>
      </section>
    </div>
  );
}
