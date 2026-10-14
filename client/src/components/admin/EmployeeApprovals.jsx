import { useEffect, useMemo, useState } from "react";
import { pendientes, aprobar, rechazar } from "../../services/usuarios";
import { apiErrorMessage } from "../../lib/api";
import { useToast } from "../common/Toast";
import Modal from "../common/Modal";
import { PageHeader, StatCard, EmptyState } from "./ui";
import { TableSkeleton } from "./Skeleton";
import { formatDate } from "../../utils/date";

function Icon({ path, className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={path} />
    </svg>
  );
}

function initialsOf(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function EmployeeApprovals() {
  const addToast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [solicitudes, setSolicitudes] = useState([]);
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState(null); // { usuario, accion: 'aprobar' | 'rechazar' }
  const [working, setWorking] = useState(null);

  async function cargar() {
    setLoading(true);
    setError("");
    try {
      const data = await pendientes();
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await pendientes();
        if (!active) return;
        setSolicitudes(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(apiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return solicitudes;
    return solicitudes.filter(
      (s) => s.nombre?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
    );
  }, [solicitudes, query]);

  async function aplicar() {
    if (!confirm) return;
    const { usuario, accion } = confirm;
    setConfirm(null);
    setWorking(usuario.id);
    try {
      if (accion === "aprobar") await aprobar(usuario.id);
      else await rechazar(usuario.id);
      addToast(
        accion === "aprobar" ? `${usuario.nombre} fue aprobado` : `Solicitud de ${usuario.nombre} rechazada`,
        accion === "aprobar" ? "success" : "info"
      );
      await cargar();
    } catch (err) {
      addToast(apiErrorMessage(err), "error");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Solicitudes"
        description="Altas de administradores registradas desde el formulario público. Aprobalas o rechazalas."
      >
        <span className="badge bg-mist text-muted border border-line">
          <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse-dot" />
          {solicitudes.length} pendiente{solicitudes.length === 1 ? "" : "s"}
        </span>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 stagger-children">
        <StatCard
          label="Pendientes"
          value={solicitudes.length}
          tone="warn"
          hint="aguardan tu revisión"
          icon={<Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
        />
        <StatCard
          label="Total mostradas"
          value={filtradas.length}
          tone="brand"
          hint={query ? "según tu búsqueda" : "sin filtros"}
          icon={<Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          {error}
          <button onClick={cargar} className="ml-2 underline cursor-pointer bg-transparent border-none text-bad">
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : (
        <div className="card p-5">
          <div className="relative mb-4 max-w-sm">
            <svg className="w-4 h-4 text-faint absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
            <input
              className="input-field pl-9"
              placeholder="Buscar por nombre o email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar solicitudes"
            />
          </div>

          {filtradas.length === 0 ? (
            <EmptyState
              icon={<Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-10 h-10 mx-auto text-faint" />}
              title={query ? "Sin resultados" : "No hay solicitudes pendientes"}
              description={query ? "Ninguna solicitud coincide con la búsqueda." : "Todo está al día."}
              action={
                query && (
                  <button className="btn-ghost" onClick={() => setQuery("")}>
                    Limpiar búsqueda
                  </button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm min-w-160">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-muted border-y border-line bg-mist/60">
                    <th className="text-left font-semibold px-5 py-3">Solicitante</th>
                    <th className="text-left font-semibold px-5 py-3">Rol</th>
                    <th className="text-left font-semibold px-5 py-3">Registrado</th>
                    <th className="text-right font-semibold px-5 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtradas.map((s) => (
                    <tr key={s.id} className="hover:bg-mist transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-full grid place-items-center text-xs font-bold shrink-0 bg-brand-deep/10 text-brand-deep">
                            {initialsOf(s.nombre)}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate">{s.nombre}</div>
                            <div className="text-xs text-faint truncate">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-brand-deep text-paper">
                          {s.rol}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted">{formatDate(s.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-ok text-paper hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                            onClick={() => setConfirm({ usuario: s, accion: "aprobar" })}
                            disabled={working === s.id}
                          >
                            <Icon path="M5 13l4 4L19 7" className="w-3.5 h-3.5" />
                            Aprobar
                          </button>
                          <button
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-paper text-bad border border-bad/30 hover:bg-bad/10 transition cursor-pointer disabled:opacity-50"
                            onClick={() => setConfirm({ usuario: s, accion: "rechazar" })}
                            disabled={working === s.id}
                          >
                            <Icon path="M6 18L18 6M6 6l12 12" className="w-3.5 h-3.5" />
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[11px] text-faint mt-4 m-0">
            Al aprobar, la cuenta queda habilitada para iniciar sesión. El rechazo es definitivo para esa solicitud.
          </p>
        </div>
      )}

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={aplicar}
        title={confirm?.accion === "aprobar" ? "Aprobar solicitud" : "Rechazar solicitud"}
        confirmText={confirm?.accion === "aprobar" ? "Aprobar" : "Rechazar"}
        confirmDanger={confirm?.accion === "rechazar"}
      >
        {confirm?.accion === "aprobar" ? (
          <p className="m-0">
            ¿Aprobar la cuenta de <strong>{confirm.usuario.nombre}</strong>? Podrá iniciar sesión
            como administrador.
          </p>
        ) : (
          <p className="m-0">
            ¿Rechazar la solicitud de <strong>{confirm?.usuario.nombre}</strong>? La cuenta no podrá
            iniciar sesión.
          </p>
        )}
      </Modal>
    </div>
  );
}
