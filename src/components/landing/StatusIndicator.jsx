const DOT_TONE = {
  ok: "bg-[#18bc42]",
  brand: "bg-brand",
  warn: "bg-[#efc21e]",
};

export default function StatusIndicator({ label, tone = "ok", live = true, light = false, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-[0.66rem] font-medium uppercase tracking-[0.2em] ${
        light ? "text-[#f3f1e9]/75" : "text-muted"
      } ${className}`}
    >
      <span className={`status-dot ${DOT_TONE[tone] || DOT_TONE.ok} ${live ? "animate-pulse-dot" : ""}`} aria-hidden="true" />
      {label}
    </span>
  );
}