export default function SectionLabel({ num, children, light = false, className = "" }) {
  return (
    <p
      className={`fig-num m-0 inline-flex items-center gap-3 uppercase tracking-[0.18em] ${
        light ? "text-[#f3f1e9]/60" : "text-ink/60"
      } ${className}`}
    >
      <span className="text-brand">{num}</span>
      <span className={`inline-block h-px w-10 ${light ? "bg-[#f3f1e9]/30" : "bg-ink/25"}`} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}