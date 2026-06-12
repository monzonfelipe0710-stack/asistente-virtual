import { useState, useEffect } from "react";
import { knowledgeBase, knowledgeCategories } from "../../data/mockKnowledge";
import { useToast } from "../common/Toast";
import Modal from "../common/Modal";
import Pagination, { usePagination } from "../common/Pagination";
import EmptyState from "./EmptyState";
import { TableSkeleton } from "./Skeleton";
import useSortable from "../../hooks/useSortable";

const emptyArticle = { question: "", answer: "", category: "Licencias", active: true };

export default function KnowledgeManager() {
  const addToast = useToast();
  const [local, setLocal] = useState(knowledgeBase);
  const [filterCat, setFilterCat] = useState("Todas");
  const [formOpen, setFormOpen] = useState(false);
  const [editArticle, setEditArticle] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(emptyArticle);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filtered = filterCat === "Todas" ? local : local.filter((a) => a.category === filterCat);
  const { sorted, toggleSort, getSortIndicator } = useSortable(filtered, null, "asc");
  const { page, totalPages, paginatedItems, setPage } = usePagination(sorted, 6);

  function openNew() { setEditArticle(null); setForm(emptyArticle); setFormOpen(true); }

  function openEdit(article) {
    setEditArticle(article);
    setForm({ question: article.question, answer: article.answer, category: article.category, active: article.active });
    setFormOpen(true);
  }

  function handleSave() {
    if (!form.question.trim() || !form.answer.trim()) { addToast("Completá todos los campos requeridos", "error"); return; }
    if (editArticle) {
      setLocal((prev) => prev.map((a) => a.id === editArticle.id ? { ...a, ...form } : a));
      addToast("Artículo actualizado", "success");
    } else {
      setLocal((prev) => [...prev, { id: Math.max(...prev.map((a) => a.id), 0) + 1, ...form, views: 0, createdAt: new Date().toLocaleDateString("es-AR"), updatedAt: new Date().toLocaleDateString("es-AR") }]);
      addToast("Artículo creado", "success");
    }
    setFormOpen(false);
    setEditArticle(null);
  }

  function confirmDelete() {
    setLocal((prev) => prev.filter((a) => a.id !== deleteId));
    setDeleteId(null);
    addToast("Artículo eliminado", "info");
  }

  const catCounts = { Todas: local.length };
  knowledgeCategories.slice(1).forEach((c) => catCounts[c] = local.filter((a) => a.category === c).length);

  if (loading) return <div className="animate-fade-in"><div className="animate-shimmer h-8 w-48 rounded-lg mb-4" /><TableSkeleton rows={4} cols={3} /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-primary m-0 tracking-tight">Administrar Conocimiento</h1>
          <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">{local.length} artículos · {local.filter((a) => a.active).length} activos · {local.reduce((s, a) => s + (a.views || 0), 0).toLocaleString()} vistas totales</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo Artículo
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {knowledgeCategories.map((cat) => (
          <button key={cat} onClick={() => { setFilterCat(cat); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all duration-200 ${filterCat === cat ? "bg-primary text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200/60 hover:border-primary/30 hover:text-primary"}`}>
            {cat} ({catCounts[cat] || 0})
          </button>
        ))}
      </div>

      <div className="grid gap-4 stagger-children">
        {paginatedItems.map((article) => (
          <div key={article.id} className="card card-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-accent-light text-accent">{article.category}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg ${article.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>{article.active ? "Activo" : "Inactivo"}</span>
                  <span className="text-[10px] text-slate-400">{article.views || 0} vistas</span>
                </div>
                <h3 className="text-sm font-semibold text-primary m-0">{article.question}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{article.answer}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => {
                  setLocal((prev) => prev.map((a) => a.id === article.id ? { ...a, active: !a.active } : a));
                  addToast(`Artículo ${article.active ? "desactivado" : "activado"}`, "success");
                }} className={`px-2.5 py-1 text-[10px] font-medium rounded-lg cursor-pointer transition-colors ${article.active ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                  {article.active ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => openEdit(article)} className="px-2.5 py-1 text-[10px] font-medium text-accent bg-accent-light/50 rounded-lg cursor-pointer hover:bg-accent-light transition-colors">Editar</button>
                <button onClick={() => setDeleteId(article.id)} className="px-2.5 py-1 text-[10px] font-medium text-red-600 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors">Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {paginatedItems.length === 0 && <EmptyState title="No hay artículos" description="No hay artículos en esta categoría o con el filtro aplicado." action={<button onClick={() => { setFilterCat("Todas"); setPage(1); }} className="btn-ghost text-xs">Ver todas</button>} />}

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditArticle(null); }} title={editArticle ? "Editar artículo" : "Nuevo artículo"} onConfirm={handleSave} confirmText={editArticle ? "Guardar cambios" : "Crear artículo"}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Pregunta *</label>
            <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="input-field" placeholder="Ej: ¿Cómo solicito licencia anual?" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Respuesta *</label>
            <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="input-field min-h-[100px] resize-y" placeholder="Escribí la respuesta detallada..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Categoría</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                {knowledgeCategories.filter((c) => c !== "Todas").map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Estado</label>
              <select value={form.active} onChange={(e) => setForm({ ...form, active: e.target.value === "true" })} className="input-field">
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} title="Eliminar artículo" confirmText="Eliminar" confirmDanger>
        <p className="text-sm text-slate-600 m-0">¿Estás seguro de eliminar este artículo de la base de conocimiento?</p>
      </Modal>
    </div>
  );
}
