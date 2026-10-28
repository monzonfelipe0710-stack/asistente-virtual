import { useEffect, useMemo, useState } from "react";
import { listar, suspender, reactivar } from "../../services/usuarios";
import { apiErrorMessage } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../common/Toast";
import Modal from "../common/Modal";
import NuevoUsuarioModal from "./NuevoUsuarioModal";
import Pagination, { usePagination } from "../common/Pagination";
import { PageHeader, EmptyState } from "./ui";
import { TableSkeleton } from "./Skeleton";
import { formatDate } from "../../utils/date";
import { roleLabel } from "../../lib/roles";
import { downloadCsv } from "../../lib/adminCsv";
import useLocalStorage from "../../hooks/useLocalStorage";

const ESTADOS = ["Todos", "PENDIENTE", "APROBADO", "SUSPENDIDO", "RECHAZADO"];

const ESTADO_META = {
  PENDIENTE: { badge: "bg-warn/10 text-warn", dot: "bg-warn", label: "Pendiente de revisión" },
  APROBADO: { badge: "bg-ok/10 text-ok", dot: "bg-ok", label: "Aprobado" },
  SUSPENDIDO: { badge: "bg-muted/15 text-muted", dot: "bg-muted", label: "Acceso suspendido" },
  RECHAZADO: { badge: "bg-bad/10 text-bad", dot: "bg-bad", label: "Rechazado" },
};

function RoleBadge({ role }) {
  const tone =
    role === "SUPERUSUARIO"
      ? "bg-ink text-paper"
      : role === "ADMINISTRADOR"
        ? "bg-brand-deep text-paper"
        : "bg-mist text-muted border border-line";
  return (
    <span className={`inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full ${tone}`}>
      {roleLabel(role)}
    </span>
  );
}

function EstadoPill({ estado }) {
  const meta = ESTADO_META[estado] || ESTADO_META.PENDIENTE;
  return (
    <span className={`badge ${meta.badge}`} title={meta.label}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${estado === "PENDIENTE" ? "dot-ping" : ""}`} />
      {estado}
    </span>
  );
}

export default function UserTable() {
  const addToast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const preferenceKey = user?.id ?? "anon";
  const [estado, setEstado] = useLocalStorage(`chatap.admin.usuarios.status.${preferenceKey}`, "Todos");
  const [query, setQuery] = useLocalStorage(`chatap.admin.usuarios.query.${preferenceKey}`, "");
  const [confirm, setConfirm] = useState(null);
  const [working, setWorking] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  async function cargar() {
    setLoading(true);
    setError("");
    try {
      const data = await listar();
      setUsuarios(Array.isArray(data) ? data : []);
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
        const data = await listar();
        if (!active) return;
        setUsuarios(Array.isArray(data) ? data : []);
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

  const counts = useMemo(() => {
    const c = { Todos: usuarios.length };
    for (const e of ESTADOS.slice(1)) c[e] = usuarios.filter((u) => u.estado === e).length;
    return c;
  }, [usuarios]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return usuarios.filter((u) => {
      const matchEstado = estado === "Todos" || u.estado === estado;
      const matchQ =
        !q ||
        u.nombre?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);
      return matchEstado && matchQ;
    });
  }, [usuarios, estado, query]);

  const { page, totalPages, paginatedItems, setPage } = usePagination(filtrados, 8);

  async function aplicar() {
    if (!confirm) return;
    const { usuario, accion } = confirm;
    setConfirm(null);
    setWorking(usuario.id);
    try {
      if (accion === "suspender") await suspender(usuario.id);
      else await reactivar(usuario.id);
      addToast(
        accion === "suspender" ? "Usuario suspendido" : "Usuario reactivado",
        accion === "suspender" ? "info" : "success"
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
        title="Usuarios"
        description="Cuentas del sistema. El alta de personal la realiza la administración."
      >
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="btn-primary text-xs"
        >
          Nuevo usuario
        </button>
        <button
          type="button"
          onClick={() => downloadCsv(
            "usuarios.csv",
            ["Nombre", "Correo", "Rol", "Estado", "Registrado"],
            filtrados.map((usuario) => [
              usuario.nombre,
              usuario.email,
              roleLabel(usuario.rol),
              usuario.estado,
              formatDate(usuario.createdAt),
            ])
          )}
          disabled={loading || filtrados.length === 0}
          className="btn-ghost text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          Exportar CSV
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

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {ESTADOS.map((e) => {
          const active = estado === e;
          return (
            <button
              key={e}
              onClick={() => {
                setEstado(e);
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                active
                  ? "bg-brand-deep text-paper border-brand-deep shadow-sm"
                  : "bg-paper text-muted border-line hover:text-ink hover:bg-mist"
              }`}
            >
              {e}
              <span
                className={`min-w-5 h-5 px-1 grid place-items-center rounded-full text-[10px] font-bold tabular-nums ${
                  active ? "bg-paper/20 text-paper" : "bg-mist text-muted"
                }`}
              >
                {counts[e] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : (
        <div className="card card-border overflow-hidden">
          <div className="px-4 py-3 border-b border-line">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre o email…"
              className="input-field max-w-xs text-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-soft/80 text-left text-xs text-muted uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Registrado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paginatedItems.map((u) => {
                  const esUnoMismo = u.id === user?.id;
                  return (
                    <tr key={u.id} className="table-row">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-ink m-0">{u.nombre}</p>
                        <p className="text-[11px] text-muted m-0 mt-0.5">{u.email}</p>
                        {u.dni && (
                          <p className="text-[11px] text-faint m-0 mt-0.5 font-mono">
                            DNI {u.dni}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.rol} />
                      </td>
                      <td className="px-4 py-3">
                        <EstadoPill estado={u.estado} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end items-center gap-2">
                          {u.estado === "APROBADO" && (
                            <button
                              onClick={() => setConfirm({ usuario: u, accion: "suspender" })}
                              disabled={esUnoMismo || working === u.id}
                              title={esUnoMismo ? "No podés suspender tu propia cuenta" : "Suspender acceso"}
                              className="px-2.5 py-1 text-[10px] font-medium text-warn bg-warn/10 rounded-lg cursor-pointer hover:bg-warn/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Suspender
                            </button>
                          )}
                          {u.estado === "SUSPENDIDO" && (
                            <button
                              onClick={() => setConfirm({ usuario: u, accion: "reactivar" })}
                              disabled={working === u.id}
                              className="px-2.5 py-1 text-[10px] font-medium text-ok bg-ok/10 rounded-lg cursor-pointer hover:bg-ok/20 transition-colors disabled:opacity-50"
                            >
                              Reactivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtrados.length === 0 && (
            <EmptyState
              title="Sin usuarios"
              description={query ? "No hay usuarios que coincidan con la búsqueda." : "No hay usuarios en este estado."}
            />
          )}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={aplicar}
        title={confirm?.accion === "suspender" ? "Suspender usuario" : "Reactivar usuario"}
        confirmText={confirm?.accion === "suspender" ? "Suspender" : "Reactivar"}
        confirmDanger={confirm?.accion === "suspender"}
      >
        {confirm?.accion === "suspender" ? (
          <p className="m-0">
            ¿Suspender el acceso de <strong>{confirm.usuario.nombre}</strong>? No podrá iniciar
            sesión hasta que lo reactives.
          </p>
        ) : (
          <p className="m-0">
            ¿Reactivar el acceso de <strong>{confirm?.usuario.nombre}</strong>?
          </p>
        )}
      </Modal>

      {formOpen && (
        <NuevoUsuarioModal
          onClose={() => setFormOpen(false)}
          onSaved={cargar}
        />
      )}
    </div>
  );
}
