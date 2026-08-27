import { useState } from "react";
import { knowledgeBase, knowledgeCategories } from "../../data/mockKnowledge";

export default function KnowledgeManager() {
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [editingId, setEditingId] = useState(null);
  const [localKnowledge, setLocalKnowledge] = useState(knowledgeBase);

  const filtered =
    activeCategory === "Todas"
      ? localKnowledge
      : localKnowledge.filter((k) => k.category === activeCategory);

  function toggleActive(id) {
    setLocalKnowledge((prev) =>
      prev.map((k) => (k.id === id ? { ...k, active: !k.active } : k))
    );
  }

  function deleteArticle(id) {
    setLocalKnowledge((prev) => prev.filter((k) => k.id !== id));
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wide text-ink m-0">
            Administración del Conocimiento
          </h1>
          <p className="text-xs uppercase tracking-wide text-muted m-0 mt-2">
            Preguntas y respuestas de la base de conocimiento
          </p>
        </div>
        <button
          className="px-6 py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wide hover:bg-[#333333] transition-colors self-start"
          onClick={() => alert("Formulario para nuevo artículo")}
        >
          + Nuevo Artículo
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {knowledgeCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide cursor-pointer transition-colors ${
              activeCategory === cat
                ? "bg-ink text-paper"
                : "bg-paper text-ink border border-line hover:border-ink"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((article) => (
          <div
            key={article.id}
            className="bg-paper border border-line"
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-ink m-0">
                      {article.question}
                    </h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted bg-mist px-2 py-0.5 flex-shrink-0">
                      {article.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted m-0 leading-relaxed">
                    {article.answer}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(article.id)}
                    className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-colors ${
                      article.active
                        ? "bg-ok text-paper"
                        : "bg-mist text-muted"
                    }`}
                  >
                    {article.active ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    onClick={() => setEditingId(article.id)}
                    className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-paper bg-ink cursor-pointer hover:bg-[#333333] transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteArticle(article.id)}
                    className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-paper bg-bad cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-muted text-center py-8 m-0">
            No hay artículos en esta categoría.
          </p>
        )}
      </div>

      <div className="mt-8 p-6 bg-paper border border-line">
        <h2 className="text-lg font-bold uppercase tracking-wide text-ink m-0 mb-5">
          {editingId ? "Editar Artículo" : "Agregar Nuevo Artículo"}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted mb-2">
              Pregunta
            </label>
            <input
              type="text"
              defaultValue={editingId ? localKnowledge.find((k) => k.id === editingId)?.question : ""}
              placeholder="Escribí la pregunta..."
              className="w-full px-4 py-3 text-sm border border-line outline-none bg-paper text-ink placeholder:text-muted focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted mb-2">
              Respuesta
            </label>
            <textarea
              rows={3}
              defaultValue={editingId ? localKnowledge.find((k) => k.id === editingId)?.answer : ""}
              placeholder="Escribí la respuesta..."
              className="w-full px-4 py-3 text-sm border border-line outline-none bg-paper text-ink placeholder:text-muted focus:border-brand transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-muted mb-2">
              Categoría
            </label>
            <select className="w-full px-4 py-3 text-sm border border-line outline-none bg-paper text-ink focus:border-brand transition-colors">
              {knowledgeCategories.filter((c) => c !== "Todas").map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              alert("Artículo guardado (simulado)");
            }}
            className="px-6 py-3 bg-ink text-paper text-xs font-bold uppercase tracking-wide hover:bg-brand transition-colors"
          >
            {editingId ? "Guardar Cambios" : "Agregar Artículo"}
          </button>
          {editingId && (
            <button
              onClick={() => setEditingId(null)}
              className="px-6 py-3 text-xs font-bold uppercase tracking-wide text-ink border border-ink hover:bg-ink hover:text-paper transition-colors ml-2"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
