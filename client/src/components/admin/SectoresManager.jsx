import { useEffect, useMemo, useState } from "react";
import { listar, crear, actualizar, eliminar } from "../../services/sectores";
import { apiErrorMessage } from "../../lib/api";
import { useToast } from "../common/Toast";
import Modal from "../common/Modal";
import { PageHeader, EmptyState } from "./ui";
import { TableSkeleton } from "./Skeleton";

const TIPOS = ["MINISTERIO", "SUBSECRETARIA", "DEPARTAMENTO", "ORGANISMO"];

const TIPO_TONE = {
  MINISTERIO: "bg-ink text-paper",
  SUBSECRETARIA: "bg-brand-deep/15 text-brand-deep",
  DEPARTAMENTO: "bg-mist text-muted border border-line",
  ORGANISMO: "bg-emerald-600/15 text-emerald-800 border border-emerald-500/20",
};

function buildTree(list) {
  const byId = new Map(list.map((s) => [s.id, { ...s, children: [] }]));
  const roots = [];
  for (const node of byId.values()) {
    if (node.parentId != null && byId.has(node.parentId)) byId.get(node.parentId).children.push(node);
    else roots.push(node);
  }
  const ordenar = (arr) => {
    arr.sort((a, b) => a.nombre.localeCompare(b.nombre));
    arr.forEach((n) => ordenar(n.children));
  };
  ordenar(roots);
  return roots;
}

function descendientes(id, sectores) {
  const out = new Set();
  const pila = [id];
  while (pila.length) {
    const actual = pila.pop();
    for (const s of sectores) {
      if (s.parentId === actual && !out.has(s.id)) {
        out.add(s.id);
        pila.push(s.id);
      }
    }
  }
  return out;
}

