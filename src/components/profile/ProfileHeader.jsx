import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Icon, ICONS } from "./ui";
import EditProfileModal from "./EditProfileModal";

function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const STATUS_TONE = {
  Activo: "bg-ok/10 text-ok border border-ok/20",
  Pendiente: "bg-warn/10 text-warn border border-warn/25",
  Suspendido: "bg-bad/10 text-bad border border-bad/25",
  Inactivo: "bg-muted/10 text-muted border border-line",
};

const ROLE_TONE = {
  Superadmin: "bg-ink text-paper",
  Administrador: "bg-brand-deep/10 text-brand-deep border border-brand-deep/20",
  Ciudadano: "bg-mist text-muted border border-line",
};

function InfoItem({ label, value, mono = false }) {
  if (!value) return null;
  return (
    <div className="min-w-0 border-t border-line/70 pt-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-faint m-0">{label}</p>
      <p className={`text-[15px] text-ink font-medium m-0 mt-1 break-words ${mono ? "font-mono text-[13px]" : ""}`}>{value}</p>
    </div>
  );
}

export default function ProfileHeader({ onSaved }) {
  const { user, userRole, isSuperadmin, isStaff } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  if (!user) return null;
  const isAdmin = userRole === "Administrador";

  return (
    <>
      <header className="card overflow-hidden bg-paper">
        <div className="px-6 sm:px-10 pt-10 pb-8 relative overflow-hidden">
          <span
            className="pointer-events-none select-none absolute -right-6 -top-8 text-ink/[0.05] text-[11rem] font-black tracking-tighter"
            aria-hidden="true"
          >
            AP
          </span>

          <p className="kicker m-0">[ Mi perfil · ChatAP ]</p>
          <h1 className="display-2 text-ink mt-4 mb-0">
            MI PERFIL.
          </h1>

          <div className="relative mt-10 flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-5 min-w-0">
              <span className="w-20 h-20 rounded-full bg-brand-deep text-paper grid place-items-center text-2xl font-bold uppercase ring-4 ring-brand-deep/10 shrink-0">
                {initials(user.name)}
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-extrabold tracking-tight text-ink m-0 truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-sm text-muted m-0 mt-1 font-medium break-all">{user.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full ${ROLE_TONE[userRole] || "bg-mist text-muted border border-line"}`}>
                    {isSuperadmin ? "SuperAdmin" : isAdmin ? "Administrador" : "Ciudadano"}
                  </span>
                  <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full ${STATUS_TONE[user.status] || "bg-muted/10 text-muted border border-line"}`}>
                    {user.status || "—"}
                  </span>
                  {isStaff && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full bg-brand/10 text-brand-deep border border-brand/20">
                      <Icon path={ICONS.shield} className="w-3 h-3" />
                      Personal interno
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setEditOpen(true)}
              className="btn-primary shrink-0"
            >
              <Icon path={ICONS.profile} className="w-4 h-4" />
              Editar perfil
            </button>
          </div>
        </div>

        <div className="border-t border-line px-6 sm:px-10 py-8 grid grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-6">
          <InfoItem label="Nombre completo" value={user.name} />
          <InfoItem label="Correo electrónico" value={user.email} mono />
          <InfoItem label="DNI" value={user.dni || "—"} mono />
          <InfoItem label="CUIL" value={user.cuil || "—"} mono />
          <InfoItem label="Teléfono" value={user.phone || "—"} mono />
          <InfoItem label="Dependencia" value={user.department || "—"} />
          <InfoItem label="Puesto" value={user.position || "—"} />
          <InfoItem label="Registrado" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-AR") : "—"} />
          <InfoItem label="Último acceso" value={user.lastAccessAt ? new Date(user.lastAccessAt).toLocaleString("es-AR") : "—"} />
        </div>
      </header>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} saved={onSaved} />
    </>
  );
}