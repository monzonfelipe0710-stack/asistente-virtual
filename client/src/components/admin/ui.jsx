import { useEffect, useRef, useState } from "react";

export function useReducedMotion() {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function CountUp({ value, duration = 900, className = "" }) {
  const [display, setDisplay] = useState(useReducedMotion() ? value : 0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (useReducedMotion()) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    const start = performance.now();
    const from = fromRef.current;
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}

const TONES = {
  brand: "bg-brand-deep/10 text-brand-deep",
  ok: "bg-ok/10 text-ok",
  warn: "bg-warn/10 text-warn",
  bad: "bg-bad/10 text-bad",
  info: "bg-info/10 text-info",
  muted: "bg-muted/10 text-muted",
};

export function StatCard({ label, value, icon, tone = "brand", hint, delay = 0 }) {
  return (
    <div
      className="card-interactive p-5 animate-list-item"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-muted m-0 truncate">{label}</p>
          <p className="mt-2 text-3xl font-bold text-ink leading-none">
            <CountUp value={value} />
          </p>
          {hint && <p className="text-xs text-faint mt-1.5 m-0">{hint}</p>}
        </div>
        {icon && (
          <div className={`w-11 h-11 rounded-xl grid place-items-center flex-shrink-0 ${TONES[tone] || TONES.brand}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function PageHeader({ title, description, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-ink m-0 truncate">{title}</h1>
        {description && <p className="text-sm text-muted mt-1 m-0">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

export const statusStyles = {
  Ingresado: "bg-info/10 text-info",
  "En proceso": "bg-warn/10 text-warn",
  Observado: "bg-bad/10 text-bad",
  Finalizado: "bg-ok/10 text-ok",
};

export const priorityStyles = {
  Alta: "bg-bad/10 text-bad",
  Normal: "bg-brand/10 text-brand",
  Baja: "bg-muted/10 text-muted",
};

export function StatusPill({ status, dot = true, className = "" }) {
  const live = status === "En proceso" || status === "Ingresado";
  return (
    <span className={`badge ${statusStyles[status] || "bg-mist text-muted"} ${className}`}>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full bg-current ${live ? "dot-ping" : ""}`}
        />
      )}
      {status}
    </span>
  );
}

export function PriorityDot({ priority }) {
  const colors = { Alta: "bg-bad", Normal: "bg-brand", Baja: "bg-muted" };
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${colors[priority] || "bg-muted"}`}
      title={`Prioridad ${priority}`}
    />
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      {icon && <div className="text-5xl mb-3 opacity-80">{icon}</div>}
      <h3 className="text-base font-semibold text-ink m-0">{title}</h3>
      {description && (
        <p className="text-sm text-muted mt-1.5 max-w-sm m-0">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
