import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import { useToast } from "../common/Toast";
import {
  initialMesaEntradas,
  createMesaEntrada,
  peekNextMesaId,
  mesaStatuses,
  mesaPriorities,
  mesaTipoDocumento,
  mesaDependencias,
} from "../../data/mockMesaEntrada";
import {
  PageHeader,
  StatCard,
  StatusPill,
  PriorityDot,
  EmptyState,
} from "./ui";
import { formatDate } from "../../utils/date";

function Icon({ path }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={path} />
    </svg>
  );
}

export default function MesaDeEntrada() {
  const { can, role } = useAdmin();
  const push = useToast();
  const [items, setItems] = useState(initialMesaEntradas);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [justAdded, setJustAdded] = useState(null);

  const allowed = can("mesa_entrada");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const matchQ =
        !q ||
        it.solicitante.toLowerCase().includes(q) ||
        it.asunto.toLowerCase().includes(q) ||
        it.id.toLowerCase().includes(q);
      const matchS = filterStatus === "todos" || it.estado === filterStatus;
      return matchQ && matchS;
    });
  }, [items, query, filterStatus]);

  const stats = useMemo(
    () => ({
      total: items.length,
      proceso: items.filter((i) => i.estado === "En proceso").length,
      observado: items.filter((i) => i.estado === "Observado").length,
      finalizado: items.filter((i) => i.estado === "Finalizado").length,
    }),
    [items]
  );

  if (!allowed) {
    return (
      <div className="card p-10 text-center max-w-lg mx-auto mt-10 animate-scale-in">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-lg font-bold text-ink m-0">Acceso restringido</h2>
        <p className="text-sm text-muted mt-2">
          Tu rol actual (<span className="font-semibold">{role}</span>) no tiene permiso para
          gestionar la Mesa de Entradas. Contactá a un Administrador.
        </p>
      </div>
    );
  }

  function handleCreate(values) {
    const entry = createMesaEntrada(values);
    setItems((prev) => [entry, ...prev]);
    setJustAdded(entry.id);
    push(`Ingreso ${entry.id} registrado en Mesa de Entradas.`, "success");
    setTimeout(() => setJustAdded(null), 2000);
  }

  function changeStatus(id, estado) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, estado } : it)));
    setDetail((prev) => (prev && prev.id === id ? { ...prev, estado } : prev));
    push(`Ingreso ${id} → estado "${estado}".`, "info");
  }

  return (
    <div>
      <PageHeader
        title="Mesa de Entradas"
        description="Registrá y dale seguimiento a los ingresos de trámites y expedientes."
      >
        <button className="btn-primary" onClick={() => setFormOpen(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Registrar ingreso
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
        <StatCard
          label="Ingresos totales"
          value={stats.total}
          tone="brand"
          icon={<Icon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}
        />
        <StatCard
          label="En proceso"
          value={stats.proceso}
          tone="warn"
          hint="requieren atención"
          icon={<Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
        />
        <StatCard
          label="Observados"
          value={stats.observado}
          tone="bad"
          hint="pendientes de corrección"
          icon={<Icon path="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />}
        />
        <StatCard
          label="Finalizados"
          value={stats.finalizado}
          tone="ok"
          hint="completados"
          icon={<Icon path="M5 13l4 4L19 7" />}
        />
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-55">
            <svg className="w-4 h-4 text-faint absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
            <input
              className="input-field pl-9"
              placeholder="Buscar por solicitante, asunto o nº…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["todos", ...mesaStatuses].map((s) => {
              const active = filterStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    active
                      ? "bg-brand-deep text-paper border-brand-deep"
                      : "bg-paper text-muted border-line hover:text-ink hover:bg-mist"
                  }`}
                >
                  {s === "todos" ? "Todos" : s}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="🗂️"
            title="Sin ingresos para mostrar"
            description="No hay registros que coincidan con la búsqueda o el filtro seleccionado."
            action={
              <button className="btn-primary" onClick={() => setFormOpen(true)}>
                Registrar ingreso
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-muted border-b border-line">
                  <th className="text-left font-semibold px-5 py-3">Nº</th>
                  <th className="text-left font-semibold px-5 py-3">Solicitante</th>
                  <th className="text-left font-semibold px-5 py-3">Tipo</th>
                  <th className="text-left font-semibold px-5 py-3">Dependencia</th>
                  <th className="text-left font-semibold px-5 py-3">Prioridad</th>
                  <th className="text-left font-semibold px-5 py-3">Estado</th>
                  <th className="text-left font-semibold px-5 py-3">Fecha</th>
                  <th className="text-right font-semibold px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((it) => (
                  <tr
                    key={it.id}
                    onClick={() => setDetail(it)}
                    className={`table-row hover:bg-mist cursor-pointer transition-colors ${
                      justAdded === it.id ? "row-new" : ""
                    }`}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-muted">{it.id}</td>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-ink">{it.solicitante}</div>
                      <div className="text-xs text-faint truncate max-w-50">{it.asunto}</div>
                    </td>
                    <td className="px-5 py-3 text-muted">{it.tipo}</td>
                    <td className="px-5 py-3 text-muted">{it.dependencia}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-2 text-muted">
                        <PriorityDot priority={it.prioridad} />
                        {it.prioridad}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={it.estado} />
                    </td>
                    <td className="px-5 py-3 text-muted whitespace-nowrap">{formatDate(it.fecha)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        className="text-xs font-semibold text-brand hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetail(it);
                        }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <MesaFormModal onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
      )}

      {detail && (
        <MesaDetailModal
          entry={detail}
          onClose={() => setDetail(null)}
          onChangeStatus={(estado) => changeStatus(detail.id, estado)}
        />
      )}
    </div>
  );
}

function MesaFormModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    solicitante: "",
    tipo: mesaTipoDocumento[0],
    dependencia: "Mesa de Entradas",
    prioridad: "Normal",
    asunto: "",
    observaciones: "",
  });
  const [errors, setErrors] = useState({});
  const [shake, setShake] = useState(false);
  const [adjuntos, setAdjuntos] = useState([]);
  const [closing, setClosing] = useState(false);
  const maxAsunto = 120;
  const previewId = peekNextMesaId();
  const today = formatDate(new Date());
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.max(72, el.scrollHeight);
    el.style.height = `${nextHeight}px`;
  }, [form.observaciones]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function togglePrioridad(p) {
    update("prioridad", p);
  }

  function handleAddFiles() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const selected = Array.from(e.target.files || []);
    setAdjuntos((prev) => [...prev, ...selected]);
    e.target.value = "";
  }

  function removeFile(i) {
    setAdjuntos((a) => a.filter((_, idx) => idx !== i));
  }

  function handleClose() {
    setClosing(true);
    setTimeout(() => onClose(), 220);
  }

  function submit(e) {
    e.preventDefault();
    const next = {};
    if (!form.solicitante.trim()) next.solicitante = "El solicitante es obligatorio.";
    if (!form.asunto.trim()) next.asunto = "El asunto es obligatorio.";
    setErrors(next);
    if (Object.keys(next).length) {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      return;
    }
    onSubmit({ ...form, adjuntos });
    setClosing(true);
    setTimeout(() => onClose(), 220);
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 ${closing ? "animate-fade-out" : "animate-fade-in"}`}>
      <div className={`card w-full max-w-205 p-0 ${closing ? "animate-scale-out" : "animate-scale-in"} shadow-2xl ${shake ? "animate-shake" : ""}`}>
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand/10 text-brand">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink m-0 leading-tight">Registrar ingreso</h2>
              <p className="text-[10px] text-muted mt-0.5 m-0">Completá los datos del trámite</p>
            </div>
          </div>
          <button className="flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-ink hover:bg-mist transition-colors" onClick={handleClose} aria-label="Cerrar">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-2 bg-soft border-b border-line">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-muted m-0">Nº de expediente</p>
                <p className="text-xs font-bold text-brand-deep font-mono m-0 tracking-wide">{previewId}</p>
              </div>
            </div>
            <div className="h-6 w-px bg-line" />
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-muted m-0">Fecha</p>
                <p className="text-xs font-semibold text-ink m-0">{today}</p>
              </div>
            </div>
          </div>
        </div>

        <form className="p-4 grid grid-cols-2 gap-x-4 gap-y-2" onSubmit={submit}>
          <div>
            <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted mb-0.5">
              <svg className="w-3 h-3 text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Solicitante
            </label>
            <input
              className={`input-field ${errors.solicitante ? "border-bad focus:border-bad ring-bad/15" : ""}`}
              value={form.solicitante}
              onChange={(e) => update("solicitante", e.target.value)}
              placeholder="Nombre y apellido"
            />
            {errors.solicitante && <p className="text-[10px] text-bad mt-0.5 font-medium">{errors.solicitante}</p>}
          </div>

          <div>
            <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted mb-0.5">
              <svg className="w-3 h-3 text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Asunto
            </label>
            <input
              className={`input-field ${errors.asunto ? "border-bad focus:border-bad ring-bad/15" : ""}`}
              value={form.asunto}
              maxLength={maxAsunto}
              onChange={(e) => update("asunto", e.target.value)}
              placeholder="Motivo del ingreso"
            />
            <div className="flex justify-between mt-0.5">
              {errors.asunto ? (
                <p className="text-[10px] text-bad font-medium">{errors.asunto}</p>
              ) : (
                <span />
              )}
              <span className="text-[9px] text-faint tabular-nums">{form.asunto.length}/{maxAsunto}</span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted mb-0.5">
              <svg className="w-3 h-3 text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Tipo
            </label>
            <select className="input-field" value={form.tipo} onChange={(e) => update("tipo", e.target.value)}>
              {mesaTipoDocumento.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted mb-0.5">
              <svg className="w-3 h-3 text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Prioridad
            </label>
            <div className="grid grid-cols-3 gap-1">
              {mesaPriorities.map((p) => {
                const active = form.prioridad === p;
                const tone =
                  p === "Alta" ? "bg-bad/12 text-bad border-bad/30" : p === "Baja" ? "bg-muted/12 text-muted border-muted/30" : "bg-brand/12 text-brand border-brand/30";
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePrioridad(p)}
                    className={`px-1.5 py-1.5 text-[10px] font-bold rounded-md border transition-all ${
                      active ? `${tone} shadow-sm` : "border-line text-muted hover:bg-mist bg-paper"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted mb-0.5">
              <svg className="w-3 h-3 text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Dependencia destino
            </label>
            <select className="input-field" value={form.dependencia} onChange={(e) => update("dependencia", e.target.value)}>
              {mesaDependencias.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted mb-0.5">
              <svg className="w-3 h-3 text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Observaciones
            </label>
            <textarea
              ref={textareaRef}
              className="input-field min-h-13 resize-none leading-relaxed"
              style={{ overflowY: "hidden", transition: "height 0.2s ease-out" }}
              value={form.observaciones}
              onChange={(e) => update("observaciones", e.target.value)}
              placeholder="Notas adicionales (opcional)"
            />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted mb-0.5">
              <svg className="w-3 h-3 text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 000 2.828l6.586 6.586a2 2 0 002.828 0l6.586-6.586a2 2 0 000-2.828l-6.586-6.586a2 2 0 00-2.828 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15l-3-3m0 0l3-3m-3 3h9" />
              </svg>
              Documentación adjunta
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={handleAddFiles}
              className="w-full border-2 border-dashed border-line rounded-lg py-2.5 text-xs text-muted hover:border-brand hover:text-brand transition-colors flex flex-col items-center gap-1 bg-soft/50 hover:bg-brand/5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 4v12m0-12l-4 4m4-4l4 4M4 20h16" />
              </svg>
              <span className="font-medium">Tocar para adjuntar archivos</span>
            </button>
            {adjuntos.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {adjuntos.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] text-muted bg-mist rounded-lg px-2.5 py-1.5 border border-line">
                    <svg className="w-3.5 h-3.5 text-brand shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="truncate flex-1 font-medium text-ink">{f.name}</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-faint hover:text-bad transition-colors p-0.5 rounded hover:bg-bad/10" aria-label="Quitar">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="col-span-2 flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={handleClose} className="btn-ghost py-1.5! px-3! text-xs!">
              Cancelar
            </button>
            <button type="submit" className="btn-primary py-1.5! px-3! text-xs!">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardar ingreso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_ORDER = ["Ingresado", "En proceso", "Observado", "Finalizado"];

function MesaDetailModal({ entry, onClose, onChangeStatus }) {
  const currentIdx = STATUS_ORDER.indexOf(entry.estado);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 animate-fade-in">
      <div className="card w-full max-w-lg p-6 animate-scale-in">
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink m-0 truncate">{entry.solicitante}</h2>
            <p className="text-xs font-mono text-muted mt-0.5">{entry.id}</p>
          </div>
          <button className="text-muted hover:text-ink" onClick={onClose} aria-label="Cerrar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <StatusPill status={entry.estado} />
          <span className="text-xs text-faint">·</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <PriorityDot priority={entry.prioridad} />
            Prioridad {entry.prioridad}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <Field label="Asunto" value={entry.asunto} />
          <Field label="Tipo" value={entry.tipo} />
          <Field label="Dependencia" value={entry.dependencia} />
          <Field label="Fecha" value={formatDate(entry.fecha)} />
          {entry.observaciones && (
            <div className="col-span-2">
              <Field label="Observaciones" value={entry.observaciones} />
            </div>
          )}
        </dl>

        <div className="mt-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-faint mb-2">
            Progreso del expediente
          </p>
          <div className="flex items-center gap-1">
            {STATUS_ORDER.map((s, i) => {
              const done = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={s} className="flex-1 flex items-center gap-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={`w-3.5 h-3.5 rounded-full transition-colors ${
                        isCurrent ? "bg-brand-deep ring-4 ring-brand-deep/20" : done ? "bg-brand-deep/60" : "bg-line"
                      }`}
                    />
                    <span className={`text-[9px] text-center leading-tight ${isCurrent ? "text-brand-deep font-semibold" : "text-faint"}`}>
                      {s}
                    </span>
                  </div>
                  {i < STATUS_ORDER.length - 1 && (
                    <div className={`h-0.5 flex-1 rounded ${done ? "bg-brand-deep/50" : "bg-line"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-faint mb-2">
            Cambiar estado
          </p>
          <div className="flex flex-wrap gap-2">
            {mesaStatuses.map((s) => {
              const active = entry.estado === s;
              const tone =
                s === "Finalizado" ? "ok" : s === "Observado" ? "bad" : s === "En proceso" ? "warn" : "info";
              const activeCls =
                tone === "ok"
                  ? "bg-ok text-paper border-ok"
                  : tone === "bad"
                  ? "bg-bad text-paper border-bad"
                  : tone === "warn"
                  ? "bg-warn text-paper border-warn"
                  : "bg-info text-paper border-info";
              return (
                <button
                  key={s}
                  onClick={() => onChangeStatus(s)}
                  className={`badge cursor-pointer border transition-all ${
                    active ? activeCls : "bg-mist text-muted border-line hover:bg-soft"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-faint">{label}</dt>
      <dd className="text-ink font-medium mt-0.5 wrap-break-word">{value}</dd>
    </div>
  );
}
