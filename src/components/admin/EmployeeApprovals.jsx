import { useMemo, useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import { useToast } from "../common/Toast";
import {
  loadEmployeeRequests,
  saveEmployeeRequests,
} from "../../lib/employeeRequests";
import { loadUsers, saveUsers } from "../../lib/auth";
import { employeeDepartments, initialsOf } from "../../data/mockEmployeeApprovals";
import { PageHeader, StatCard, EmptyState } from "./ui";
import { formatDate } from "../../utils/date";

const TABS = ["Pendiente", "Activo", "Rechazado"];

const STATUS_META = {
  Pendiente: {
    badge: "bg-warn/10 text-warn",
    dot: "bg-warn",
    label: "Pendiente de revisión",
  },
  Activo: {
    badge: "bg-ok/10 text-ok",
    dot: "bg-ok",
    label: "Empleado activo",
  },
  Rechazado: {
    badge: "bg-bad/10 text-bad",
    dot: "bg-bad",
    label: "Solicitud rechazada",
  },
};

function Icon({ path, className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d={path} />
    </svg>
  );
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.Pendiente;
  const live = status === "Pendiente";
  return (
    <span className={`badge ${meta.badge}`} title={meta.label}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${live ? "dot-ping" : ""}`} />
      {status}
    </span>
  );
}

function RoleBadge({ role }) {
  const tone =
    role === "Superadmin"
      ? "bg-ink text-paper"
      : role === "Administrador"
        ? "bg-brand-deep text-paper"
        : "bg-mist text-muted border border-line";
  return (
    <span className={`inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full ${tone}`}>
      {role}
    </span>
  );
}

export default function EmployeeApprovals() {
  const { can, role } = useAdmin();
  const push = useToast();

  const [requests, setRequests] = useState(() => loadEmployeeRequests());
  const [tab, setTab] = useState("Pendiente");
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("Todas");
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null); // { id, action: 'Activo' | 'Rechazado' }
  const [note, setNote] = useState("");
  const [justUpdated, setJustUpdated] = useState(null);

  const allowed = can("solicitudes");

  const counts = useMemo(
    () => ({
      total: requests.length,
      Pendiente: requests.filter((r) => r.status === "Pendiente").length,
      Activo: requests.filter((r) => r.status === "Activo").length,
      Rechazado: requests.filter((r) => r.status === "Rechazado").length,
    }),
    [requests]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      const matchTab = tab === "Todos" || r.status === tab;
      const matchDept = department === "Todas" || r.department === department;
      const matchQ =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.dni || "").toLowerCase().includes(q) ||
        (r.cuil || "").toLowerCase().includes(q) ||
        r.position.toLowerCase().includes(q);
      return matchTab && matchDept && matchQ;
    });
  }, [requests, tab, query, department]);

  if (!allowed) {
    return (
      <div className="card p-10 text-center max-w-lg mx-auto mt-10 animate-scale-in">
        <div className="w-12 h-12 mx-auto rounded-xl grid place-items-center bg-bad/10 text-bad mb-4">
          <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </div>
        <h2 className="text-lg font-bold text-ink m-0">Acceso restringido</h2>
        <p className="text-sm text-muted mt-2 m-0">
          Esta sección es exclusiva del rol <span className="font-semibold text-ink">Superadmin</span>.
          Tu rol actual es <span className="font-semibold text-ink">{role}</span>.
        </p>
      </div>
    );
  }

  function openConfirm(req, action) {
    setDetail(null);
    setNote(action === "Rechazado" ? req.reviewNote || "" : "");
    setConfirm({ id: req.id, action, name: req.name });
  }

  function applyDecision() {
    if (!confirm) return;
    if (confirm.action === "Rechazado" && !note.trim()) {
      push("Indicá el motivo del rechazo para dejar constancia.", "error");
      return;
    }
    const now = new Date().toISOString();
    const finalNote =
      note.trim() ||
      (confirm.action === "Activo" ? "Aprobado. Alta de empleado confirmada." : "");
    const target = requests.find((r) => r.id === confirm.id);
    const updated = requests.map((r) =>
      r.id === confirm.id
        ? {
            ...r,
            status: confirm.action,
            reviewedBy: "Superadmin",
            reviewedAt: now,
            reviewNote: finalNote,
          }
        : r
    );
    setRequests(updated);
    saveEmployeeRequests(updated);

    // Si la solicitud vino del registro, se actualiza esa cuenta real:
    // aprobado → pasa a Administrador; rechazado → sigue como Ciudadano.
    if (target?.userId) {
      const users = loadUsers();
      if (users.some((u) => u.id === target.userId)) {
        saveUsers(
          users.map((u) =>
            u.id === target.userId
              ? {
                  ...u,
                  role: confirm.action === "Activo" ? "Administrador" : u.role,
                  status: confirm.action,
                  reviewedAt: now,
                  reviewNote: finalNote,
                }
              : u
          )
        );
      }
    }

    setJustUpdated(confirm.id);
    setTimeout(() => setJustUpdated(null), 2000);
    push(
      confirm.action === "Activo"
        ? `${confirm.name} fue aprobado como empleado.`
        : `Solicitud de ${confirm.name} rechazada.`,
      confirm.action === "Activo" ? "success" : "error"
    );
    if (confirm.action === "Activo") setTab("Activo");
    if (confirm.action === "Rechazado") setTab("Rechazado");
    setConfirm(null);
    setNote("");
  }

  return (
    <div>
      <PageHeader
        title="Solicitudes de empleados"
        description="Revisá las solicitudes de alta y definí si la persona ingresa como empleada."
      >
        <span className="badge bg-mist text-muted border border-line">
          <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse-dot" />
          {counts.Pendiente} pendiente{counts.Pendiente === 1 ? "" : "s"}
        </span>
      </PageHeader>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
        <StatCard
          label="Pendientes"
          value={counts.Pendiente}
          tone="warn"
          hint="aguardan tu revisión"
          icon={<Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
        />
        <StatCard
          label="Activos"
          value={counts.Activo}
          tone="ok"
          hint="empleados aprobados"
          icon={<Icon path="M5 13l4 4L19 7" />}
        />
        <StatCard
          label="Rechazados"
          value={counts.Rechazado}
          tone="bad"
          hint="no ingresaron"
          icon={<Icon path="M6 18L18 6M6 6l12 12" />}
        />
        <StatCard
          label="Solicitudes totales"
          value={counts.total}
          tone="brand"
          hint="historial completo"
          icon={<Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
        />
      </div>

      <div className="card p-5">
        {/* Tabs en orden de flujo: Pendiente → Activo → Rechazado */}
        <div className="flex flex-wrap items-center gap-2 mb-4" role="tablist" aria-label="Filtrar por estado">
          {["Todos", ...TABS].map((t) => {
            const active = tab === t;
            const count = t === "Todos" ? counts.total : counts[t];
            return (
              <button
                key={t}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  active
                    ? "bg-brand-deep text-paper border-brand-deep shadow-sm"
                    : "bg-paper text-muted border-line hover:text-ink hover:bg-mist"
                }`}
              >
                {t !== "Todos" && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${active ? "bg-paper" : STATUS_META[t].dot}`}
                  />
                )}
                {t}
                <span
                  className={`min-w-5 h-5 px-1 grid place-items-center rounded-full text-[10px] font-bold tabular-nums ${
                    active ? "bg-paper/20 text-paper" : "bg-mist text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Buscador + dependencia */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 min-w-0">
            <svg className="w-4 h-4 text-faint absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
            <input
              className="input-field pl-9"
              placeholder="Buscar por nombre, email, DNI, puesto o nº de solicitud…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar solicitudes"
            />
          </div>
          <select
            className="input-field sm:w-60 cursor-pointer"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            aria-label="Filtrar por dependencia"
          >
            <option value="Todas">Todas las dependencias</option>
            {employeeDepartments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-10 h-10 mx-auto text-faint" />}
            title="Sin solicitudes para mostrar"
            description={
              tab === "Pendiente"
                ? "No hay solicitudes pendientes. Todo está al día."
                : "No hay registros que coincidan con la búsqueda o los filtros."
            }
            action={
              (query || department !== "Todas") && (
                <button
                  className="btn-ghost"
                  onClick={() => { setQuery(""); setDepartment("Todas"); }}
                >
                  Limpiar filtros
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm min-w-200">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-muted border-y border-line bg-mist/60">
                  <th className="text-left font-semibold px-5 py-3">Solicitante</th>
                  <th className="text-left font-semibold px-5 py-3">Puesto / Dependencia</th>
                  <th className="text-left font-semibold px-5 py-3">Solicitud</th>
                  <th className="text-left font-semibold px-5 py-3">Estado</th>
                  <th className="text-right font-semibold px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setDetail(r)}
                    className={`hover:bg-mist cursor-pointer transition-colors ${justUpdated === r.id ? "row-new" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full grid place-items-center text-xs font-bold shrink-0 bg-brand-deep/10 text-brand-deep">
                          {initialsOf(r.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-ink truncate">{r.name}</div>
                          <div className="text-xs text-faint truncate">{r.email}</div>
                          <div className="text-[11px] text-faint font-mono">CUIL {r.cuil}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-ink">{r.position}</div>
                      <div className="text-xs text-muted">{r.department}</div>
                      <div className="mt-1"><RoleBadge role={r.role} /></div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-mono text-xs text-muted">{r.id}</div>
                      <div className="text-xs text-muted">{formatDate(r.requestedAt)}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={r.status} />
                      {r.reviewedAt && (
                        <div className="text-[11px] text-faint mt-1">
                          {r.status === "Activo" ? "Aprobado" : "Revisado"} · {formatDate(r.reviewedAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="text-xs font-semibold text-brand hover:underline px-2 py-1 cursor-pointer"
                          onClick={() => setDetail(r)}
                        >
                          Ver
                        </button>
                        {r.status === "Pendiente" ? (
                          <>
                            <button
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-ok text-paper hover:opacity-90 transition cursor-pointer"
                              onClick={() => openConfirm(r, "Activo")}
                              title={`Aprobar a ${r.name}`}
                            >
                              <Icon path="M5 13l4 4L19 7" className="w-3.5 h-3.5" />
                              Aprobar
                            </button>
                            <button
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-paper text-bad border border-bad/30 hover:bg-bad/10 transition cursor-pointer"
                              onClick={() => openConfirm(r, "Rechazado")}
                              title={`Rechazar a ${r.name}`}
                            >
                              <Icon path="M6 18L18 6M6 6l12 12" className="w-3.5 h-3.5" />
                              Rechazar
                            </button>
                          </>
                        ) : (
                          <button
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-paper text-muted border border-line hover:text-ink hover:bg-mist transition cursor-pointer"
                            onClick={() => openConfirm(r, r.status === "Activo" ? "Rechazado" : "Activo")}
                            title="Cambiar estado"
                          >
                            Cambiar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[11px] text-faint mt-4 m-0">
          Mostrando {filtered.length} de {counts.total} solicitudes · Solo el Superadmin puede aprobar o rechazar.
        </p>
      </div>

      {/* Modal detalle */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setDetail(null)}>
          <div
            className="card w-full max-w-xl p-0 overflow-hidden animate-scale-in shadow-2xl max-h-[calc(100vh-2rem)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-line shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-full grid place-items-center text-xs font-bold shrink-0 bg-brand-deep/10 text-brand-deep">
                  {initialsOf(detail.name)}
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-ink m-0 truncate leading-tight">{detail.name}</h2>
                  <p className="text-[11px] font-mono text-muted m-0 mt-0.5">{detail.id} · {formatDate(detail.requestedAt)}</p>
                </div>
              </div>
              <button className="text-muted hover:text-ink p-1 cursor-pointer" onClick={() => setDetail(null)} aria-label="Cerrar">
                <Icon path="M6 18L18 6M6 6l12 12" className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-3 overflow-y-auto">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <StatusPill status={detail.status} />
                <RoleBadge role={detail.role} />
                {detail.userId && (
                  <span className="badge bg-brand/10 text-brand" title="Esta solicitud la generó el registro de cuenta">
                    Cuenta registrada
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2.5 text-sm">
                <Field label="CUIL" value={detail.cuil} mono />
                <Field label="Teléfono" value={detail.phone} />
                <Field label="Dependencia" value={detail.department} />
                <div className="col-span-2 sm:col-span-2">
                  <Field label="Email" value={detail.email} mono />
                </div>
                <Field label="Puesto solicitado" value={detail.position} />
                <div className="col-span-2 sm:col-span-3">
                  <Field label="Motivo / documentación" value={detail.reason} />
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <Field label="Origen de la solicitud" value={detail.submittedBy} />
                </div>
                {detail.reviewNote && (
                  <div className="col-span-2 sm:col-span-3">
                    <Field label="Resolución" value={detail.reviewNote} />
                  </div>
                )}
                {detail.reviewedAt && (
                  <div className="col-span-2 sm:col-span-3">
                    <Field
                      label={detail.status === "Activo" ? "Aprobado" : "Revisado"}
                      value={`${detail.reviewedBy || "Superadmin"} · ${formatDate(detail.reviewedAt)}`}
                    />
                  </div>
                )}
              </dl>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-line bg-soft/60 shrink-0">
              <button className="btn-ghost py-2! px-3.5! text-[13px]!" onClick={() => setDetail(null)}>
                Cerrar
              </button>
              {detail.status === "Pendiente" && (
                <>
                  <button
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-semibold rounded-xl bg-paper text-bad border border-bad/30 hover:bg-bad/10 transition cursor-pointer"
                    onClick={() => openConfirm(detail, "Rechazado")}
                  >
                    <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                    Rechazar
                  </button>
                  <button
                    className="btn-primary py-2! px-3.5! text-[13px]!"
                    onClick={() => openConfirm(detail, "Activo")}
                  >
                    <Icon path="M5 13l4 4L19 7" className="w-4 h-4" />
                    Aprobar empleado
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 animate-fade-in" onClick={() => { setConfirm(null); setNote(""); }}>
          <div
            className="card w-full max-w-md p-0 overflow-hidden animate-scale-in shadow-2xl max-h-[calc(100vh-2rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 pt-5">
              <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${confirm.action === "Activo" ? "bg-ok/10 text-ok" : "bg-bad/10 text-bad"}`}>
                <Icon path={confirm.action === "Activo" ? "M5 13l4 4L19 7" : "M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"} className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-ink m-0 leading-tight">
                  {confirm.action === "Activo" ? "Aprobar empleado" : "Rechazar solicitud"}
                </h2>
                <p className="text-xs text-muted m-0 mt-0.5 truncate">{confirm.name} · pasará a <span className={`font-semibold ${confirm.action === "Activo" ? "text-ok" : "text-bad"}`}>{confirm.action === "Activo" ? "Activo" : "Rechazado"}</span></p>
              </div>
            </div>

            <div className="px-5 pt-3 pb-4">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted mb-1.5">
                {confirm.action === "Activo" ? "Nota de aprobación (opcional)" : "Motivo del rechazo (obligatorio)"}
              </label>
              <textarea
                rows={2}
                className="input-field min-h-14 resize-none leading-relaxed"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={confirm.action === "Activo" ? "Ej.: Legajo verificado, alta confirmada." : "Ej.: Documentación incompleta, falta constancia de CUIL."}
              />
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-line bg-soft/60">
              <button className="btn-ghost py-2! px-3.5! text-[13px]!" onClick={() => { setConfirm(null); setNote(""); }}>
                Cancelar
              </button>
              <button
                className={`${confirm.action === "Activo" ? "btn-primary" : "btn-danger"} py-2! px-3.5! text-[13px]!`}
                onClick={applyDecision}
              >
                {confirm.action === "Activo" ? "Confirmar aprobación" : "Confirmar rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono = false }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-widest text-faint">{label}</dt>
      <dd className={`text-ink font-medium mt-0.5 break-words m-0 ${mono ? "font-mono text-[13px]" : ""}`}>{value}</dd>
    </div>
  );
}
