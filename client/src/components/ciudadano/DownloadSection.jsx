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
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_-25px_rgba(15,23,42,0.35)]">
      <div className="border-b border-slate-100 px-4 py-4">
        <h2 className="text-sm font-semibold text-slate-800 m-0">
          Descargas
        </h2>
        <p className="text-xs text-slate-500 m-0 mt-0.5">
          Formularios, guías y plantillas administrativas
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        {documentCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
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
