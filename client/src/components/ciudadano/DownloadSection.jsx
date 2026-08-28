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
    <section className="bg-paper border border-line">
      <div className="px-5 py-4 border-b border-line">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-deep mb-1">
          Documentos
        </p>
        <h2 className="text-xl font-bold uppercase tracking-wide text-ink m-0">
          Descargas
        </h2>
      </div>

      <div className="flex flex-wrap gap-2 px-5 py-4 border-b border-line">
        {documentCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide cursor-pointer transition-colors ${
              activeCategory === cat
                ? "bg-brand-deep text-paper"
                : "bg-paper text-ink border border-line hover:border-brand"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-3">
        {filtered.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted text-center py-6 m-0">
            No hay documentos en esta categoría.
          </p>
        )}
      </div>
    </section>
  );
}
