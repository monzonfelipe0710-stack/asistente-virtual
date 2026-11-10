import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import { apiErrorMessage } from "../../lib/api";
import { listarMesas } from "../../services/mesas";
import { roleLabel } from "../../lib/roles";

export default function MesaDeEntrada() {
  const { can, role } = useAdmin();
  const canView = can("mesa_entrada");
  const [mesas, setMesas] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (!canView) return () => { active = false; };

    listarMesas()
      .then((data) => {
        if (!active) return;
        if (!Array.isArray(data)) {
          throw new Error("El servidor devolvió un formato inesperado para las mesas.");
        }
        setMesas(data);
      })
      .catch((requestError) => {
        if (active) setError(apiErrorMessage(requestError, "No se pudieron cargar las mesas."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canView, refreshKey]);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    if (!term) return mesas;
    return mesas.filter((mesa) =>
      [
        mesa.nombre,
        mesa.direccion,
        mesa.localidad,
        mesa.horario,
        mesa.sector?.nombre,
      ].some((value) => String(value || "").toLocaleLowerCase("es").includes(term))
    );
  }, [mesas, query]);

  if (!canView) {
    return (
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-line bg-paper p-8 text-center">
        <h2 className="m-0 text-lg font-bold text-ink">Acceso restringido</h2>
        <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">
          Tu rol actual ({roleLabel(role)}) no tiene permiso para ver las mesas de entrada.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <header className="flex flex-col gap-5 border-b border-line/70 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
            [ Administración · Atención ]
          </p>
          <h1 className="mb-0 mt-4 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
            Mesas de entrada
          </h1>
          <p className="mb-0 mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Puntos de atención registrados en el backend.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setError("");
            setRefreshKey((key) => key + 1);
          }}
          disabled={loading}
          className="btn-ghost shrink-0 disabled:cursor-wait disabled:opacity-50"
        >
          {loading ? "Cargando…" : "Actualizar"}
        </button>
      </header>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm text-muted" role="status" aria-live="polite">
          {loading ? "Cargando mesas…" : `${filtered.length} de ${mesas.length} mesas`}
        </p>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-sm text-ink sm:w-72"
          placeholder="Buscar por nombre, localidad o sector"
          aria-label="Buscar mesas de entrada"
        />
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          {error}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError("");
              setRefreshKey((key) => key + 1);
            }}
            className="ml-2 font-semibold underline"
          >
            Reintentar
          </button>
        </div>
      )}

      <section className="mt-5 overflow-hidden rounded-2xl border border-line bg-paper">
        {loading ? (
          <p className="m-0 px-5 py-10 text-center text-sm text-muted">Cargando mesas…</p>
        ) : !error && filtered.length === 0 ? (
          <p className="m-0 px-5 py-10 text-center text-sm text-muted">
            {mesas.length ? "No hay mesas que coincidan con la búsqueda." : "Todavía no hay mesas registradas."}
          </p>
        ) : (
          <ul className="m-0 list-none divide-y divide-line p-0">
            {filtered.map((mesa) => (
              <li key={mesa.id} className="px-5 py-4 md:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="m-0 text-base font-semibold text-ink">{mesa.nombre}</h2>
                    <p className="mb-0 mt-1 text-sm text-muted">
                      {[mesa.direccion, mesa.localidad].filter(Boolean).join(" · ") || "Dirección no informada"}
                    </p>
                    {mesa.horario && <p className="mb-0 mt-1 text-sm text-muted">Horario: {mesa.horario}</p>}
                    {mesa.sector?.nombre && <p className="mb-0 mt-1 text-xs text-muted">Sector: {mesa.sector.nombre}</p>}
                  </div>
                  <span className="rounded-full bg-mist px-3 py-1 text-xs font-semibold text-muted">
                    {mesa.esGeneral ? "Atención general" : "Por sector"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="mb-0 mt-3 text-xs text-muted">
        La gestión de altas y modificaciones no está habilitada desde esta pantalla.
      </p>
    </div>
  );
}
