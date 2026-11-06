import { useEffect, useState } from "react";
import { apiErrorMessage } from "../../lib/api";
import { listarCalificaciones } from "../../services/consultas";
import { listar as listarTramites } from "../../services/tramites";
import { formatDateTime } from "../../utils/date";

const FILTROS_VACIOS = {
  desde: "",
  hasta: "",
  tramiteId: "",
  calificacion: "",
};

function Metric({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-line bg-paper p-5 md:p-6">
      <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-3 mb-0 text-3xl font-extrabold tracking-tight text-ink tabular-nums">{value}</p>
      <p className="mt-2 mb-0 text-xs text-muted">{hint}</p>
    </div>
  );
}

function Breakdown({ title, rows, emptyMessage, keyField, maxValue }) {
  if (!rows.length) {
    return (
      <section className="rounded-xl border border-line bg-paper p-5">
        <h2 className="m-0 text-base font-bold text-ink">{title}</h2>
        <p className="mb-0 mt-3 text-sm text-muted">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-line bg-paper p-5">
      <h2 className="m-0 text-base font-bold text-ink">{title}</h2>
      <ul className="mb-0 mt-4 list-none space-y-4 p-0">
        {rows.map((row) => {
          const value = Number(row.cantidad) || 0;
          const width = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <li key={row[keyField]}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-ink">{row[keyField]}</span>
                <span className="shrink-0 font-semibold tabular-nums text-ink">{value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-mist" aria-hidden="true">
                <div className="h-full rounded-full bg-brand" style={{ width: `${width}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function CalificacionPage() {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [filtrosAplicados, setFiltrosAplicados] = useState({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [report, setReport] = useState(null);
  const [tramites, setTramites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tramitesLoading, setTramitesLoading] = useState(true);
  const [error, setError] = useState("");
  const [tramitesError, setTramitesError] = useState("");
  const [filterError, setFilterError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    listarTramites()
      .then((rows) => {
        if (!active) return;
        if (!Array.isArray(rows)) {
          setTramitesError("El servidor devolvió un formato inesperado para los trámites.");
          return;
        }
        setTramites(rows);
        setTramitesError("");
      })
      .catch((requestError) => {
        if (active) {
          setTramitesError(apiErrorMessage(requestError, "No se pudieron cargar los trámites."));
        }
      })
      .finally(() => {
        if (active) setTramitesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setReport(null);
      try {
        const data = await listarCalificaciones({ ...filtrosAplicados, page, limit });
        if (!active) return;
        if (
          !data?.resumen ||
          !Array.isArray(data.items) ||
          !Array.isArray(data.resumen.porMotivo) ||
          !Array.isArray(data.resumen.porTopico)
        ) {
          setError("El servidor devolvió un formato inesperado para las calificaciones.");
          return;
        }
        setReport(data);
      } catch (requestError) {
        if (active) {
          setError(apiErrorMessage(requestError, "No se pudieron cargar las calificaciones."));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [filtrosAplicados, page, limit, refreshKey]);

  function applyFilters(event) {
    event.preventDefault();
    if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
      setFilterError("La fecha “desde” no puede ser posterior a “hasta”.");
      return;
    }

    setFilterError("");
    const next = {};
    if (filtros.desde) next.desde = filtros.desde;
    if (filtros.hasta) next.hasta = filtros.hasta;
    if (filtros.tramiteId) next.tramiteId = Number(filtros.tramiteId);
    if (filtros.calificacion !== "") next.calificacion = Number(filtros.calificacion);
    setFiltrosAplicados(next);
    setPage(1);
  }

  function clearFilters() {
    setFiltros(FILTROS_VACIOS);
    setFiltrosAplicados({});
    setFilterError("");
    setPage(1);
  }

  const resumen = report?.resumen;
  const total = Number(report?.total ?? resumen?.total) || 0;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const motivos = resumen
    ? [...resumen.porMotivo, { motivo: "Sin motivo", cantidad: resumen.sinMotivo || 0 }]
    : [];
  const maxMotivo = Math.max(0, ...motivos.map((item) => Number(item.cantidad) || 0));
  const topicos = resumen?.porTopico || [];
  const maxTopico = Math.max(0, ...topicos.map((item) => Number(item.cantidad) || 0));
  const satisfaccion = Number.isFinite(resumen?.satisfaccion)
    ? `${resumen.satisfaccion.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`
    : "Sin datos";

  return (
    <div className="max-w-6xl">
      <header className="border-b border-line/70 pb-8">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
          [ Administración · Calidad ]
        </p>
        <h1 className="mt-4 mb-0 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Calificación
        </h1>
        <p className="mt-4 mb-0 max-w-2xl text-base leading-relaxed text-muted">
          Seguimiento de las valoraciones de la ciudadanía para conocer la utilidad de las respuestas y detectar oportunidades de mejora.
        </p>
      </header>

      <form
        onSubmit={applyFilters}
        className="mt-8 grid grid-cols-1 gap-4 rounded-2xl border border-line bg-paper p-5 md:grid-cols-2 md:p-6 xl:grid-cols-5"
      >
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          Desde
          <input
            type="date"
            value={filtros.desde}
            onChange={(event) => setFiltros((previous) => ({ ...previous, desde: event.target.value }))}
            className="min-h-11 rounded-lg border border-line bg-paper px-3 text-sm text-ink"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          Hasta
          <input
            type="date"
            value={filtros.hasta}
            onChange={(event) => setFiltros((previous) => ({ ...previous, hasta: event.target.value }))}
            className="min-h-11 rounded-lg border border-line bg-paper px-3 text-sm text-ink"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          Trámite
          <select
            value={filtros.tramiteId}
            onChange={(event) => setFiltros((previous) => ({ ...previous, tramiteId: event.target.value }))}
            disabled={tramitesLoading || Boolean(tramitesError)}
            className="min-h-11 rounded-lg border border-line bg-paper px-3 text-sm text-ink disabled:opacity-60"
          >
            <option value="">Todos los trámites</option>
            {tramites.map((tramite) => (
              <option key={tramite.id} value={tramite.id}>{tramite.nombre}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-ink">
          Calificación
          <select
            value={filtros.calificacion}
            onChange={(event) => setFiltros((previous) => ({ ...previous, calificacion: event.target.value }))}
            className="min-h-11 rounded-lg border border-line bg-paper px-3 text-sm text-ink"
          >
            <option value="">Todas</option>
            <option value="1">Útil</option>
            <option value="0">No útil</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-brand-deep px-4 text-sm font-semibold text-white transition-colors hover:bg-brand disabled:cursor-wait disabled:opacity-60"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={clearFilters}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-3 text-sm font-semibold text-ink hover:bg-mist disabled:opacity-60"
          >
            Limpiar
          </button>
        </div>
        {(filterError || tramitesError) && (
          <p role="alert" className="m-0 text-sm text-bad md:col-span-2 xl:col-span-5">
            {filterError || `Filtro de trámites: ${tramitesError}`}
          </p>
        )}
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-xs text-muted" role="status" aria-live="polite">
          {loading ? "Cargando calificaciones…" : error ? "No se pudieron actualizar los datos" : `${total} valoraciones en el resultado`}
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

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-bad/30 bg-bad/5 p-4 text-sm text-bad">
          {error}
        </div>
      )}

      <section aria-label="Resumen de calificaciones" className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Valoraciones" value={loading ? "—" : resumen?.total ?? "—"} hint="Total con los filtros aplicados" />
        <Metric label="Respuestas útiles" value={loading ? "—" : resumen?.utiles ?? "—"} hint="Calificaciones positivas" />
        <Metric label="Respuestas no útiles" value={loading ? "—" : resumen?.noUtiles ?? "—"} hint="Calificaciones negativas" />
        <Metric label="Satisfacción" value={loading ? "—" : satisfaccion} hint="Porcentaje de respuestas útiles" />
      </section>

      {!loading && !error && resumen && (
        <>
          <section aria-label="Desglose de calificaciones" className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Breakdown
              title="Motivos de respuestas no útiles"
              rows={motivos.map((item) => ({ ...item, motivo: item.motivo }))}
              emptyMessage="Todavía no hay motivos para mostrar."
              keyField="motivo"
              maxValue={maxMotivo}
            />
            <Breakdown
              title="Consultas por tópico"
              rows={topicos}
              emptyMessage="Todavía no hay tópicos registrados."
              keyField="topico"
              maxValue={maxTopico}
            />
          </section>

          <section className="mt-8 overflow-hidden rounded-2xl border border-line bg-paper">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
              <div>
                <h2 className="m-0 text-lg font-bold text-ink">Opiniones de la ciudadanía</h2>
                <p className="mb-0 mt-1 text-sm text-muted">El resumen incluye todas las coincidencias, no solo esta página.</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted">
                Por página
                <select
                  value={limit}
                  onChange={(event) => {
                    setLimit(Number(event.target.value));
                    setPage(1);
                  }}
                  className="min-h-10 rounded-lg border border-line bg-paper px-2 text-sm text-ink"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>

            {report.items.length === 0 ? (
              <p className="m-0 px-5 py-10 text-center text-sm text-muted">
                No hay calificaciones para los filtros seleccionados.
              </p>
            ) : (
              <ul className="m-0 list-none divide-y divide-line p-0">
                {report.items.map((item) => (
                  <li key={item.id} className="px-5 py-5 md:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="m-0 text-xs text-muted">{formatDateTime(item.fecha) || "Fecha no disponible"}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.calificacion === 1
                          ? "bg-ok/10 text-ok"
                          : "bg-bad/10 text-bad"
                      }`}>
                        {item.calificacion === 1 ? "Útil" : "No útil"}
                      </span>
                    </div>
                    <h3 className="mb-0 mt-3 text-sm font-semibold leading-relaxed text-ink">
                      {item.textoConsulta || "Consulta sin texto"}
                    </h3>
                    {item.respuesta && (
                      <details className="mt-3 text-sm text-muted">
                        <summary className="cursor-pointer font-medium text-brand-deep">Ver respuesta</summary>
                        <p className="mb-0 mt-2 whitespace-pre-wrap leading-relaxed">{item.respuesta}</p>
                      </details>
                    )}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      {item.motivoCalificacion && <span>Motivo: {item.motivoCalificacion}</span>}
                      {item.topico && <span>Tópico: {item.topico}</span>}
                      {item.tramiteId != null && <span>Trámite #{item.tramiteId}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 md:px-6">
              <p className="m-0 text-sm text-muted">
                Página {page} de {pageCount}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={loading || page <= 1}
                  className="min-h-10 rounded-lg border border-line px-3 text-sm font-semibold text-ink hover:bg-mist disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  disabled={loading || page >= pageCount}
                  className="min-h-10 rounded-lg border border-line px-3 text-sm font-semibold text-ink hover:bg-mist disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