function SectorFormModal({ sector, sectores, onClose, onSaved }) {
  const addToast = useToast();
  const sectorId = sector?.id;
  const esEdicion = Boolean(sectorId);
  const [nombre, setNombre] = useState(sector?.nombre || "");
  const [tipo, setTipo] = useState(sector?.tipo || "MINISTERIO");
  const [parentId, setParentId] = useState(
    sector?.parentId != null ? String(sector.parentId) : ""
  );
  const [saving, setSaving] = useState(false);

  const excluidos = useMemo(() => {
    if (!esEdicion) return new Set();
    const set = descendientes(sectorId, sectores);
    set.add(sectorId);
    return set;
  }, [esEdicion, sectorId, sectores]);

  const opcionesPadre = useMemo(
    () => sectores.filter((s) => !excluidos.has(s.id)),
    [sectores, excluidos]
  );

  async function submit(e) {
    e.preventDefault();
    if (nombre.trim().length < 2) {
      addToast("El nombre debe tener al menos 2 caracteres", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = { nombre: nombre.trim(), tipo, parentId: parentId === "" ? null : Number(parentId) };
      if (esEdicion) await actualizar(sector.id, payload);
      else await crear(payload);
      addToast(esEdicion ? "Sector actualizado" : "Sector creado", "success");
      onSaved?.();
    } catch (err) {
      addToast(apiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in p-4">
      <div className="card card-border w-full max-w-md animate-scale-in">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink m-0">
            {esEdicion ? "Editar sector" : "Nuevo sector"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-mist transition-colors text-muted cursor-pointer bg-transparent border-none"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Nombre *</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input-field"
              placeholder="Ej: Ministerio de Educación"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Tipo</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input-field">
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Depende de</label>
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="input-field">
              <option value="">Sin dependencia (raíz)</option>
              {opcionesPadre.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-xs" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary text-xs" disabled={saving}>
              {saving ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear sector"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Nodo({ node, sectores, onCrearHijo, onEditar, onEliminar, depth }) {
  return (
    <li className="list-none">
      <div
        className="flex items-center gap-2 rounded-lg border border-line bg-soft/40 px-3 py-2 mb-1.5"
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <span className={`inline-block px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded-full shrink-0 ${TIPO_TONE[node.tipo] || TIPO_TONE.DEPARTAMENTO}`}>
          {node.tipo}
        </span>
        <span className="text-xs font-medium text-ink flex-1 min-w-0 truncate">{node.nombre}</span>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onCrearHijo(node)}
            className="px-2 py-1 text-[10px] font-medium text-brand-deep bg-brand-deep/10 rounded-md cursor-pointer hover:bg-brand-deep/20 transition-colors"
          >
            + Subsector
          </button>
          <button
            onClick={() => onEditar(node)}
            className="px-2 py-1 text-[10px] font-medium text-ink bg-mist rounded-md cursor-pointer hover:bg-line transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => onEliminar(node)}
            className="px-2 py-1 text-[10px] font-medium text-bad bg-bad/10 rounded-md cursor-pointer hover:bg-bad/20 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
      {node.children.length > 0 && (
        <ul className="m-0 p-0">
          {node.children.map((c) => (
            <Nodo
              key={c.id}
              node={c}
              sectores={sectores}
              onCrearHijo={onCrearHijo}
              onEditar={onEditar}
              onEliminar={onEliminar}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function SectoresManager() {
  const addToast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sectores, setSectores] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editarSector, setEditarSector] = useState(null);
  const [padreId, setPadreId] = useState(null);
  const [deleteSector, setDeleteSector] = useState(null);

  async function cargar() {
    setLoading(true);
    setError("");
    try {
      const data = await listar();
      setSectores(Array.isArray(data) ? data : []);
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
        setSectores(Array.isArray(data) ? data : []);
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

  const arbol = useMemo(() => buildTree(sectores), [sectores]);

  function abrirNuevo() {
    setEditarSector(null);
    setPadreId(null);
    setFormOpen(true);
  }

  function crearHijo(padre) {
    setEditarSector(null);
    setPadreId(padre.id);
    setFormOpen(true);
  }

  function editar(sector) {
    setEditarSector(sector);
    setPadreId(null);
    setFormOpen(true);
  }

  async function confirmDelete() {
    const sector = deleteSector;
    setDeleteSector(null);
    try {
      await eliminar(sector.id);
      addToast("Sector eliminado", "info");
      await cargar();
    } catch (err) {
      addToast(apiErrorMessage(err), "error");
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Sectores"
        description="Organigrama de dependencias. Se usa para clasificar los trámites."
      >
        <button onClick={abrirNuevo} className="btn-primary flex items-center gap-1.5 text-xs">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo sector
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
        <TableSkeleton rows={4} cols={3} />
      ) : arbol.length === 0 ? (
        <div className="card card-border">
          <EmptyState
            title="Sin sectores"
            description="Creá el primer sector para empezar a organizar la estructura."
            action={
              <button onClick={abrirNuevo} className="btn-primary text-xs">
                Crear sector
              </button>
            }
          />
        </div>
      ) : (
        <div className="card card-border p-5">
          <ul className="m-0 p-0">
            {arbol.map((n) => (
              <Nodo
                key={n.id}
                node={n}
                sectores={sectores}
                onCrearHijo={crearHijo}
                onEditar={editar}
                onEliminar={setDeleteSector}
                depth={0}
              />
            ))}
          </ul>
        </div>
      )}

      {formOpen && (
        <SectorFormModal
          key={editarSector?.id ?? `new-${padreId ?? "root"}`}
          sector={editarSector ?? (padreId != null ? { parentId: padreId } : null)}
          sectores={sectores}
          onClose={() => {
            setFormOpen(false);
            setEditarSector(null);
            setPadreId(null);
          }}
          onSaved={async () => {
            setFormOpen(false);
            setEditarSector(null);
            setPadreId(null);
            await cargar();
          }}
        />
      )}

      <Modal
        open={deleteSector !== null}
        onClose={() => setDeleteSector(null)}
        onConfirm={confirmDelete}
        title="Eliminar sector"
        confirmText="Eliminar"
        confirmDanger
      >
        <p className="m-0">
          ¿Eliminar el sector <strong>{deleteSector?.nombre}</strong>? No se puede si tiene
          trámites asociados.
        </p>
      </Modal>
    </div>
  );
}
