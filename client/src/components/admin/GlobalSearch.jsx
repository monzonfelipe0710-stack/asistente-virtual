import { useState, useRef, useEffect } from "react";
import { knowledgeBase } from "../../data/mockKnowledge";
import { documents } from "../../data/mockDocuments";
import { sigedRecords } from "../../data/mockSiged";
import { useNavigate } from "react-router-dom";
import useKeyboardShortcut from "../../hooks/useKeyboardShortcut";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useKeyboardShortcut("k", true, () => {
    setFocused(true);
    setTimeout(() => ref.current?.focus(), 50);
  });

  useEffect(() => {
    if (!focused) return;
    const handler = (e) => { if (e.key === "Escape") { setFocused(false); setQuery(""); ref.current?.blur(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focused]);

  const results = query.trim().length >= 2 ? [
    ...knowledgeBase.filter((k) => k.active && (k.question.toLowerCase().includes(query.toLowerCase()) || k.answer.toLowerCase().includes(query.toLowerCase()))).map((r) => ({ ...r, _type: "knowledge", _label: r.question, _desc: r.answer.slice(0, 80) + "…", _link: "/admin/conocimiento" })),
    ...documents.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()) || d.description.toLowerCase().includes(query.toLowerCase())).map((d) => ({ ...d, _type: "document", _label: d.title, _desc: d.description, _link: "/admin/documentos" })),
    ...sigedRecords.filter((r) => r.id.toLowerCase().includes(query.toLowerCase()) || r.applicant.toLowerCase().includes(query.toLowerCase())).map((r) => ({ ...r, _type: "siged", _label: r.id, _desc: `${r.type} — ${r.applicant}`, _link: "/admin/siged" })),
  ].slice(0, 8) : [];

  function handleSelect(item) {
    setQuery("");
    setFocused(false);
    ref.current?.blur();
    navigate(item._link);
  }

  const typeStyles = { knowledge: "bg-purple-50 text-purple-600 border-purple-200", document: "bg-emerald-50 text-emerald-600 border-emerald-200", siged: "bg-amber-50 text-amber-600 border-amber-200" };

  return (
    <div className="relative" style={{ minWidth: 260 }}>
      <div className="relative">
        <svg className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input ref={ref} type="text" value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => { setFocused(false); }, 200)} placeholder="Buscar..." className="input-field pl-9 pr-10 text-xs" aria-label="Búsqueda global" />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-medium bg-mist text-muted rounded border border-line leading-none">Ctrl+K</kbd>
      </div>
      {focused && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 card card-border overflow-hidden z-50 animate-scale-in shadow-lg">
          {results.length > 0 ? (
            <div className="py-1">
              {results.map((item, i) => (
                <button key={`${item._type}-${item.id}`} onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }} className="w-full text-left px-3 py-2.5 hover:bg-soft transition-colors flex items-start gap-2.5 border-b border-line last:border-0 cursor-pointer">
                  <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border shrink-0 mt-0.5 ${typeStyles[item._type] || "bg-mist text-muted"}`}>{item._type === "knowledge" ? "Art." : item._type === "document" ? "Doc." : "SIGED"}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink m-0 truncate">{item._label}</p>
                    <p className="text-[10px] text-muted m-0 mt-0.5 truncate">{item._desc}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-4 text-center">
              <svg className="w-6 h-6 text-muted mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <p className="text-xs text-muted font-medium">Sin resultados para "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
