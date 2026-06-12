import { useState } from "react";
import { knowledgeBase, knowledgeCategories } from "../../data/mockKnowledge";
import { useToast } from "../common/Toast";
import Modal from "../common/Modal";
import Pagination, { usePagination } from "../common/Pagination";

export default function KnowledgeManager() {
  const addToast = useToast();
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [editingId, setEditingId] = useState(null);
  const [localKnowledge, setLocalKnowledge] = useState(knowledgeBase);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ question: "", answer: "", category: knowledgeCategories[1] });

  const filtered =
    activeCategory === "Todas"
      ? localKnowledge
      : localKnowledge.filter((k) => k.category === activeCategory);

  const { page, totalPages, paginatedItems, setPage } = usePagination(filtered, 4);

  function openNewForm() {
    setEditingId(null);
    setForm({ question: "", answer: "", category: knowledgeCategories[1] });
    setShowForm(true);
  }

  function openEdit(id) {
    const article = localKnowledge.find((k) => k.id === id);
    setEditingId(id);
    setForm({ question: article.question, answer: article.answer, category: article.category });
    setShowForm(true);
  }

  function saveArticle() {
    if (!form.question.trim() || !form.answer.trim()) {
      addToast("Completá la pregunta y la respuesta", "error");
      return;
    }
    if (editingId) {
      setLocalKnowledge((prev) =>
        prev.map((k) => (k.id === editingId ? { ...k, question: form.question, answer: form.answer, category: form.category } : k))
      );
      addToast("Artículo actualizado", "success");
    } else {
      const newId = Math.max(...localKnowledge.map((k) => k.id), 0) + 1;
      setLocalKnowledge((prev) => [...prev, { id: newId, question: form.question, answer: form.answer, category: form.category, active: true }]);
      addToast("Artículo creado", "success");
    }
    setShowForm(false);
    setEditingId(null);
  }

  function confirmDelete() {
    setLocalKnowledge((prev) => prev.filter((k) => k.id !== deleteId));
    setDeleteId(null);
    addToast("Artículo eliminado", "info");
  }

  function toggleActive(id) {
    setLocalKnowledge((prev) =>
      prev.map((k) => (k.id === id ? { ...k, active: !k.active } : k))
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-primary m-0 tracking-tight">
            Administración del Conocimiento
          </h1>
          <p className="text-xs text-slate-400 m-0 mt-0.5 font-medium">
            Gestioná las preguntas y respuestas de la base de conocimiento
          </p>
        </div>
        <button className="btn-primary" onClick={openNewForm}>
          + Nuevo Artículo
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {knowledgeCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all duration-200 ${
              activeCategory === cat
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-slate-500 border border-slate-200/60 hover:border-primary/30 hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3 stagger-children">
        {paginatedItems.map((article) => (
          <div key={article.id} className="card card-border overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-slate-800 m-0">
                      {article.question}
                    </h3>
                    <span className="text-[10px] font-medium text-accent bg-accent-light/50 px-1.5 py-0.5 rounded flex-shrink-0">
                      {article.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 m-0 mt-1 leading-relaxed">
                    {article.answer}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(article.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                      article.active
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {article.active ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    onClick={() => openEdit(article.id)}
                    className="px-2.5 py-1 text-xs font-medium text-accent bg-accent-light/50 rounded-lg cursor-pointer hover:bg-accent-light transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteId(article.id)}
                    className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm text-slate-400 font-medium">No hay artículos en esta categoría</p>
          </div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-primary m-0">
                {editingId ? "Editar Artículo" : "Nuevo Artículo"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Pregunta</label>
                <input
                  type="text"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="Escribí la pregunta..."
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Respuesta</label>
                <textarea
                  rows={3}
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder="Escribí la respuesta..."
                  className="input-field resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Categoría</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-field"
                >
                  {knowledgeCategories.filter((c) => c !== "Todas").map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
                <button onClick={saveArticle} className="btn-primary">
                  {editingId ? "Guardar Cambios" : "Agregar Artículo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Eliminar artículo"
        confirmText="Eliminar"
        confirmDanger
      >
        ¿Estás seguro de eliminar este artículo de la base de conocimiento?
      </Modal>
    </div>
  );
}
