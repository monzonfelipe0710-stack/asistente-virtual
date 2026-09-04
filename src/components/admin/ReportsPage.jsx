import { useState, useEffect } from "react";
import { users } from "../../data/mockUsers";
import { knowledgeBase, knowledgeCategories } from "../../data/mockKnowledge";
import { sigedRecords } from "../../data/mockSiged";
import { documents } from "../../data/mockDocuments";
import { departments } from "../../data/mockUsers";
import { CountUp } from "./ui";

function StatCard({ label, value, icon, color, subtitle }) {
  return (
    <div
      className="card card-border p-4 hover:-translate-y-0.5 hover:shadow-md transition duration-200 animate-list-item"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-primary m-0 tracking-tight">
            {typeof value === "number" ? <CountUp value={value} /> : value}
          </p>
          <p className="text-xs text-muted m-0 font-medium">{label}</p>
          {subtitle && <p className="text-[10px] text-muted m-0 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-muted m-0 mb-3">
      {children}
    </p>
  );
}

function CardTitle({ children }) {
  return (
    <h2 className="text-sm font-semibold text-primary m-0 mb-4">{children}</h2>
  );
}

/* Gráfico de dona interactivo (SVG puro, sin librerías): al pasar el mouse
   o enfocar un segmento se resalta y el centro muestra su porcentaje e info. */
function DonutChart({ segments, size = 176, thickness = 26 }) {
  const [active, setActive] = useState(null);
  const [mounted, setMounted] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 62;
  const c = 2 * Math.PI * r;
  const ticks = Array.from({ length: 36 }, (_, i) => (i * Math.PI) / 18);
  let acc = 0;

  useEffect(() => {
    if (mounted) return;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setMounted(true))
    );
    return () => cancelAnimationFrame(raf);
  }, [mounted]);

  const activeSeg = active != null ? segments[active] : null;
  const activePct = activeSeg && total ? Math.round((activeSeg.value / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <div
          className="absolute -inset-8 rounded-full pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-brand) 9%, transparent) 0%, transparent 65%)",
          }}
        />
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative -rotate-90" role="img" aria-label="Gráfico de dona del estado de expedientes">
          <defs>
            {segments.map((s, i) => (
              <linearGradient key={s.label} id={`donut-g-${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={s.color} />
                <stop
                  offset="100%"
                  stopColor={s.color}
                  style={{ stopColor: `color-mix(in srgb, ${s.color}, black 28%)` }}
                />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((a, i) => {
            const major = i % 3 === 0;
            const r1 = 80;
            const r2 = major ? 85 : 83;
            const cx = size / 2;
            const cy = size / 2;
            return (
              <line
                key={i}
                x1={cx + r1 * Math.cos(a)}
                y1={cy + r1 * Math.sin(a)}
                x2={cx + r2 * Math.cos(a)}
                y2={cy + r2 * Math.sin(a)}
                strokeWidth={major ? 1.4 : 1}
                strokeLinecap="round"
                style={{ stroke: "var(--color-faint)", opacity: major ? 0.55 : 0.3 }}
              />
            );
          })}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} strokeLinecap="round" style={{ stroke: "var(--color-mist)" }} />
          {total > 0 &&
            segments.map((s, i) => {
              if (!s.value) return null;
              const frac = s.value / total;
              const full = Math.max(frac * c - 5, 3);
              const isActive = active === i;
              const el = (
                <circle
                  key={s.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  strokeLinecap="round"
                  style={{
                    stroke: `url(#donut-g-${i})`,
                    cursor: "pointer",
                    outline: "none",
                    opacity: active === null || isActive ? 1 : 0.28,
                    transition:
                      "opacity 0.25s ease, stroke-width 0.25s ease, filter 0.25s ease, stroke-dasharray 0.9s cubic-bezier(0.22, 1, 0.36, 1), stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
                    filter: isActive ? `drop-shadow(0 3px 10px ${s.color}73)` : "none",
                  }}
                  strokeWidth={isActive ? thickness + 6 : thickness}
                  strokeDasharray={mounted ? `${full} ${c - full}` : `0 ${c}`}
                  strokeDashoffset={-acc}
                  tabIndex={0}
                  aria-label={`${s.label}: ${s.value} expedientes, ${Math.round((s.value / total) * 100)} por ciento`}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                />
              );
              acc += frac * c;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center pointer-events-none px-10">
          {activeSeg ? (
            <div className="animate-fade-in" key={activeSeg.label}>
              <p className="text-[32px] font-bold m-0 leading-none tabular-nums tracking-tight" style={{ color: activeSeg.color }}>
                {activePct}%
              </p>
              <span className="block w-8 h-0.5 rounded-full mx-auto mt-2" style={{ background: activeSeg.color, opacity: 0.5 }} />
              <p className="text-xs font-semibold text-ink m-0 mt-1.5 leading-tight">{activeSeg.label}</p>
              <p className="text-[11px] text-muted m-0 mt-0.5 tabular-nums">{activeSeg.value} expedientes</p>
            </div>
          ) : (
            <div>
              <p className="text-[32px] font-bold text-ink m-0 leading-none tabular-nums tracking-tight">
                <CountUp value={total} />
              </p>
              <span className="block w-8 h-0.5 rounded-full bg-line mx-auto mt-2" />
              <p className="text-[11px] text-muted m-0 mt-1.5">expedientes en total</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-[11px] text-faint m-0 mt-2 text-center inline-flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3l14 7-6.2 2-2 6.2L5 3z" />
        </svg>
        Pasá el cursor sobre cada porción para ver el detalle
      </p>
    </div>
  );
}

/* Barras verticales (CSS puro) con cartel de porcentaje al pasar el cursor. */
const deptShort = {
  "Mesa de Entradas": "Mesa",
  "Recursos Humanos": "RR.HH.",
  Legajos: "Legajos",
  Liquidaciones: "Liquid.",
  Sistemas: "Sistemas",
};

function VBars({ data }) {
  const [active, setActive] = useState(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex items-stretch gap-2.5 h-48">
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        const pctTotal = total ? Math.round((d.value / total) * 100) : 0;
        const isActive = active === i;
        return (
          <div
            key={d.label}
            className="relative flex-1 min-w-0 flex flex-col items-center outline-none"
            tabIndex={0}
            role="img"
            aria-label={`${d.label}: ${d.value} expedientes, ${pctTotal} por ciento del total`}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          >
            <div
              className={`absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 transition duration-200 z-10 ${
                isActive ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0 pointer-events-none"
              }`}
            >
              <div className="relative bg-ink text-paper text-[11px] font-semibold rounded-lg px-2.5 py-1 shadow-lg whitespace-nowrap tabular-nums">
                {pctTotal}% · {d.value} exp.
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-ink" aria-hidden="true" />
              </div>
            </div>
            <span className={`text-xs font-bold tabular-nums mb-1 transition-colors ${isActive ? "text-brand-deep" : "text-ink"}`}>
              {d.value}
            </span>
            <div className="w-full flex-1 flex items-end justify-center bg-mist rounded-lg overflow-hidden">
              <div
                className={`w-3/5 rounded-t-md bar-fill-y-animate transition-colors duration-200 ${isActive ? "bg-brand-deep" : "bg-brand"}`}
                style={{ "--bar-target-y": `${d.value > 0 ? Math.max(pct, 6) : 0}%` }}
              />
            </div>
            <span className="text-[10px] text-muted mt-1.5 truncate w-full text-center">{deptShort[d.label] || d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Barras horizontales con valor */
function HBarRow({ label, value, max, colorClass = "bg-brand" }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted w-24 font-medium truncate shrink-0">{label}</span>
      <div className="flex-1 h-4 bg-mist rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full bar-fill-animate`} style={{ "--bar-target": `${pct}%` }} />
      </div>
      <span className="text-xs text-ink font-bold tabular-nums w-6 text-right shrink-0">{value}</span>
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("7d");

  const activeUsers = users.filter((u) => u.status === "Activo").length;
  const activeArticles = knowledgeBase.filter((k) => k.active).length;
  const totalViews = knowledgeBase.reduce((s, k) => s + (k.views || 0), 0);
  const totalDownloads = documents.reduce((s, d) => s + d.downloads, 0);
  const byCategory = knowledgeCategories.slice(1).map((cat) => ({ label: cat, count: knowledgeBase.filter((k) => k.category === cat).length }));
  const byDept = departments.map((d) => ({ label: d, value: sigedRecords.filter((r) => r.department === d).length }));
  const byStatus = [
    { label: "Activos", count: activeUsers, pct: Math.round((activeUsers / users.length) * 100) },
    { label: "Inactivos", count: users.length - activeUsers, pct: Math.round(((users.length - activeUsers) / users.length) * 100) },
  ];
  const sigedSegments = [
    { label: "Ingresado", value: sigedRecords.filter((r) => r.status === "Ingresado").length, color: "var(--color-info)" },
    { label: "En proceso", value: sigedRecords.filter((r) => r.status === "En proceso").length, color: "var(--color-warn)" },
    { label: "Observado", value: sigedRecords.filter((r) => r.status === "Observado").length, color: "var(--color-bad)" },
    { label: "Finalizado", value: sigedRecords.filter((r) => r.status === "Finalizado").length, color: "var(--color-ok)" },
  ];
  const topArticles = [...knowledgeBase].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const topDocs = [...documents].sort((a, b) => b.downloads - a.downloads).slice(0, 5);
  const usersByRole = ["Superadmin", "Administrador", "Ciudadano"].map((r) => ({ label: r, count: users.filter((u) => u.role === r).length }));

  const maxCat = Math.max(...byCategory.map((c) => c.count), 1);
  const maxRole = Math.max(...usersByRole.map((r) => r.count), 1);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <h1 className="text-xl font-semibold text-primary m-0 tracking-tight">Reportes y Analíticas</h1>
          <p className="text-xs text-muted m-0 mt-0.5 font-medium">Métricas detalladas del sistema y contenido</p>
        </div>
        <div className="flex gap-1.5 bg-mist p-0.5 rounded-lg">
          {[{ v: "7d", l: "7 días" }, { v: "30d", l: "30 días" }, { v: "90d", l: "90 días" }].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${period === v ? "bg-paper text-primary shadow-sm" : "text-muted hover:text-primary bg-transparent"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard label="Vistas totales" value={totalViews} subtitle="en artículos" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} color="bg-info/10 text-info" />
        <StatCard label="Descargas" value={totalDownloads} subtitle="de documentos" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} color="bg-ok/10 text-ok" />
        <StatCard label="Expedientes" value={sigedRecords.length} subtitle="gestionados" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} color="bg-warn/10 text-warn" />
        <StatCard label="Artículos activos" value={`${activeArticles}/${knowledgeBase.length}`} subtitle="en base" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>} color="bg-brand/10 text-brand" />
      </div>

      {/* Gráficos */}
      <SectionTitle>Gráficos</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 stagger-children">
        <div className="card card-border p-5 overflow-hidden">
          <div className="mb-2">
            <h2 className="text-sm font-semibold text-primary m-0">Estado de expedientes</h2>
            <p className="text-[11px] text-muted m-0 mt-0.5">Distribución actual por etapa del trámite</p>
          </div>
          <DonutChart segments={sigedSegments} />
        </div>

        <div className="card card-border p-5">
          <CardTitle>Expedientes por área</CardTitle>
          <VBars data={byDept} />
        </div>

        <div className="card card-border p-5">
          <CardTitle>Artículos por categoría</CardTitle>
          <div className="space-y-2.5">
            {byCategory.map((c) => (
              <HBarRow key={c.label} label={c.label} value={c.count} max={maxCat} colorClass="bg-brand" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 stagger-children">
        <div className="card card-border p-5">
          <CardTitle>Usuarios por rol</CardTitle>
          <div className="space-y-2.5">
            {usersByRole.map((r) => (
              <HBarRow key={r.label} label={r.label} value={r.count} max={maxRole} colorClass="bg-info" />
            ))}
          </div>
        </div>

        <div className="card card-border p-5">
          <CardTitle>Distribución de usuarios</CardTitle>
          <div className="flex h-5 rounded-full overflow-hidden bg-mist">
            <div className="h-full bg-ok bar-fill-animate" style={{ "--bar-target": `${byStatus[0].pct}%` }} title={`Activos: ${byStatus[0].count}`} />
            <div className="h-full bg-line bar-fill-animate" style={{ "--bar-target": `${byStatus[1].pct}%` }} title={`Inactivos: ${byStatus[1].count}`} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {byStatus.map((s) => (
              <div key={s.label} className="flex items-center gap-3 p-3 bg-soft rounded-xl">
                <span className={`w-3 h-3 rounded-full shrink-0 ${s.label === "Activos" ? "bg-ok" : "bg-line"}`} />
                <div>
                  <p className="text-lg font-bold text-primary m-0 leading-none tabular-nums"><CountUp value={s.count} /></p>
                  <p className="text-[11px] text-muted m-0 mt-1">{s.label} · {s.pct}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lo más solicitado */}
      <SectionTitle>Lo más solicitado</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        <div className="card card-border p-5">
          <CardTitle>Preguntas más frecuentes</CardTitle>
          <div className="space-y-2">
            {topArticles.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 py-1.5 hover:bg-mist/50 rounded-lg px-1.5 -mx-1.5 transition-colors">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-warn/15 text-warn" : i === 1 ? "bg-mist text-muted" : i === 2 ? "bg-warn/10 text-warn" : "bg-soft text-muted"}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink m-0 truncate font-medium">{a.question}</p>
                  <p className="text-[10px] text-muted m-0">{a.category} · {a.views} vistas</p>
                </div>
                <div className="text-xs font-semibold text-muted tabular-nums"><CountUp value={a.views} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-border p-5">
          <CardTitle>Documentos más descargados</CardTitle>
          <div className="space-y-2">
            {topDocs.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3 py-1.5 hover:bg-mist/50 rounded-lg px-1.5 -mx-1.5 transition-colors">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-warn/15 text-warn" : i === 1 ? "bg-mist text-muted" : i === 2 ? "bg-warn/10 text-warn" : "bg-soft text-muted"}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink m-0 truncate font-medium">{d.title}</p>
                  <p className="text-[10px] text-muted m-0">{d.category} · {d.format} · {d.fileSize}</p>
                </div>
                <div className="text-xs font-semibold text-muted tabular-nums"><CountUp value={d.downloads} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
