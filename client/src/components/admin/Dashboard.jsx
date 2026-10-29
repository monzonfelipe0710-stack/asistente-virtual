import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiErrorMessage } from "../../lib/api";
import { listar as listarTramites } from "../../services/tramites";
import { porTramite, sinRespuesta } from "../../services/metricas";
import { listar as listarUsuarios } from "../../services/usuarios";
import { Kicker, DisplayTitle, Lead } from "../common/editorial";
import { formatDate } from "../../utils/date";
import PendingBackend from "./PendingBackend";

function Metric({ label, value, hint }) {
  return (
    <div className="bg-paper p-6 md:p-8">
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">{label}</p>
      <p className="mt-4 m-0 text-4xl md:text-5xl font-extrabold tracking-tighter text-ink">
        {value}
      </p>
      {hint ? <p className="mt-2 m-0 text-sm text-faint">{hint}</p> : null}
      <div className="mt-6 h-[3px] w-10 bg-brand-deep" aria-hidden="true" />
    </div>
  );
}

function SectionEmpty({ children }) {
  return <p className="px-8 py-10 m-0 text-sm text-faint">{children}</p>;
}

export default function Dashboard() {
  const { user, userRole } = useAuth();
  const userId = user?.id;
  const esSuper = userRole === "SUPERUSUARIO";
  const firstName = (user?.name || "").split(" ")[0] || "Admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tramites, setTramites] = useState([]);
  const [porTramiteData, setPorTramiteData] = useState([]);
  const [sinRespuestaData, setSinRespuestaData] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [metricasPendientes, setMetricasPendientes] = useState(false);
  const [usuariosNoDisponibles, setUsuariosNoDisponibles] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      setMetricasPendientes(false);
      setUsuariosNoDisponibles(false);
      setTramites([]);
      setPorTramiteData([]);
      setSinRespuestaData([]);
      setUsuarios([]);

      const requests = await Promise.allSettled([
        listarTramites(),
        ...(esSuper ? [porTramite(), sinRespuesta(), listarUsuarios()] : []),
      ]);
      if (!active) return;

      const tramitesResult = requests[0];
      if (tramitesResult.status === "fulfilled" && Array.isArray(tramitesResult.value)) {
        setTramites(tramitesResult.value);
      } else {
        setError(
          tramitesResult.status === "rejected"
            ? apiErrorMessage(tramitesResult.reason, "No se pudieron cargar los trámites.")
            : "El servidor devolvió un formato inesperado al consultar los trámites."
        );
      }

      if (esSuper) {
        const [porT, sinResp, us] = requests.slice(1);
        const validPorT = porT.status === "fulfilled" && Array.isArray(porT.value);
        const validSinResp = sinResp.status === "fulfilled" && Array.isArray(sinResp.value);
        const validUsers = us.status === "fulfilled" && Array.isArray(us.value);

        if (validPorT) setPorTramiteData(porT.value);
        if (validSinResp) setSinRespuestaData(sinResp.value);
        if (validUsers) setUsuarios(us.value);

        setMetricasPendientes(!validPorT || !validSinResp);
        setUsuariosNoDisponibles(!validUsers);
      }

      setLoading(false);
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [esSuper, refreshKey]);

  const publicados = useMemo(() => tramites.filter((t) => t.publicado).length, [tramites]);
  const misTramites = useMemo(
    () => tramites.filter((t) => t.encargado?.id === userId),
    [tramites, userId]
  );

  const totalConsultas = useMemo(
    () => porTramiteData.reduce((acc, r) => acc + (r._count?._all || 0), 0),
    [porTramiteData]
  );

  const usuariosAprobados = useMemo(
    () => usuarios.filter((u) => u.estado === "APROBADO").length,
    [usuarios]
  );
  const usuariosPendientes = useMemo(
    () => usuarios.filter((u) => u.estado === "PENDIENTE").length,
    [usuarios]
  );

  const topConsultados = useMemo(() => {
    const nombrePorId = new Map(tramites.map((t) => [t.id, t.nombre]));
    return [...porTramiteData]
      .map((r) => ({
        tramiteId: r.tramiteId,
        nombre: r.tramiteId != null ? nombrePorId.get(r.tramiteId) : null,
        count: r._count?._all || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [porTramiteData, tramites]);

  const maxConsulta = topConsultados[0]?.count || 1;

  const recientes = useMemo(
    () =>
      [...tramites]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5),
    [tramites]
  );

  const sinRespuestaRecientes = useMemo(() => sinRespuestaData.slice(0, 6), [sinRespuestaData]);

  return (
    <div className="max-w-6xl">
      <div className="border-b border-line/70 pb-12">
        <Kicker>[ Panel de administración ]</Kicker>
        <DisplayTitle as={2} className="mt-4">
          ADMINISTRACIÓN.
        </DisplayTitle>
        <Lead className="mt-6 max-w-2xl">
          {esSuper
            ? `Hola, ${firstName}. Resumen de trámites, consultas del chat y cuentas de la plataforma.`
            : `Hola, ${firstName}. Resumen de tus trámites y la actividad del panel.`}
        </Lead>
      </div>

      {(error || metricasPendientes || usuariosNoDisponibles) && (
        <div role="alert" className="mt-8 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          {error && <p className="m-0">{error}</p>}
          {metricasPendientes && <p className="m-0">No se pudieron actualizar todas las métricas del chat. Los indicadores afectados no se mostrarán como cero.</p>}
          {usuariosNoDisponibles && <p className="m-0">No se pudo consultar el estado de las cuentas de usuario.</p>}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
          className="btn-ghost text-xs disabled:cursor-wait disabled:opacity-50"
        >
          {loading ? "Actualizando…" : "Actualizar panel"}
        </button>
      </div>

      <div className="mt-12 grid gap-px bg-line border border-line overflow-hidden rounded-2xl grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-paper p-6 md:p-8">
              <div className="animate-shimmer h-3 w-24 rounded" />
              <div className="animate-shimmer mt-5 h-10 w-16 rounded" />
              <div className="animate-shimmer mt-3 h-4 w-20 rounded" />
            </div>
          ))
        ) : esSuper ? (
          <>
            <Metric label="Trámites publicados" value={publicados} hint={`de ${tramites.length} en total`} />
            <Metric label="Consultas registradas" value={metricasPendientes ? "—" : totalConsultas} hint={metricasPendientes ? "Dato no disponible" : "agrupadas por trámite"} />
            <Metric label="Consultas sin respuesta" value={metricasPendientes ? "—" : sinRespuestaData.length} hint={metricasPendientes ? "Dato no disponible" : "requieren revisión"} />
            <Metric label="Usuarios aprobados" value={usuariosNoDisponibles ? "—" : usuariosAprobados} hint={usuariosNoDisponibles ? "Dato no disponible" : `${usuariosPendientes} pendientes`} />
          </>
        ) : (
          <>
            <Metric label="Mis trámites" value={misTramites.length} hint={`de ${tramites.length} en el sistema`} />
            <Metric label="Publicados" value={misTramites.filter((t) => t.publicado).length} hint="visibles en el chat" />
            <Metric label="Borradores" value={misTramites.filter((t) => !t.publicado).length} hint="aún sin publicar" />
            <Metric label="Trámites totales" value={tramites.length} hint="en toda la plataforma" />
          </>
        )}
      </div>

      {!esSuper && (
        <div className="mt-16">
          <PendingBackend
            title="Métricas de actividad no disponibles para este rol"
            description="En este momento, las métricas detalladas solo están habilitadas para el superusuario. Podés seguir gestionando tus trámites desde la sección correspondiente."
            className="mb-0"
          />
        </div>
      )}

      {esSuper && !loading && (
        <>
          <div className="card mt-10 overflow-hidden sm:mt-16">
            <div className="px-8 py-6 border-b border-line flex flex-wrap items-center justify-between gap-3">
              <h2 className="display-3 text-ink m-0 uppercase">Trámites más consultados</h2>
              <span className="text-xs text-faint font-semibold uppercase tracking-wider">
                {metricasPendientes ? "No disponible" : "Chat"}
              </span>
            </div>
            {metricasPendientes ? (
              <SectionEmpty>No se pudieron cargar las métricas del chat.</SectionEmpty>
            ) : topConsultados.length === 0 ? (
              <SectionEmpty>Todavía no hay consultas registradas.</SectionEmpty>
            ) : (
              <div className="space-y-4 p-5 sm:p-8">
                {topConsultados.map((c) => (
                  <div key={c.tramiteId ?? "null"} className="flex items-center gap-4">
                    <span className="w-40 shrink-0 truncate text-sm text-ink sm:w-64">
                      {c.nombre || (c.tramiteId == null ? "Trámite eliminado" : `Trámite #${c.tramiteId}`)}
                    </span>
                    <span className="flex-1 h-2 rounded-full bg-mist overflow-hidden">
                      <span
                        className="block h-full bg-brand-deep rounded-full"
                        style={{ width: `${Math.max(4, (c.count / maxConsulta) * 100)}%` }}
                      />
                    </span>
                    <span className="w-10 text-right text-sm font-bold tabular-nums text-ink">{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card mt-10 overflow-hidden sm:mt-16">
            <div className="px-8 py-6 border-b border-line flex flex-wrap items-center justify-between gap-3">
              <h2 className="display-3 text-ink m-0 uppercase">Consultas sin respuesta</h2>
              <span className="text-xs text-faint font-semibold uppercase tracking-wider">
                Últimas {sinRespuestaRecientes.length}
              </span>
            </div>
            {sinRespuestaRecientes.length === 0 ? (
              <SectionEmpty>No hay consultas sin respuesta.</SectionEmpty>
            ) : (
              <ul className="m-0 p-0 divide-y divide-line">
                {sinRespuestaRecientes.map((c) => (
                  <li key={c.id} className="px-8 py-5 flex items-start justify-between gap-6">
                    <p className="m-0 min-w-0 break-words text-sm text-ink">{c.textoConsulta || "Consulta sin texto disponible"}</p>
                    <span className="text-xs text-faint shrink-0">{formatDate(c.fecha)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <div className="card mt-16 overflow-hidden">
        <div className="px-8 py-6 border-b border-line flex flex-wrap items-center justify-between gap-3">
          <h2 className="display-3 text-ink m-0 uppercase">Trámites recientes</h2>
          <Link
            to="/admin/tramites"
            className="text-xs text-faint font-semibold uppercase tracking-wider no-underline hover:text-brand-deep transition-colors"
          >
            Ver todos
          </Link>
        </div>
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-shimmer h-5 rounded" />
            ))}
          </div>
        ) : recientes.length === 0 ? (
          <SectionEmpty>Todavía no hay trámites cargados.</SectionEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-faint">
                  <th className="px-8 py-4 font-bold">Trámite</th>
                  <th className="px-8 py-4 font-bold">Sector</th>
                  <th className="px-8 py-4 font-bold">Encargado</th>
                  <th className="px-8 py-4 font-bold">Estado</th>
                  <th className="px-8 py-4 font-bold">Actualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recientes.map((t) => (
                  <tr key={t.id} className="hover:bg-mist/60 transition-colors">
                    <td className="px-8 py-6 text-ink font-semibold">
                      <Link to={`/admin/tramites/${t.id}`} className="no-underline text-ink hover:text-brand-deep transition-colors">
                        {t.nombre}
                      </Link>
                    </td>
                    <td className="px-8 py-6 text-muted">{t.sector?.nombre || "—"}</td>
                    <td className="px-8 py-6 text-muted">{t.encargado?.nombre || "—"}</td>
                    <td className="px-8 py-6">
                      <span
                        className={`inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full ${
                          t.publicado ? "bg-ok/10 text-ok" : "bg-muted/15 text-muted"
                        }`}
                      >
                        {t.publicado ? "Publicado" : "Borrador"}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-muted text-xs">{formatDate(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
