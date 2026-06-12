export default function QuickReplies({ onSelect }) {
  const options = [
    {
      label: "Preguntas Frecuentes",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      query: "¿Cuáles son las preguntas frecuentes?",
    },
    {
      label: "Guía de Trámites",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      query: "¿Cuál es la guía de trámites disponibles?",
    },
    {
      label: "Descargar Formularios",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      query: "Necesito descargar formularios",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2.5 bg-slate-50/80 border-t border-slate-100">
      {options.map((opt) => (
        <button
          key={opt.label}
          onClick={() => onSelect(opt.query)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/60 rounded-lg text-xs font-medium text-slate-600 cursor-pointer hover:border-accent hover:text-accent hover:bg-accent-light/50 transition-all duration-200 shadow-sm"
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
