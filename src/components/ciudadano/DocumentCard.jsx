export default function DocumentCard({ document }) {
  const formatIcons = {
    PDF: (
      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-red-600 font-bold text-[10px]">PDF</span>
      </div>
    ),
    DOCX: (
      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-blue-600 font-bold text-[10px]">DOC</span>
      </div>
    ),
    XLSX: (
      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-green-600 font-bold text-[10px]">XLS</span>
      </div>
    ),
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-200 hover:shadow-sm transition-all">
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
        className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={() => alert(`Descargando: ${document.title}`)}
      >
        Descargar
      </button>
    </div>
  );
}
