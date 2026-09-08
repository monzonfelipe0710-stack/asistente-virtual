export default function TechnicalBadge({ children, tone = "muted", className = "" }) {
  const accent =
    tone === "brand"
      ? " border-brand/40 text-brand"
      : tone === "paper"
        ? " border-[#f3f1e9]/30 text-[#f3f1e9]/70 hover:text-[#f3f1e9] hover:border-[#f3f1e9]/60"
        : "";
  return <span className={`tech-badge ${accent} ${className}`}>{children}</span>;
}