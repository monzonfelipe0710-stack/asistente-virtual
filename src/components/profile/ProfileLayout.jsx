import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useProfileData } from "./useProfileData";
import ProfileHeader from "./ProfileHeader";
import { Icon, ICONS } from "./ui";
import Resumen from "./sections/Resumen";
import Tramites from "./sections/Tramites";
import Solicitudes from "./sections/Solicitudes";
import Conversaciones from "./sections/Conversaciones";
import Actividad from "./sections/Actividad";
import Notificaciones from "./sections/Notificaciones";
import Seguridad from "./sections/Seguridad";
import Permisos from "./sections/Permisos";
import Auditoria from "./sections/Auditoria";

export default function ProfileLayout() {
  const { isSuperadmin, userRole, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const data = useProfileData();
  const [go, setGo] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const isStaff = userRole === "ADMINISTRADOR" || isSuperadmin;

  const nav =
    isSuperadmin
      ? [
          { key: "resumen", label: "Resumen", icon: ICONS.activity },
          { key: "permisos", label: "Permisos", icon: ICONS.shield },
          { key: "auditoria", label: "Auditoría", icon: ICONS.activity },
          { key: "seguridad", label: "Seguridad", icon: ICONS.lock },
        ]
      : isStaff
      ? [
          { key: "resumen", label: "Resumen", icon: ICONS.activity },
          { key: "permisos", label: "Permisos", icon: ICONS.shield },
          { key: "seguridad", label: "Seguridad", icon: ICONS.lock },
        ]
      : [
          { key: "resumen", label: "Resumen", icon: ICONS.activity },
          { key: "tramites", label: "Mis trámites", icon: ICONS.tramite },
          { key: "solicitudes", label: "Mis solicitudes", icon: ICONS.solicitud },
          { key: "conversaciones", label: "Mis conversaciones", icon: ICONS.chat },
          { key: "actividad", label: "Mi actividad", icon: ICONS.activity },
          { key: "notificaciones", label: "Notificaciones", icon: ICONS.bell },
          { key: "seguridad", label: "Seguridad", icon: ICONS.shield },
        ];

  const [active, setActive] = useState(nav[0].key);
  const normalized = go || active;

  const target = nav.find((n) => n.key === normalized) || nav[0];

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "ELIMINAR") return;
    setDeletingAccount(true);
    setDeleteError("");
    try {
      await deleteAccount();
      navigate("/", { replace: true });
    } catch (error) {
      setDeleteError(error?.response?.data?.mensaje || error?.response?.data?.message || error?.message || "No se pudo eliminar la cuenta. Intentá nuevamente.");
      setDeletingAccount(false);
    }
  }

  function renderSection(key) {
    switch (key) {
      case "resumen":
        return <Resumen data={data} role={userRole} onGo={setGo} />;
      case "tramites":
        return <Tramites />;
      case "solicitudes":
        return <Solicitudes />;
      case "conversaciones":
        return <Conversaciones />;
      case "actividad":
        return <Actividad />;
      case "notificaciones":
        return <Notificaciones />;
      case "seguridad":
        return <Seguridad />;
      case "permisos":
        return isStaff ? <Permisos /> : null;
      case "auditoria":
        return isSuperadmin ? <Auditoria /> : null;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-full flex flex-col bg-paper">
      <main id="contenido" aria-label="Secciones del perfil" className="flex-1 w-full ed-max section-bleed py-12 lg:py-16" key={normalized}>
        <ProfileHeader />

        {/* Pestañas */}
        <div className="flex gap-2 overflow-x-auto pb-2 mt-10 -mx-1 px-1" aria-label="Secciones del perfil">
          {nav.map((n) => {
            const isActive = target.key === n.key;
            return (
              <button
                key={n.key}
                onClick={() => {
                  setActive(n.key);
                  setGo(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold rounded-full border whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-ink text-paper border-ink"
                    : "bg-paper text-muted border-line hover:text-ink hover:bg-mist"
                }`}
              >
                <Icon path={n.icon} className="w-4 h-4" />
                {n.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8" key={normalized}>
          {renderSection(target.key)}
        </div>

        <section className="mt-12 rounded-2xl border border-red-200 bg-red-50/70 p-5 sm:p-7 dark:border-red-900/70 dark:bg-red-950/30" aria-labelledby="delete-account-title">
          <p className="kicker m-0 text-red-700 dark:text-red-300">[ Zona de riesgo ]</p>
          <h2 id="delete-account-title" className="mt-3 text-xl font-semibold text-ink">Eliminar mi cuenta</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Esta acción es permanente. Vas a cerrar tu sesión y perder el acceso a tu cuenta. Las consultas asociadas dejarán de estar vinculadas a tu perfil.
          </p>
          <button
            type="button"
            onClick={() => { setDeleteConfirmText(""); setDeleteError(""); setDeleteDialogOpen(true); }}
            className="mt-5 inline-flex items-center justify-center rounded-full border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/70 dark:focus-visible:outline-red-300"
          >
            Eliminar mi cuenta
          </button>
        </section>
      </main>

      {deleteDialogOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingAccount) setDeleteDialogOpen(false); }}>
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-dialog-title"
            aria-describedby="delete-account-dialog-description"
            className="w-full max-w-lg rounded-2xl bg-paper p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-100 text-red-700" aria-hidden="true">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 9v4m0 4h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3l-7.6-13.1a2 2 0 0 0-3.4 0Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="kicker m-0 text-red-700">Confirmación necesaria</p>
            <h2 id="delete-account-dialog-title" className="mt-2 text-2xl font-semibold text-ink">¿Eliminar tu cuenta definitivamente?</h2>
            <p id="delete-account-dialog-description" className="mt-3 text-sm leading-6 text-muted">
              No vas a poder deshacer esta acción ni volver a ingresar con esta cuenta. Para evitar errores, escribí <strong className="text-ink">ELIMINAR</strong> en el campo.
            </p>
            <label htmlFor="delete-account-confirm" className="mt-5 block text-sm font-semibold text-ink">Escribí ELIMINAR para confirmar</label>
            <input
              id="delete-account-confirm"
              type="text"
              autoComplete="off"
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
              disabled={deletingAccount}
              className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:bg-slate-950 dark:focus:ring-red-950"
            />
            {deleteError && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{deleteError}</p>}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleteDialogOpen(false)} disabled={deletingAccount} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-mist disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={handleDeleteAccount} disabled={deleteConfirmText !== "ELIMINAR" || deletingAccount} className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50">
                {deletingAccount ? "Eliminando cuenta…" : "Sí, eliminar cuenta"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}