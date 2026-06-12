export default function DocumentCard({ document }) {
  const formatStyles = {
    PDF: "bg-red-50 text-red-600 border-red-200/50",
    DOCX: "bg-blue-50 text-blue-600 border-blue-200/50",
    XLSX: "bg-emerald-50 text-emerald-600 border-emerald-200/50",
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200/60 rounded-xl hover:border-primary/20 hover:shadow-md hover:shadow-slate-200/50 transition-all duration-200 group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${formatStyles[document.format] || formatStyles.PDF}`}>
        <span className="font-bold text-[10px] tracking-wider">{document.format}</span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-slate-800 m-0 truncate group-hover:text-primary transition-colors">
          {document.title}
        </h3>
        <p className="text-xs text-slate-400 m-0 mt-0.5 truncate">
          {document.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-slate-400 font-medium">{document.fileSize}</span>
          <span className="text-[10px] text-slate-200">|</span>
          <span className="text-[10px] font-medium text-accent bg-accent-light/50 px-1.5 py-0.5 rounded">
            {document.category.slice(0, -1)}
          </span>
        </div>
      </div>

      <button
        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 rounded-lg cursor-pointer hover:bg-primary hover:text-white transition-all duration-200 border border-primary/10 hover:border-primary"
        onClick={() => {
          const link = document.createElement("a");
          link.download = `${document.title}.${document.format.toLowerCase()}`;
          link.click();
        }}
      >
        Descargar
      </button>
    </div>
  );
}
