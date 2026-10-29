export default function PendingBackend({ title = "Función no disponible todavía", description, className = "" }) {
  return (
    <div className={`rounded-xl border border-line bg-mist/50 px-5 py-4 mb-6 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted/10 text-muted shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="m-0 text-xs font-bold uppercase tracking-wider text-ink">{title}</p>
          {description && <p className="m-0 mt-1 text-sm text-muted">{description}</p>}
        </div>
      </div>
    </div>
  );
}
