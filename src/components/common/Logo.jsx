export default function Logo({ compact = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className={`grid place-items-center rounded-2xl bg-brand-deep text-paper shrink-0 ${
          compact ? "h-9 w-9 rounded-lg" : "h-11 w-11"
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className={compact ? "h-5 w-5" : "h-6 w-6"} fill="none" stroke="currentColor" strokeWidth={1.9}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M12 3l9 5H3l9-5zM5 8v13M9.5 8v13M14.5 8v13M19 8v13" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-lg font-extrabold tracking-tight text-ink uppercase">
            ChatAP
          </span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-muted">
            Administración Pública
          </span>
        </span>
      )}
    </span>
  );
}