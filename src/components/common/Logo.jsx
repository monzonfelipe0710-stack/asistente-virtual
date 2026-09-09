export default function Logo({ compact = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className={`grid place-items-center bg-brand-deep text-paper font-extrabold shrink-0 border border-brand-deep ${
          compact ? "h-7 w-7 text-[11px]" : "h-8 w-8 text-xs font-neue"
        }`}
        aria-hidden="true"
      >
        AP
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-base font-extrabold tracking-tight text-ink uppercase font-neue">
            ChatAP<span className="text-brand">.</span>
          </span>
          <span className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.24em] text-muted font-neue">
            Recursos Humanos · Formosa
          </span>
        </span>
      )}
    </span>
  );
}