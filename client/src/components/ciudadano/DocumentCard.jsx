export default function DocumentCard({ document }) {
  const formatIcons = {
    PDF: (
      <div className="w-10 h-10 bg-brand flex items-center justify-center flex-shrink-0">
        <span className="text-paper font-bold text-[10px] tracking-wide">PDF</span>
      </div>
    ),
    DOCX: (
      <div className="w-10 h-10 bg-brand flex items-center justify-center flex-shrink-0">
        <span className="text-paper font-bold text-[10px] tracking-wide">DOC</span>
      </div>
    ),
    XLSX: (
      <div className="w-10 h-10 bg-ok flex items-center justify-center flex-shrink-0">
        <span className="text-paper font-bold text-[10px] tracking-wide">XLS</span>
      </div>
    ),
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-paper border border-line hover:border-ink transition-colors">
      {formatIcons[document.format] || formatIcons.PDF}

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold uppercase tracking-wide text-ink m-0 truncate">
          {document.title}
        </h3>
        <p className="text-xs text-muted m-0 mt-1 truncate">
          {document.description}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] uppercase tracking-wide text-muted">{document.format}</span>
          <span className="text-[10px] text-line">|</span>
          <span className="text-[10px] uppercase tracking-wide text-muted">{document.fileSize}</span>
          <span className="text-[10px] text-line">|</span>
          <span className="text-[10px] uppercase tracking-wide text-muted">{document.category.slice(0, -1)}</span>
        </div>
      </div>

      <button
        className="flex-shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-wide text-paper bg-brand cursor-pointer hover:bg-brand-dark transition-colors"
        onClick={() => alert(`Descargando: ${document.title}`)}
      >
        Descargar
      </button>
    </div>
  );
}
