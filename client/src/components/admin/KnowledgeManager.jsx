import { useEffect, useMemo, useState } from "react";
import { PageHeader, EmptyState } from "./ui";

const STORAGE_KEY = "chatap.admin.knowledge.local.v1";
const CATEGORIES = ["General", "Trámites", "Requisitos", "Contacto", "Institucional"];

function readEntries() {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

const emptyDraft = { title: "", category: "General", question: "", answer: "" };

function Icon({ path, className = "h-5 w-5" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d={path} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function KnowledgeManager() {
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [status, setStatus] = useState("Todos");
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    setEntries(readEntries());
  }, []);

  function persist(next) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setEntries(next);
      setStorageError("");
      return true;
    } catch {
      setStorageError("No se pudo guardar en este navegador. Comprobá el espacio disponible e intentá nuevamente.");
      return false;
    }
  }

  function openCreate() {
    setDraft(emptyDraft);
    setEditingId(null);
    setError("");
    setFormOpen(true);
  }

  function openEdit(entry) {
    setDraft({ title: entry.title, category: entry.category, question: entry.question, answer: entry.answer });
    setEditingId(entry.id);
    setError("");
    setFormOpen(true);
  }

  function save(event) {
    event.preventDefault();
    const normalized = {
      title: draft.title.trim(),
      category: draft.category,
      question: draft.question.trim(),
      answer: draft.answer.trim(),
    };
    if (normalized.title.length < 3 || normalized.question.length < 5 || normalized.answer.length < 10) {
      setError("Completá un título, una consulta y una respuesta con información suficiente.");
      return;
    }
    const now = new Date().toISOString();
    const next = editingId
      ? entries.map((item) => item.id === editingId ? { ...item, ...normalized, updatedAt: now } : item)
      : [{ id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...normalized, active: true, createdAt: now, updatedAt: now }, ...entries];
    if (persist(next)) {
      setFormOpen(false);
      setDraft(emptyDraft);
      setEditingId(null);
      setError("");
    }
  }

  function toggleActive(entry) {
    persist(entries.map((item) => item.id === entry.id ? { ...item, active: !item.active, updatedAt: new Date().toISOString() } : item));
  }

  function removeEntry(entry) {
    if (!window.confirm(`¿Eliminar «${entry.title}» de este navegador?`)) return;
    persist(entries.filter((item) => item.id !== entry.id));
  }

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return entries.filter((item) => {
      const matchesText = !term || [item.title, item.question, item.answer, item.category].some((value) => String(value || "").toLocaleLowerCase("es").includes(term));
      const matchesCategory = category === "Todas" || item.category === category;
      const matchesStatus = status === "Todos" || (status === "Activos" ? item.active : !item.active);
      return matchesText && matchesCategory && matchesStatus;
    });
  }, [entries, query, category, status]);

  const activeCount = entries.filter((item) => item.active).length;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Base de conocimiento" description="Organizá respuestas y contenidos de referencia para el equipo. Los registros creados aquí se conservan únicamente en este navegador.">
        <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <Icon path="M12 5v14m-7-7h14" className="h-4 w-4" /> Nuevo contenido
        </button>
      </PageHeader>

      <div role="note" className="mb-6 flex gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
        <Icon path="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z" className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="m-0"><strong>Modo local.</strong> Este contenido no se publica ni se incorpora automáticamente a las respuestas del asistente. Se guarda solo en este navegador; no ingreses información confidencial ni lo uses como fuente oficial compartida.</p>
      </div>

      {storageError && <p role="alert" className="mb-4 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad">{storageError}</p>}

      <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Resumen de contenidos">
        <div className="rounded-xl border border-line bg-paper p-5"><p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted">Contenidos guardados</p><p className="mb-0 mt-2 text-3xl font-bold tabular-nums text-ink">{entries.length}</p></div>
        <div className="rounded-xl border border-line bg-paper p-5"><p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted">Activos</p><p className="mb-0 mt-2 text-3xl font-bold tabular-nums text-ink">{activeCount}</p></div>
        <div className="rounded-xl border border-line bg-paper p-5"><p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted">Inactivos</p><p className="mb-0 mt-2 text-3xl font-bold tabular-nums text-ink">{entries.length - activeCount}</p></div>
      </section>

      {formOpen && (
        <form onSubmit={save} className="mb-6 rounded-2xl border border-line bg-paper p-5 md:p-7">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div><p className="m-0 text-xs font-bold uppercase tracking-widest text-brand-deep">{editingId ? "Edición" : "Nuevo registro"}</p><h2 className="mb-0 mt-1 text-xl font-bold text-ink">{editingId ? "Editar contenido" : "Agregar contenido"}</h2></div>
            <button type="button" onClick={() => setFormOpen(false)} className="btn-ghost text-sm">Cerrar</button>
          </div>
          {error && <p role="alert" className="mb-4 rounded-lg bg-bad/5 px-3 py-2 text-sm text-bad">{error}</p>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-ink">Título<input required minLength={3} maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="input-field mt-2 w-full" placeholder="Ej. Horarios de atención" /></label>
            <label className="text-sm font-semibold text-ink">Categoría<select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="input-field mt-2 w-full">{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-sm font-semibold text-ink md:col-span-2">Consulta relacionada<input required minLength={5} maxLength={240} value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })} className="input-field mt-2 w-full" placeholder="¿Qué suele preguntar la ciudadanía?" /></label>
            <label className="text-sm font-semibold text-ink md:col-span-2">Respuesta de referencia<textarea required minLength={10} maxLength={5000} rows={5} value={draft.answer} onChange={(e) => setDraft({ ...draft, answer: e.target.value })} className="input-field mt-2 w-full resize-y" placeholder="Escribí una respuesta clara y verificable…" /></label>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setFormOpen(false)} className="btn-ghost">Cancelar</button><button type="submit" className="btn-primary">{editingId ? "Guardar cambios" : "Guardar contenido"}</button></div>
        </form>
      )}

      <section className="overflow-hidden rounded-2xl border border-line bg-paper">
        <div className="border-b border-line p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="m-0 text-lg font-bold text-ink">Contenidos</h2><p className="m-0 mt-1 text-sm text-muted">{filtered.length} de {entries.length} registros</p></div></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} className="input-field sm:col-span-1" placeholder="Buscar contenido…" aria-label="Buscar contenidos" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field" aria-label="Filtrar por categoría"><option value="Todas">Todas las categorías</option>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field" aria-label="Filtrar por estado"><option>Todos</option><option>Activos</option><option>Inactivos</option></select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title={entries.length ? "No encontramos contenidos" : "Todavía no hay contenidos"} description={entries.length ? "Probá cambiar los filtros o la búsqueda." : "Creá el primer registro para organizar información de referencia en este navegador."} action={!entries.length ? <button type="button" onClick={openCreate} className="btn-primary">Crear primer contenido</button> : null} />
        ) : (
          <div className="divide-y divide-line">
            {filtered.map((entry) => (
              <article key={entry.id} className="p-4 md:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-deep">{entry.category}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.active ? "bg-ok/10 text-ok" : "bg-mist text-muted"}`}>{entry.active ? "Activo" : "Inactivo · borrador local"}</span></div>
                    <h3 className="m-0 text-base font-bold text-ink">{entry.title}</h3>
                    <p className="mb-0 mt-2 text-sm font-semibold text-muted">{entry.question}</p>
                    <p className="mb-0 mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{entry.answer}</p>
                    <p className="mb-0 mt-3 text-xs text-faint">Actualizado: {new Date(entry.updatedAt || entry.createdAt).toLocaleString("es-AR")}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" onClick={() => openEdit(entry)} className="btn-ghost text-xs">Editar</button>
                    <button type="button" onClick={() => toggleActive(entry)} className="btn-ghost text-xs">{entry.active ? "Desactivar" : "Activar"}</button>
                    <button type="button" onClick={() => removeEntry(entry)} className="btn-ghost text-xs text-bad">Eliminar</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
