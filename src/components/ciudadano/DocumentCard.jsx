export default function DocumentCard({ document }) {
  const formatIcons = {
    PDF: (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">PDF</span>
      </div>
    ),
    DOCX: (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">DOC</span>
      </div>
    ),
    XLSX: (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 shadow-sm">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">XLS</span>
      </div>
    ),
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      {formatIcons[document.format] || formatIcons.PDF}

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-slate-800 m-0 truncate">
          {document.title}
        </h3>
        <p className="text-xs text-slate-500 m-0 mt-0.5 truncate">
          {document.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-slate-400">{document.fileSize}</span>
          <span className="text-[10px] text-slate-300">|</span>
          <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
            {document.category.slice(0, -1)}
          </span>
        </div>
      </div>

      <button
        className="shrink-0 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-100"
        onClick={() => alert(`Descargando: ${document.title}`)}
      >
        Descargar
      </button>
    </div>
  );
}
