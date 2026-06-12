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
    <section className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-sm font-semibold text-primary m-0">
            Descargas
          </h2>
        </div>
        <p className="text-xs text-slate-400 m-0 mt-0.5 ml-6">
          Formularios, guías y plantillas administrativas
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        {documentCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 text-xs font-medium rounded-lg cursor-pointer transition-all duration-200 ${
              activeCategory === cat
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-slate-500 border border-slate-200/60 hover:border-primary/30 hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-2 stagger-children">
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
