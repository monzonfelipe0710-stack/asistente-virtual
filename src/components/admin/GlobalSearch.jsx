import { useState } from "react";
import { knowledgeBase } from "../../data/mockKnowledge";
import { documents } from "../../data/mockDocuments";
import { sigedRecords } from "../../data/mockSiged";
import { Link } from "react-router-dom";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  if (!query.trim()) {
    return (
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar en todo..."
          className="w-48 lg:w-64 px-3 py-1.5 text-xs border border-slate-200/60 rounded-lg outline-none focus:border-primary/30 bg-slate-50/50 transition-colors placeholder:text-slate-400"
        />
      </div>
    );
  }

  const q = query.toLowerCase();
  const results = [
    ...knowledgeBase
      .filter((k) => k.question.toLowerCase().includes(q) || k.answer.toLowerCase().includes(q))
      .map((k) => ({ type: "Artículo", title: k.question, desc: k.answer.slice(0, 80) + "...", link: "/admin/conocimiento" })),
    ...documents
      .filter((d) => d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
      .map((d) => ({ type: "Documento", title: d.title, desc: d.description, link: "/" })),
    ...sigedRecords
      .filter((r) => r.id.toLowerCase().includes(q) || r.applicant.toLowerCase().includes(q))
      .map((r) => ({ type: "Expediente", title: r.id, desc: `${r.applicant} - ${r.type}`, link: "/admin/siged" })),
  ];

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Buscar en todo..."
        className="w-48 lg:w-64 px-3 py-1.5 text-xs border border-slate-200/60 rounded-lg outline-none focus:border-primary/30 bg-slate-50/50 transition-colors placeholder:text-slate-400"
        autoFocus
      />
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200/60 shadow-xl shadow-slate-200/50 max-h-72 overflow-y-auto z-50 animate-fade-in">
          {results.length === 0 ? (
            <p className="text-xs text-slate-400 px-3 py-4 text-center font-medium">Sin resultados</p>
          ) : (
            results.slice(0, 8).map((r, i) => (
              <Link
                key={i}
                to={r.link}
                onClick={() => { setQuery(""); setOpen(false); }}
                className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-slate-50 no-underline border-b border-slate-50 last:border-0 transition-colors"
              >
                <span className="text-[10px] font-semibold text-accent bg-accent-light/50 px-1.5 py-0.5 rounded whitespace-nowrap mt-0.5">{r.type}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800 m-0 truncate">{r.title}</p>
                  <p className="text-[10px] text-slate-400 m-0 truncate">{r.desc}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
