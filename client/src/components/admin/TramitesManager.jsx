import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listar, eliminar, publicar, despublicar } from "../../services/tramites";
import { listar as listarSectores } from "../../services/sectores";
import { apiErrorMessage } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../common/Toast";
import Modal from "../common/Modal";
import Pagination, { usePagination } from "../common/Pagination";
import { EmptyState, PageHeader } from "./ui";
import { TableSkeleton } from "./Skeleton";
import { formatDate } from "../../utils/date";
import TramiteFormModal from "./TramiteFormModal";
import { downloadCsv } from "../../lib/adminCsv";
import useLocalStorage from "../../hooks/useLocalStorage";

function formatCosto(costo) {
  if (costo == null || costo === "") return "—";
  const n = Number(costo);
  if (!Number.isFinite(n)) return "—";
  return `$ ${n.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
}

export default function TramitesManager() {
  const addToast = useToast();
  const { user, isSuperadmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tramites, setTramites] = useState([]);
  const [sectores, setSectores] = useState([]);
  const preferenceKey = user?.id ?? "anon";
  const [query, setQuery] = useLocalStorage(`chatap.admin.tramites.query.${preferenceKey}`, "");
  const [soloMios, setSoloMios] = useLocalStorage(`chatap.admin.tramites.mine.${preferenceKey}`, !isSuperadmin);
  const [filterStatus, setFilterStatus] = useLocalStorage(`chatap.admin.tramites.status.${preferenceKey}`, "todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editar, setEditar] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [working, setWorking] = useState(null);

  async function cargar() {
    setLoading(true);
    setError("");
    try {
      const [t, s] = await Promise.all([listar(), listarSectores()]);
      setTramites(Array.isArray(t) ? t : []);
      setSectores(Array.isArray(s) ? s : []);
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
        const [t, s] = await Promise.all([listar(), listarSectores()]);
        if (!active) return;
        setTramites(Array.isArray(t) ? t : []);
        setSectores(Array.isArray(s) ? s : []);
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

  const userId = user?.id;
  const filtrados = useMemo(() => {
    let list = tramites;
    if (soloMios && userId != null) {
      list = list.filter((t) => t.encargado?.id === userId);
    }
    if (filterStatus !== "todos") {
      list = list.filter((t) => (filterStatus === "publicados" ? t.publicado : !t.publicado));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.nombre?.toLowerCase().includes(q) ||
          t.sector?.nombre?.toLowerCase().includes(q) ||
          t.encargado?.nombre?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }, [tramites, soloMios, filterStatus, query, userId]);

  const { page, totalPages, paginatedItems, setPage } = usePagination(filtrados, 8);

  async function togglePublicado(t) {
    setWorking(t.id);
    try {
      if (t.publicado) await despublicar(t.id);
      else await publicar(t.id);
      addToast(t.publicado ? "Trámite despublicado" : "Trámite publicado", "success");
      await cargar();
    } catch (err) {
      addToast(apiErrorMessage(err), "error");
    } finally {
      setWorking(null);
    }
  }

  async function confirmDelete() {
    const id = deleteId;
    setDeleteId(null);
    setWorking(id);
    try {
      await eliminar(id);
      addToast("Trámite eliminado", "info");
      await cargar();
    } catch (err) {
      addToast(apiErrorMessage(err), "error");
    } finally {
      setWorking(null);
    }
  }

  function abrirNuevo() {
    setEditar(null);
    setFormOpen(true);
  }

  function abrirEditar(t) {
    setEditar(t);
    setFormOpen(true);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Trámites"
        description="Creá, editá y publicá los trámites de tu sector. Solo los publicados aparecen en el chat."
      >
        <button
          type="button"
          onClick={() => downloadCsv(
            "tramites.csv",
            ["Trámite", "Sector", "Encargado", "Costo", "Estado", "Actualizado"],
            filtrados.map((tramite) => [
              tramite.nombre,
              tramite.sector?.nombre,
              tramite.encargado?.nombre,
              formatCosto(tramite.costo),
              tramite.publicado ? "Publicado" : "Borrador",
              formatDate(tramite.updatedAt),
            ])
          )}
          disabled={loading || filtrados.length === 0}
          className="btn-ghost text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          Exportar CSV
        </button>
        <button onClick={abrirNuevo} className="btn-primary flex items-center gap-1.5 text-xs">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo trámite
        </button>
      </PageHeader>

      {error && (
        <div className="mb-4 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">
          {error}
          <button onClick={cargar} className="ml-2 underline cursor-pointer bg-transparent border-none text-bad">
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="card card-border overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-line">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre, sector o encargado…"
              className="input-field max-w-xs text-sm"
            />
            <div className="flex flex-wrap items-center gap-3">
              <select
                aria-label="Filtrar trámites por estado"
                value={filterStatus}
                onChange={(event) => {
                  setFilterStatus(event.target.value);
                  setPage(1);
                }}
                className="input-field py-2! text-xs"
              >
                <option value="todos">Todos los estados</option>
                <option value="publicados">Publicados</option>
                <option value="borradores">Borradores</option>
              </select>
              <span className="text-xs text-muted">{filtrados.length} trámites</span>
              {!isSuperadmin && (
                <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={soloMios}
                    onChange={(e) => {
                      setSoloMios(e.target.checked);
                      setPage(1);
                    }}
                  />
                  Solo míos
                </label>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-soft/80 text-left text-xs text-muted uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Trámite</th>
                  <th className="px-4 py-3 font-semibold">Sector</th>
                  {!soloMios && <th className="px-4 py-3 font-semibold">Encargado</th>}
                  <th className="px-4 py-3 font-semibold">Costo</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Actualizado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paginatedItems.map((t) => (
                  <tr key={t.id} className="table-row">
                    <td className="px-4 py-3 max-w-xs">
                      <Link
                        to={`/admin/tramites/${t.id}`}
                        className="text-xs font-medium text-ink no-underline hover:text-brand-deep"
                      >
                        {t.nombre}
                      </Link>
                      {t.descripcion && (
                        <p className="text-[10px] text-muted m-0 mt-0.5 line-clamp-1">{t.descripcion}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{t.sector?.nombre || "—"}</td>
                    {!soloMios && <td className="px-4 py-3 text-xs text-muted">{t.encargado?.nombre || "—"}</td>}
                    <td className="px-4 py-3 text-xs text-muted">{formatCosto(t.costo)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${t.publicado ? "bg-ok/10 text-ok" : "bg-muted/10 text-muted"}`}
                      >
                        {t.publicado ? "Publicado" : "Borrador"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate(t.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => abrirEditar(t)}
                          className="px-2.5 py-1 text-[10px] font-medium text-brand-deep bg-brand-deep/10 rounded-lg cursor-pointer hover:bg-brand-deep/20 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => togglePublicado(t)}
                          disabled={working === t.id}
                          className="px-2.5 py-1 text-[10px] font-medium text-ink bg-mist rounded-lg cursor-pointer hover:bg-line transition-colors disabled:opacity-50"
                        >
                          {t.publicado ? "Despublicar" : "Publicar"}
                        </button>
                        <button
                          onClick={() => setDeleteId(t.id)}
                          className="px-2.5 py-1 text-[10px] font-medium text-bad bg-bad/10 rounded-lg cursor-pointer hover:bg-bad/20 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtrados.length === 0 && (
            <EmptyState
              title="Sin trámites"
              description={
                query
                  ? "No hay trámites que coincidan con la búsqueda."
                  : filterStatus !== "todos"
                    ? `No hay trámites ${filterStatus === "publicados" ? "publicados" : "en borrador"}.`
                    : "Todavía no creaste trámites. Empezá con “Nuevo trámite”."
              }
            />
          )}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {formOpen && (
        <TramiteFormModal
          tramite={editar}
          sectores={sectores}
          onClose={() => {
            setFormOpen(false);
            setEditar(null);
          }}
          onSaved={async () => {
            setFormOpen(false);
            setEditar(null);
            await cargar();
          }}
        />
      )}

      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Eliminar trámite"
        confirmText="Eliminar"
        confirmDanger
      >
        <p className="m-0">
          ¿Seguro que querés eliminar este trámite? Se borran también sus documentos y no se puede
          deshacer.
        </p>
      </Modal>
    </div>
  );
}
