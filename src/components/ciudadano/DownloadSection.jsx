import { useState } from "react";
import DocumentCard from "./DocumentCard";
import { documents, documentCategories } from "../../data/mockDocuments";

export default function DownloadSection() {
  const [activeCategory, setActiveCategory] = useState("Todos");

  const filtered =
    activeCategory === "Todos"
      ? documents
      : documents.filter((d) => d.category === activeCategory);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-800 m-0">
          Descargas
        </h2>
        <p className="text-xs text-slate-500 m-0 mt-0.5">
          Formularios, guías y plantillas administrativas
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-slate-100 bg-slate-50">
        {documentCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 text-xs rounded-md cursor-pointer transition-colors ${
              activeCategory === cat
                ? "bg-blue-800 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-2">
        {filtered.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">
            No hay documentos en esta categoría.
          </p>
        )}
      </div>
    </section>
  );
}
