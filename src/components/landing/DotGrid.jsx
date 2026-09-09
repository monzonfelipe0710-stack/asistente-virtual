/**
 * DotGrid — a CSS dot-grid background texture.
 * Used on the dark side of the hero split and as section accents.
 */
export default function DotGrid({ className = "", color = "rgba(241,240,232,0.12)" }) {
  return (
    <div
      className={`dot-grid-bg pointer-events-none absolute inset-0 ${className}`}
      aria-hidden="true"
      style={{
        backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
      }}
    />
  );
}
