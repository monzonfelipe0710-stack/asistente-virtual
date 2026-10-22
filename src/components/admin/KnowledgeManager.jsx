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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 m-0">
            Administración del Conocimiento
          </h1>
          <p className="text-xs text-slate-500 m-0 mt-1">
            Gestioná las preguntas y respuestas de la base de conocimiento
          </p>
        </div>
        <button
          className="px-4 py-2 bg-blue-800 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-900 transition-colors self-start"
          onClick={() => alert("Formulario para nuevo artículo")}
        >
          + Nuevo Artículo
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {knowledgeCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs rounded-md cursor-pointer transition-colors ${
              activeCategory === cat
                ? "bg-blue-800 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((article) => (
          <div
            key={article.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-slate-800 m-0">
                      {article.question}
                    </h3>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex-shrink-0">
                      {article.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 m-0 mt-1 leading-relaxed">
                    {article.answer}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(article.id)}
                    className={`px-2.5 py-1 text-xs rounded-md cursor-pointer transition-colors ${
                      article.active
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {article.active ? "Activo" : "Inactivo"}
                  </button>
                  <button
                    onClick={() => setEditingId(article.id)}
                    className="px-2.5 py-1 text-xs text-blue-700 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => deleteArticle(article.id)}
                    className="px-2.5 py-1 text-xs text-red-600 bg-red-50 rounded-md cursor-pointer hover:bg-red-100 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            No hay artículos en esta categoría.
          </p>
        )}
      </div>

      <div className="mt-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 m-0 mb-3">
          {editingId ? "Editar Artículo" : "Agregar Nuevo Artículo"}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Pregunta
            </label>
            <input
              type="text"
              defaultValue={editingId ? localKnowledge.find((k) => k.id === editingId)?.question : ""}
              placeholder="Escribí la pregunta..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Respuesta
            </label>
            <textarea
              rows={3}
              defaultValue={editingId ? localKnowledge.find((k) => k.id === editingId)?.answer : ""}
              placeholder="Escribí la respuesta..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Categoría
            </label>
            <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors bg-white">
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
            className="px-4 py-2 bg-blue-800 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-900 transition-colors"
          >
            {editingId ? "Guardar Cambios" : "Agregar Artículo"}
          </button>
          {editingId && (
            <button
              onClick={() => setEditingId(null)}
              className="px-4 py-2 text-sm text-slate-600 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors ml-2"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
