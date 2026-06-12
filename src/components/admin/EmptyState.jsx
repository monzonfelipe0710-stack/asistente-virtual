export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-slate-100">
        {icon || (
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="text-sm font-semibold text-slate-500 mb-1">{title || "Sin resultados"}</h3>
      <p className="text-xs text-slate-400 text-center max-w-xs mb-4">{description || "No se encontraron elementos con los filtros actuales."}</p>
      {action && action}
    </div>
  );
}
