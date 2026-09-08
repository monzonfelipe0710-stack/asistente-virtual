import { Fragment } from "react";

export function Kicker({ children, className = "" }) {
  return <p className={`kicker m-0 font-neue tracking-[0.22em] text-xs text-muted ${className}`}>{children}</p>;
}

const TITLE_EL = { 1: "h1", 2: "h2", 3: "h3" };

export function DisplayTitle({ as = 2, children, className = "" }) {
  const Tag = TITLE_EL[as] || "h2";
  const size = as === 1 ? "display-1" : as === 2 ? "display-2" : "display-3";
  return <Tag className={`${size} text-ink m-0 font-neue ${className}`}>{children}</Tag>;
}

export function Lead({ children, className = "" }) {
  return <p className={`lead m-0 font-neue-text ${className}`}>{children}</p>;
}

export function ArrowLink({ children, to, onClick, className = "", mute = false }) {
  const base = `group inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] no-underline transition-colors ${
    mute ? "text-muted hover:text-ink" : "text-[#FF4000] hover:text-ink"
  } ${className}`;
  const arrow = (
    <span className="inline-block transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
      →
    </span>
  );
  if (to) {
    return (
      <a href={to} className={base} onClick={onClick}>
        <span>{children}</span>
        {arrow}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`${base} cursor-pointer bg-transparent border-0 p-0`}>
      <span>{children}</span>
      {arrow}
    </button>
  );
}

export function SectionHeading({
  kicker,
  title,
  lead,
  as = 2,
  align = "left",
  className = "",
}) {
  const alignCls = align === "center" ? "items-center text-center" : "items-start text-left";
  return (
    <div className={`flex flex-col gap-4 max-w-3xl ${alignCls} ${className}`}>
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      {title ? <DisplayTitle as={as}>{title}</DisplayTitle> : null}
      {lead ? <Lead className="mt-2">{lead}</Lead> : null}
    </div>
  );
}

export function Wordmark({ children, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`select-none pointer-events-none font-black tracking-tighter leading-none font-neue ${
        className || "text-[13vw] md:text-[11vw]"
      }`}
      style={{
        color: "transparent",
        WebkitTextStroke: "1px rgba(255, 255, 255, 0.08)",
      }}
    >
      {children}
    </span>
  );
}

export function MetricStrip({ items = [], cols = "grid-cols-2 md:grid-cols-4", className = "" }) {
  return (
    <div className={`grid gap-px bg-line border border-line overflow-hidden rounded-none ${cols} ${className}`}>
      {items.map((item, i) => (
        <div key={item.label ?? i} className="bg-paper p-6 md:p-8">
          <p className="m-0 text-[10px] font-bold uppercase tracking-[0.24em] text-muted">
            {item.label}
          </p>
          <p className="mt-4 m-0 text-4xl md:text-5xl font-extrabold tracking-tighter text-ink font-neue">
            {item.value}
          </p>
          {item.hint ? (
            <p className="mt-2 m-0 text-xs text-faint">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function CommaJoiner({ parts = [] }) {
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-brand-deep">, </span>}
          {p}
        </Fragment>
      ))}
    </>
  );
}