import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiErrorMessage } from "../../lib/api";
import { listar as listarTramites } from "../../services/tramites";
import { porTramite, sinRespuesta } from "../../services/metricas";

function Metric({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-line bg-paper p-5 md:p-6">
      <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-3 mb-0 text-3xl font-extrabold tracking-tight text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-2 mb-0 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function SectionMessage({ children }) {
  return <p className="m-0 px-5 py-8 text-sm text-muted">{children}</p>;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tramites, setTramites] = useState([]);
  const [porTramiteData, setPorTramiteData] = useState([]);
  const [sinRespuestaData, setSinRespuestaData] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErrors({});
      setTramites([]);
      setPorTramiteData([]);
      setSinRespuestaData([]);
      const results = await Promise.allSettled([
        listarTramites(),
        porTramite(),
        sinRespuesta(),
      ]);
      if (!active) return;

      const nextErrors = {};
      if (results[0].status === "fulfilled" && Array.isArray(results[0].value)) {
        setTramites(results[0].value);
      } else {
        nextErrors.tramites = results[0].status === "rejected"
          ? apiErrorMessage(results[0].reason, "No se pudieron cargar los trámites.")
          : "El servidor devolvió un formato inesperado.";
      }
      if (results[1].status === "fulfilled" && Array.isArray(results[1].value)) {
        setPorTramiteData(results[1].value);
      } else {
        nextErrors.porTramite = results[1].status === "rejected"
          ? apiErrorMessage(results[1].reason, "No se pudieron cargar las métricas por trámite.")
          : "El servidor devolvió un formato inesperado.";
      }
      if (results[2].status === "fulfilled" && Array.isArray(results[2].value)) {
        setSinRespuestaData(results[2].value);
      } else {
        nextErrors.sinRespuesta = results[2].status === "rejected"
          ? apiErrorMessage(results[2].reason, "No se pudieron cargar las consultas sin respuesta.")
          : "El servidor devolvió un formato inesperado.";
      }
      setErrors(nextErrors);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const totalConsultas = useMemo(
    () => porTramiteData.reduce((total, row) => total + (row?._count?._all || 0), 0),
    [porTramiteData]
  );

  const nombrePorId = useMemo(
    () => new Map(tramites.map((tramite) => [tramite.id, tramite.nombre])),
    [tramites]
  );

  const ranking = useMemo(
    () => [...porTramiteData]
      .map((row) => ({
        id: row.tramiteId ?? "eliminado",
        nombre: row.tramiteId == null
          ? "Trámite eliminado"
          : nombrePorId.get(row.tramiteId) || `Trámite #${row.tramiteId}`,
        cantidad: row?._count?._all || 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad),
    [porTramiteData, nombrePorId]
  );
  const maxConsultas = ranking[0]?.cantidad || 1;

  return (
    <div className="max-w-6xl">
      <header className="border-b border-line/70 pb-8">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
          [ Administración · Información ]
        </p>
        <h1 className="mt-4 mb-0 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Reportes y analíticas
        </h1>
        <p className="mt-4 mb-0 max-w-2xl text-base leading-relaxed text-muted">
          Indicadores obtenidos de la actividad registrada en ChatAP. Los resultados pueden variar según los datos disponibles y los permisos de tu cuenta.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-xs text-muted" aria-live="polite" role="status">
          {loading ? "Actualizando información…" : Object.keys(errors).length > 0 ? "Actualización finalizada con información incompleta" : "Datos actualizados desde el sistema"}
        </p>
        <button
          type="button"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
          className="btn-ghost text-xs disabled:cursor-wait disabled:opacity-50"
        >
          {loading ? "Cargando…" : "Actualizar datos"}
        </button>
      </div>

      {Object.keys(errors).length > 0 && (
        <div role="alert" className="mt-5 rounded-xl border border-warn/40 bg-warn/5 p-4">
          <p className="m-0 text-sm font-semibold text-ink">Parte de la información no está disponible</p>
          <ul className="mt-2 mb-0 list-disc space-y-1 pl-5 text-sm text-muted">
            {errors.tramites && <li>Trámites: {errors.tramites}</li>}
            {errors.porTramite && <li>Métricas por trámite: {errors.porTramite}</li>}
            {errors.sinRespuesta && <li>Consultas sin respuesta: {errors.sinRespuesta}</li>}
          </ul>
        </div>
      )}

      <section aria-label="Resumen de actividad" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric label="Trámites registrados" value={loading ? "—" : errors.tramites ? "—" : tramites.length} hint="Datos del catálogo administrativo" />
        <Metric label="Consultas contabilizadas" value={loading ? "—" : errors.porTramite ? "—" : totalConsultas} hint="Suma de las consultas agrupadas por trámite" />
        <Metric label="Consultas sin respuesta" value={loading ? "—" : errors.sinRespuesta ? "—" : sinRespuestaData.length} hint="Registros devueltos (máximo 50)" />
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-line bg-paper">
        <div className="border-b border-line px-5 py-4 md:px-6">
          <h2 className="m-0 text-lg font-bold text-ink">Trámites más consultados</h2>
          <p className="mt-1 mb-0 text-sm text-muted">Ordenados por la cantidad de consultas registradas.</p>
        </div>
        {loading ? (
          <SectionMessage>Cargando métricas…</SectionMessage>
        ) : errors.porTramite ? (
          <SectionMessage>No se pudo obtener el ranking. Revisá el mensaje de error e intentá actualizar los datos.</SectionMessage>
        ) : ranking.length === 0 ? (
          <SectionMessage>Todavía no hay consultas registradas para generar este informe.</SectionMessage>
        ) : (
          <ol className="m-0 list-none space-y-5 p-5 md:p-6">
            {ranking.slice(0, 10).map((item, index) => (
              <li key={`${item.id}-${index}`} className="flex min-w-0 items-center gap-3">
                <span className="w-5 shrink-0 text-xs font-semibold text-muted">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium text-ink">{item.nombre}</span>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-ink">{item.cantidad}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-mist" role="presentation">
                    <div className="h-full rounded-full bg-brand-deep" style={{ width: `${Math.max(2, (item.cantidad / maxConsultas) * 100)}%` }} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-line bg-paper">
        <div className="border-b border-line px-5 py-4 md:px-6">
          <h2 className="m-0 text-lg font-bold text-ink">Consultas sin respuesta</h2>
          <p className="mt-1 mb-0 text-sm text-muted">Últimos registros que el sistema identificó como no resueltos (hasta 50).</p>
        </div>
        {loading ? (
          <SectionMessage>Cargando consultas…</SectionMessage>
        ) : errors.sinRespuesta ? (
          <SectionMessage>No se pudieron cargar las consultas sin respuesta. Podés volver a intentarlo con “Actualizar datos”.</SectionMessage>
        ) : sinRespuestaData.length === 0 ? (
          <SectionMessage>No hay consultas sin respuesta registradas.</SectionMessage>
        ) : (
          <ul className="m-0 list-none divide-y divide-line p-0">
            {sinRespuestaData.slice(0, 20).map((item) => (
              <li key={item.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between md:px-6">
                <p className="m-0 min-w-0 whitespace-pre-wrap break-words text-sm text-ink">{item.textoConsulta || "Consulta sin texto disponible"}</p>
                <time className="shrink-0 text-xs text-muted" dateTime={item.fecha && !Number.isNaN(Date.parse(item.fecha)) ? item.fecha : undefined}>
                  {item.fecha && !Number.isNaN(Date.parse(item.fecha))
                    ? new Date(item.fecha).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })
                    : "Fecha no disponible"}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8">
        <Link to="/admin" className="text-sm font-semibold text-brand-deep no-underline hover:underline">
          ← Volver al panel
        </Link>
      </div>
    </div>
  );
}
