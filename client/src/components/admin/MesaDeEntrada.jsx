import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import { roleLabel } from "../../lib/roles";

const STORAGE_KEY = "chatap.mesa-entrada.expedientes.v1";
const STATUSES = ["Recibido", "En revisión", "En trámite", "Resuelto", "Archivado"];

function readExpedientes() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function nextNumber(items) {
  const year = new Date().getFullYear();
  const max = items.reduce((current, item) => {
    const match = String(item.numero || "").match(/ME-(\d+)-\d{4}/);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);
  return `ME-${String(max + 1).padStart(5, "0")}-${year}`;
}

export default function MesaDeEntrada() {
  const { can, role } = useAdmin();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [formError, setFormError] = useState("");
  const [draft, setDraft] = useState({ remitente: "", documento: "", asunto: "", area: "", observaciones: "" });

  useEffect(() => {
    setItems(readExpedientes());
  }, []);

  function persist(next) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setItems(next);
      setStorageError("");
      return true;
    } catch {
      setStorageError("No se pudieron guardar los cambios en este navegador. Revisá el espacio disponible y volvé a intentar.");
      return false;
    }
  }

  function crearExpediente(event) {
    event.preventDefault();
    setFormError("");
    if (!draft.remitente.trim() || !draft.asunto.trim()) {
      setFormError("Completá el nombre del remitente y el asunto para continuar.");
      return;
    }
    const now = new Date().toISOString();
    const item = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      numero: nextNumber(items),
      remitente: draft.remitente.trim(),
      documento: draft.documento.trim(),
      asunto: draft.asunto.trim(),
      area: draft.area.trim(),
      observaciones: draft.observaciones.trim(),
      estado: "Recibido",
      creadoEn: now,
      actualizadoEn: now,
      origen: "local",
    };
    if (persist([item, ...items])) {
      setDraft({ remitente: "", documento: "", asunto: "", area: "", observaciones: "" });
      setShowForm(false);
    }
  }

  function cambiarEstado(item, estado) {
    const next = items.map((current) => current.id === item.id
      ? { ...current, estado, actualizadoEn: new Date().toISOString() }
      : current);
    persist(next);
  }

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return items.filter((item) => {
      const matchesStatus = statusFilter === "Todos" || item.estado === statusFilter;
      const matchesQuery = !term || [item.numero, item.remitente, item.documento, item.asunto, item.area]
        .some((value) => String(value || "").toLocaleLowerCase("es").includes(term));
      return matchesStatus && matchesQuery;
    });
  }, [items, query, statusFilter]);

  if (!can("mesa_entrada")) {
    return (
      <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-line bg-paper p-8 text-center">
        <div className="mb-3 text-3xl" aria-hidden="true">🔒</div>
        <h2 className="m-0 text-lg font-bold text-ink">Acceso restringido</h2>
        <p className="mt-2 mb-0 text-sm leading-relaxed text-muted">
          Tu rol actual ({roleLabel(role)}) no tiene permiso para gestionar la Mesa de Entradas. Contactá a un administrador si necesitás acceso.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <header className="flex flex-col gap-5 border-b border-line/70 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.22em] text-muted">[ Administración · Expedientes ]</p>
          <h1 className="mt-4 mb-0 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">Mesa de Entradas</h1>
          <p className="mt-4 mb-0 max-w-2xl text-base leading-relaxed text-muted">Registrá ingresos, consultá los expedientes cargados y actualizá su seguimiento.</p>
        </div>
        <button type="button" onClick={() => { setFormError(""); setShowForm((value) => !value); }} className="btn-primary shrink-0">
          {showForm ? "Cancelar" : "+ Nuevo expediente"}
        </button>
      </header>

      <div className="mt-5 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
        <strong>Modo local del navegador.</strong> Los registros se guardan en este dispositivo y navegador; todavía no se sincronizan con el servidor ni constituyen expedientes oficiales compartidos. No cargues información sensible hasta habilitar esa integración.
      </div>

      {storageError && <div role="alert" className="mt-4 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">{storageError}</div>}

      {showForm && (
        <form onSubmit={crearExpediente} className="mt-6 rounded-2xl border border-line bg-paper p-5 md:p-7">
          <h2 className="m-0 text-xl font-bold text-ink">Registrar ingreso</h2>
          <p className="mt-2 mb-6 text-sm text-muted">Completá los datos básicos para crear un registro local.</p>
          {formError && <p role="alert" className="mb-4 rounded-lg bg-bad/5 px-3 py-2 text-sm text-bad">{formError}</p>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-ink">Remitente <span className="text-bad">*</span>
              <input required maxLength={160} value={draft.remitente} onChange={(e) => setDraft({ ...draft, remitente: e.target.value })} className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-normal" placeholder="Nombre y apellido o institución" />
            </label>
            <label className="text-sm font-semibold text-ink">Documento / referencia
              <input maxLength={80} value={draft.documento} onChange={(e) => setDraft({ ...draft, documento: e.target.value })} className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-normal" placeholder="DNI o referencia (opcional)" />
            </label>
            <label className="text-sm font-semibold text-ink md:col-span-2">Asunto <span className="text-bad">*</span>
              <input required maxLength={240} value={draft.asunto} onChange={(e) => setDraft({ ...draft, asunto: e.target.value })} className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-normal" placeholder="Motivo de la presentación" />
            </label>
            <label className="text-sm font-semibold text-ink">Área de destino
              <input maxLength={120} value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2.5 font-normal" placeholder="Área o dependencia" />
            </label>
            <label className="text-sm font-semibold text-ink">Observaciones
              <textarea maxLength={1000} rows={3} value={draft.observaciones} onChange={(e) => setDraft({ ...draft, observaciones: e.target.value })} className="mt-2 w-full resize-y rounded-lg border border-line bg-paper px-3 py-2.5 font-normal" placeholder="Información adicional (opcional)" />
            </label>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
            <button type="submit" className="btn-primary">Crear registro</button>
          </div>
        </form>
      )}

      <section className="mt-7 overflow-hidden rounded-2xl border border-line bg-paper">
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div>
            <h2 className="m-0 text-lg font-bold text-ink">Registros de ingreso</h2>
            <p className="mt-1 mb-0 text-sm text-muted">{items.length} {items.length === 1 ? "registro guardado" : "registros guardados"} en este navegador</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input aria-label="Buscar expedientes" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 rounded-lg border border-line bg-paper px-3 py-2 text-sm sm:w-64" placeholder="Buscar por número, remitente…" />
            <select aria-label="Filtrar por estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-line bg-paper px-3 py-2 text-sm">
              {["Todos", ...STATUSES].map((status) => <option key={status} value={status}>{status === "Todos" ? "Todos los estados" : status}</option>)}
            </select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="text-3xl" aria-hidden="true">▤</div>
            <h3 className="mt-3 mb-0 text-base font-bold text-ink">{items.length ? "No hay resultados para esos filtros" : "Todavía no hay ingresos registrados"}</h3>
            <p className="mt-2 mb-0 text-sm text-muted">{items.length ? "Probá con otra búsqueda o estado." : "Usá «Nuevo expediente» para registrar el primer ingreso local."}</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {filtered.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between md:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-deep">{item.numero}</span>
                    <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-semibold text-muted">{item.estado}</span>
                  </div>
                  <h3 className="mt-2 mb-0 break-words text-base font-bold text-ink">{item.asunto}</h3>
                  <p className="mt-1 mb-0 text-sm text-muted">{item.remitente}{item.documento ? ` · ${item.documento}` : ""}</p>
                  {item.area && <p className="mt-1 mb-0 text-sm text-muted">Destino: {item.area}</p>}
                  {item.observaciones && <p className="mt-2 mb-0 whitespace-pre-wrap break-words text-sm text-muted">{item.observaciones}</p>}
                  <p className="mt-2 mb-0 text-xs text-muted">Creado: {new Date(item.creadoEn).toLocaleString("es-AR")}</p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-ink">
                  Estado
                  <select value={item.estado} onChange={(e) => cambiarEstado(item, e.target.value)} className="rounded-lg border border-line bg-paper px-3 py-2 text-sm">
                    {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
